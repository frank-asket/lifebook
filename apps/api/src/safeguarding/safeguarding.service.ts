import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { MeditationService } from '../meditation/meditation.service';
import { REPORT_LIMITS } from '../care/care.service';
import { PastorAdmin, isActivePastor } from '../pastors/pastor-admin';
import { decryptReflection, encryptReflection } from '../security/reflection-crypto';

export const OVERDUE_HOURS = 24;
const hours = (from: Date, now = Date.now()) => Math.floor((now - from.getTime()) / 3600000);

/** The safeguarding lead's tools. Leads never read live conversations, only copies a reporter chose to share. */
@Injectable()
export class SafeguardingService implements OnModuleDestroy {
  private readonly db = new PrismaClient();
  constructor(private readonly meditation: MeditationService) {}
  async onModuleDestroy() { await this.db.$disconnect(); }
  userId(auth?: string) { return this.meditation.userId(auth); }

  private async lead(auth?: string) {
    const userId = await this.userId(auth);
    const user = await this.db.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user || !['MODERATOR', 'ADMIN'].includes(user.role)) throw new ForbiddenException('Only the safeguarding lead can open this');
    return userId;
  }
  private log(actorId: string, action: string, extra: { pastorUserId?: string; reportId?: string; note?: string } = {}) {
    return this.db.safeguardingAction.create({ data: { actorId, action, ...extra } });
  }
  private async pastorBySlug(slug: string) {
    if (!/^[a-z0-9-]{1,60}$/.test(slug)) throw new NotFoundException('Pastor not found');
    const profile = await this.db.pastorProfile.findUnique({ where: { slug } });
    if (!profile) throw new NotFoundException('Pastor not found');
    return profile;
  }

  async overview(auth?: string) {
    await this.lead(auth);
    const now = Date.now();
    const overdueSince = new Date(now - OVERDUE_HOURS * 3600000);
    const [openReports, overdueReports, waiting, profiles, actions] = await Promise.all([
      this.db.careReport.count({ where: { status: 'OPEN' } }),
      this.db.careReport.count({ where: { status: 'OPEN', createdAt: { lt: overdueSince } } }),
      this.db.careRequest.findMany({ where: { status: 'OPEN', createdAt: { lt: overdueSince } }, orderBy: { createdAt: 'asc' }, take: 50, select: { topic: true, language: true, createdAt: true } }),
      this.db.pastorProfile.findMany({ orderBy: { displayName: 'asc' }, include: { user: { select: { verification: true } } } }),
      this.db.safeguardingAction.findMany({ orderBy: { createdAt: 'desc' }, take: 20, select: { action: true, createdAt: true, reportId: true } }),
    ]);
    const openCases = await this.db.careRequest.groupBy({ by: ['pastorId'], where: { status: 'CLAIMED' }, _count: true });
    const casesByPastor = new Map(openCases.map(c => [c.pastorId, c._count]));
    return {
      openReports, overdueReports,
      // Requests nobody has taken in time: no content, only what is needed to find a pastor.
      waitingTooLong: waiting.map(w => ({ topic: w.topic, language: w.language, waitingHours: hours(w.createdAt, now) })),
      pastors: profiles.map(p => ({
        slug: p.slug, displayName: p.displayName, languages: p.languages, acceptingRequests: p.acceptingRequests,
        active: isActivePastor(p.user.verification), suspended: !!p.user.verification?.suspendedAt, status: p.user.verification?.status ?? 'NOT_REQUESTED',
        openCases: casesByPastor.get(p.userId) ?? 0,
      })),
      recentActions: actions,
    };
  }

  async reports(auth?: string) {
    await this.lead(auth);
    const rows = await this.db.careReport.findMany({ orderBy: [{ status: 'asc' }, { createdAt: 'asc' }], take: 200 });
    const names = await this.pastorNames(rows.map(r => r.subjectPastorId));
    return rows.map(r => ({
      id: r.id, category: r.category, reporterRole: r.reporterRole, status: r.status, createdAt: r.createdAt, acknowledgedAt: r.acknowledgedAt, resolvedAt: r.resolvedAt,
      sharedConversation: !!r.transcriptCiphertext, aboutPastor: r.subjectPastorId ? names.get(r.subjectPastorId) ?? null : null,
      overdue: r.status === 'OPEN' && hours(r.createdAt) >= OVERDUE_HOURS,
    }));
  }
  private async pastorNames(ids: (string | null)[]) {
    const unique = [...new Set(ids.filter((id): id is string => !!id))];
    const rows = unique.length ? await this.db.pastorProfile.findMany({ where: { userId: { in: unique } }, select: { userId: true, displayName: true, slug: true } }) : [];
    return new Map(rows.map(r => [r.userId, { displayName: r.displayName, slug: r.slug }]));
  }

  async report(auth: string | undefined, id: string) {
    const leadId = await this.lead(auth);
    if (!/^[0-9a-f-]{36}$/.test(id)) throw new NotFoundException('Report not found');
    const r = await this.db.careReport.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Report not found');
    await this.log(leadId, 'viewed-report', { reportId: id });
    const names = await this.pastorNames([r.subjectPastorId]);
    return {
      id: r.id, category: r.category, reporterRole: r.reporterRole, status: r.status, createdAt: r.createdAt, acknowledgedAt: r.acknowledgedAt, resolvedAt: r.resolvedAt,
      aboutPastor: r.subjectPastorId ? names.get(r.subjectPastorId) ?? null : null,
      details: decryptReflection(r.detailsCiphertext, `care-report:details:${id}`),
      transcript: r.transcriptCiphertext ? JSON.parse(decryptReflection(r.transcriptCiphertext, `care-report:transcript:${id}`)) as { from: string; at: string; text: string }[] : null,
      resolution: r.resolutionCiphertext ? decryptReflection(r.resolutionCiphertext, `care-report:resolution:${id}`) : null,
    };
  }

  async acknowledge(auth: string | undefined, id: string) {
    const leadId = await this.lead(auth);
    const updated = await this.db.careReport.updateMany({ where: { id, status: 'OPEN' }, data: { status: 'ACKNOWLEDGED', acknowledgedAt: new Date(), handledById: leadId } });
    if (!updated.count) throw new ConflictException('This report is not waiting for acknowledgement');
    await this.log(leadId, 'acknowledged-report', { reportId: id });
    return this.report(auth, id);
  }

  async resolve(auth: string | undefined, id: string, resolution: unknown) {
    const leadId = await this.lead(auth);
    if (typeof resolution !== 'string' || !resolution.trim() || resolution.length > 2000) throw new BadRequestException('Describe how the report was resolved');
    const now = new Date();
    const updated = await this.db.careReport.updateMany({ where: { id, status: { in: ['OPEN', 'ACKNOWLEDGED'] } }, data: {
      status: 'RESOLVED', resolvedAt: now, handledById: leadId,
      resolutionCiphertext: encryptReflection(resolution.trim(), `care-report:resolution:${id}`),
      deleteAfter: new Date(now.getTime() + REPORT_LIMITS.retentionDaysAfterResolved * 86400000),
    } });
    if (!updated.count) throw new ConflictException('This report is already resolved');
    await this.db.careReport.updateMany({ where: { id, acknowledgedAt: null }, data: { acknowledgedAt: now } });
    await this.log(leadId, 'resolved-report', { reportId: id });
    return this.report(auth, id);
  }

  /**
   * Pastor applications for review, newest activity first. The lead sees the reference's contact so they can check it;
   * each time the list is opened that is logged, because it is the applicant's private data.
   */
  async applications(auth?: string) {
    const leadId = await this.lead(auth);
    const rows = await this.db.ministryVerification.findMany({
      where: { status: { not: 'NOT_REQUESTED' } }, orderBy: { updatedAt: 'desc' }, take: 200,
      include: { user: { select: { pastorProfile: true } } },
    });
    await this.log(leadId, 'viewed-applications', { note: `${rows.length} application(s)` });
    return rows.map(v => {
      const p = v.user.pastorProfile;
      let referenceContact: string | null = null;
      try { referenceContact = v.referenceContactCiphertext ? decryptReflection(v.referenceContactCiphertext, `pastor-reference:${v.userId}`) : null; } catch { referenceContact = null; }
      return {
        slug: p?.slug ?? null, displayName: p?.displayName ?? null, bio: p?.bio ?? null, languages: p?.languages ?? [],
        status: v.status, active: isActivePastor(v), suspended: !!v.suspendedAt, self: v.userId === leadId,
        churchName: v.churchName, ministryRole: v.ministryRole, country: v.country,
        referenceName: v.referenceName, referenceContact,
        trainingCourse: v.trainingCourse, trainingCompletedOn: v.trainingCompletedAt?.toISOString().slice(0, 10) ?? null,
        codeOfConductSignedOn: v.codeOfConductSignedAt?.toISOString().slice(0, 10) ?? null,
        reviewerNotes: v.reviewerNotes, submittedAt: v.createdAt, updatedAt: v.updatedAt, reviewedAt: v.reviewedAt,
      };
    });
  }

  async approveApplication(auth: string | undefined, slug: string) {
    const leadId = await this.lead(auth);
    const profile = await this.pastorBySlug(slug);
    try { await new PastorAdmin(this.db).approve(profile.userId, leadId); }
    catch (error) { if (error instanceof Error && error.constructor === Error) throw new ConflictException(error.message); throw error; }
    await this.log(leadId, 'approved-pastor', { pastorUserId: profile.userId });
    return { slug, status: 'APPROVED' };
  }

  async rejectApplication(auth: string | undefined, slug: string, notes: unknown) {
    const leadId = await this.lead(auth);
    const profile = await this.pastorBySlug(slug);
    if (profile.userId === leadId) throw new ForbiddenException('You cannot review your own application');
    if (typeof notes !== 'string' || !notes.trim()) throw new BadRequestException('Say why, so the applicant knows what to change');
    try { await new PastorAdmin(this.db).reject(profile.userId, notes); }
    catch (error) { if (error instanceof Error && error.constructor === Error) throw new BadRequestException(error.message); throw error; }
    await this.log(leadId, 'rejected-pastor', { pastorUserId: profile.userId });
    return { slug, status: 'REJECTED' };
  }

  async suspendPastor(auth: string | undefined, slug: string, reason: unknown) {
    const leadId = await this.lead(auth);
    const profile = await this.pastorBySlug(slug);
    if (profile.userId === leadId) throw new ForbiddenException('You cannot suspend yourself');
    if (typeof reason !== 'string' || !reason.trim()) throw new BadRequestException('Give a reason for the suspension');
    const result = await new PastorAdmin(this.db).suspend(profile.userId, reason);
    await this.log(leadId, 'suspended-pastor', { pastorUserId: profile.userId, note: `${result.releasedConversations} conversation(s) returned to the queue` });
    return { slug, suspended: true, releasedConversations: result.releasedConversations };
  }

  async reinstatePastor(auth: string | undefined, slug: string) {
    const leadId = await this.lead(auth);
    const profile = await this.pastorBySlug(slug);
    await new PastorAdmin(this.db).reinstate(profile.userId, leadId);
    await this.log(leadId, 'reinstated-pastor', { pastorUserId: profile.userId });
    return { slug, suspended: false };
  }
}

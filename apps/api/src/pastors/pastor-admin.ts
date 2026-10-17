import type { PlatformRole, PrismaClient } from '@prisma/client';
import { encryptReflection } from '../security/reflection-crypto';

type Verification = { status: string; trainingCompletedAt: Date | null; codeOfConductSignedAt: Date | null; suspendedAt: Date | null } | null | undefined;
export type PastorRegistration = {
  slug: string; displayName: string; bio: string; languages: string[];
  churchName: string; ministryRole: string; country: string; referenceName: string; referenceContact: string;
};

/** The single rule for whether a pastor may appear publicly or receive care requests. */
export function isActivePastor(v: Verification): boolean {
  return !!v && v.status === 'APPROVED' && !!v.trainingCompletedAt && !!v.codeOfConductSignedAt && !v.suspendedAt;
}

export const PASTOR_LIMITS = { displayName: 80, bio: 1200, churchName: 120, ministryRole: 80, referenceName: 120, referenceContact: 200, reason: 500, course: 120 };
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+){0,5}$/;

function text(value: unknown, max: number, label: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} is required`);
  const trimmed = value.trim();
  if (trimmed.length > max) throw new Error(`${label} is too long (max ${max})`);
  return trimmed;
}
function date(value: unknown, label: string): Date {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) throw new Error(`${label} must be YYYY-MM-DD`);
  const result = new Date(`${value}T00:00:00Z`);
  if (result.getTime() > Date.now()) throw new Error(`${label} cannot be in the future`);
  return result;
}

/** Operator actions for the pastoral care pilot. Used by scripts/pastor-admin.cjs; never exposed over HTTP. */
export class PastorAdmin {
  constructor(private readonly db: PrismaClient) {}

  private async verification(userId: string) {
    const row = await this.db.ministryVerification.findUnique({ where: { userId } });
    if (!row) throw new Error('This user is not registered as a pastor');
    return row;
  }

  async register(userId: string, input: PastorRegistration) {
    const slug = text(input.slug, 60, 'Slug').toLowerCase();
    if (!slugPattern.test(slug)) throw new Error('Slug must be lowercase words joined by hyphens, e.g. kwame-mensah');
    const languages = [...new Set((input.languages ?? []).map(l => l.trim().toLowerCase()))];
    if (!languages.length || languages.some(l => !/^[a-z]{2,3}$/.test(l))) throw new Error('Languages must be ISO codes such as en, fr, tw');
    const country = text(input.country, 2, 'Country').toUpperCase();
    if (!/^[A-Z]{2}$/.test(country)) throw new Error('Country must be a two-letter code such as GH or FR');
    const details = {
      churchName: text(input.churchName, PASTOR_LIMITS.churchName, 'Church name'),
      ministryRole: text(input.ministryRole, PASTOR_LIMITS.ministryRole, 'Ministry role'),
      country,
      referenceName: text(input.referenceName, PASTOR_LIMITS.referenceName, 'Reference name'),
      referenceContactCiphertext: encryptReflection(text(input.referenceContact, PASTOR_LIMITS.referenceContact, 'Reference contact'), `pastor-reference:${userId}`),
    };
    const profile = { slug, displayName: text(input.displayName, PASTOR_LIMITS.displayName, 'Display name'), bio: text(input.bio, PASTOR_LIMITS.bio, 'Bio'), languages };
    const taken = await this.db.pastorProfile.findUnique({ where: { slug } });
    if (taken && taken.userId !== userId) throw new Error('That slug is already used by another pastor');
    const existing = await this.db.ministryVerification.findUnique({ where: { userId } });
    // Changing who vouches for an approved pastor sends them back for review.
    const reviewAgain = !existing || existing.status !== 'APPROVED' || existing.referenceName !== details.referenceName || existing.churchName !== details.churchName;
    await this.db.ministryVerification.upsert({
      where: { userId },
      create: { userId, status: 'PENDING', ...details },
      update: { ...details, ...(reviewAgain ? { status: 'PENDING', reviewedAt: null, verifiedById: null } : {}) },
    });
    await this.db.pastorProfile.upsert({ where: { userId }, create: { userId, ...profile }, update: profile });
    return this.summary(userId);
  }

  async recordTraining(userId: string, course: string, completedOn: string) {
    await this.verification(userId);
    await this.db.ministryVerification.update({ where: { userId }, data: { trainingCourse: text(course, PASTOR_LIMITS.course, 'Course'), trainingCompletedAt: date(completedOn, 'Completion date') } });
    return this.summary(userId);
  }

  async recordConduct(userId: string, signedOn: string) {
    await this.verification(userId);
    await this.db.ministryVerification.update({ where: { userId }, data: { codeOfConductSignedAt: date(signedOn, 'Signature date') } });
    return this.summary(userId);
  }

  private async assertModerator(moderatorId: string, pastorId: string) {
    if (moderatorId === pastorId) throw new Error('A pastor cannot approve themselves');
    const moderator = await this.db.user.findUnique({ where: { id: moderatorId } });
    if (!moderator || !['MODERATOR', 'ADMIN'].includes(moderator.role)) throw new Error('Approver must have the MODERATOR or ADMIN role');
  }

  async approve(userId: string, moderatorId: string) {
    const row = await this.verification(userId);
    await this.assertModerator(moderatorId, userId);
    if (row.status !== 'PENDING') throw new Error(`Only pending pastors can be approved (current: ${row.status})`);
    if (row.suspendedAt) throw new Error('This pastor is suspended; use reinstate');
    const missing = [!row.referenceName && 'reference', !row.trainingCompletedAt && 'training', !row.codeOfConductSignedAt && 'signed code of conduct'].filter(Boolean);
    if (missing.length) throw new Error(`Cannot approve yet; missing: ${missing.join(', ')}`);
    if (!(await this.db.pastorProfile.findUnique({ where: { userId } }))) throw new Error('Cannot approve without a profile');
    await this.db.ministryVerification.update({ where: { userId }, data: { status: 'APPROVED', reviewedAt: new Date(), verifiedById: moderatorId } });
    return this.summary(userId);
  }

  async reject(userId: string, notes: string) {
    await this.verification(userId);
    await this.db.ministryVerification.update({ where: { userId }, data: { status: 'REJECTED', reviewedAt: new Date(), reviewerNotes: text(notes, PASTOR_LIMITS.reason, 'Notes') } });
    await this.db.pastorProfile.updateMany({ where: { userId }, data: { acceptingRequests: false } });
    return this.summary(userId);
  }

  /** Takes effect immediately: the profile disappears and no new requests can reach this pastor. */
  async suspend(userId: string, reason: string) {
    await this.verification(userId);
    await this.db.ministryVerification.update({ where: { userId }, data: { suspendedAt: new Date(), suspensionReason: text(reason, PASTOR_LIMITS.reason, 'Reason') } });
    await this.db.pastorProfile.updateMany({ where: { userId }, data: { acceptingRequests: false } });
    // Members are not left waiting on a suspended pastor: their conversations go back to the shared queue.
    const released = await this.db.careRequest.updateMany({ where: { pastorId: userId, status: 'CLAIMED' }, data: { status: 'OPEN', pastorId: null, claimedAt: null } });
    return { ...(await this.summary(userId)), releasedConversations: released.count };
  }

  async reinstate(userId: string, moderatorId: string) {
    const row = await this.verification(userId);
    await this.assertModerator(moderatorId, userId);
    if (!row.suspendedAt) throw new Error('This pastor is not suspended');
    await this.db.ministryVerification.update({ where: { userId }, data: { suspendedAt: null, suspensionReason: null, reviewedAt: new Date(), verifiedById: moderatorId } });
    return this.summary(userId);
  }

  async setRole(userId: string, role: PlatformRole) {
    if (!['MEMBER', 'CREATOR', 'MODERATOR', 'ADMIN'].includes(role)) throw new Error('Unknown role');
    await this.db.user.update({ where: { id: userId }, data: { role } });
    return { userId, role };
  }

  /** Operator view. Never includes the reference contact. */
  async summary(userId: string) {
    const [v, p] = await Promise.all([this.db.ministryVerification.findUnique({ where: { userId } }), this.db.pastorProfile.findUnique({ where: { userId } })]);
    return {
      userId, slug: p?.slug ?? null, displayName: p?.displayName ?? null, status: v?.status ?? 'NOT_REQUESTED',
      church: v?.churchName ?? null, country: v?.country ?? null, languages: p?.languages ?? [],
      training: v?.trainingCompletedAt?.toISOString().slice(0, 10) ?? null, conductSigned: v?.codeOfConductSignedAt?.toISOString().slice(0, 10) ?? null,
      suspended: !!v?.suspendedAt, active: isActivePastor(v),
    };
  }

  async list() {
    const rows = await this.db.ministryVerification.findMany({ where: { status: { not: 'NOT_REQUESTED' } }, orderBy: { createdAt: 'asc' }, select: { userId: true } });
    return Promise.all(rows.map(r => this.summary(r.userId)));
  }
}

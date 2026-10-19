import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { MeditationService } from '../meditation/meditation.service';
import { isActivePastor } from '../pastors/pastor-admin';
import { decryptReflection, encryptReflection } from '../security/reflection-crypto';

export const CARE_TOPICS = ['prayer', 'grief', 'family', 'faith', 'relationships', 'work', 'health', 'loneliness', 'other'] as const;
export const CARE_LIMITS = { message: 2000, name: 60, openPerMember: 2, retentionDays: 90 };
export const REPORT_CATEGORIES = ['safety', 'conduct', 'money', 'pressure', 'other'] as const;
export const REPORT_LIMITS = { details: 2000, perDay: 5, retentionDaysAfterResolved: 365 };
type Role = 'member' | 'pastor';
type Field = 'request' | 'name' | 'phone' | 'message';
type Request = { id: string; memberId: string; pastorId: string | null; topic: string; language: string; contactPreference: string; nameCiphertext: string | null; phoneCiphertext: string | null; messageCiphertext: string; status: string; claimedAt: Date | null; closedAt: Date | null; closedBy: string | null; createdAt: Date; memberReadAt: Date | null; pastorReadAt: Date | null; updatedAt: Date };

@Injectable()
export class CareService implements OnModuleDestroy {
  private readonly db = new PrismaClient();
  constructor(private readonly meditation: MeditationService) {}
  async onModuleDestroy() { await this.db.$disconnect(); }
  userId(auth?: string) { return this.meditation.userId(auth); }

  private transaction<T>(run: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.db.$transaction(run);
  }

  // Bound to the request (and message) so ciphertext cannot be moved between requests.
  private seal(field: Field, request: { id: string; memberId: string }, text: string, messageId = '') { return encryptReflection(text, `care:${field}:${request.memberId}:${request.id}:${messageId}`); }
  private open(field: Field, request: { id: string; memberId: string }, value: string, messageId = '') {
    if (!value.startsWith('lbenc:v1:')) throw new ServiceUnavailableException('This conversation cannot be opened right now');
    return decryptReflection(value, `care:${field}:${request.memberId}:${request.id}:${messageId}`);
  }
  private text(value: unknown, max: number, label: string): string {
    if (typeof value !== 'string' || !value.trim()) throw new BadRequestException(`${label} is required`);
    if (value.trim().length > max) throw new BadRequestException(`${label} is too long`);
    return value.trim();
  }
  private checkId(id: string) { if (!/^[0-9a-f-]{36}$/.test(id)) throw new NotFoundException('Request not found'); }

  /** The signed-in user as an active pastor, or 403. Re-checked on every pastor action so suspension is immediate. */
  private async activePastor(auth?: string) {
    const userId = await this.userId(auth);
    const [verification, profile] = await Promise.all([this.db.ministryVerification.findUnique({ where: { userId } }), this.db.pastorProfile.findUnique({ where: { userId } })]);
    if (!profile || !isActivePastor(verification)) throw new ForbiddenException('Only active, verified pastors can do this');
    return { userId, profile };
  }

  private async thread(request: Request, viewer: Role) {
    const messages = await this.db.careMessage.findMany({ where: { requestId: request.id }, orderBy: { createdAt: 'asc' }, take: 500 });
    const pastor = request.pastorId ? await this.db.pastorProfile.findUnique({ where: { userId: request.pastorId }, select: { displayName: true, slug: true } }) : null;
    await this.db.careRequest.update({ where: { id: request.id }, data: viewer === 'member' ? { memberReadAt: new Date() } : { pastorReadAt: new Date() } });
    return {
      id: request.id, topic: request.topic, language: request.language, status: request.status, contactPreference: request.contactPreference,
      createdAt: request.createdAt, claimedAt: request.claimedAt, closedAt: request.closedAt, closedBy: request.closedBy,
      name: request.nameCiphertext ? this.open('name', request, request.nameCiphertext) : null,
      // The phone number is shown only to the pastor who claimed a callback request.
      phone: viewer === 'pastor' && request.phoneCiphertext ? this.open('phone', request, request.phoneCiphertext) : null,
      message: this.open('request', request, request.messageCiphertext),
      pastor: pastor ? { displayName: pastor.displayName, slug: pastor.slug } : null,
      messages: messages.map(m => ({ id: m.id, from: m.senderRole, text: this.open('message', request, m.ciphertext, m.id), createdAt: m.createdAt })),
    };
  }
  private summary(request: Request & { messages?: { senderRole: string; createdAt: Date }[] }, viewer: Role, pastorName?: string | null) {
    const lastReply = request.messages?.find(m => m.senderRole !== viewer)?.createdAt;
    const readAt = viewer === 'member' ? request.memberReadAt : request.pastorReadAt;
    return { id: request.id, topic: request.topic, language: request.language, status: request.status, createdAt: request.createdAt, claimedAt: request.claimedAt, closedAt: request.closedAt, pastor: pastorName ?? null, unread: !!lastReply && (!readAt || lastReply > readAt) };
  }

  // ---------- Member ----------

  async create(auth: string | undefined, input: Record<string, unknown>) {
    const memberId = await this.userId(auth);
    if (input.consent !== true) throw new BadRequestException('Consent is required to share this with a pastor');
    if (typeof input.topic !== 'string' || !(CARE_TOPICS as readonly string[]).includes(input.topic)) throw new BadRequestException('Invalid topic');
    if (typeof input.language !== 'string' || !/^[a-z]{2,3}$/.test(input.language)) throw new BadRequestException('Invalid language');
    if (input.contactPreference !== 'messages' && input.contactPreference !== 'callback') throw new BadRequestException('Invalid contact preference');
    const message = this.text(input.message, CARE_LIMITS.message, 'Message');
    const name = input.name === undefined || input.name === '' ? null : this.text(input.name, CARE_LIMITS.name, 'Name');
    let phone: string | null = null;
    if (input.contactPreference === 'callback') {
      phone = this.text(input.phone, 24, 'Phone number').replace(/[\s().-]/g, '');
      if (!/^\+?[0-9]{7,15}$/.test(phone)) throw new BadRequestException('Enter a phone number with country code, e.g. +233 20 000 0000');
    } else if (input.phone !== undefined && input.phone !== '') throw new BadRequestException('A phone number is only used for a callback');
    const ref = { id: randomUUID(), memberId };
    await this.transaction(async tx => {
      // Serialize quota decisions for this member; the existing User row is the lock key.
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${memberId} FOR UPDATE`;
      const open = await tx.careRequest.count({ where: { memberId, status: { in: ['OPEN', 'CLAIMED'] } } });
      if (open >= CARE_LIMITS.openPerMember) throw new ConflictException('You already have two open requests. Close one before asking again.');
      await tx.careRequest.create({ data: {
        ...ref, topic: input.topic as string, language: input.language as string, contactPreference: input.contactPreference as string, consentAt: new Date(),
        messageCiphertext: this.seal('request', ref, message), nameCiphertext: name ? this.seal('name', ref, name) : null, phoneCiphertext: phone ? this.seal('phone', ref, phone) : null,
      } });
    });
    return this.mine(auth, ref.id);
  }

  async listMine(auth?: string) {
    const memberId = await this.userId(auth);
    const rows = await this.db.careRequest.findMany({ where: { memberId }, orderBy: { createdAt: 'desc' }, take: 50, include: { messages: { orderBy: { createdAt: 'desc' }, select: { senderRole: true, createdAt: true } }, pastor: { select: { pastorProfile: { select: { displayName: true } } } } } });
    return rows.map(r => this.summary(r, 'member', r.pastor?.pastorProfile?.displayName));
  }

  private async ownRequest(memberId: string, id: string) {
    this.checkId(id);
    const request = await this.db.careRequest.findFirst({ where: { id, memberId } });
    if (!request) throw new NotFoundException('Request not found');
    return request as Request;
  }
  async mine(auth: string | undefined, id: string) { return this.thread(await this.ownRequest(await this.userId(auth), id), 'member'); }

  async memberReply(auth: string | undefined, id: string, text: unknown) {
    const request = await this.ownRequest(await this.userId(auth), id);
    if (request.status === 'CLOSED') throw new ConflictException('This conversation is closed');
    await this.addMessage(request, 'member', text);
    return this.thread(request, 'member');
  }
  async memberClose(auth: string | undefined, id: string) {
    const request = await this.ownRequest(await this.userId(auth), id);
    await this.close(request, 'member');
    return this.mine(auth, id);
  }
  /** Permanent: the request and every message are deleted. */
  async memberDelete(auth: string | undefined, id: string) {
    const request = await this.ownRequest(await this.userId(auth), id);
    await this.db.careRequest.delete({ where: { id: request.id } });
    return { deleted: true };
  }

  // ---------- Pastor ----------

  async pastorStatus(auth?: string) {
    const userId = await this.userId(auth);
    const [verification, profile] = await Promise.all([this.db.ministryVerification.findUnique({ where: { userId } }), this.db.pastorProfile.findUnique({ where: { userId } })]);
    const active = !!profile && isActivePastor(verification);
    if (!active) return { active: false };
    const openCases = await this.db.careRequest.count({ where: { pastorId: userId, status: 'CLAIMED' } });
    return { active: true, displayName: profile!.displayName, languages: profile!.languages, acceptingRequests: profile!.acceptingRequests, openCases, maxOpenRequests: profile!.maxOpenRequests };
  }
  async setAvailability(auth: string | undefined, accepting: unknown) {
    const { userId } = await this.activePastor(auth);
    if (typeof accepting !== 'boolean') throw new BadRequestException('Invalid availability');
    await this.db.pastorProfile.update({ where: { userId }, data: { acceptingRequests: accepting } });
    return this.pastorStatus(auth);
  }

  /** Waiting requests in the pastor's languages. Content stays hidden until a pastor claims the request. */
  async queue(auth?: string) {
    const { userId, profile } = await this.activePastor(auth);
    const rows = await this.db.careRequest.findMany({ where: { status: 'OPEN', language: { in: profile.languages }, memberId: { not: userId } }, orderBy: { createdAt: 'asc' }, take: 100, select: { id: true, topic: true, language: true, contactPreference: true, createdAt: true } });
    return rows;
  }
  async claim(auth: string | undefined, id: string) {
    const { userId } = await this.activePastor(auth);
    this.checkId(id);
    await this.transaction(async tx => {
      // Different requests still share the same pastor capacity limit.
      await tx.$queryRaw`SELECT "userId" FROM "PastorProfile" WHERE "userId" = ${userId} FOR UPDATE`;
      const [verification, profile] = await Promise.all([tx.ministryVerification.findUnique({ where: { userId } }), tx.pastorProfile.findUnique({ where: { userId } })]);
      if (!profile || !isActivePastor(verification)) throw new ForbiddenException('Only active, verified pastors can do this');
      if (!profile.acceptingRequests) throw new ConflictException('Turn on “accepting requests” before claiming');
      const open = await tx.careRequest.count({ where: { pastorId: userId, status: 'CLAIMED' } });
      if (open >= profile.maxOpenRequests) throw new ConflictException(`You already have ${open} open conversations, your limit`);
      const request = await tx.careRequest.findUnique({ where: { id } });
      if (!request) throw new NotFoundException('Request not found');
      if (request.memberId === userId) throw new ForbiddenException('You cannot take your own request');
      if (!profile.languages.includes(request.language)) throw new ForbiddenException('This request is in a language you have not listed');
      const claimed = await tx.careRequest.updateMany({ where: { id, status: 'OPEN' }, data: { status: 'CLAIMED', pastorId: userId, claimedAt: new Date() } });
      if (!claimed.count) throw new ConflictException('Another pastor has already taken this request');
    });
    return this.case(auth, id);
  }
  async cases(auth?: string) {
    const { userId } = await this.activePastor(auth);
    const rows = await this.db.careRequest.findMany({ where: { pastorId: userId }, orderBy: { claimedAt: 'desc' }, take: 50, include: { messages: { orderBy: { createdAt: 'desc' }, select: { senderRole: true, createdAt: true } } } });
    return rows.map(r => this.summary(r, 'pastor'));
  }
  private async ownCase(pastorId: string, id: string) {
    this.checkId(id);
    const request = await this.db.careRequest.findFirst({ where: { id, pastorId } });
    if (!request) throw new NotFoundException('Request not found');
    return request as Request;
  }
  async case(auth: string | undefined, id: string) { const { userId } = await this.activePastor(auth); return this.thread(await this.ownCase(userId, id), 'pastor'); }
  async pastorReply(auth: string | undefined, id: string, text: unknown) {
    const { userId } = await this.activePastor(auth);
    const request = await this.ownCase(userId, id);
    if (request.status !== 'CLAIMED') throw new ConflictException('This conversation is closed');
    await this.addMessage(request, 'pastor', text);
    return this.thread(request, 'pastor');
  }
  async pastorClose(auth: string | undefined, id: string) {
    const { userId } = await this.activePastor(auth);
    await this.close(await this.ownCase(userId, id), 'pastor');
    return this.case(auth, id);
  }

  // ---------- Reports ----------

  async memberReport(auth: string | undefined, id: string, input: Record<string, unknown>) {
    const memberId = await this.userId(auth);
    return this.report(await this.ownRequest(memberId, id), memberId, 'member', input);
  }
  async pastorReport(auth: string | undefined, id: string, input: Record<string, unknown>) {
    const { userId } = await this.activePastor(auth);
    return this.report(await this.ownCase(userId, id), userId, 'pastor', input);
  }
  /** Sends a concern to the safeguarding lead. The conversation goes with it only if the reporter chooses. */
  private async report(request: Request, reporterId: string, role: Role, input: Record<string, unknown>) {
    if (typeof input.category !== 'string' || !(REPORT_CATEGORIES as readonly string[]).includes(input.category)) throw new BadRequestException('Choose what the concern is about');
    if (typeof input.shareConversation !== 'boolean') throw new BadRequestException('Say whether to share the conversation');
    const details = this.text(input.details, REPORT_LIMITS.details, 'Details');
    const category = input.category;
    const since = new Date(Date.now() - 86400000);
    const sharedConversation = await this.transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${reporterId} FOR UPDATE`;
      if (await tx.careReport.count({ where: { reporterId, createdAt: { gte: since } } }) >= REPORT_LIMITS.perDay) throw new ConflictException('You have sent several reports today. If someone is in danger, call 112 now.');
      const id = randomUUID();
      let transcriptCiphertext: string | null = null;
      if (input.shareConversation) {
        const messages = await tx.careMessage.findMany({ where: { requestId: request.id }, orderBy: { createdAt: 'asc' } });
        const transcript = [{ from: 'member', at: request.createdAt, text: this.open('request', request, request.messageCiphertext) },
          ...messages.map(m => ({ from: m.senderRole, at: m.createdAt, text: this.open('message', request, m.ciphertext, m.id) }))];
        transcriptCiphertext = encryptReflection(JSON.stringify(transcript), `care-report:transcript:${id}`);
      }
      await tx.careReport.create({ data: {
        id, requestId: request.id, reporterId, reporterRole: role, subjectPastorId: role === 'member' ? request.pastorId : null, category,
        detailsCiphertext: encryptReflection(details, `care-report:details:${id}`), transcriptCiphertext,
      } });
      return !!transcriptCiphertext;
    });
    return { reported: true, sharedConversation };
  }

  // ---------- Shared ----------

  private async addMessage(request: Request, role: Role, text: unknown) {
    const body = this.text(text, CARE_LIMITS.message, 'Message');
    const id = randomUUID();
    await this.transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "CareRequest" WHERE "id" = ${request.id} FOR UPDATE`;
      const fresh = await tx.careRequest.findUnique({ where: { id: request.id } });
      if (!fresh || fresh.status === 'CLOSED' || (role === 'pastor' && fresh.status !== 'CLAIMED')) throw new ConflictException('This conversation is closed');
      await tx.careMessage.create({ data: { id, requestId: request.id, senderRole: role, ciphertext: this.seal('message', request, body, id) } });
      await tx.careRequest.update({ where: { id: request.id }, data: role === 'member' ? { memberReadAt: new Date() } : { pastorReadAt: new Date() } });
    });
  }
  private async close(request: Request, by: Role) {
    if (request.status === 'CLOSED') return;
    const now = new Date();
    await this.db.careRequest.updateMany({ where: { id: request.id, status: { not: 'CLOSED' } }, data: { status: 'CLOSED', closedAt: now, closedBy: by, deleteAfter: new Date(now.getTime() + CARE_LIMITS.retentionDays * 86400000) } });
  }
}

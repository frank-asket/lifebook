import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { database } from '../common/database';
import { EditorialService } from './editorial.service';
import { TeachingDiscoveryService } from './teaching-discovery.service';

function fields(raw: unknown, allowed: string[]): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || Object.keys(raw).some(key => !allowed.includes(key))) throw new BadRequestException('Invalid review fields');
  return raw as Record<string, unknown>;
}
export function reviewInput(raw: unknown) {
  const value = fields(raw, ['revision', 'title', 'speaker', 'attribution', 'rightsReference', 'reviewNotes', 'locale']);
  if (!Number.isSafeInteger(value.revision) || Number(value.revision) < 1 || !['en', 'fr'].includes(value.locale as string)) throw new BadRequestException('Invalid review revision or language');
  const limits = { title: 200, speaker: 200, attribution: 1000, rightsReference: 1000, reviewNotes: 10000 };
  for (const [key, max] of Object.entries(limits)) if (typeof value[key] !== 'string' || (value[key] as string).length > max) throw new BadRequestException(`Invalid ${key}`);
  return { revision: value.revision as number, locale: value.locale as string, title: (value.title as string).trim(), speaker: (value.speaker as string).trim(), attribution: (value.attribution as string).trim(), rightsReference: (value.rightsReference as string).trim(), reviewNotes: (value.reviewNotes as string).trim() };
}

@Injectable()
export class TeachingReviewsService {
  private readonly db = database;
  constructor(private readonly editorial: EditorialService, private readonly discovery: TeachingDiscoveryService) {}
  async list(auth?: string) {
    await this.editorial.requireEditor(auth);
    return this.db.teachingReviewDraft.findMany({ take: 100, orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }] });
  }
  async create(auth: string | undefined, raw: unknown) {
    const editorId = await this.editorial.requireEditor(auth);
    const input = fields(raw, ['videoId', 'channelId']);
    const sourceUrl = await this.discovery.verifyVideo(auth, input.channelId as string, input.videoId as string);
    // Keep only the chosen source reference and human-written notes, not a YouTube metadata cache.
    await this.db.teachingReviewDraft.createMany({ data: [{ sourceUrl, channelId: input.channelId as string, creatorId: editorId, updatedById: editorId }], skipDuplicates: true });
    return this.db.teachingReviewDraft.findUniqueOrThrow({ where: { sourceUrl } });
  }
  async update(auth: string | undefined, id: string, raw: unknown) {
    const editorId = await this.editorial.requireEditor(auth);
    const { revision, ...input } = reviewInput(raw);
    return this.db.$transaction(async tx => {
      if (!await tx.teachingReviewDraft.findUnique({ where: { id }, select: { id: true } })) throw new NotFoundException('Review draft not found');
      const result = await tx.teachingReviewDraft.updateMany({ where: { id, revision }, data: { ...input, revision: { increment: 1 }, updatedById: editorId } });
      if (!result.count) throw new ConflictException('This review changed. Reload before saving; your changes have not been applied.');
      return tx.teachingReviewDraft.findUniqueOrThrow({ where: { id } });
    });
  }
}

import { BadRequestException, ForbiddenException, Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { isIP } from 'node:net';
import { Prisma, PrismaClient } from '@prisma/client';
import { BibleReadingService } from '../bible-reading/bible-reading.service';

function mediaHosts() {
  return (process.env.LIVINGWORD_MEDIA_HOSTS || '').split(',').map(value => value.trim().toLowerCase()).filter(host => host.includes('.') && !isIP(host) && !/(^|\.)(localhost|local|internal)$/.test(host) && /^[a-z0-9.-]+$/.test(host));
}
export function mediaUrl(raw: string) {
  let url: URL;
  try { url = new URL(raw); } catch { throw new BadRequestException('Invalid media URL'); }
  const hosts = mediaHosts();
  if (url.protocol !== 'https:' || url.username || url.password || url.hash || url.search || url.port || !hosts.includes(url.hostname.toLowerCase())) throw new BadRequestException('Media must use an approved HTTPS host without credentials, query, custom port or fragment');
  return url.toString();
}
const select = { id: true, title: true, description: true, mediaKey: true, kind: true, locale: true, speaker: true, attribution: true, transcript: true, publishedAt: true } as const;
/** Teachings anyone may see: approved, published, credited, transcribed, on an approved media host. */
export const approvedTeachings = (): Prisma.SermonWhereInput => {
  const hosts = mediaHosts();
  return { approvedAt: { not: null }, publishedAt: { lte: new Date() }, rightsReference: { not: null }, attribution: { not: null }, transcript: { not: null }, kind: { in: ['audio', 'video'] },
    ...(hosts.length ? { OR: hosts.map(host => ({ mediaKey: { startsWith: `https://${host}/` } })) } : { id: { in: [] } }) };
};
@Injectable()
export class LivingWordService implements OnModuleDestroy {
  private readonly db = new PrismaClient();
  constructor(private readonly identity: BibleReadingService) {}
  async onModuleDestroy() { await this.db.$disconnect(); }
  private present<T extends { mediaKey: string }>(row: T) { const { mediaKey, ...rest } = row; return { ...rest, mediaUrl: mediaUrl(mediaKey) }; }
  async list(locale = 'en', q = '', pageInput = '1') {
    if (typeof locale !== 'string' || typeof q !== 'string' || typeof pageInput !== 'string' || !['en', 'fr'].includes(locale) || q.length > 80 || !/^[1-9][0-9]{0,3}$/.test(pageInput)) throw new BadRequestException('Invalid library filters');
    const page = Number(pageInput); const pageSize = 20;
    const where: Prisma.SermonWhereInput = { AND: [approvedTeachings(), { locale }, ...(q.trim() ? [{ OR: [{ title: { contains: q.trim(), mode: 'insensitive' as const } }, { description: { contains: q.trim(), mode: 'insensitive' as const } }, { speaker: { contains: q.trim(), mode: 'insensitive' as const } }] }] : [])] };
    const [rows, total] = await this.db.$transaction([this.db.sermon.findMany({ where, select, orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }], take: pageSize, skip: (page - 1) * pageSize }), this.db.sermon.count({ where })]);
    return { items: rows.map(row => this.present(row)), total, page, pageSize };
  }
  async details(id: string) {
    const row = await this.db.sermon.findFirst({ where: { ...approvedTeachings(), id }, select });
    if (!row) throw new NotFoundException('Teaching not found');
    return this.present(row);
  }
  private async editor(auth?: string) {
    const id = await this.identity.userId(auth);
    const user = await this.db.user.findUnique({ where: { id }, select: { role: true } });
    if (!user || !['MODERATOR', 'ADMIN'].includes(user.role)) throw new ForbiddenException('Only LifeBook editors can publish teachings');
    return id;
  }
  async drafts(auth?: string) {
    await this.editor(auth);
    return this.db.sermon.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  }
  async save(auth: string | undefined, id: string | undefined, input: { title: string; description?: string; mediaUrl: string; locale: string; kind: string; speaker: string; attribution: string; transcript: string; rightsReference: string; publish: boolean }) {
    const editorId = await this.editor(auth);
    const mediaKey = mediaUrl(input.mediaUrl);
    for (const value of [input.title, input.speaker, input.attribution, input.transcript, input.rightsReference]) if (!value.trim()) throw new BadRequestException('Title, speaker, attribution, transcript and rights reference are required');
    const now = new Date();
    const data = { title: input.title.trim(), description: input.description?.trim() || null, mediaKey, locale: input.locale, kind: input.kind, speaker: input.speaker.trim(), attribution: input.attribution.trim(), transcript: input.transcript.trim(), rightsReference: input.rightsReference.trim(), approvedAt: input.publish ? now : null, approvedById: input.publish ? editorId : null, publishedAt: input.publish ? now : null };
    if (!id) return this.db.sermon.create({ data: { ...data, creatorId: editorId } });
    if (!await this.db.sermon.findUnique({ where: { id }, select: { id: true } })) throw new NotFoundException('Teaching not found');
    return this.db.sermon.update({ where: { id }, data });
  }
  async unpublish(auth: string | undefined, id: string) {
    await this.editor(auth);
    const row = await this.db.sermon.updateMany({ where: { id }, data: { approvedAt: null, approvedById: null, publishedAt: null } });
    if (!row.count) throw new NotFoundException('Teaching not found');
    return { unpublished: true };
  }
}

import { database } from '../common/database';
import { BadRequestException, Injectable, NotFoundException, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import { decryptNote, encryptNote } from './note-crypto';
import { MeditationService } from '../meditation/meditation.service';

type Locale = 'en' | 'fr';
const passagePattern = /^[A-Z0-9]{3}\.[1-9][0-9]*\.[1-9][0-9]*(?:-[1-9][0-9]*)?$/;
@Injectable()
export class BibleAnnotationsService implements OnModuleDestroy {
  private readonly db = database;
  constructor(private readonly meditation: MeditationService) {}
  async onModuleDestroy() { /* The root Database provider owns the shared pool lifecycle. */ }
  private validate(passageId: string, locale: string) {
    if (!passagePattern.test(passageId)) throw new BadRequestException('Invalid verse identifier');
    if (locale !== 'en' && locale !== 'fr') throw new BadRequestException('Invalid locale');
    const range = passageId.split('.')[2].split('-').map(Number);
    if (range.length === 2 && (range[1] < range[0] || range[1] - range[0] > 50)) throw new BadRequestException('Invalid verse range');
  }
  private encrypt(value: string): string { return encryptNote(value); }
  private decrypt(value: string): string { return decryptNote(value); }
  async one(auth?: string, locale?: string, passageId?: string) {
    const userId = await this.meditation.userId(auth);
    if (!passageId || !locale) throw new BadRequestException('A passage and locale are required');
    this.validate(passageId, locale);
    const row = await this.db.bibleAnnotation.findUnique({ where: { userId_locale_passageId: { userId, locale, passageId } } });
    if (!row) return null;
    const { noteCiphertext, ...item } = row;
    return { ...item, note: noteCiphertext ? this.decrypt(noteCiphertext) : null };
  }
  async list(auth?: string, locale?: string, chapterId?: string) {
    const userId = await this.meditation.userId(auth);
    if ((locale || chapterId) && ((locale !== 'en' && locale !== 'fr') || !chapterId || !/^[A-Z0-9]{3}\.[1-9][0-9]{0,2}$/.test(chapterId))) throw new BadRequestException('Invalid chapter filter');
    const rows = await this.db.bibleAnnotation.findMany({ where: { userId, ...(chapterId ? { locale, passageId: { startsWith: chapterId + '.' } } : {}) }, orderBy: { updatedAt: 'desc' }, take: 200 });
    return rows.map(({ noteCiphertext, ...row }) => ({ ...row, note: noteCiphertext ? this.decrypt(noteCiphertext) : null }));
  }
  async page(auth?: string, cursor?: string) {
    const userId = await this.meditation.userId(auth);
    if (cursor && (typeof cursor !== 'string' || cursor.length > 100 || !await this.db.bibleAnnotation.findFirst({ where: { id: cursor, userId }, select: { id: true } }))) throw new NotFoundException('Annotation page not found');
    const rows = await this.db.bibleAnnotation.findMany({ where: { userId, OR: [{ bookmarked: true }, { highlight: { not: null } }, { noteCiphertext: { not: null } }] }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 51, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) });
    return { items: rows.slice(0, 50).map(({ noteCiphertext, ...row }) => ({ ...row, note: noteCiphertext ? this.decrypt(noteCiphertext) : null })), nextCursor: rows.length > 50 ? rows[49].id : null };
  }
  async save(auth: string | undefined, input: { passageId: string; locale: Locale; bookmark?: boolean; highlight?: string | null; note?: string | null }) {
    const userId = await this.meditation.userId(auth);
    this.validate(input.passageId, input.locale);
    if (input.highlight !== undefined && input.highlight !== null && !['yellow','green','blue','pink'].includes(input.highlight)) throw new BadRequestException('Invalid highlight');
    if (input.note !== undefined && input.note !== null && input.note.length > 4000) throw new BadRequestException('Note too long');
    if (input.bookmark === undefined && input.highlight === undefined && input.note === undefined) throw new BadRequestException('No changes provided');
    const data = {
      ...(input.bookmark !== undefined ? { bookmarked: input.bookmark } : {}),
      ...(input.highlight !== undefined ? { highlight: input.highlight } : {}),
      ...(input.note !== undefined ? { noteCiphertext: input.note ? this.encrypt(input.note) : null } : {}),
    };
    const row = await this.db.bibleAnnotation.upsert({
      where: { userId_locale_passageId: { userId, locale: input.locale, passageId: input.passageId } },
      create: { userId, locale: input.locale, passageId: input.passageId, ...data }, update: data,
    });
    return { id: row.id, passageId: row.passageId, locale: row.locale, bookmarked: row.bookmarked, highlight: row.highlight, note: row.noteCiphertext ? this.decrypt(row.noteCiphertext) : null };
  }
  async remove(auth: string | undefined, id: string) {
    const userId = await this.meditation.userId(auth);
    const deleted = await this.db.bibleAnnotation.deleteMany({ where: { id, userId } });
    if (!deleted.count) throw new NotFoundException('Annotation not found');
    return { deleted: true };
  }
}

import { BadRequestException, Injectable, NotFoundException, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { MeditationService } from '../meditation/meditation.service';
import { pageOf } from '../common/paging';
import { decryptReflection, encryptReflection } from '../security/reflection-crypto';
import { PrayerVerseService, type StoredVerse } from './prayer-verse.service';

export const PRAYER_LIMITS = { body: 5000, title: 120, answerNote: 1000, list: 200, preview: 160 };
type Field = 'body' | 'title' | 'answer' | 'meditation' | 'verse';
type Row = { id: string; userId: string; ciphertext: string; titleCiphertext: string | null; answerNoteCiphertext: string | null; answeredAt: Date | null; meditationCiphertext?: string | null; meditationAt?: Date | null; verseCiphertext?: string | null; createdAt: Date; updatedAt: Date };
const idPattern = /^[A-Za-z0-9_-]{1,64}$/;

@Injectable()
export class PrayerService implements OnModuleDestroy {
  private readonly db = new PrismaClient();
  constructor(private readonly meditation: MeditationService, private readonly verses: PrayerVerseService) {}
  async onModuleDestroy() { await this.db.$disconnect(); }
  userId(auth?: string) { return this.meditation.userId(auth); }

  // Bind each value to its field, owner and record so ciphertext cannot be swapped between them.
  private seal(field: Field, userId: string, id: string, text: string) { return encryptReflection(text, `prayer:${field}:${userId}:${id}`); }
  private open(field: Field, row: Row, value: string) {
    // Prayers were encrypted from the first write; plaintext here means tampering, never legacy data.
    if (!value.startsWith('lbenc:v1:')) throw new ServiceUnavailableException('This prayer cannot be opened right now');
    return decryptReflection(value, `prayer:${field}:${row.userId}:${row.id}`);
  }
  private text(value: unknown, max: number, label: string, required: boolean): string | null {
    if (value === undefined || value === null) { if (required) throw new BadRequestException(`${label} is required`); return null; }
    if (typeof value !== 'string') throw new BadRequestException(`Invalid ${label.toLowerCase()}`);
    const trimmed = value.trim();
    if (!trimmed) { if (required) throw new BadRequestException(`${label} is required`); return null; }
    if (trimmed.length > max) throw new BadRequestException(`${label} is too long`);
    return trimmed;
  }
  private checkId(id: string) { if (!idPattern.test(id)) throw new NotFoundException('Prayer not found'); }
  private detail(row: Row) {
    return {
      id: row.id, title: row.titleCiphertext ? this.open('title', row, row.titleCiphertext) : null,
      body: this.open('body', row, row.ciphertext),
      answeredAt: row.answeredAt, answerNote: row.answerNoteCiphertext ? this.open('answer', row, row.answerNoteCiphertext) : null,
      meditation: row.meditationCiphertext ? JSON.parse(this.open('meditation', row, row.meditationCiphertext)) as unknown : null, meditationAt: row.meditationAt ?? null,
      verse: row.verseCiphertext ? this.verses.present(JSON.parse(this.open('verse', row, row.verseCiphertext)) as StoredVerse) : null,
      createdAt: row.createdAt, updatedAt: row.updatedAt,
    };
  }
  private async owned(userId: string, id: string): Promise<Row> {
    this.checkId(id);
    const row = await this.db.prayerEntry.findFirst({ where: { id, userId } });
    if (!row) throw new NotFoundException('Prayer not found');
    return row;
  }

  private summary(row: Row) {
    const { body, answerNote: _answerNote, meditation: _meditation, verse: _verse, ...rest } = this.detail(row);
    return { ...rest, preview: body.length > PRAYER_LIMITS.preview ? body.slice(0, PRAYER_LIMITS.preview).trimEnd() + '…' : body };
  }

  async list(auth?: string) {
    const userId = await this.userId(auth);
    const rows = await this.db.prayerEntry.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' }, take: PRAYER_LIMITS.list });
    return rows.map(row => this.summary(row));
  }

  /** The whole journal, 50 at a time, most recently changed first ("Load more"). */
  async page(auth: string | undefined, cursor?: string) {
    const userId = await this.userId(auth);
    const { rows, nextCursor } = await pageOf(cursor,
      async id => !!await this.db.prayerEntry.findFirst({ where: { id, userId }, select: { id: true } }),
      window => this.db.prayerEntry.findMany({ where: { userId }, orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }], ...window }));
    return { items: rows.map(row => this.summary(row)), nextCursor };
  }
  async get(auth: string | undefined, id: string) {
    const userId = await this.userId(auth);
    return this.detail(await this.owned(userId, id));
  }
  /** A verse for the prayer's text (see PrayerVerseService), sealed like the prayer. Saving never waits on a failure here. */
  private async verseFor(userId: string, id: string, body: string, input: { locale?: unknown; aiVerse?: unknown }) {
    if (input.aiVerse !== undefined && typeof input.aiVerse !== 'boolean') throw new BadRequestException('Invalid aiVerse value');
    try {
      const verse = await this.verses.choose(userId, id, body, input.locale === 'fr' ? 'fr' : 'en', input.aiVerse === true);
      return verse ? this.seal('verse', userId, id, JSON.stringify(verse)) : null;
    } catch { return null; }
  }
  async create(auth: string | undefined, input: { title?: unknown; body?: unknown; locale?: unknown; aiVerse?: unknown }) {
    const userId = await this.userId(auth);
    const body = this.text(input.body, PRAYER_LIMITS.body, 'Prayer', true)!;
    const title = this.text(input.title, PRAYER_LIMITS.title, 'Title', false);
    const id = randomUUID();
    const row = await this.db.prayerEntry.create({ data: {
      id, userId, keyVersion: 1, ciphertext: this.seal('body', userId, id, body), titleCiphertext: title ? this.seal('title', userId, id, title) : null,
      verseCiphertext: await this.verseFor(userId, id, body, input),
    } });
    return this.detail(row);
  }
  async update(auth: string | undefined, id: string, input: { title?: unknown; body?: unknown; locale?: unknown; aiVerse?: unknown }) {
    const userId = await this.userId(auth);
    if (input.title === undefined && input.body === undefined) throw new BadRequestException('No changes provided');
    await this.owned(userId, id);
    const body = input.body === undefined ? undefined : this.text(input.body, PRAYER_LIMITS.body, 'Prayer', true)!;
    const title = input.title === undefined ? undefined : this.text(input.title, PRAYER_LIMITS.title, 'Title', false);
    const verseCiphertext = body === undefined ? undefined : await this.verseFor(userId, id, body, input);
    const updated = await this.db.prayerEntry.updateMany({ where: { id, userId }, data: {
      // A meditation or verse chosen for the old text no longer fits the edited prayer.
      ...(body !== undefined ? { ciphertext: this.seal('body', userId, id, body), meditationCiphertext: null, meditationAt: null, verseCiphertext } : {}),
      ...(title !== undefined ? { titleCiphertext: title ? this.seal('title', userId, id, title) : null } : {}),
    } });
    if (!updated.count) throw new NotFoundException('Prayer not found');
    return this.get(auth, id);
  }
  /** For guided meditation: the owner's prayer text, decrypted. */
  async ownedBody(userId: string, id: string) {
    const row = await this.owned(userId, id);
    return this.open('body', row, row.ciphertext);
  }
  async saveMeditation(userId: string, id: string, meditation: unknown) {
    await this.owned(userId, id);
    await this.db.prayerEntry.updateMany({ where: { id, userId }, data: { meditationCiphertext: this.seal('meditation', userId, id, JSON.stringify(meditation)), meditationAt: new Date() } });
  }
  async clearMeditation(auth: string | undefined, id: string) {
    const userId = await this.userId(auth);
    await this.owned(userId, id);
    await this.db.prayerEntry.updateMany({ where: { id, userId }, data: { meditationCiphertext: null, meditationAt: null } });
    return this.get(auth, id);
  }
  async answer(auth: string | undefined, id: string, input: { answered?: unknown; note?: unknown }) {
    const userId = await this.userId(auth);
    if (typeof input.answered !== 'boolean') throw new BadRequestException('Invalid answered value');
    const row = await this.owned(userId, id);
    const note = input.answered ? this.text(input.note, PRAYER_LIMITS.answerNote, 'Note', false) : null;
    const updated = await this.db.prayerEntry.updateMany({ where: { id, userId }, data: {
      answeredAt: input.answered ? row.answeredAt ?? new Date() : null,
      answerNoteCiphertext: note ? this.seal('answer', userId, id, note) : null,
    } });
    if (!updated.count) throw new NotFoundException('Prayer not found');
    return this.get(auth, id);
  }
  async remove(auth: string | undefined, id: string) {
    const userId = await this.userId(auth);
    this.checkId(id);
    const deleted = await this.db.prayerEntry.deleteMany({ where: { id, userId } });
    if (!deleted.count) throw new NotFoundException('Prayer not found');
    return { deleted: true };
  }
  async removeAll(auth: string | undefined, confirm: unknown) {
    const userId = await this.userId(auth);
    if (confirm !== 'DELETE_ALL_PRAYERS') throw new BadRequestException('Confirmation required');
    const deleted = await this.db.prayerEntry.deleteMany({ where: { userId } });
    return { deleted: deleted.count };
  }
}

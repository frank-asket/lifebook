import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BadRequestException } from '@nestjs/common';

export type Locale = 'en' | 'fr';

/**
 * The Bible versions a reader can choose. Each one is either served by API.Bible (the key stays on this
 * server) or, for public-domain texts API.Bible doesn't offer, from our own files in content/bibles.
 * The first version of each language is its default, used wherever no version is asked for.
 * Keep in step with apps/web/lib/bible-versions.ts, which the apps use to draw the picker.
 */
export type BibleVersion = { id: string; locale: Locale; abbreviation: string; name: string } & (
  { source: 'api.bible'; bibleId: () => string | undefined } | { source: 'local'; folder: string }
);

export const BIBLE_VERSIONS: readonly BibleVersion[] = [
  { id: 'kjv', locale: 'en', abbreviation: 'KJV', name: 'King James Version', source: 'api.bible', bibleId: () => process.env.API_BIBLE_EN_BIBLE_ID },
  { id: 'bsb', locale: 'en', abbreviation: 'BSB', name: 'Berean Standard Bible', source: 'api.bible', bibleId: () => 'bba9f40183526463-01' },
  { id: 'web', locale: 'en', abbreviation: 'WEB', name: 'World English Bible', source: 'api.bible', bibleId: () => '9879dbb7cfe39e4d-04' },
  { id: 'nkjv', locale: 'en', abbreviation: 'NKJV', name: 'New King James Version', source: 'api.bible', bibleId: () => '63097d2a0a2f7db3-01' },
  { id: 'gnt', locale: 'en', abbreviation: 'GNT', name: 'Good News Translation', source: 'api.bible', bibleId: () => '61fd76eafa1577c2-02' },
  { id: 'darby', locale: 'fr', abbreviation: 'JND', name: 'Bible J.N. Darby', source: 'api.bible', bibleId: () => process.env.API_BIBLE_FR_BIBLE_ID },
  { id: 'lsg', locale: 'fr', abbreviation: 'LSG', name: 'Louis Segond 1910', source: 'local', folder: 'lsg' },
];

/** The version asked for, or the language's default. An unknown version is refused rather than silently swapped. */
export function resolveVersion(locale: Locale, requested?: string): BibleVersion {
  if (requested === undefined || requested === '') return BIBLE_VERSIONS.find(v => v.locale === locale)!;
  const version = BIBLE_VERSIONS.find(v => v.id === requested);
  if (!version) throw new BadRequestException('Unknown Bible version');
  return version;
}

type LocalBook = { id: string; name: string; chapters: [string, string][][][] };
type LocalIndex = { id: string; name: string; abbreviation: string; language: string; copyright: string; books: { id: string; name: string; chapters: number }[] };

const PASSAGE = /^([A-Z0-9]{3})\.([0-9]+)(?:\.([0-9]+)(?:-([0-9]+))?)?$/;
/** Lower case without accents or punctuation, so "Eternel" finds "Éternel" and "l’esprit" finds "esprit". */
const fold = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * A Bible kept in our own files, answering in the same shapes as API.Bible so the apps read both alike.
 * Files load on first use and stay in memory (Louis Segond 1910 is about 4.5 MB).
 */
export class LocalBible {
  private index?: LocalIndex;
  private readonly bookCache = new Map<string, LocalBook>();
  private folded?: { id: string; reference: string; chapterId: string; verse: number; words: string }[];

  constructor(readonly id: string, private readonly folder: string) {}

  private file<T>(name: string): T {
    return JSON.parse(readFileSync(join(__dirname, '../../content/bibles', this.folder, name), 'utf8')) as T;
  }
  private meta(): LocalIndex { return this.index ??= this.file<LocalIndex>('index.json'); }
  private book(bookId: string): LocalBook | undefined {
    if (!this.meta().books.some(b => b.id === bookId)) return undefined;
    let book = this.bookCache.get(bookId);
    if (!book) { book = this.file<LocalBook>(`${bookId}.json`); this.bookCache.set(bookId, book); }
    return book;
  }

  translation() {
    const m = this.meta();
    return { data: { id: this.id, name: m.name, nameLocal: m.name, abbreviation: m.abbreviation, abbreviationLocal: m.abbreviation, language: { id: m.language }, copyright: m.copyright } };
  }

  books() {
    return { data: this.meta().books.map(b => ({ id: b.id, bibleId: this.id, abbreviation: b.id, name: b.name, nameLong: b.name })) };
  }

  chapters(bookId: string) {
    const book = this.meta().books.find(b => b.id === bookId);
    if (!book) throw new BadRequestException('Invalid book');
    return { data: Array.from({ length: book.chapters }, (_, i) => ({ id: `${bookId}.${i + 1}`, bibleId: this.id, bookId, number: String(i + 1), reference: `${book.name} ${i + 1}` })) };
  }

  /** API.Bible's plain-text layout: one paragraph per line, each verse led by its number in brackets. */
  private text(paragraphs: [string, string][][]): string {
    return paragraphs.map(p => '     ' + p.map(([n, t]) => `[${n}] ${t}`).join(' ')).join('\n');
  }

  chapter(chapterId: string) {
    const [bookId, number] = chapterId.split('.');
    const book = this.book(bookId);
    const paragraphs = book?.chapters[Number(number) - 1];
    if (!book || !paragraphs) throw new BadRequestException('Invalid chapter');
    return { data: { id: chapterId, bibleId: this.id, reference: `${book.name} ${Number(number)}`, content: this.text(paragraphs), copyright: this.meta().copyright, fumsToken: null } };
  }

  passage(passageId: string) {
    const match = PASSAGE.exec(passageId);
    const book = match && this.book(match[1]);
    const paragraphs = match && book?.chapters[Number(match[2]) - 1];
    if (!match || !book || !paragraphs) throw new BadRequestException('Invalid passage identifier');
    const from = match[3] ? Number(match[3]) : 1;
    const to = match[4] ? Number(match[4]) : match[3] ? from : Infinity;
    const kept = paragraphs.map(p => p.filter(([n]) => Number(n) >= from && Number(n) <= to)).filter(p => p.length);
    if (!kept.length || to < from) throw new BadRequestException('Invalid passage identifier');
    const verses = match[3] ? `:${from}${match[4] ? `-${to}` : ''}` : '';
    return { reference: `${book.name} ${Number(match[2])}${verses}`, text: this.text(kept).trim(), copyright: this.meta().copyright };
  }

  /** Verses with a word starting with each word of the query ("berger" finds "bergers"), in Bible order. References only, like the API.Bible search. */
  search(query: string, offset: number, limit: number) {
    const terms = fold(query).split(' ').filter(Boolean);
    if (!terms.length) return { items: [], total: 0 };
    this.folded ??= this.meta().books.flatMap(meta => {
      const book = this.book(meta.id)!;
      return book.chapters.flatMap((paragraphs, c) => paragraphs.flat().map(([n, t]) => ({
        id: `${meta.id}.${c + 1}.${n}`, reference: `${meta.name} ${c + 1}:${n}`, chapterId: `${meta.id}.${c + 1}`, verse: Number(n), words: ` ${fold(t)} `,
      })));
    });
    const hits = this.folded.filter(v => terms.every(term => v.words.includes(` ${term}`)));
    return { items: hits.slice(offset, offset + limit).map(({ words: _words, ...item }) => item), total: hits.length };
  }
}

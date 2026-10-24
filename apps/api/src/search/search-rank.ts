// Unified search: reference parsing and ranking. Pure functions, no database or network.

/** Lower case, accents removed, punctuation to spaces, single spaces. "Prière " -> "priere". */
export function fold(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’'`]/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
}

/**
 * How well a query matches a title (and, more weakly, a description). 0 means no match.
 * Words must match whole words or word beginnings: "grace" matches "Grace" and "graces", never "disgrace".
 */
export function score(query: string, title: string, description = ''): number {
  const q = fold(query);
  if (!q) return 0;
  const t = fold(title);
  const words = q.split(' ');
  const titleWords = t.split(' ');
  const descWords = fold(description).split(' ');
  const has = (list: string[], w: string, prefix: boolean) => list.some(x => x === w || (prefix && w.length >= 3 && x.startsWith(w)));
  if (t === q) return 100;
  if (t.startsWith(q + ' ') || (q.length >= 3 && t.startsWith(q))) return 80;
  if (words.every(w => has(titleWords, w, false))) return 60;
  if (words.every(w => has(titleWords, w, true))) return 45;
  if (words.every(w => has(titleWords, w, true) || has(descWords, w, false))) return 30;
  if (words.every(w => has(titleWords, w, true) || has(descWords, w, true))) return 20;
  return 0;
}

/** Best matches first; ties keep a stable alphabetical order. */
export function rank<T>(query: string, items: T[], fields: (item: T) => { title: string; description?: string | null }, limit = 5): (T & { score: number })[] {
  return items
    .map(item => { const f = fields(item); return { ...item, score: score(query, f.title, f.description ?? '') }; })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || fields(a).title.localeCompare(fields(b).title))
    .slice(0, limit);
}

// The 66 books, in the KJV numbering the app uses: USFM id, English name, French name, chapters, extra names.
export const BOOKS: [string, string, string, number, string[]?][] = [
  ['GEN', 'Genesis', 'Genèse', 50], ['EXO', 'Exodus', 'Exode', 40], ['LEV', 'Leviticus', 'Lévitique', 27], ['NUM', 'Numbers', 'Nombres', 36],
  ['DEU', 'Deuteronomy', 'Deutéronome', 34], ['JOS', 'Joshua', 'Josué', 24], ['JDG', 'Judges', 'Juges', 21], ['RUT', 'Ruth', 'Ruth', 4],
  ['1SA', '1 Samuel', '1 Samuel', 31], ['2SA', '2 Samuel', '2 Samuel', 24], ['1KI', '1 Kings', '1 Rois', 22], ['2KI', '2 Kings', '2 Rois', 25],
  ['1CH', '1 Chronicles', '1 Chroniques', 29], ['2CH', '2 Chronicles', '2 Chroniques', 36], ['EZR', 'Ezra', 'Esdras', 10], ['NEH', 'Nehemiah', 'Néhémie', 13],
  ['EST', 'Esther', 'Esther', 10], ['JOB', 'Job', 'Job', 42], ['PSA', 'Psalms', 'Psaumes', 150, ['Psalm', 'Psaume', 'Ps']], ['PRO', 'Proverbs', 'Proverbes', 31, ['Prov', 'Pr']],
  ['ECC', 'Ecclesiastes', 'Ecclésiaste', 12], ['SNG', 'Song of Songs', 'Cantique des cantiques', 8, ['Song of Solomon', 'Cantique']], ['ISA', 'Isaiah', 'Ésaïe', 66, ['Isaïe', 'Is', 'Es']],
  ['JER', 'Jeremiah', 'Jérémie', 52], ['LAM', 'Lamentations', 'Lamentations', 5], ['EZK', 'Ezekiel', 'Ézéchiel', 48], ['DAN', 'Daniel', 'Daniel', 12],
  ['HOS', 'Hosea', 'Osée', 14], ['JOL', 'Joel', 'Joël', 3], ['AMO', 'Amos', 'Amos', 9], ['OBA', 'Obadiah', 'Abdias', 1], ['JON', 'Jonah', 'Jonas', 4],
  ['MIC', 'Micah', 'Michée', 7], ['NAM', 'Nahum', 'Nahum', 3], ['HAB', 'Habakkuk', 'Habacuc', 3], ['ZEP', 'Zephaniah', 'Sophonie', 3], ['HAG', 'Haggai', 'Aggée', 2],
  ['ZEC', 'Zechariah', 'Zacharie', 14], ['MAL', 'Malachi', 'Malachie', 4], ['MAT', 'Matthew', 'Matthieu', 28, ['Mt']], ['MRK', 'Mark', 'Marc', 16, ['Mk', 'Mc']], ['LUK', 'Luke', 'Luc', 24, ['Lk', 'Lc']],
  ['JHN', 'John', 'Jean', 21, ['Jn']], ['ACT', 'Acts', 'Actes', 28], ['ROM', 'Romans', 'Romains', 16, ['Rm', 'Ro']], ['1CO', '1 Corinthians', '1 Corinthiens', 16], ['2CO', '2 Corinthians', '2 Corinthiens', 13],
  ['GAL', 'Galatians', 'Galates', 6], ['EPH', 'Ephesians', 'Éphésiens', 6], ['PHP', 'Philippians', 'Philippiens', 4, ['Phil', 'Php', 'Ph']], ['COL', 'Colossians', 'Colossiens', 4],
  ['1TH', '1 Thessalonians', '1 Thessaloniciens', 5], ['2TH', '2 Thessalonians', '2 Thessaloniciens', 3], ['1TI', '1 Timothy', '1 Timothée', 6], ['2TI', '2 Timothy', '2 Timothée', 4],
  ['TIT', 'Titus', 'Tite', 3], ['PHM', 'Philemon', 'Philémon', 1, ['Phm', 'Philem']], ['HEB', 'Hebrews', 'Hébreux', 13], ['JAS', 'James', 'Jacques', 5, ['Jas', 'Jc']], ['1PE', '1 Peter', '1 Pierre', 5],
  ['2PE', '2 Peter', '2 Pierre', 3], ['1JN', '1 John', '1 Jean', 5], ['2JN', '2 John', '2 Jean', 1], ['3JN', '3 John', '3 Jean', 1], ['JUD', 'Jude', 'Jude', 1],
  ['REV', 'Revelation', 'Apocalypse', 22, ['Revelations', 'Rev', 'Ap']],
];
const NAMES: [string, number][] = BOOKS.flatMap(([, en, fr, , extra = []], index) => [en, fr, ...extra].map(name => [fold(name).replace(/ /g, ''), index] as [string, number]));

export type Reference = { bookId: string; chapter: number; verse: number | null; verseEnd: number | null; chapterId: string; label: string };

/**
 * Reads "John 3:16", "jean 3 16", "1 Jean 4", "Psaume 23", "Gen 1:1-3" or "rom 8".
 * A book may be shortened to its first three letters or more, if that names only one book. Chapters are checked.
 */
export function parseReference(query: string, locale: 'en' | 'fr'): Reference | null {
  const m = /^\s*([1-3])?\s*([\p{L} .]+?)\.?\s*(\d{1,3})(?:\s*[:.,\s]\s*(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?)?\s*$/u.exec(query);
  if (!m) return null;
  const key = (m[1] ?? '') + fold(m[2]).replace(/ /g, '');
  if (key.replace(/\d/g, '').length < 2) return null;
  const exact = NAMES.filter(([name]) => name === key).map(([, i]) => i);
  const prefix = key.replace(/\d/g, '').length >= 3 ? [...new Set(NAMES.filter(([name]) => name.startsWith(key)).map(([, i]) => i))] : [];
  const index = exact.length ? exact[0] : prefix.length === 1 ? prefix[0] : null;
  if (index === null) return null;
  const [bookId, en, fr, chapters] = BOOKS[index];
  const chapter = Number(m[3]);
  if (chapter < 1 || chapter > chapters) return null;
  const verse = m[4] ? Number(m[4]) : null;
  const verseEnd = m[5] ? Number(m[5]) : null;
  if (verse !== null && (verse < 1 || verse > 176)) return null;
  if (verseEnd !== null && (verse === null || verseEnd <= verse || verseEnd > 176)) return null;
  // One psalm is "Psalm 23" / "Psaume 23".
  const name = bookId === 'PSA' ? (locale === 'fr' ? 'Psaume' : 'Psalm') : locale === 'fr' ? fr : en;
  return { bookId, chapter, verse, verseEnd, chapterId: `${bookId}.${chapter}`, label: `${name} ${chapter}${verse ? `:${verse}${verseEnd ? `-${verseEnd}` : ''}` : ''}` };
}

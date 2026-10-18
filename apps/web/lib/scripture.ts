// Presentation helpers for Scripture: book names, passage labels, verse layout and calendar dates.
// They only format text the API returned; they never change the words of a passage.

type Locale = 'en' | 'fr';

const BOOKS: Record<string, [string, string]> = {
  GEN: ['Genesis', 'Genèse'], EXO: ['Exodus', 'Exode'], LEV: ['Leviticus', 'Lévitique'], NUM: ['Numbers', 'Nombres'],
  DEU: ['Deuteronomy', 'Deutéronome'], JOS: ['Joshua', 'Josué'], JDG: ['Judges', 'Juges'], RUT: ['Ruth', 'Ruth'],
  '1SA': ['1 Samuel', '1 Samuel'], '2SA': ['2 Samuel', '2 Samuel'], '1KI': ['1 Kings', '1 Rois'], '2KI': ['2 Kings', '2 Rois'],
  '1CH': ['1 Chronicles', '1 Chroniques'], '2CH': ['2 Chronicles', '2 Chroniques'], EZR: ['Ezra', 'Esdras'], NEH: ['Nehemiah', 'Néhémie'],
  EST: ['Esther', 'Esther'], JOB: ['Job', 'Job'], PSA: ['Psalm', 'Psaume'], PRO: ['Proverbs', 'Proverbes'],
  ECC: ['Ecclesiastes', 'Ecclésiaste'], SNG: ['Song of Songs', 'Cantique des cantiques'], ISA: ['Isaiah', 'Ésaïe'], JER: ['Jeremiah', 'Jérémie'],
  LAM: ['Lamentations', 'Lamentations'], EZK: ['Ezekiel', 'Ézéchiel'], DAN: ['Daniel', 'Daniel'], HOS: ['Hosea', 'Osée'],
  JOL: ['Joel', 'Joël'], AMO: ['Amos', 'Amos'], OBA: ['Obadiah', 'Abdias'], JON: ['Jonah', 'Jonas'],
  MIC: ['Micah', 'Michée'], NAM: ['Nahum', 'Nahoum'], HAB: ['Habakkuk', 'Habaquq'], ZEP: ['Zephaniah', 'Sophonie'],
  HAG: ['Haggai', 'Aggée'], ZEC: ['Zechariah', 'Zacharie'], MAL: ['Malachi', 'Malachie'], MAT: ['Matthew', 'Matthieu'],
  MRK: ['Mark', 'Marc'], LUK: ['Luke', 'Luc'], JHN: ['John', 'Jean'], ACT: ['Acts', 'Actes'],
  ROM: ['Romans', 'Romains'], '1CO': ['1 Corinthians', '1 Corinthiens'], '2CO': ['2 Corinthians', '2 Corinthiens'], GAL: ['Galatians', 'Galates'],
  EPH: ['Ephesians', 'Éphésiens'], PHP: ['Philippians', 'Philippiens'], COL: ['Colossians', 'Colossiens'], '1TH': ['1 Thessalonians', '1 Thessaloniciens'],
  '2TH': ['2 Thessalonians', '2 Thessaloniciens'], '1TI': ['1 Timothy', '1 Timothée'], '2TI': ['2 Timothy', '2 Timothée'], TIT: ['Titus', 'Tite'],
  PHM: ['Philemon', 'Philémon'], HEB: ['Hebrews', 'Hébreux'], JAS: ['James', 'Jacques'], '1PE': ['1 Peter', '1 Pierre'],
  '2PE': ['2 Peter', '2 Pierre'], '1JN': ['1 John', '1 Jean'], '2JN': ['2 John', '2 Jean'], '3JN': ['3 John', '3 Jean'],
  JUD: ['Jude', 'Jude'], REV: ['Revelation', 'Apocalypse'],
};

export function bookName(id: string, locale: Locale): string {
  const names = BOOKS[id.toUpperCase()];
  return names ? names[locale === 'fr' ? 1 : 0] : id;
}

/** "LUK.1" → "Luke 1", "LUK.1.5" → "Luke 1:5", "PHP.4.6-PHP.4.7" → "Philippians 4:6–7". Unknown ids are returned unchanged. */
export function passageLabel(id: string, locale: Locale, verse?: number | null): string {
  const [start, end] = id.split('-');
  const match = /^([1-3]?[A-Z]{2,3})\.(\d+)(?:\.(\d+))?$/.exec(start ?? '');
  if (!match) return id;
  const [, book, chapter, firstVerse] = match;
  let label = `${bookName(book, locale)} ${chapter}`;
  const v = firstVerse ?? (verse ? String(verse) : undefined);
  if (v) label += `:${v}`;
  const tail = end && /\.(\d+)\.(\d+)$/.exec(end);
  if (tail) label += tail[1] === chapter ? `–${tail[2]}` : `–${tail[1]}:${tail[2]}`;
  return label;
}

export type Verse = { number: string; text: string };

/** Splits API.Bible text ("[1] In the beginning… [2] …", paragraphs on new lines) into paragraphs of numbered verses.
 *  A leading "¶" (the KJV paragraph mark) starts a new paragraph instead of being printed. */
export function parseVerses(content: string): Verse[][] {
  return content.split(/\n+/).flatMap(paragraph => {
    const verses: Verse[] = [];
    const pattern = /\[(\d+[a-z]?)\]\s*/g;
    let match: RegExpExecArray | null;
    let last: Verse | null = null;
    let index = 0;
    const first = paragraph.search(/\[\d/);
    const lead = (first < 0 ? paragraph : paragraph.slice(0, first)).trim();
    if (lead) verses.push({ number: '', text: lead });
    while ((match = pattern.exec(paragraph))) {
      if (last) last.text = paragraph.slice(index, match.index).trim();
      last = { number: match[1], text: '' };
      verses.push(last);
      index = pattern.lastIndex;
    }
    if (last) last.text = paragraph.slice(index).trim();
    const split: Verse[][] = [[]];
    for (const verse of verses.filter(v => v.text || v.number)) {
      if (verse.text.startsWith('¶')) { verse.text = verse.text.slice(1).trim(); if (split[split.length - 1].length) split.push([]); }
      split[split.length - 1].push(verse);
    }
    return split;
  }).filter(p => p.length);
}

/** "2026-10-18" → "Sunday 18 October" / "dimanche 18 octobre", in the reader's calendar (no timezone shift). */
export function calendarDay(isoDate: string, locale: Locale): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return isoDate;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(date);
}

/** A greeting that fits the time of day. */
export function greeting(hour: number, locale: Locale): string {
  if (locale === 'fr') return hour >= 18 || hour < 4 ? 'Bonsoir' : 'Bonjour';
  return hour < 4 || hour >= 18 ? 'Good evening' : hour < 12 ? 'Good morning' : 'Good afternoon';
}

export type DayMark = { date: string; label: string; name: string; state: 'none' | 'started' | 'done'; today: boolean };

/** The last seven calendar days ending today, marked by whether a Daily Word session was started or finished. No streaks: a missed day is simply empty. */
export function lastSevenDays(todayIso: string, locale: Locale, sessions: { journeyDate: string; status: string; steps?: unknown[] }[]): DayMark[] {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(todayIso);
  if (!match) return [];
  const end = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const byDate = new Map(sessions.map(s => [s.journeyDate.slice(0, 10), s]));
  const short = new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', { weekday: 'narrow', timeZone: 'UTC' });
  const long = new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(end - (6 - i) * 86400000);
    const date = day.toISOString().slice(0, 10);
    const session = byDate.get(date);
    const state = !session ? 'none' : session.status === 'COMPLETED' ? 'done' : session.steps?.length ? 'started' : 'none';
    return { date, label: short.format(day), name: long.format(day), state, today: i === 6 };
  });
}

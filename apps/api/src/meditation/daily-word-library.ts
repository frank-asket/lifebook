// The Daily Word library: one entry per calendar date, written in English and French and reviewed pastorally.
// Scripture text is never stored here, only a passage id; the text always comes from the published translation.

export type DailyWordText = { explanation: string; question: string; prayer: string; action: string };
export type DailyWordEntry = {
  key: string;                 // stable id, stored on each user's session (e.g. JOSHUA_1_8, D_10_19)
  passage: string;             // USFM id in the English (KJV) versification, e.g. PSA.23.1
  passageFr?: string;          // only when the French (Darby) numbering differs
  date?: string;               // "MM-DD": the calendar day this entry is for; without it, the entry is in the fallback rotation
  en: DailyWordText; fr: DailyWordText;
  review: { status: 'draft' | 'reviewed' | 'legacy'; reviewedBy?: string | null; reviewedOn?: string | null; notes?: string };
};
export type DailyWordLibrary = { version: 1; notes?: string; entries: DailyWordEntry[] };

const PASSAGE = /^[1-3]?[A-Z]{2,3}\.[0-9]{1,3}\.[0-9]{1,3}(?:-[0-9]{1,3})?$/;
const KEY = /^[A-Z][A-Z0-9_]{2,40}$/;
const DATE = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
export const LIMITS = { explanation: 420, question: 160, prayer: 420, action: 200 } as const;
// A real calendar day in a leap year (so 02-29 is allowed; 02-31 is not).
const realDay = (md: string) => { const [m, d] = md.split('-').map(Number); const t = new Date(Date.UTC(2024, m - 1, d)); return t.getUTCMonth() === m - 1 && t.getUTCDate() === d; };
const ENTRY_KEYS = new Set(['key', 'passage', 'passageFr', 'date', 'en', 'fr', 'review']);

/** Throws with a precise message if anything is off; returns the library unchanged when valid. */
export function validateDailyWordLibrary(value: unknown): DailyWordLibrary {
  const lib = value as DailyWordLibrary;
  if (!lib || lib.version !== 1 || !Array.isArray(lib.entries) || !lib.entries.length) throw new Error('Invalid Daily Word library');
  const keys = new Set<string>(); const dates = new Set<string>();
  for (const e of lib.entries) {
    const where = `Entry ${e?.key ?? '?'}`;
    for (const k of Object.keys(e ?? {})) if (!ENTRY_KEYS.has(k)) throw new Error(`${where}: unexpected field "${k}" (Scripture text must never be stored in the library)`);
    if (!KEY.test(e.key) || keys.has(e.key)) throw new Error(`${where}: invalid or duplicate key`);
    keys.add(e.key);
    if (!PASSAGE.test(e.passage) || (e.passageFr !== undefined && !PASSAGE.test(e.passageFr))) throw new Error(`${where}: invalid passage id`);
    if (e.date !== undefined) {
      if (!DATE.test(e.date) || !realDay(e.date)) throw new Error(`${where}: invalid date "${e.date}" (use MM-DD)`);
      if (dates.has(e.date)) throw new Error(`${where}: another entry already uses ${e.date}`);
      dates.add(e.date);
    }
    for (const lang of ['en', 'fr'] as const) {
      for (const field of Object.keys(LIMITS) as (keyof DailyWordText)[]) {
        const text = e[lang]?.[field];
        if (typeof text !== 'string' || !text.trim()) throw new Error(`${where}: ${lang}.${field} is missing`);
        if (text.length > LIMITS[field]) throw new Error(`${where}: ${lang}.${field} is longer than ${LIMITS[field]} characters`);
      }
    }
    const r = e.review;
    if (!r || !['draft', 'reviewed', 'legacy'].includes(r.status)) throw new Error(`${where}: review.status must be draft, reviewed or legacy`);
    if (r.status === 'reviewed' && (!r.reviewedBy?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(r.reviewedOn ?? ''))) throw new Error(`${where}: a reviewed entry must name its reviewer and date (YYYY-MM-DD)`);
  }
  if (!lib.entries.some(e => e.date === undefined && e.review.status !== 'draft')) throw new Error('The library needs at least one undated, non-draft entry for the fallback rotation');
  return lib;
}

/** Which entries may be shown: reviewed and legacy everywhere, drafts only where explicitly allowed (staging). */
export const servable = (e: DailyWordEntry, allowDraft: boolean) => e.review.status !== 'draft' || allowDraft;

/**
 * The entry for a date (YYYY-MM-DD): the servable entry written for that calendar day, otherwise the fallback
 * rotation of undated entries by day number. Adding dated entries never changes what other days show.
 */
export function entryFor(lib: DailyWordLibrary, isoDate: string, allowDraft = false): DailyWordEntry {
  const md = isoDate.slice(5, 10);
  const dated = lib.entries.find(e => e.date === md && servable(e, allowDraft));
  if (dated) return dated;
  const pool = lib.entries.filter(e => e.date === undefined && servable(e, allowDraft));
  const days = Math.floor(Date.parse(`${isoDate}T00:00:00Z`) / 86400000);
  return pool[((days % pool.length) + pool.length) % pool.length];
}

/** Coverage for the check script: dated entries by status and the calendar days still missing. */
export function coverage(lib: DailyWordLibrary) {
  const byStatus = { reviewed: 0, draft: 0, legacy: 0 };
  for (const e of lib.entries) if (e.date) byStatus[e.review.status]++;
  const all: string[] = [];
  for (let d = Date.UTC(2024, 0, 1); d < Date.UTC(2025, 0, 1); d += 86400000) all.push(new Date(d).toISOString().slice(5, 10));
  const dated = new Set(lib.entries.filter(e => e.date).map(e => e.date as string));
  return { byStatus, missing: all.filter(d => !dated.has(d)) };
}

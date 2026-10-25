// The Bible versions a reader can choose, and which one they chose for each language, remembered on this
// device. Keep in step with apps/api/src/bible-content/bible-versions.ts, which serves them.

export type BibleVersionLocale = 'en' | 'fr';
export type BibleVersion = {
  id: string; locale: BibleVersionLocale; abbreviation: string; name: string;
  /** Who serves the text: API.Bible (reported to its usage system) or LifeBook's own public-domain files. */
  source: 'api.bible' | 'lifebook';
  /** Psalm 119:105 for the settings preview, quoted exactly. Only for public-domain texts; others load it from the API. */
  preview?: string;
};

export const BIBLE_VERSIONS: readonly BibleVersion[] = [
  { id: 'kjv', source: 'api.bible', locale: 'en', abbreviation: 'KJV', name: 'King James Version', preview: 'Thy word is a lamp unto my feet, and a light unto my path.' },
  { id: 'bsb', source: 'api.bible', locale: 'en', abbreviation: 'BSB', name: 'Berean Standard Bible', preview: 'Your word is a lamp to my feet and a light to my path.' },
  { id: 'web', source: 'api.bible', locale: 'en', abbreviation: 'WEB', name: 'World English Bible', preview: 'Your word is a lamp to my feet, and a light for my path.' },
  { id: 'nkjv', source: 'api.bible', locale: 'en', abbreviation: 'NKJV', name: 'New King James Version' },
  { id: 'gnt', source: 'api.bible', locale: 'en', abbreviation: 'GNT', name: 'Good News Translation' },
  { id: 'darby', source: 'api.bible', locale: 'fr', abbreviation: 'JND', name: 'Bible J.N. Darby', preview: 'Ta parole est une lampe à mon pied, et une lumière à mon sentier.' },
  { id: 'lsg', source: 'lifebook', locale: 'fr', abbreviation: 'LSG', name: 'Louis Segond 1910', preview: 'Ta parole est une lampe à mes pieds, Et une lumière sur mon sentier.' },
];

export const PREVIEW_PASSAGE = 'PSA.119.105';
export const VERSIONS_KEY = 'lifebook.bibleVersions';
export type VersionChoice = Partial<Record<BibleVersionLocale, string>>;

export function versionsFor(locale: BibleVersionLocale): BibleVersion[] {
  return BIBLE_VERSIONS.filter(v => v.locale === locale);
}

/** The chosen version for a language, or its default (the first listed) when none was chosen or the choice is stale. */
export function versionFor(locale: BibleVersionLocale, choice: VersionChoice | null | undefined): BibleVersion {
  const versions = versionsFor(locale);
  return versions.find(v => v.id === choice?.[locale]) ?? versions[0];
}

/** Accepts only known versions in the right language, so an old or edited entry can never break the reader. */
export function parseVersionChoice(raw: string | null | undefined): VersionChoice {
  let value: unknown = null;
  try { value = raw ? JSON.parse(raw) : null; } catch { /* fall back to defaults */ }
  const out: VersionChoice = {};
  if (!value || typeof value !== 'object') return out;
  for (const locale of ['en', 'fr'] as const) {
    const id = (value as Record<string, unknown>)[locale];
    if (BIBLE_VERSIONS.some(v => v.id === id && v.locale === locale)) out[locale] = id as string;
  }
  return out;
}

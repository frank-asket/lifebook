// Reading comfort preferences, remembered on this device only.

export const TEXT_SIZES = ['s', 'm', 'l', 'xl'] as const;
export type ReaderSettings = { size: typeof TEXT_SIZES[number]; spacing: 'normal' | 'relaxed'; font: 'serif' | 'sans' };
export const DEFAULT_READER: ReaderSettings = { size: 'm', spacing: 'normal', font: 'serif' };
export const READER_KEY = 'lifebook.reader';

/** Accepts only known values, so a stale or edited entry can never break the page. */
export function parseReaderSettings(raw: string | null): ReaderSettings {
  let value: Partial<ReaderSettings> = {};
  try { value = raw ? JSON.parse(raw) : {}; } catch { /* fall back to defaults */ }
  if (!value || typeof value !== 'object') value = {};
  return {
    size: (TEXT_SIZES as readonly string[]).includes(value.size as string) ? value.size as ReaderSettings['size'] : DEFAULT_READER.size,
    spacing: value.spacing === 'relaxed' ? 'relaxed' : 'normal',
    font: value.font === 'sans' ? 'sans' : 'serif',
  };
}

export function stepSize(size: ReaderSettings['size'], by: 1 | -1): ReaderSettings['size'] {
  const i = TEXT_SIZES.indexOf(size) + by;
  return TEXT_SIZES[Math.min(TEXT_SIZES.length - 1, Math.max(0, i))];
}

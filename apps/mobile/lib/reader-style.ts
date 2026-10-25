import { fonts } from './theme';
import type { ReaderSettings } from '../../web/lib/reader-settings';

/** Point sizes for the four text sizes. The reader and the settings preview both use this, so they always match. */
export const READER_SIZES = { s: 17, m: 19, l: 22, xl: 25 } as const;

/** Scripture text style for the given reading settings. */
export function readerText(reader: ReaderSettings) {
  const size = READER_SIZES[reader.size];
  const leading = reader.spacing === 'relaxed' ? 2.2 : 1.8;
  return { size, leading, family: reader.font === 'sans' ? undefined : fonts.serif };
}

/** The preview's reference in each language. The verse itself comes from the chosen version (web/lib/bible-versions.ts). */
export const READER_PREVIEW = {
  en: { reference: 'Psalm 119:105' },
  fr: { reference: 'Psaume 119:105' },
} as const;

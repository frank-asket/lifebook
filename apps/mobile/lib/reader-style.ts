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

/** Shown in the settings sheet so each change is visible at once. Quoted exactly from the translations the app uses. */
export const READER_PREVIEW = {
  en: { text: 'Thy word is a lamp unto my feet, and a light unto my path.', reference: 'Psalm 119:105', translation: 'King James Version' },
  fr: { text: 'Ta parole est une lampe à mon pied, et une lumière à mon sentier.', reference: 'Psaume 119:105', translation: 'Bible J.N. Darby' },
} as const;

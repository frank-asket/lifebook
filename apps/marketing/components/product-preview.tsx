import type { Content } from '../lib/content';
import { Phone, ReaderScreen, TodayScreen } from './phone-screens';

/** Source-based illustrations with sample content; these are not a promise of a native store release. */
export function ProductPreview({ t, screens, locale }: { t: Content['preview']; screens: Content['screens']; locale: 'en' | 'fr' }) {
  return <figure className="product-stage" aria-label={t.label}>
    <div className="product-stage-label"><span className="product-stage-dot" aria-hidden="true" />{locale === 'fr' ? 'Un passage. Un moment pour vous.' : 'One passage. A moment for you.'}</div>
    <div className="product-stage-phones">
      <div className="product-reader"><Phone label={`${screens.bookTitle} · ${screens.translation}`}><ReaderScreen s={screens} sheet={false} /></Phone></div>
      <div className="product-today"><Phone label={screens.todayWord}><TodayScreen s={screens} /></Phone></div>
    </div>
    <figcaption>{locale === 'fr' ? 'Aperçus illustratifs · Français et anglais · Sur navigateur' : 'Illustrative previews · English & French · In your browser'}</figcaption>
  </figure>;
}

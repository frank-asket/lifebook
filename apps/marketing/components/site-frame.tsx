import { content, type Locale } from '../lib/content';
import { SiteHeader } from './site-header';
import { SiteFooter } from './site-footer';

/** Header, content and footer in one language. French pages mark their content with lang="fr". */
export function SiteFrame({ locale = 'en', children }: { locale?: Locale; children: React.ReactNode }) {
  return <div lang={locale}>
    <a className="skip-link" href="#main-content">{content[locale].skip}</a>
    <SiteHeader locale={locale} />
    <div id="main-content" tabIndex={-1}>{children}</div>
    <SiteFooter locale={locale} />
  </div>;
}

import { Brand } from './brand';
import { content, type Locale } from '../lib/content';

export function SiteFooter({ locale = 'en' }: { locale?: Locale }) {
  const t = content[locale];
  const home = locale === 'fr' ? '/fr' : '/';
  return <footer className="site-footer">
    <div className="container footer-grid">
      <div className="footer-brand"><Brand href={home} /><p>{t.footer.tagline}</p></div>
      <nav aria-label={t.footer.explore}><h2>{t.footer.explore}</h2><a href={`${home}#why`}>{t.nav.why}</a><a href={`${home}#features`}>{t.nav.features}</a><a href={`${home}#how`}>{t.nav.how}</a><a href={`${home}#roadmap`}>{t.nav.roadmap}</a><a href={`${home}#churches`}>{t.nav.churches}</a><a href={`${home}#promises`}>{t.nav.promises}</a><a href={`${home}#faq`}>{t.nav.faq}</a></nav>
      <nav aria-label={t.footer.about}><h2>{t.footer.about}</h2><a href="/privacy">{t.footer.privacy}</a><a href="/terms">{t.footer.terms}</a><a href="mailto:hello@lifebook.app">{t.footer.contact}</a><a href={t.nav.otherHref} hrefLang={t.nav.otherLang} lang={t.nav.otherLang}>{t.nav.other}</a></nav>
    </div>
    <div className="container footer-bottom"><span>© {new Date().getFullYear()} LifeBook. {t.footer.rights}</span><span>{t.footer.scripture}</span></div>
  </footer>;
}

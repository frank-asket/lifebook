'use client';
import { useEffect, useRef, useState } from 'react';
import { Brand } from './brand';
import { appLinks } from '../lib/app-links';
import { content, type Locale } from '../lib/content';
import { CloseIcon, MenuIcon } from './icons';

export function SiteHeader({ locale = 'en' }: { locale?: Locale }) {
  const t = content[locale].nav;
  const home = locale === 'fr' ? '/fr' : '/';
  const links: [string, string][] = [[t.how, `${home}#how`], [t.inside, `${home}#inside`], [t.ease, `${home}#ease`], [t.promises, `${home}#promises`], [t.faq, `${home}#faq`]];
  const [open, setOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    nav.current?.querySelector('a')?.focus();
    const dismiss = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); toggle.current?.focus(); } };
    const outside = (event: PointerEvent) => { if (!header.current?.contains(event.target as Node)) setOpen(false); };
    const media = window.matchMedia('(min-width: 1181px)');
    const resize = () => { if (media.matches) setOpen(false); };
    document.addEventListener('keydown', dismiss); document.addEventListener('pointerdown', outside); media.addEventListener('change', resize);
    return () => { document.removeEventListener('keydown', dismiss); document.removeEventListener('pointerdown', outside); media.removeEventListener('change', resize); };
  }, [open]);
  return <header className="site-header" ref={header}>
    <div className="container header-inner">
      <Brand href={home} />
      <nav ref={nav} id="site-navigation" className={open ? 'nav open' : 'nav'} aria-label={locale === 'fr' ? 'Navigation principale' : 'Main navigation'}>
        {links.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}
        <a className="nav-mobile-only" href={appLinks.signIn}>{t.signIn}</a><a className="nav-mobile-only nav-start" href={appLinks.signUp}>{t.start}</a>
      </nav>
      <div className="header-actions">
        <a className="lang-switch" href={t.otherHref} hrefLang={t.otherLang} lang={t.otherLang}>{t.other}</a>
        <a className="header-signin" href={appLinks.signIn}>{t.signIn}</a>
        <a className="button button-small" href={appLinks.signUp}>{t.start}</a>
        <button ref={toggle} type="button" className="menu-toggle" aria-controls="site-navigation" aria-label={open ? t.close : t.menu} aria-expanded={open} onClick={() => setOpen(value => !value)}>{open ? <CloseIcon /> : <MenuIcon />}</button>
      </div>
    </div>
  </header>;
}

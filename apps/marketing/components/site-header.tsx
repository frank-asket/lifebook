'use client';
import { useEffect, useRef, useState } from 'react';
import { Brand } from './brand';
import { appLinks } from '../lib/app-links';
const links = [['Why LifeBook', '/#why'], ['Features', '/#features'], ['How it works', '/#how'], ['Questions', '/#faq']];
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    nav.current?.querySelector('a')?.focus();
    const dismiss = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); toggle.current?.focus(); } };
    const outside = (event: PointerEvent) => { if (!header.current?.contains(event.target as Node)) setOpen(false); };
    const media = window.matchMedia('(min-width: 761px)');
    const resize = () => { if (media.matches) setOpen(false); };
    document.addEventListener('keydown', dismiss); document.addEventListener('pointerdown', outside); media.addEventListener('change', resize);
    return () => { document.removeEventListener('keydown', dismiss); document.removeEventListener('pointerdown', outside); media.removeEventListener('change', resize); };
  }, [open]);
  return <header className="site-header" ref={header}><div className="container header-inner"><Brand /><nav ref={nav} id="marketing-navigation" className={open ? 'nav open' : 'nav'} aria-label="Main navigation">{links.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}<a className="mobile-signin" href={appLinks.signIn}>Sign in to LifeBook →</a></nav><div className="header-actions"><a className="header-login" href={appLinks.signIn}>Sign in</a><a className="button button-small" href={appLinks.signUp}>Get started <span aria-hidden="true">↗</span></a></div><button ref={toggle} type="button" className="menu-toggle" aria-controls="marketing-navigation" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(value => !value)}>{open ? '✕' : '☰'}</button></div></header>;
}

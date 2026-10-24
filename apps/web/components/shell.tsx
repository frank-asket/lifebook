'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { BookOpen, LayoutDashboard, HeartHandshake, Headphones, GraduationCap, BookMarked, Settings, Search, UserRound, Menu, Sun } from 'lucide-react';
import { UserButton, useUser } from '@clerk/nextjs';
import { useLanguage } from './language-provider';
import { pageTitle } from '../lib/page-title';

const links = [
  { href: '/dashboard', en: 'Home', fr: 'Accueil', icon: LayoutDashboard },
  { href: '/daily-word', en: 'Daily Word', fr: 'Parole du jour', icon: Sun },
  { href: '/bible/dashboard', en: 'Bible Reading', fr: 'Lecture biblique', icon: BookOpen },
  { href: '/bible', en: 'Bible Study', fr: 'Étude biblique', icon: BookMarked },
  { href: '/meditation', en: 'Daily Meditation', fr: 'Méditation quotidienne', icon: BookOpen },
  { href: '/prayer', en: 'Prayer Sanctuary', fr: 'Sanctuaire de prière', icon: HeartHandshake },
  { href: '/livingword', en: 'LivingWord', fr: 'Parole vivante', icon: Headphones },
  { href: '/discipleship', en: 'My Journey', fr: 'Mon parcours', icon: GraduationCap },
  { href: '/settings', en: 'Settings', fr: 'Paramètres', icon: Settings },
];

export function Brand() {
  return <Link className="brand" href="/dashboard"><span className="brand-mark"><BookOpen size={22} strokeWidth={2.4} aria-hidden="true" /></span>LifeBook</Link>;
}

export function Shell({ children, title = 'Your space to grow' }: { children: React.ReactNode; title?: string }) {
  const path = usePathname();
  const { language } = useLanguage();
  const { user } = useUser();
  const more = useRef<HTMLDetailsElement>(null);
  const router = useRouter();
  // ⌘K / Ctrl+K anywhere, or "/" when not typing, opens search.
  useEffect(() => {
    const open = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName));
      if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') || (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey)) {
        e.preventDefault(); if (path !== '/search') router.push('/search'); else document.getElementById('site-search')?.focus();
      }
    };
    window.addEventListener('keydown', open);
    return () => window.removeEventListener('keydown', open);
  }, [path, router]);
  const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const reading = /^\/bible\/(read|plans|my-reading|dashboard|annotations)(\/|$)/.test(path);
  const active = (href: string) => href === '/bible/dashboard' ? reading : href === '/bible' ? path === '/bible' || (path.startsWith('/bible/') && !reading) : path === href || path.startsWith(`${href}/`);
  const navigation = links.map(({ href, en, fr, icon: Icon }) => <Link key={href} href={href} className={`nav-link ${active(href) ? 'active' : ''}`} aria-current={active(href) ? 'page' : undefined} onClick={() => { if (more.current) more.current.open = false; }}><Icon size={19} aria-hidden="true" />{tr(en, fr)}</Link>);

  return <div className="app-shell">
    <title>{pageTitle(title)}</title>
    <a className="skip-link" href="#main-content">{tr('Skip to content', 'Aller au contenu')}</a>
    <aside className="sidebar">
      <Brand />
      <div className="side-label">{tr('YOUR SPACE', 'VOTRE ESPACE')}</div>
      <nav className="nav-links" aria-label={tr('Main navigation', 'Navigation principale')}>{navigation}</nav>
      <div className="sidebar-bottom">
        <div className="sidebar-profile"><div className="avatar"><UserRound size={19} aria-hidden="true" /></div><div className="profile-name"><strong>{user?.firstName || tr('LifeBook member', 'Membre LifeBook')}</strong><small>{tr('My account', 'Mon compte')}</small></div><UserButton /></div>
      </div>
    </aside>
    <div className="main-column">
      <div className="mobile-top"><Brand /><div className="mobile-header-actions"><Link href="/search" className="icon-button" aria-label={tr('Search LifeBook', 'Rechercher dans LifeBook')}><Search size={18} aria-hidden="true" /></Link><UserButton /></div></div>
      <header className="topbar"><div><div className="greeting">{title}</div></div><div className="topbar-right"><Link href="/search" className="icon-button" aria-label={tr('Search LifeBook', 'Rechercher dans LifeBook')} aria-keyshortcuts="Control+K Meta+K /" title={tr('Search (⌘K)', 'Rechercher (⌘K)')}><Search size={18} aria-hidden="true" /></Link><Link href="/settings" className="icon-button" aria-label={tr('Settings', 'Paramètres')}><Settings size={18} aria-hidden="true" /></Link><UserButton /></div></header>
      <main id="main-content" className="page" tabIndex={-1}>{children}</main>
      <nav className="mobile-menu" aria-label={tr('Mobile navigation', 'Navigation mobile')}>
        {[links[0], links[1], links[2], links[5]].map(({ href, en, fr, icon: Icon }) => <Link key={href} href={href} className={active(href) ? 'active' : ''} aria-current={active(href) ? 'page' : undefined} onClick={() => { if (more.current) more.current.open = false; }}><Icon size={21} aria-hidden="true" />{href === '/bible/dashboard' ? tr('Bible', 'Bible') : href === '/prayer' ? tr('Prayer', 'Prière') : tr(en, fr)}</Link>)}
        <details className="mobile-more" ref={more} onKeyDown={e => { if (e.key === 'Escape' && more.current) { more.current.open = false; more.current.querySelector('summary')?.focus(); } }}><summary><Menu size={21} aria-hidden="true" />{tr('More', 'Plus')}</summary><div className="mobile-more-panel"><h2>{tr('Explore LifeBook', 'Explorer LifeBook')}</h2>{navigation}</div></details>
      </nav>
    </div>
  </div>;
}

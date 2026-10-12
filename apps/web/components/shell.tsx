'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
    BookOpen,
    LayoutDashboard,
    HeartHandshake,
    Headphones,
    GraduationCap,
    BookMarked,
    Settings,
    Search,
    Bell,
    UserRound,
    House,
} from 'lucide-react';

import { UserButton, useUser } from '@clerk/nextjs';
import {useLanguage} from './language-provider';


// ============================================================
// NAVIGATION
// ============================================================

const links = [
    {
        href: '/dashboard',
        label: 'Home',
        icon: LayoutDashboard,
    },
    {
        href: '/meditation',
        label: 'Daily Meditation',
        icon: BookOpen,
    },
    {
        href: '/prayer',
        label: 'Prayer Sanctuary',
        icon: HeartHandshake,
    },
    {
        href: '/livingword',
        label: 'LivingWord',
        icon: Headphones,
    },
    {
        href: '/bible',
        label: 'Bible Study',
        icon: BookMarked,
    },
    {
        href: '/discipleship',
        label: 'My Journey',
        icon: GraduationCap,
    },
    {
        href: '/settings',
        label: 'Settings',
        icon: Settings,
    },
];

// ============================================================
// BRAND
// ============================================================

export function Brand() {
    return (
        <Link className="brand" href="/dashboard">
            <span className="brand-mark">
                <BookOpen size={22} strokeWidth={2.4} />
            </span>
            LifeBook
        </Link>
    );
}

// ============================================================
// APPLICATION SHELL
// ============================================================

export function Shell({
    children,
    title = 'Your space to grow',
}: {
    children: React.ReactNode;
    title?: string;
}) {
    const path = usePathname();
    const {language,setLanguage}=useLanguage();
    const tr=(en:string,fr:string)=>language==='fr'?fr:en;

    const { user } = useUser();

    return (
        <div className="app-shell">

            {/* ======================================================
          SIDEBAR
      ====================================================== */}

            <aside className="sidebar">

                <Brand />

                <div className="side-label">
                    {tr('YOUR SPACE','VOTRE ESPACE')}
                </div>

                <nav className="nav-links">
                    {links.map((item) => {
                        const active =
                            path === item.href ||
                            path.startsWith(`${item.href}/`);

                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={
                                    `nav-link ${active ? 'active' : ''}`
                                }
                            >
                                <Icon size={19} />

                                {tr(item.label, ({'Home':'Accueil','Daily Meditation':'Méditation quotidienne','Prayer Sanctuary':'Sanctuaire de prière','LivingWord':'Parole vivante','Bible Study':'Étude biblique','My Journey':'Mon parcours','Settings':'Paramètres','Profile':'Profil'} as Record<string,string>)[item.label]||item.label)}
                            </Link>
                        );
                    })}
                </nav>

                <div className="sidebar-bottom">


                    {/* Scripture encouragement */}

                    <div className="small-verse">
                        <strong>
                            {tr('A MOMENT OF PEACE','UN MOMENT DE PAIX')}
                        </strong>

                        “Be still, and know that I am God.”

                        <br />

                        <small>
                            Psalm 46:10
                        </small>
                    </div>

                    {/* User profile */}

                    <div className="sidebar-profile">

                        <div className="avatar">
                            <UserRound size={19} />
                        </div>

                        <div
                            style={{
                                flex: 1,
                                minWidth: 0,
                            }}
                        >
                            <strong
                                style={{
                                    display: 'block',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {user?.firstName || tr('LifeBook member','Membre LifeBook')}
                            </strong>

                            <small>
                                {tr('My account','Mon compte')}
                            </small>
                        </div>

                        <UserButton />

                    </div>
                </div>
            </aside>

            {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

            <div className="main-column">

                {/* Mobile header */}

                <div className="mobile-top">

                    <Brand />

                    <div className="mobile-header-actions">
                        <select aria-label={tr('Application language','Langue de l’application')} value={language} onChange={e=>setLanguage(e.target.value as 'en'|'fr')}><option value="en">EN</option><option value="fr">FR</option></select>

                        <UserButton />
                    </div>

                </div>

                {/* Desktop header */}

                <header className="topbar">

                    <div>
                        <div className="greeting">
                            {title}
                        </div>

                        <span className="muted">
                            {tr('A little time in the Word can shape your day.','Un moment dans la Parole peut transformer votre journée.')}
                        </span>
                    </div>

                    <div className="topbar-right">
                        <label style={{display:'flex',alignItems:'center',gap:6,fontSize:12}}>
                          <span className="sr-only">{tr('Language','Langue')}</span>
                          <select aria-label={tr('Application language','Langue de l’application')} value={language} onChange={e=>setLanguage(e.target.value as 'en'|'fr')} style={{padding:'7px 9px',borderRadius:8}}><option value="en">EN</option><option value="fr">FR</option></select>
                        </label>


                        <Link
                            href="/bible"
                            className="icon-button"
                            aria-label="Bible search"
                        >
                            <Search size={17} />
                        </Link>

                        <Link
                            href="/settings"
                            className="icon-button"
                            aria-label="Settings"
                        >
                            <Bell size={17} />
                        </Link>

                        <UserButton />

                    </div>
                </header>

                {/* Page content */}

                <main className="page">
                    {children}
                </main>

                {/* ====================================================
            MOBILE NAVIGATION
        ==================================================== */}

                <nav className="mobile-menu">

                    {[
                        {
                            href: '/dashboard',
                            label: 'Home',
                            icon: House,
                        },

                        ...links.slice(1, 4),

                        {
                            href: '/settings',
                            label: 'Profile',
                            icon: UserRound,
                        },
                    ].map((item) => {
                        const Icon = item.icon;

                        const active =
                            path === item.href ||
                            path.startsWith(`${item.href}/`);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={
                                    active ? 'active' : ''
                                }
                            >
                                <Icon size={21} />

                                {tr(item.label, ({'Home':'Accueil','Daily Meditation':'Méditation quotidienne','Prayer Sanctuary':'Sanctuaire de prière','LivingWord':'Parole vivante','Bible Study':'Étude biblique','My Journey':'Mon parcours','Settings':'Paramètres','Profile':'Profil'} as Record<string,string>)[item.label]||item.label)}
                            </Link>
                        );
                    })}

                </nav>

            </div>
        </div>
    );
}
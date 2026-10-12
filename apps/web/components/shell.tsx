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

    const { user } = useUser();

    return (
        <div className="app-shell">

            {/* ======================================================
          SIDEBAR
      ====================================================== */}

            <aside className="sidebar">

                <Brand />

                <div className="side-label">
                    YOUR SPACE
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

                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="sidebar-bottom">


                    {/* Scripture encouragement */}

                    <div className="small-verse">
                        <strong>
                            A MOMENT OF PEACE
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
                                {user?.firstName || 'LifeBook member'}
                            </strong>

                            <small>
                                My account
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
                            A little time in the Word can shape your day.
                        </span>
                    </div>

                    <div className="topbar-right">


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

                                {item.label}
                            </Link>
                        );
                    })}

                </nav>

            </div>
        </div>
    );
}
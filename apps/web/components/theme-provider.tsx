'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';

export type ThemeMode =
    | 'system'
    | 'schedule'
    | 'light'
    | 'dark';

type ResolvedTheme = 'light' | 'dark';

type ThemeContextValue = {
    theme: ThemeMode;
    resolvedTheme: ResolvedTheme;
    setTheme: (theme: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'lifebook-theme';

function isTheme(value: string | null): value is ThemeMode {
    return (
        value === 'system' ||
        value === 'schedule' ||
        value === 'light' ||
        value === 'dark'
    );
}

/**
 * Scheduled theme:
 * Light: 06:00–17:59
 * Dark: 18:00–05:59
 *
 * Uses the user's device-local time.
 */
function getScheduledTheme(): ResolvedTheme {
    const hour = new Date().getHours();

    return hour >= 18 || hour < 6 ? 'dark' : 'light';
}

function getResolvedTheme(mode: ThemeMode): ResolvedTheme {
    if (mode === 'light' || mode === 'dark') {
        return mode;
    }

    if (mode === 'schedule') {
        return getScheduledTheme();
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
}

export function ThemeProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [ready, setReady] = useState(false);
    const [theme, setThemeState] = useState<ThemeMode>('system');
    const [resolvedTheme, setResolvedTheme] =
        useState<ResolvedTheme>('light');

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);

            if (isTheme(saved)) {
                setThemeState(saved);
            }
        } catch {
            // Continue using system mode if storage is unavailable.
        } finally {
            setReady(true);
        }
    }, []);

    useEffect(() => {
        if (!ready) return;
        const media = window.matchMedia('(prefers-color-scheme: dark)');

        function applyTheme() {
            const resolved = getResolvedTheme(theme);

            document.documentElement.setAttribute(
                'data-theme',
                resolved,
            );

            document.documentElement.style.colorScheme = resolved;

            setResolvedTheme(resolved);
        }

        applyTheme();

        // Listen for operating system appearance changes.
        media.addEventListener('change', applyTheme);

        // Check periodically for scheduled theme changes.
        const interval = window.setInterval(applyTheme, 30_000);

        // Refresh after returning to a backgrounded tab.
        document.addEventListener('visibilitychange', applyTheme);

        return () => {
            media.removeEventListener('change', applyTheme);
            window.clearInterval(interval);
            document.removeEventListener('visibilitychange', applyTheme);
        };
    }, [theme, ready]);

    const setTheme = useCallback((nextTheme: ThemeMode) => {
        setThemeState(nextTheme);

        try {
            localStorage.setItem(STORAGE_KEY, nextTheme);
        } catch {
            // Theme still works for the current session.
        }
    }, []);

    const value = useMemo(
        () => ({ theme, resolvedTheme, setTheme }),
        [theme, resolvedTheme, setTheme],
    );

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error(
            'useTheme must be used inside ThemeProvider',
        );
    }

    return context;
}
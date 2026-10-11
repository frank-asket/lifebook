'use client';

import { useTheme, type ThemeMode } from './theme-provider';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <label
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 14,
            }}
        >
            <span>Appearance</span>

            <select
                aria-label="Choose appearance"
                value={theme}
                onChange={(event) =>
                    setTheme(event.target.value as ThemeMode)
                }
                style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)',
                }}
            >
                <option value="system">Use device settings</option>
                <option value="schedule">Automatic (6 PM–6 AM)</option>
                <option value="light">Light mode</option>
                <option value="dark">Dark mode</option>
            </select>
        </label>
    );
}
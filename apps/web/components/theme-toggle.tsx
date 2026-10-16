'use client';

import { useLanguage } from './language-provider';
import { useTheme, type ThemeMode } from './theme-provider';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const { language } = useLanguage();
    const tr = (en: string, fr: string) => language === 'fr' ? fr : en;

    return (
        <label className="theme-control"
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 14,
            }}
        >
            <span>{tr('Appearance', 'Apparence')}</span>

            <select
                aria-label={tr('Choose appearance', 'Choisir l’apparence')}
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
                <option value="system">{tr('Use device settings', 'Selon l’appareil')}</option>
                <option value="schedule">{tr('Automatic (6 PM–6 AM)', 'Automatique (18 h–6 h)')}</option>
                <option value="light">{tr('Light mode', 'Mode clair')}</option>
                <option value="dark">{tr('Dark mode', 'Mode sombre')}</option>
            </select>
        </label>
    );
}
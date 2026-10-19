import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from '../components/theme-provider';
import { LanguageProvider } from '../components/language-provider';

import { DailyWordProvider } from '../components/daily-word-provider';
import './globals.css';

export const metadata: Metadata = {
    // No title here: signed-in pages render their own localized <title> through the Shell (React hoists it),
    // and a layout title would be listed first and win. Pages outside the Shell set theirs.
    description:
        'Daily scripture, prayer, discipleship and teaching in one thoughtful space.',
};

/**
 * Initialize the theme before React hydration.
 *
 * Default: device appearance
 * Schedule: dark from 18:00 to 05:59
 */
const themeScript = `
(function () {
  try {
    var mode = localStorage.getItem('lifebook-theme') || 'system';
    var dark;

    if (mode === 'dark') {
      dark = true;
    } else if (mode === 'light') {
      dark = false;
    } else if (mode === 'schedule') {
      var hour = new Date().getHours();
      dark = hour >= 18 || hour < 6;
    } else {
      dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    var resolved = dark ? 'dark' : 'light';

    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.style.colorScheme = resolved;
  } catch (error) {
    // The system theme remains the fallback.
  }
})();
`;

// Opt-in render profiling for local development: NEXT_PUBLIC_REACT_SCAN=1 pnpm dev:web
// Loaded before hydration so React Scan can attach to React; never rendered in production.
const reactScan =
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_REACT_SCAN === '1';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ClerkProvider>
            <html lang="en" suppressHydrationWarning>
                <head>
                    {reactScan && (
                        <script
                            src="https://unpkg.com/react-scan@0.5.7/dist/auto.global.js"
                            crossOrigin="anonymous"
                        />
                    )}
                    <script
                        dangerouslySetInnerHTML={{
                            __html: themeScript,
                        }}
                    />
                </head>

                <body>
                    <ThemeProvider>
                        <LanguageProvider><DailyWordProvider>{children}</DailyWordProvider></LanguageProvider>
                    </ThemeProvider>
                </body>
            </html>
        </ClerkProvider>
    );
}
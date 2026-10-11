import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from '../components/theme-provider';

import './globals.css';

export const metadata: Metadata = {
    title: {
        default: 'LifeBook — Grow in the Word',
        template: '%s | LifeBook',
    },
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

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ClerkProvider>
            <html lang="en" suppressHydrationWarning>
                <head>
                    <script
                        dangerouslySetInnerHTML={{
                            __html: themeScript,
                        }}
                    />
                </head>

                <body>
                    <ThemeProvider>
                        {children}
                    </ThemeProvider>
                </body>
            </html>
        </ClerkProvider>
    );
}
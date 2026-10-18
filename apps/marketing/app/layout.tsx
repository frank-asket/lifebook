import type { Metadata, Viewport } from 'next';
import './globals.css';
import { content } from '../lib/content';

export const metadata: Metadata = {
  title: { default: content.en.meta.title, template: '%s | LifeBook' },
  description: content.en.meta.description,
  openGraph: { title: content.en.meta.title, description: content.en.meta.description, type: 'website' },
  alternates: { languages: { en: '/', fr: '/fr' } },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { themeColor: [{ media: '(prefers-color-scheme: light)', color: '#faf9fc' }, { media: '(prefers-color-scheme: dark)', color: '#121019' }] };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}

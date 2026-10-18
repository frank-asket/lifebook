import type { Metadata } from 'next';
import { SiteFrame } from '../../components/site-frame';
import { Home } from '../../components/home';
import { content } from '../../lib/content';
export const metadata: Metadata = { title: { absolute: content.fr.meta.title }, description: content.fr.meta.description, openGraph: { title: content.fr.meta.title, description: content.fr.meta.description, locale: 'fr_FR' } };
export default function Page() { return <SiteFrame locale="fr"><Home locale="fr" /></SiteFrame>; }

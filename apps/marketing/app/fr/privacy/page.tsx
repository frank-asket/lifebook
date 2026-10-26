import type { Metadata } from 'next';
import { LegalOverview } from '../../../components/legal-overview';

export const metadata: Metadata = {
  title: 'Confidentialité',
  robots: { index: false, follow: true },
  other: { 'lifebook-legal-status': 'draft' },
};
export default function Page() { return <LegalOverview locale="fr" document="privacy" />; }

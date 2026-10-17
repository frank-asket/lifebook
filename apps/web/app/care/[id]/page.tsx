'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Shell } from '../../../components/shell';
import { useLanguage } from '../../../components/language-provider';
import { CareConversation } from '../../../components/care/CareConversation';

export default function CareRequestPage() {
  const { language } = useLanguage(); const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const { id } = useParams<{ id: string }>();
  return <Shell title={tr('Ask a pastor', 'Demander un pasteur')}>
    <Link href="/care" className="text-link">← {tr('Your requests', 'Vos demandes')}</Link>
    <div style={{ marginTop: 20 }}><CareConversation id={id} viewer="member" language={language}/></div>
  </Shell>;
}

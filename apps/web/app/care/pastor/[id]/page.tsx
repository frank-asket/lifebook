'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Shell } from '../../../../components/shell';
import { useLanguage } from '../../../../components/language-provider';
import { CareConversation } from '../../../../components/care/CareConversation';

export default function PastorCasePage() {
  const { language } = useLanguage(); const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const { id } = useParams<{ id: string }>();
  return <Shell title={tr('Pastor space', 'Espace pasteur')}>
    <Link href="/care/pastor" className="text-link care-link"><span aria-hidden="true">←</span> {tr('Pastor space', 'Espace pasteur')}</Link>
    <div style={{ marginTop: 20 }}><CareConversation id={id} viewer="pastor" language={language}/></div>
  </Shell>;
}

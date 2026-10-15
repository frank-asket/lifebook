'use client';
import Link from 'next/link';
import { Shell } from '../../../components/shell';
import { useLanguage } from '../../../components/language-provider';
import { ContinueReading } from '../../../components/bible/ContinueReading';
export default function BibleReadingDashboard() {
  const { language } = useLanguage(); const locale = language === 'fr' ? 'fr' : 'en';
  return <Shell title={locale === 'fr' ? 'Ma lecture biblique' : 'My Bible Reading'}><h1 className="page-heading">{locale === 'fr' ? 'Mon parcours de lecture' : 'My Reading Journey'}</h1><ContinueReading locale={locale}/><div className="card" style={{padding:20}}><p>{locale === 'fr' ? 'Lisez à votre rythme et poursuivez votre progression.' : 'Read at your own pace and pick up where you left off.'}</p><p><Link href={`/bible/read?locale=${locale}`}>{locale === 'fr' ? 'Lire la Bible' : 'Read the Bible'}</Link></p><p><Link href="/bible/plans">{locale === 'fr' ? 'Explorer les plans' : 'Explore reading plans'}</Link></p><p><Link href="/bible/my-reading">{locale === 'fr' ? 'Mon suivi' : 'My progress'}</Link></p></div></Shell>;
}

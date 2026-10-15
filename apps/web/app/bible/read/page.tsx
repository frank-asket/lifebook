import BibleReader from '../../../components/bible/BibleReader';

type Params = { locale?: string; chapter?: string };
export default function BibleReadPage({ searchParams }: { searchParams?: Params }) {
  const locale = searchParams?.locale === 'fr' ? 'fr' : 'en';
  const chapter = searchParams?.chapter;
  const initialChapter = chapter && /^[A-Z0-9]{3}\.[1-9][0-9]{0,2}$/.test(chapter) ? chapter : undefined;
  return <BibleReader key={`${locale}:${initialChapter ?? ''}`} initialLocale={locale} initialChapter={initialChapter} />;
}

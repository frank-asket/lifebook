import BibleReader from '../../../components/bible/BibleReader';

type Params = { locale?: string; chapter?: string; verse?: string };
export default async function BibleReadPage({ searchParams }: { searchParams: Promise<Params> }) {
  const query = await searchParams;
  const locale = query.locale === 'fr' ? 'fr' : query.locale === 'en' ? 'en' : undefined;
  const chapter = query.chapter;
  const initialChapter = chapter && /^[A-Z0-9]{3}\.[1-9][0-9]{0,2}$/.test(chapter) ? chapter : undefined;
  const verse = query.verse && /^[1-9][0-9]{0,2}(?:-[1-9][0-9]{0,2})?$/.test(query.verse) ? query.verse : undefined;
  return <BibleReader key={`${locale}:${initialChapter ?? ''}`} initialLocale={locale} initialChapter={initialChapter} initialVerse={verse} />;
}

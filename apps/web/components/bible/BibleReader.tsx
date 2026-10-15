'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ReadingTracker } from './ReadingTracker';
import { bibleApi, type BibleBook, type BibleChapter, type BibleChapterContent, type BibleLocale, type BibleTranslation } from '../../lib/bible-api';

const labels = {
  en: { title: 'Read the Bible', book: 'Book', chapter: 'Chapter', language: 'Language', prev: 'Previous', next: 'Next', study: 'Bible Study', loading: 'Loading Scripture…', retry: 'Try again', empty: 'Choose a book and chapter.' },
  fr: { title: 'Lire la Bible', book: 'Livre', chapter: 'Chapitre', language: 'Langue', prev: 'Précédent', next: 'Suivant', study: 'Étude biblique', loading: 'Chargement des Écritures…', retry: 'Réessayer', empty: 'Choisissez un livre et un chapitre.' },
};

export default function BibleReader({ initialLocale = 'en', initialChapter }: { initialLocale?: BibleLocale; initialChapter?: string }) {
  const [locale, setLocale] = useState<BibleLocale>(initialLocale);
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [bookId, setBookId] = useState('');
  const [chapters, setChapters] = useState<BibleChapter[]>([]);
  const [chapterId, setChapterId] = useState('');
  const [content, setContent] = useState<BibleChapterContent | null>(null);
  const [translation, setTranslation] = useState<BibleTranslation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const t = labels[locale];

  // Changing locale invalidates the book and chapter lists. Abort stale requests.
  useEffect(() => {
    const abort = new AbortController();
    setBusy(true); setError(''); setBooks([]); setBookId(''); setChapters([]); setChapterId(''); setContent(null); setTranslation(null);
    Promise.all([bibleApi.books(locale, abort.signal), bibleApi.translation(locale, abort.signal)])
      .then(([items, version]) => {
        if (abort.signal.aborted) return;
        setBooks(items); setTranslation(version);
        const requestedBook = initialChapter?.split('.')[0];
        setBookId(items.find(x => x.id === requestedBook)?.id ?? items.find(x => x.id === 'GEN')?.id ?? items[0]?.id ?? '');
      })
      .catch(e => { if (!abort.signal.aborted) setError(e instanceof Error ? e.message : 'Unable to load books'); })
      .finally(() => { if (!abort.signal.aborted) setBusy(false); });
    return () => abort.abort();
  }, [locale, retry]);

  useEffect(() => {
    if (!bookId) return;
    const abort = new AbortController();
    setBusy(true); setError(''); setChapters([]); setChapterId(''); setContent(null);
    bibleApi.chapters(bookId, locale, abort.signal)
      .then(items => {
        if (abort.signal.aborted) return;
        const numbered = items.filter(x => /^\d+$/.test(x.number));
        setChapters(numbered); setChapterId(numbered.find(x => x.id === initialChapter)?.id ?? numbered[0]?.id ?? '');
      })
      .catch(e => { if (!abort.signal.aborted) setError(e instanceof Error ? e.message : 'Unable to load chapters'); })
      .finally(() => { if (!abort.signal.aborted) setBusy(false); });
    return () => abort.abort();
  }, [bookId, locale, retry]);

  useEffect(() => {
    if (!chapterId) return;
    const abort = new AbortController();
    setBusy(true); setError(''); setContent(null);
    bibleApi.chapter(chapterId, locale, abort.signal)
      .then(data => { if (!abort.signal.aborted) setContent(data); })
      .catch(e => { if (!abort.signal.aborted) setError(e instanceof Error ? e.message : 'Unable to load chapter'); })
      .finally(() => { if (!abort.signal.aborted) setBusy(false); });
    return () => abort.abort();
  }, [chapterId, locale, retry]);

  const index = useMemo(() => chapters.findIndex(x => x.id === chapterId), [chapters, chapterId]);
  const previous = index > 0 ? chapters[index - 1] : undefined;
  const next = index >= 0 ? chapters[index + 1] : undefined;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/bible" className="text-sm underline">← {t.study}</Link>
      <h1 className="mt-4 text-3xl font-bold">{t.title}</h1>
      <section className="my-6 grid gap-4 rounded-xl border p-4 sm:grid-cols-3" aria-label="Bible navigation">
        <label className="grid gap-2 text-sm">{t.language}
          <select className="rounded-lg border p-3" value={locale} onChange={e => setLocale(e.target.value as BibleLocale)}>
            <option value="en">English</option><option value="fr">Français</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm">{t.book}
          <select className="rounded-lg border p-3" value={bookId} disabled={!books.length} onChange={e => setBookId(e.target.value)}>
            {!bookId && <option value="">—</option>}
            {books.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm">{t.chapter}
          <select className="rounded-lg border p-3" value={chapterId} disabled={!chapters.length} onChange={e => setChapterId(e.target.value)}>
            {!chapterId && <option value="">—</option>}
            {chapters.map(x => <option key={x.id} value={x.id}>{x.number}</option>)}
          </select>
        </label>
      </section>
      {error && <div role="alert" className="my-4 rounded-lg border border-red-400 p-4">{error} <button className="ml-3 underline" onClick={() => setRetry(x => x + 1)}>{t.retry}</button></div>}
      <article className="rounded-xl border p-6 sm:p-10" aria-busy={busy}>
        {busy ? <p role="status">{t.loading}</p> : content ? <>
          <ReadingTracker locale={locale} chapterId={content.id} />
          <h2 className="mb-6 text-center text-2xl font-semibold">{content.reference}</h2>
          <p className="whitespace-pre-wrap font-serif text-lg leading-9">{content.content}</p>
          <footer className="mt-8 border-t pt-4 text-xs opacity-75">
            <p>{translation?.name ?? translation?.abbreviation ?? 'API.Bible'}</p>
            {translation?.copyright && <p className="mt-2 whitespace-pre-wrap">{translation.copyright}</p>}
            {content.copyright && <p className="mt-2 whitespace-pre-wrap">{content.copyright}</p>}
            <p className="mt-2">Scripture via API.Bible. Check translation-specific attribution requirements.</p>
          </footer>
        </> : <p>{t.empty}</p>}
      </article>
      <nav className="mt-5 flex justify-between gap-3" aria-label="Chapter navigation">
        <button className="rounded-lg border px-4 py-2 disabled:opacity-40" disabled={!previous || busy} onClick={() => previous && setChapterId(previous.id)}>← {t.prev}</button>
        <button className="rounded-lg border px-4 py-2 disabled:opacity-40" disabled={!next || busy} onClick={() => next && setChapterId(next.id)}>{t.next} →</button>
      </nav>
    </main>
  );
}

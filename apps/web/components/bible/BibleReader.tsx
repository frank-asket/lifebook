'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Shell } from '../shell';
import { useLanguage } from '../language-provider';
import { ReadingTracker } from './ReadingTracker';
import { bibleApi, type BibleBook, type BibleChapter, type BibleChapterContent, type BibleLocale, type BibleTranslation } from '../../lib/bible-api';

const labels = {
  en: { title: 'Read the Bible', book: 'Book', chapter: 'Chapter', language: 'Language', prev: 'Previous', next: 'Next', study: 'Bible Study', loading: 'Loading Scripture…', retry: 'Try again', empty: 'Choose a book and chapter.' },
  fr: { title: 'Lire la Bible', book: 'Livre', chapter: 'Chapitre', language: 'Langue', prev: 'Précédent', next: 'Suivant', study: 'Étude biblique', loading: 'Chargement des Écritures…', retry: 'Réessayer', empty: 'Choisissez un livre et un chapitre.' },
};

export default function BibleReader({ initialLocale, initialChapter }: { initialLocale?: BibleLocale; initialChapter?: string }) {
  const { language, setLanguage } = useLanguage();
  const [locale, setLocale] = useState<BibleLocale>(initialLocale ?? language);
  useEffect(() => { if (!initialLocale) setLocale(language); }, [language, initialLocale]);
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [bookId, setBookId] = useState('');
  const [chapters, setChapters] = useState<BibleChapter[]>([]);
  const [chapterId, setChapterId] = useState('');
  const [content, setContent] = useState<BibleChapterContent | null>(null);
  const [translation, setTranslation] = useState<BibleTranslation | null>(null);
  const [booksBusy, setBooksBusy] = useState(true);
  const [chaptersBusy, setChaptersBusy] = useState(false);
  const [contentBusy, setContentBusy] = useState(false);
  const busy = booksBusy || chaptersBusy || contentBusy;
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const t = labels[locale];

  // Changing locale invalidates the book and chapter lists. Abort stale requests.
  useEffect(() => {
    const abort = new AbortController();
    setBooksBusy(true); setError(''); setBooks([]); setBookId(''); setChapters([]); setChapterId(''); setContent(null); setTranslation(null);
    Promise.all([bibleApi.books(locale, abort.signal), bibleApi.translation(locale, abort.signal)])
      .then(([items, version]) => {
        if (abort.signal.aborted) return;
        setBooks(items); setTranslation(version);
        const requestedBook = initialChapter?.split('.')[0];
        setBookId(items.find(x => x.id === requestedBook)?.id ?? items.find(x => x.id === 'GEN')?.id ?? items[0]?.id ?? '');
      })
      .catch(e => { if (!abort.signal.aborted) setError(e instanceof Error ? e.message : 'Unable to load books'); })
      .finally(() => { if (!abort.signal.aborted) setBooksBusy(false); });
    return () => abort.abort();
  }, [locale, retry]);

  useEffect(() => {
    if (!bookId) { setChaptersBusy(false); return; }
    const abort = new AbortController();
    setChaptersBusy(true); setError(''); setChapters([]); setChapterId(''); setContent(null);
    bibleApi.chapters(bookId, locale, abort.signal)
      .then(items => {
        if (abort.signal.aborted) return;
        const numbered = items.filter(x => /^\d+$/.test(x.number));
        setChapters(numbered); setChapterId(numbered.find(x => x.id === initialChapter)?.id ?? numbered[0]?.id ?? '');
      })
      .catch(e => { if (!abort.signal.aborted) setError(e instanceof Error ? e.message : 'Unable to load chapters'); })
      .finally(() => { if (!abort.signal.aborted) setChaptersBusy(false); });
    return () => abort.abort();
  }, [bookId, locale, retry]);

  useEffect(() => {
    if (!chapterId) { setContentBusy(false); return; }
    const abort = new AbortController();
    setContentBusy(true); setError(''); setContent(null);
    bibleApi.chapter(chapterId, locale, abort.signal)
      .then(data => { if (!abort.signal.aborted) setContent(data); })
      .catch(e => { if (!abort.signal.aborted) setError(e instanceof Error ? e.message : 'Unable to load chapter'); })
      .finally(() => { if (!abort.signal.aborted) setContentBusy(false); });
    return () => abort.abort();
  }, [chapterId, locale, retry]);

  const index = useMemo(() => chapters.findIndex(x => x.id === chapterId), [chapters, chapterId]);
  const previous = index > 0 ? chapters[index - 1] : undefined;
  const next = index >= 0 ? chapters[index + 1] : undefined;

  return (
    <Shell title={t.title}><div className="bible-reader" lang={locale}>
      <Link href="/bible" className="text-link">← {t.study}</Link>
      <h1 className="page-heading" style={{ marginTop: 20 }}>{t.title}</h1>
      <section className="reader-controls card" aria-label={locale === 'fr' ? 'Navigation biblique' : 'Bible navigation'}>
        <label className="form-field">{t.language}
          <select className="select" value={locale} onChange={e => { setLocale(e.target.value as BibleLocale); setLanguage(e.target.value as BibleLocale); }}>
            <option value="en">English</option><option value="fr">Français</option>
          </select>
        </label>
        <label className="form-field">{t.book}
          <select className="select" value={bookId} disabled={!books.length} onChange={e => setBookId(e.target.value)}>
            {!bookId && <option value="">—</option>}
            {books.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </label>
        <label className="form-field">{t.chapter}
          <select className="select" value={chapterId} disabled={!chapters.length} onChange={e => setChapterId(e.target.value)}>
            {!chapterId && <option value="">—</option>}
            {chapters.map(x => <option key={x.id} value={x.id}>{x.number}</option>)}
          </select>
        </label>
      </section>
      {error && <div role="alert" className="alert reader-error">{error} <button className="btn btn-soft btn-sm" onClick={() => setRetry(x => x + 1)}>{t.retry}</button></div>}
      <article className="reader-paper card" aria-busy={busy}>
        {busy ? <p role="status">{t.loading}</p> : content ? <>
          <ReadingTracker locale={locale} chapterId={content.id} />
          <h2 className="reader-reference">{content.reference}</h2>
          <p className="scripture-text">{content.content}</p>
          <footer className="scripture-attribution">
            <p>{translation?.name ?? translation?.abbreviation ?? 'API.Bible'}</p>
            {translation?.copyright && <p className="attribution-line">{translation.copyright}</p>}
            {content.copyright && <p className="attribution-line">{content.copyright}</p>}
            <p className="attribution-line">{locale === 'fr' ? 'Texte biblique fourni par API.Bible.' : 'Scripture provided by API.Bible.'}</p>
          </footer>
        </> : <p>{t.empty}</p>}
      </article>
      <nav className="reader-pagination" aria-label={locale === 'fr' ? 'Navigation des chapitres' : 'Chapter navigation'}>
        <button className="btn btn-outline" disabled={!previous || busy} onClick={() => previous && setChapterId(previous.id)}>← {t.prev}</button>
        <button className="btn btn-outline" disabled={!next || busy} onClick={() => next && setChapterId(next.id)}>{t.next} →</button>
      </nav>
    </div></Shell>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { Shell } from '../shell';
import { useLanguage } from '../language-provider';
import { AnnotationPanel } from './AnnotationPanel';
import { ReadingTracker } from './ReadingTracker';
import { readingApi } from '../../lib/bible-reading-api';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { parseVerses } from '../../lib/scripture';
import { DEFAULT_READER, READER_KEY, parseReaderSettings, type ReaderSettings } from '../../lib/reader-settings';
import { ReaderSettingsPanel } from './ReaderSettingsPanel';
import { bibleApi, type BibleBook, type BibleChapter, type BibleChapterContent, type BibleLocale, type BibleTranslation } from '../../lib/bible-api';
import { errorMessage } from '../../lib/errors';

const labels = {
  en: { title: 'Read the Bible', book: 'Book', chapter: 'Chapter', language: 'Bible language', prev: 'Previous', next: 'Next', study: 'Bible Study', loading: 'Loading Scripture…', retry: 'Try again', empty: 'Choose a book and chapter.' },
  fr: { title: 'Lire la Bible', book: 'Livre', chapter: 'Chapitre', language: 'Langue de la Bible', prev: 'Précédent', next: 'Suivant', study: 'Étude biblique', loading: 'Chargement des Écritures…', retry: 'Réessayer', empty: 'Choisissez un livre et un chapitre.' },
};

export default function BibleReader({ initialLocale, initialChapter, initialVerse }: { initialLocale?: BibleLocale; initialChapter?: string; initialVerse?: string }) {
  const { language } = useLanguage();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [locale, setLocale] = useState<BibleLocale>(initialLocale ?? language);
  // Chapter to open once its book list loads: the link target, the resumed position, or the chapter kept across a language switch.
  const [target, setTarget] = useState(initialChapter);
  // Without a link target, wait for the saved position so a default chapter is never opened and recorded over it.
  const [ready, setReady] = useState(Boolean(initialChapter));
  const [resumed, setResumed] = useState(false);
  useEffect(() => { if (!initialLocale && !resumed) setLocale(language); }, [language, initialLocale, resumed]);
  useEffect(() => {
    if (ready || !isLoaded) return;
    if (!isSignedIn) { setReady(true); return; }
    let active = true;
    getToken().then(token => readingApi.latest(token)).then(item => {
      if (!active || !item) return;
      setResumed(true); setLocale(item.locale); setTarget(item.chapterId);
    }).catch(() => undefined).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [ready, isLoaded, isSignedIn, getToken]);
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
  const [annotationDirty, setAnnotationDirty] = useState(false);
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_READER);
  useEffect(() => { try { setSettings(parseReaderSettings(localStorage.getItem(READER_KEY))); } catch { /* storage unavailable */ } }, []);
  const saveSettings = (next: ReaderSettings) => { setSettings(next); try { localStorage.setItem(READER_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ } };
  const canLeave = () => !annotationDirty || window.confirm(locale === 'fr' ? 'Quitter sans enregistrer votre note ?' : 'Leave without saving your note?');

  // Changing locale invalidates the book and chapter lists. Abort stale requests.
  useEffect(() => {
    if (!ready) return;
    const abort = new AbortController();
    setBooksBusy(true); setError(''); setBooks([]); setBookId(''); setChapters([]); setChapterId(''); setContent(null); setTranslation(null);
    Promise.all([bibleApi.books(locale, abort.signal), bibleApi.translation(locale, abort.signal)])
      .then(([items, version]) => {
        if (abort.signal.aborted) return;
        setBooks(items); setTranslation(version);
        const requestedBook = target?.split('.')[0];
        setBookId(items.find(x => x.id === requestedBook)?.id ?? items.find(x => x.id === 'GEN')?.id ?? items[0]?.id ?? '');
      })
      .catch(e => { if (!abort.signal.aborted) setError(errorMessage(e, language)); })
      .finally(() => { if (!abort.signal.aborted) setBooksBusy(false); });
    return () => abort.abort();
  }, [locale, retry, ready]);

  useEffect(() => {
    if (!bookId) { setChaptersBusy(false); return; }
    const abort = new AbortController();
    setChaptersBusy(true); setError(''); setChapters([]); setChapterId(''); setContent(null);
    bibleApi.chapters(bookId, locale, abort.signal)
      .then(items => {
        if (abort.signal.aborted) return;
        const numbered = items.filter(x => /^\d+$/.test(x.number));
        setChapters(numbered); setChapterId(numbered.find(x => x.id === target)?.id ?? numbered[0]?.id ?? '');
      })
      .catch(e => { if (!abort.signal.aborted) setError(errorMessage(e, language)); })
      .finally(() => { if (!abort.signal.aborted) setChaptersBusy(false); });
    return () => abort.abort();
  }, [bookId, locale, retry]);

  useEffect(() => {
    if (!chapterId) { setContentBusy(false); return; }
    const abort = new AbortController();
    setContentBusy(true); setError(''); setContent(null);
    bibleApi.chapter(chapterId, locale, abort.signal)
      .then(data => { if (!abort.signal.aborted) setContent(data); })
      .catch(e => { if (!abort.signal.aborted) setError(errorMessage(e, language)); })
      .finally(() => { if (!abort.signal.aborted) setContentBusy(false); });
    return () => abort.abort();
  }, [chapterId, locale, retry]);

  const index = useMemo(() => chapters.findIndex(x => x.id === chapterId), [chapters, chapterId]);
  const previous = index > 0 ? chapters[index - 1] : undefined;
  const next = index >= 0 ? chapters[index + 1] : undefined;

  const changeLocale = (next: BibleLocale) => { if (next !== locale && canLeave()) { setTarget(chapterId || target); setResumed(true); setLocale(next); } };
  const go = (chapter?: BibleChapter) => { if (chapter && canLeave()) { setChapterId(chapter.id); window.scrollTo({ top: 0 }); } };
  const tr = (en: string, fr: string) => language === 'fr' ? fr : en;

  return (
    <Shell title={t.title}><div className="bible-reader" lang={locale}>
      <nav className="reader-toolbar" aria-label={t.title}>
        <button type="button" className="icon-button" disabled={!previous || busy} onClick={() => go(previous)} aria-label={t.prev}><ChevronLeft size={18} aria-hidden="true" /></button>
        <label className="reader-pick reader-pick-book"><span className="sr-only">{t.book}</span>
          <select value={bookId} disabled={!books.length} onChange={e => { if (canLeave()) setBookId(e.target.value); }}>
            {!bookId && <option value="">{t.book}</option>}
            {books.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </label>
        <label className="reader-pick reader-pick-chapter"><span className="sr-only">{t.chapter}</span>
          <select value={chapterId} disabled={!chapters.length} onChange={e => { if (canLeave()) setChapterId(e.target.value); }}>
            {!chapterId && <option value="">—</option>}
            {chapters.map(x => <option key={x.id} value={x.id}>{x.number}</option>)}
          </select>
        </label>
        <button type="button" className="icon-button" disabled={!next || busy} onClick={() => go(next)} aria-label={t.next}><ChevronRight size={18} aria-hidden="true" /></button>
        <ReaderSettingsPanel locale={locale} uiLanguage={language} settings={settings} onSettings={saveSettings} onLocale={changeLocale} />
      </nav>
      {error && <div role="alert" className="alert reader-error">{error} <button className="btn btn-soft btn-sm" onClick={() => setRetry(x => x + 1)}>{t.retry}</button></div>}
      <article className="reader-paper card" aria-busy={busy} data-size={settings.size} data-spacing={settings.spacing} data-font={settings.font}>
        {busy ? <p role="status">{t.loading}</p> : content ? <>
          <ReadingTracker locale={locale} chapterId={content.id} />
          <h1 className="reader-reference">{content.reference}</h1>
          <div className="scripture-text">{parseVerses(content.content).map((paragraph, i) => <p key={i}>{paragraph.map((v, j) => <span key={j} className="verse">{v.number && <sup className="verse-number">{v.number}</sup>}{v.text} </span>)}</p>)}</div>
          <footer className="scripture-attribution">
            <details>
              <summary>{translation?.name ?? translation?.abbreviation ?? 'API.Bible'}</summary>
              {translation?.copyright && <p className="attribution-line">{translation.copyright}</p>}
              {content.copyright && <p className="attribution-line">{content.copyright}</p>}
              <p className="attribution-line">{locale === 'fr' ? 'Texte biblique fourni par API.Bible.' : 'Scripture provided by API.Bible.'}</p>
            </details>
          </footer>
        </> : <p>{t.empty}</p>}
      </article>
      <nav className="reader-pagination" aria-label={locale === 'fr' ? 'Navigation des chapitres' : 'Chapter navigation'}>
        <button className="btn btn-outline" disabled={!previous || busy} onClick={() => go(previous)}>← {previous ? `${t.chapter} ${previous.number}` : t.prev}</button>
        <button className="btn btn-primary" disabled={!next || busy} onClick={() => go(next)}>{next ? `${t.chapter} ${next.number}` : t.next} →</button>
      </nav>
      {!busy && content && <AnnotationPanel chapterId={content.id} locale={locale} initialVerse={content.id === initialChapter ? initialVerse : undefined} onDirtyChange={setAnnotationDirty}/>}
      <nav className="reader-links" aria-label={tr('Your reading', 'Votre lecture')}><Link className="text-link" href="/bible/dashboard">{tr('Reading journey', 'Mon parcours de lecture')}</Link><Link className="text-link" href="/bible/annotations">{tr('Saved verses', 'Versets enregistrés')}</Link><Link className="text-link" href="/bible">{t.study}</Link></nav>
    </div></Shell>
  );
}

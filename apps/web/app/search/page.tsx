'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, BookOpen, Search as SearchIcon } from 'lucide-react';
import { Shell } from '../../components/shell';
import { useLanguage } from '../../components/language-provider';
import { errorMessage } from '../../lib/errors';
import { resultCount, searchApi, SECTION_TITLES, type SearchResult } from '../../lib/search-api';

export default function SearchPage() { return <Suspense fallback={<p role="status">…</p>}><Search /></Suspense>; }

/** One search box for everything public in LifeBook. Results appear as you type; the query stays in the address. */
function Search() {
  const { language } = useLanguage();
  const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const params = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const term = query.trim();

  useEffect(() => { input.current?.focus(); }, []);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (term) url.searchParams.set('q', term); else url.searchParams.delete('q');
    window.history.replaceState(null, '', url);
    setError('');
    if (term.length < 2) { setResult(null); setBusy(false); return; }
    const controller = new AbortController(); setBusy(true);
    // Wait for a pause in typing before asking.
    const timer = window.setTimeout(() => {
      searchApi.search(term, language === 'fr' ? 'fr' : 'en', controller.signal)
        .then(value => { if (!controller.signal.aborted) setResult(value); })
        .catch(e => { if (!controller.signal.aborted) setError(errorMessage(e, language)); })
        .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    }, 300);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [term, language, retry]);

  const count = result ? resultCount(result) : 0;
  const status = term.length < 2 ? '' : busy ? tr('Searching…', 'Recherche…') : error ? '' : result ? (count === 0 ? tr('No results.', 'Aucun résultat.') : count === 1 ? tr('1 result.', '1 résultat.') : tr(`${count} results.`, `${count} résultats.`)) : '';

  return <Shell title={tr('Search', 'Rechercher')}>
    <div className="page-intro">
      <h1 className="page-heading">{tr('Search LifeBook', 'Rechercher dans LifeBook')}</h1>
      <p className="subheading">{tr('A passage like “John 3:16”, a word, or a theme. Searches Scripture, plans, studies, pathways, teachings and meditations. Never your private writing.', 'Un passage comme « Jean 3:16 », un mot ou un thème. Recherche dans les Écritures, les plans, les études, les parcours, les enseignements et les méditations. Jamais dans vos écrits privés.')}</p>
    </div>
    <form className="search-box" role="search" onSubmit={e => { e.preventDefault(); const first = result?.go?.href ?? result?.sections.flatMap(s => s.items)[0]?.href; if (first) router.push(first); }}>
      <label htmlFor="site-search" className="sr-only">{tr('Search LifeBook', 'Rechercher dans LifeBook')}</label>
      <SearchIcon size={18} aria-hidden="true" className="search-box-icon" />
      <input id="site-search" ref={input} className="input search-box-input" type="search" value={query} maxLength={120} autoComplete="off" enterKeyHint="search"
        placeholder={tr('John 3:16, peace, prayer…', 'Jean 3:16, paix, prière…')} onChange={e => setQuery(e.target.value)} />
    </form>
    <p className="sr-only" role="status" aria-live="polite">{status}</p>

    {error ? <div role="alert" className="alert reader-error"><span>{error}</span><button type="button" className="btn btn-soft" onClick={() => setRetry(n => n + 1)}>{tr('Try again', 'Réessayer')}</button></div>
      : term.length < 2 ? <p className="muted search-hint">{tr('Type at least two letters.', 'Saisissez au moins deux lettres.')}</p>
      : !result ? <p className="muted search-hint" aria-hidden="true">{tr('Searching…', 'Recherche…')}</p>
      : <div className="search-results" aria-busy={busy}>
        {result.go ? <Link className="card search-go" href={result.go.href}>
          <span className="home-link-icon"><BookOpen size={20} aria-hidden="true" /></span>
          <span><span className="eyebrow">{tr('GO TO PASSAGE', 'ALLER AU PASSAGE')}</span><strong>{result.go.label}</strong></span>
          <ArrowRight size={18} aria-hidden="true" />
        </Link> : null}
        {result.sections.filter(s => s.items.length || s.status === 'unavailable').map(s => <section key={s.kind} className="search-section" aria-labelledby={`search-${s.kind}`}>
          <h2 id={`search-${s.kind}`}>{tr(...SECTION_TITLES[s.kind])}</h2>
          {s.status === 'unavailable' ? <p className="muted">{tr('This part of search is unavailable right now.', 'Cette partie de la recherche est indisponible pour le moment.')}</p>
            : <ul className="search-list">{s.items.map(item => <li key={item.id}><Link className="search-item" href={item.href}><strong>{item.title}</strong>{item.subtitle ? <span className="muted">{item.subtitle}</span> : null}</Link></li>)}</ul>}
          {s.kind === 'scripture' && s.items.length ? <Link className="text-link" href={`/bible/search?q=${encodeURIComponent(term)}&locale=${result.locale}`}>{tr('All Scripture results', 'Tous les résultats dans les Écritures')} <ArrowRight size={14} aria-hidden="true" /></Link> : null}
        </section>)}
        {count === 0 ? <p className="notice">{tr('Nothing matches yet. Try another word, or a reference like “Psalm 23”.', 'Rien ne correspond pour le moment. Essayez un autre mot, ou une référence comme « Psaume 23 ».')}</p> : null}
      </div>}
  </Shell>;
}

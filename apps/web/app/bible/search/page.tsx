'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Shell } from '../../../components/shell';
import { useLanguage } from '../../../components/language-provider';
import { api } from '../../../lib/api';
import { errorMessage } from '../../../lib/errors';
import type { ScriptureSearch } from '../../../lib/scripture-search';
import { VERSIONS_KEY, parseVersionChoice, versionFor, type VersionChoice } from '../../../lib/bible-versions';
export default function SearchPage() { return <Suspense fallback={<p role="status">…</p>}><Search /></Suspense>; }
function Search() {
  const { language } = useLanguage(); const params = useSearchParams(); const locale = params.get('locale') === 'fr' ? 'fr' : params.get('locale') === 'en' ? 'en' : language; const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const [query, setQuery] = useState(params.get('q') ?? ''); const [search, setSearch] = useState((params.get('q') ?? '').trim()); const [offset, setOffset] = useState(0); const [data, setData] = useState<ScriptureSearch | null>(null); const [error, setError] = useState(''); const [retry, setRetry] = useState(0);
  // Search the version chosen in the reader for this language.
  const [choice, setChoice] = useState<VersionChoice | null>(null);
  useEffect(() => { let saved: VersionChoice = {}; try { saved = parseVersionChoice(localStorage.getItem(VERSIONS_KEY)); } catch { /* storage unavailable */ } setChoice(saved); }, []);
  const version = versionFor(locale, choice);
  useEffect(() => {
    if (!search || !choice) return;
    const controller = new AbortController(); setData(null); setError('');
    api<ScriptureSearch>(`/bible-content/search?locale=${locale}&version=${version.id}&q=${encodeURIComponent(search)}&offset=${offset}`, null, { signal: controller.signal }).then(value => { if (!controller.signal.aborted) setData(value); }).catch(e => { if (!controller.signal.aborted) setError(errorMessage(e, language)); });
    return () => controller.abort();
  }, [locale, version.id, choice, search, offset, retry, language]);
  return <Shell title={tr('Search Scripture', 'Rechercher dans la Bible')}><div className="page-intro"><h1 className="page-heading">{tr('Search Scripture', 'Rechercher dans la Bible')}</h1><p className="subheading">{tr('Search words or passage references in your selected translation.', 'Recherchez des mots ou des références dans votre traduction sélectionnée.')} · {version.abbreviation}</p></div>
    <form className="learning-toolbar" onSubmit={e => { e.preventDefault(); setSearch(query.trim()); setOffset(0); }}><label className="form-field"><span className="field-label">{tr('Words or passage reference', 'Mots ou référence biblique')}</span><input className="input" value={query} onChange={e => setQuery(e.target.value)} maxLength={120} required /></label><button className="btn btn-primary" disabled={!query.trim()}>{tr('Search', 'Rechercher')}</button></form>
    {error ? <div role="alert" className="alert reader-error"><span>{error}</span><button className="btn btn-soft" onClick={() => setRetry(n => n + 1)}>{tr('Try again', 'Réessayer')}</button></div> : !search ? null : !data ? <p role="status" className="notice">{tr('Searching…', 'Recherche…')}</p> : <>
      {!data.items.length ? <p className="notice">{tr('No matching passages. Try another word or reference.', 'Aucun passage correspondant. Essayez un autre mot ou une autre référence.')}</p> : <div className="grid cols-2">{data.items.map(item => <Link key={item.id} className="card text-link" href={`/bible/read?locale=${locale}&chapter=${encodeURIComponent(item.chapterId)}${item.verse ? `&verse=${item.verse}` : ''}`}>{item.reference} →</Link>)}</div>}
      <div className="learning-toolbar"><button className="btn btn-outline" disabled={!offset} onClick={() => setOffset(n => Math.max(0, n - data.limit))}>{tr('Previous', 'Précédent')}</button><span role="status">{data.total} {tr('results', 'résultats')}</span><button className="btn btn-outline" disabled={offset + data.limit >= data.total} onClick={() => setOffset(n => n + data.limit)}>{tr('Next', 'Suivant')}</button></div>
    </>}
  </Shell>;
}

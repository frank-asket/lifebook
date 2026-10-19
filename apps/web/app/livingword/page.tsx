'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shell } from '../../components/shell';
import { useLanguage } from '../../components/language-provider';
import { api } from '../../lib/api';
import { errorMessage } from '../../lib/errors';
import type { TeachingPage } from '../../lib/livingword';
export default function LivingWord() {
  const { language } = useLanguage(); const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const [query, setQuery] = useState(''); const [search, setSearch] = useState(''); const [page, setPage] = useState(1);
  const [data, setData] = useState<TeachingPage | null>(null); const [error, setError] = useState(''); const [retry, setRetry] = useState(0);
  useEffect(() => { setPage(1); }, [language]);
  useEffect(() => {
    const controller = new AbortController(); setData(null); setError('');
    api<TeachingPage>(`/livingword?locale=${language}&q=${encodeURIComponent(search)}&page=${page}`, null, { signal: controller.signal }).then(value => { if (!controller.signal.aborted) setData(value); }).catch(e => { if (!controller.signal.aborted) setError(errorMessage(e, language)); });
    return () => controller.abort();
  }, [language, search, page, retry]);
  return <Shell title="LivingWord"><div className="page-intro"><span className="eyebrow">{tr('LEARN · LISTEN · GROW', 'APPRENDRE · ÉCOUTER · GRANDIR')}</span><h1 className="page-heading">LivingWord</h1><p className="subheading">{tr('Approved audio and video teaching in your language.', 'Des enseignements audio et vidéo approuvés dans votre langue.')}</p></div>
    <form className="learning-toolbar" onSubmit={e => { e.preventDefault(); setSearch(query.trim()); setPage(1); }}><label className="form-field"><span className="field-label">{tr('Search teachings', 'Rechercher des enseignements')}</span><input className="input" value={query} onChange={e => setQuery(e.target.value)} maxLength={80} /></label><button className="btn btn-primary">{tr('Search', 'Rechercher')}</button></form>
    {error ? <div className="alert reader-error" role="alert"><span>{error}</span><button className="btn btn-soft" onClick={() => setRetry(n => n + 1)}>{tr('Try again', 'Réessayer')}</button></div> : !data ? <p className="notice" role="status">{tr('Loading teachings…', 'Chargement des enseignements…')}</p> : <>
      {!data.items.length ? <div className="card"><h2>{tr('No teachings available', 'Aucun enseignement disponible')}</h2><p>{search ? tr('Try a different search.', 'Essayez une autre recherche.') : tr('Approved, licensed teachings will appear here when ready. Nothing plays automatically.', 'Les enseignements approuvés et autorisés apparaîtront ici lorsqu’ils seront prêts. Rien ne se lance automatiquement.')}</p></div> : <div className="grid cols-2">{data.items.map(item => <article className="card" key={item.id}><span className="eyebrow">{item.kind === 'audio' ? tr('AUDIO', 'AUDIO') : tr('VIDEO', 'VIDÉO')}</span><h2>{item.title}</h2><p>{item.speaker}</p><p className="subheading">{item.description}</p><Link className="btn btn-outline" href={`/livingword/${encodeURIComponent(item.id)}`}>{tr('Open teaching', 'Ouvrir l’enseignement')}</Link></article>)}</div>}
      <div className="learning-toolbar"><button className="btn btn-outline" disabled={page === 1} onClick={() => setPage(n => n - 1)}>{tr('Previous', 'Précédent')}</button><span role="status">{tr('Page', 'Page')} {page} · {data.total} {tr('teachings', 'enseignements')}</span><button className="btn btn-outline" disabled={page * data.pageSize >= data.total} onClick={() => setPage(n => n + 1)}>{tr('Next', 'Suivant')}</button></div>
    </>}
  </Shell>;
}

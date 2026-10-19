'use client';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bookmark, NotebookPen, ArrowRight } from 'lucide-react';
import { Shell } from '../../../components/shell';
import { useLanguage } from '../../../components/language-provider';
import { api } from '../../../lib/api';
import { errorMessage } from '../../../lib/errors';
type Mark = {id:string;locale:'en'|'fr';passageId:string;bookmarked:boolean;highlight:string|null;note:string|null};
export default function SavedVerses() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const {language}=useLanguage();const tr=(en:string,fr:string)=>language==='fr'?fr:en;
  return <Shell title={tr('Saved verses','Versets enregistrés')}><div className="page-intro"><span className="eyebrow">{tr('YOUR PRIVATE READING COMPANION','VOTRE CARNET DE LECTURE PRIVÉ')}</span><h1 className="page-heading">{tr('Saved verses','Versets enregistrés')}</h1><p className="subheading">{tr('Revisit your bookmarks, colored verse marks and private notes. Browse your saved annotations and load earlier records.','Retrouvez vos favoris, marques colorées et notes privées. Parcourez vos annotations et chargez les plus anciennes.')}</p></div>
    {!isLoaded ? <p role="status">{tr('Loading…','Chargement…')}</p> : !isSignedIn || !userId ? <div className="card status-card"><h2>{tr('Your notes belong to you','Vos notes vous appartiennent')}</h2><Link className="btn btn-primary" href="/sign-in">{tr('Sign in','Se connecter')}</Link></div> : <SavedList key={userId} language={language}/>}
  </Shell>;
}
function SavedList({ language }: { language: 'en' | 'fr' }) {
  const { getToken } = useAuth(); const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const [items, setItems] = useState<Mark[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [retry, setRetry] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null); const [busy, setBusy] = useState(false); const [moreError, setMoreError] = useState('');
  const generation = useRef(0); const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    const controller = new AbortController(); generation.current++; setLoading(true); setError(''); setItems([]); setCursor(null); setMoreError(''); setBusy(false);
    (async () => { try { const token = await getToken(); if (!token) throw new Error(tr('Please sign in again.', 'Reconnectez-vous.')); const result = await api<{ items: Mark[]; nextCursor: string | null }>('/bible-annotations/page', token, { signal: controller.signal }); if (!controller.signal.aborted) { setItems(result.items); setCursor(result.nextCursor); } } catch (e) { if (!controller.signal.aborted) setError(errorMessage(e, language)); } finally { if (!controller.signal.aborted) setLoading(false); } })();
    return () => controller.abort();
  }, [getToken, retry, language]);
  async function more() {
    if (!cursor || busy) return;
    const version = generation.current; setBusy(true); setMoreError('');
    try { const token = await getToken(); if (!token) throw new Error(tr('Please sign in again.', 'Reconnectez-vous.')); const result = await api<{ items: Mark[]; nextCursor: string | null }>(`/bible-annotations/page?cursor=${encodeURIComponent(cursor)}`, token); if (mounted.current && version === generation.current) { setItems(previous => [...new Map([...previous, ...result.items].map(item => [item.id, item])).values()]); setCursor(result.nextCursor); } }
    catch (e) { if (mounted.current && version === generation.current) setMoreError(errorMessage(e, language)); }
    finally { if (mounted.current && version === generation.current) setBusy(false); }
  }
  if (loading) return <p className="notice" role="status">{tr('Loading saved verses…', 'Chargement des versets…')}</p>;
  if (error) return <div className="alert reader-error" role="alert"><span>{error}</span><button className="btn btn-soft" onClick={() => setRetry(n => n + 1)}>{tr('Try again', 'Réessayer')}</button></div>;
  if (!items.length) return <div className="card status-card"><Bookmark size={32} aria-hidden="true" /><h2>{tr('Keep a verse close', 'Gardez un verset près de vous')}</h2><p>{tr('Add a bookmark or note while reading Scripture. It will appear here.', 'Ajoutez un favori ou une note pendant votre lecture. Vous le retrouverez ici.')}</p><Link className="btn btn-primary" href="/bible/read">{tr('Open the Bible', 'Ouvrir la Bible')} <ArrowRight size={16} /></Link></div>;
  return <><div className="grid cols-2">{items.map(item => { const [book, chapter, verse] = item.passageId.split('.'); return <article className={`card saved-annotation mark-${item.highlight || 'none'}`} key={item.id}><div className="split-title"><span className="eyebrow">{item.locale === 'fr' ? 'FR' : 'EN'}</span><span className="icon-line">{item.bookmarked && <Bookmark size={18} aria-label={tr('Bookmarked', 'Favori')} />} {item.note && <NotebookPen size={18} aria-label={tr('Private note', 'Note privée')} />}</span></div><h2>{book} {chapter}:{verse}</h2>{item.note && <p className="saved-note">{item.note}</p>}<Link className="text-link icon-line" href={`/bible/read?locale=${item.locale}&chapter=${encodeURIComponent(book + '.' + chapter)}&verse=${encodeURIComponent(verse)}`}>{tr('Open verse marks', 'Ouvrir les annotations')} <ArrowRight size={16} /></Link></article>; })}</div>
    {moreError ? <p className="alert" role="alert">{moreError}</p> : null}
    {cursor ? <button className="btn btn-outline learning-progress" disabled={busy} onClick={() => void more()}>{busy ? tr('Loading…', 'Chargement…') : tr('Load more saved verses', 'Charger plus de versets')}</button> : null}
  </>;
}

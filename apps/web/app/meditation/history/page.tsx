'use client';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shell } from '../../../components/shell';
import { useLanguage } from '../../../components/language-provider';
import { api } from '../../../lib/api';
import { errorMessage } from '../../../lib/errors';
import { LoadMore } from '../../../components/LoadMore';
type Entry = { id: string; completedAt: string; meditation: { id: string; title: string; scriptureReference: string } };
export default function HistoryPage() {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const { language } = useLanguage();
  const tr = (en:string,fr:string) => language === 'fr' ? fr : en;
  const [items, setItems] = useState<Entry[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  useEffect(() => {
    if (!isLoaded) return;
    setItems([]); setError('');
    if (!isSignedIn) { setLoading(false); return; }
    let active = true; setLoading(true);
    getToken().then(token => api<{ items: Entry[]; nextCursor: string | null }>('/meditations/history/page', token))
      .then(data => { if (active) { setItems(data.items); setNextCursor(data.nextCursor); } })
      .catch(e => { if (active) setError(errorMessage(e, language)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isLoaded, isSignedIn, userId, getToken, retry]);
  return <Shell title={tr('Meditation History','Historique des méditations')}><div className="meditation-page">
    <header className="meditation-page-header"><div><span className="meditation-kicker">{tr('YOUR JOURNEY','VOTRE PARCOURS')}</span><h1>{tr('Meditation history','Historique des méditations')}</h1><p>{tr('Revisit the Scriptures you have spent time with.','Retrouvez les Écritures que vous avez méditées.')}</p></div><Link className="btn btn-soft" href="/meditation">{tr('Today’s meditation','Méditation du jour')} →</Link></header>
    {!isLoaded || loading ? <section className="meditation-status-card" role="status">{tr('Loading your history…','Chargement de votre historique…')}</section>
      : !isSignedIn ? <section className="meditation-status-card"><h2>{tr('Sign in to view your journey','Connectez-vous pour retrouver votre parcours')}</h2><p>{tr('Your meditation progress is private to your account.','Votre progression est privée et liée à votre compte.')}</p><Link className="btn btn-primary" href="/sign-in">{tr('Sign in','Se connecter')}</Link></section>
      : error ? <section className="meditation-status-card" role="alert"><h2>{tr('Unable to load history','Impossible de charger l’historique')}</h2><p>{error}</p><button className="btn btn-primary" onClick={()=>setRetry(n=>n+1)}>{tr('Try again','Réessayer')}</button></section>
      : !items.length ? <section className="meditation-status-card"><h2>{tr('Your journey begins today','Votre parcours commence aujourd’hui')}</h2><p>{tr('Completed meditations will appear here.','Les méditations terminées apparaîtront ici.')}</p><Link className="btn btn-primary" href="/meditation">{tr('Start today’s meditation','Commencer la méditation')} →</Link></section>
      : <div className="grid cols-2">{items.map(item => <article key={item.id} className="card"><span className="eyebrow">{new Date(item.completedAt).toLocaleDateString(language,{year:'numeric',month:'short',day:'numeric'})}</span><h2 style={{fontSize:20,margin:'14px 0'}}><Link href={`/meditation/${encodeURIComponent(item.meditation.id)}`}>{item.meditation.title}</Link></h2><p className="muted">{item.meditation.scriptureReference}</p><Link className="text-link" href={`/meditation/${encodeURIComponent(item.meditation.id)}`}>{tr('Read again','Relire')} →</Link></article>)}</div>}
    {!loading && !error && isSignedIn && <LoadMore cursor={nextCursor} fetchPage={async cursor => api<{ items: Entry[]; nextCursor: string | null }>(`/meditations/history/page?cursor=${encodeURIComponent(cursor)}`, await getToken())} onLoaded={page => { setItems(rows => [...rows, ...page.items.filter(p => !rows.some(r => r.id === p.id))]); setNextCursor(page.nextCursor); }} />}
  </div></Shell>;
}

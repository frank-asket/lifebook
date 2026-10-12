'use client';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shell } from '../../../components/shell';
import { api } from '../../../lib/api';
type Entry = { id: string; completedAt: string; meditation: { id: string; title: string; scriptureReference: string } };
export default function HistoryPage() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [items, setItems] = useState<Entry[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { setLoading(false); setItems([]); return; }
    let active = true;
    setLoading(true); setError('');
    getToken().then(token => api<Entry[]>('/meditations/history', token))
      .then(data => { if (active) setItems(data); })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : 'Could not load history.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isLoaded, isSignedIn, getToken]);
  return <Shell title="Meditation History"><div className="meditation-page">
    <header className="meditation-page-header"><div><span className="meditation-kicker">YOUR JOURNEY</span><h1>Meditation history</h1><p>Revisit the Scriptures you've spent time with.</p></div></header>
    {!isLoaded || loading ? <section className="meditation-status-card" role="status">Loading your history…</section>
      : !isSignedIn ? <section className="meditation-status-card"><h2>Sign in to view your journey</h2><p>Your meditation progress is private to your account.</p><Link href="/sign-in">Sign in</Link></section>
      : error ? <section className="meditation-status-card" role="alert"><h2>Unable to load history</h2><p>{error}</p></section>
      : !items.length ? <section className="meditation-status-card"><h2>Your journey begins today</h2><p>Completed meditations will appear here.</p><Link href="/meditation">Start today's meditation →</Link></section>
      : <div>{items.map(item => <article key={item.id} className="card" style={{marginBottom:14,padding:24}}><Link href={`/meditation/${encodeURIComponent(item.meditation.id)}`} style={{color:'var(--accent)',fontWeight:700}}>{item.meditation.title}</Link><p style={{color:'var(--text-muted)',marginTop:8}}>{item.meditation.scriptureReference} · {new Date(item.completedAt).toLocaleDateString()}</p></article>)}</div>}
  </div></Shell>;
}

'use client';
import { useAuth } from '@clerk/nextjs'; import { useEffect, useState } from 'react'; import Link from 'next/link';
import { Shell } from '../../../components/shell'; import { api } from '../../../lib/api';
type Entry = { id: string; completedAt: string; meditation: { id: string; title: string; scriptureReference: string } };
export default function HistoryPage() { const { isSignedIn, getToken } = useAuth(); const [items, setItems] = useState<Entry[]>([]); const [error, setError] = useState('');
 useEffect(() => { if (!isSignedIn) return; getToken().then(token => api<Entry[]>('/meditations/history', token)).then(setItems).catch(e => setError(e.message)); }, [isSignedIn, getToken]);
 return <Shell title="Meditation History"><div style={{ maxWidth: 850, margin: '24px auto' }}><h1>Your Meditation History</h1>{!isSignedIn ? <p><Link href="/sign-in">Sign in</Link> to see your progress.</p> : error ? <p role="alert">{error}</p> : !items.length ? <p>No completed meditations yet. <Link href="/meditation">Start today’s meditation</Link>.</p> : <ul style={{ listStyle: 'none', padding: 0 }}>{items.map(item => <li key={item.id} style={{ padding: 20, borderBottom: '1px solid #e7e0ef' }}><Link href={`/meditation/${item.meditation.id}`}>{item.meditation.title}</Link><p>{item.meditation.scriptureReference} · {new Date(item.completedAt).toLocaleDateString()}</p></li>)}</ul>}</div></Shell>;
}

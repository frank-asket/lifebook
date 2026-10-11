'use client';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
export type Meditation = { id: string; title: string; scriptureReference: string; scriptureText: string | null; translation: string | null; explanation: string; questions: string[]; guidedPrayer: string; publishDate: string | null };
type State = { reflection: string; completedAt: string | null; bookmarked: boolean };
export function MeditationView({ meditation }: { meditation: Meditation }) {
  const { isSignedIn, getToken } = useAuth();
  const [state, setState] = useState<State>({ reflection: '', completedAt: null, bookmarked: false });
  const [draft, setDraft] = useState(''); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  useEffect(() => { if (!isSignedIn) return; let active = true; getToken().then(token => api<State>(`/meditations/${meditation.id}/state`, token)).then(value => { if (active) { setState(value); setDraft(value.reflection); } }).catch(() => { if (active) setMessage('Unable to load your saved progress.'); }); return () => { active = false; }; }, [getToken, isSignedIn, meditation.id]);
  async function action(path: string, method: 'PUT' | 'POST', body?: object) {
    setBusy(true); setMessage('');
    try { const token = await getToken(); if (!token) throw new Error('Please sign in.'); await api(`/meditations/${meditation.id}/${path}`, token, { method, ...(body ? { body: JSON.stringify(body) } : {}) }); const next = await api<State>(`/meditations/${meditation.id}/state`, token); setState(next); setMessage('Saved successfully.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Something went wrong.'); } finally { setBusy(false); }
  }
  return <div style={{ maxWidth: 820, margin: '0 auto', padding: '30px 18px 90px', color: '#2d2445' }}>
    <Link href="/meditation" style={{ color: '#7657bb' }}>← Daily meditation</Link>
    <header style={{ margin: '30px 0' }}><span style={{ color: '#805db5', fontWeight: 700, letterSpacing: 2 }}>TODAY IN THE WORD</span><h1 style={{ fontSize: 'clamp(32px,5vw,52px)', margin: '12px 0' }}>{meditation.title}</h1><p style={{ color: '#766b88' }}>{meditation.scriptureReference}{meditation.translation ? ` · ${meditation.translation}` : ''}</p></header>
    <section style={box}><h2>Read Scripture</h2>{meditation.scriptureText ? <blockquote style={{ fontSize: 23, lineHeight: 1.7, borderLeft: '4px solid #ab8ad8', paddingLeft: 20 }}>{meditation.scriptureText}</blockquote> : <p>Open your Bible to {meditation.scriptureReference}. Scripture text is not reproduced here until licensing is confirmed.</p>}</section>
    <section style={box}><h2>Understand the Word</h2><p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.9 }}>{meditation.explanation}</p></section>
    <section style={box}><h2>Reflect</h2><ul style={{ lineHeight: 1.9 }}>{(Array.isArray(meditation.questions) ? meditation.questions : []).map((q, i) => <li key={i}>{q}</li>)}</ul>{isSignedIn ? <><label htmlFor="reflection">Your private reflection</label><textarea id="reflection" aria-label="Your private reflection" value={draft} onChange={e => setDraft(e.target.value)} maxLength={10000} rows={7} style={{ display: 'block', width: '100%', padding: 14, borderRadius: 12, border: '1px solid #d4c9e5', margin: '12px 0' }} /><button disabled={busy || !draft.trim()} onClick={() => action('reflection', 'PUT', { text: draft })} style={button}>Save reflection</button><p style={{ fontSize: 13 }}>Private to your account. Avoid entering highly sensitive details until encryption and retention policies are finalized.</p></> : <p><Link href="/sign-in">Sign in</Link> to save a private reflection.</p>}</section>
    <section style={box}><h2>Respond in Prayer</h2><p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.9 }}>{meditation.guidedPrayer}</p></section>
    {isSignedIn && <section style={box}><h2>Continue Your Journey</h2><p>{state.completedAt ? 'You completed this meditation.' : 'Ready to mark today’s meditation complete?'}</p><div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}><button style={button} disabled={busy || !!state.completedAt} onClick={() => action('complete', 'POST')}>{state.completedAt ? 'Completed ✓' : 'Mark complete'}</button><button style={button} disabled={busy} onClick={() => action('bookmark', 'PUT', { saved: !state.bookmarked })}>{state.bookmarked ? 'Remove bookmark' : 'Save for later'}</button></div></section>}
    {message && <p role="status" aria-live="polite">{message}</p>}<Link href="/meditation/history">View meditation history →</Link>
  </div>;
}
const box: React.CSSProperties = { background: '#fff', border: '1px solid #eee7f5', borderRadius: 22, padding: 'clamp(20px,4vw,36px)', marginBottom: 22, boxShadow: '0 6px 24px rgba(50,30,80,.04)' };
const button: React.CSSProperties = { background: '#6842a5', color: 'white', border: 0, borderRadius: 10, padding: '12px 20px', cursor: 'pointer', fontWeight: 650 };

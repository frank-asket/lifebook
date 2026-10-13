'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useLanguage } from '../../components/language-provider';
import { Shell } from '../../components/shell';
import { api } from '../../lib/api';

type DailyWord = {
  date: string; passageKey: string;
  verse: { reference: string; text: string; translation: string };
  explanation: string; meditation: string; reflectionQuestion: string;
  prayer: string; application: string;
};
type Session = {
  id: string; passageKey: string; status: 'IN_PROGRESS' | 'COMPLETED';
  steps: { step: string }[]; reflection: { content: string } | null;
};
const steps = ['UNDERSTAND', 'MEDITATE', 'REFLECT', 'PRAY', 'LIVE'] as const;
export default function DailyWordPage() {
  const { language } = useLanguage();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const [word, setWord] = useState<DailyWord | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [step, setStep] = useState(0);
  const [reflection, setReflection] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!isLoaded) return;
    let active = true;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    (async () => {
      setLoading(true); setError('');
      try {
        let current: Session | null = null;
        if (isSignedIn) {
          const token = await getToken();
          if (token) current = await api<Session>('/daily-word/sessions/today', token, { method: 'POST', body: JSON.stringify({ timezone }) });
        }
        const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
        const part = (type: string) => parts.find(p => p.type === type)?.value;
        const date = current ? `${part('year')}-${part('month')}-${part('day')}` : undefined;
        const data = await api<DailyWord>(`/meditations/daily-word/today?locale=${language}${date ? `&date=${date}` : ''}`);
        if (!active) return;
        setWord(data); setSession(current); setReflection(current?.reflection?.content || '');
        if (current) { const next = steps.findIndex(s => !current!.steps.some(done => done.step === s)); setStep(next < 0 ? 4 : next); }
      } catch (e) { if (active) setError(e instanceof Error ? e.message : 'Unable to load Daily Word'); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [language, isLoaded, isSignedIn, getToken]);
  async function saveReflection() {
    if (!session) return;
    if (!reflection.trim()) { setError(tr('Write a reflection first.', 'Écrivez une réflexion.')); return; }
    setBusy(true); setError('');
    try {
      const token = await getToken();
      await api(`/daily-word/sessions/${session.id}/reflection`, token, { method: 'PUT', body: JSON.stringify({ content: reflection }) });
      setMessage(tr('Reflection saved.', 'Réflexion enregistrée.'));
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save'); }
    finally { setBusy(false); }
  }
  async function continueJourney() {
    if (!session) { setStep(n => Math.min(4, n + 1)); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      const token = await getToken();
      if (step === 2 && reflection.trim()) {
        await api(`/daily-word/sessions/${session.id}/reflection`, token, { method: 'PUT', body: JSON.stringify({ content: reflection }) });
      }
      const updated = await api<Session>(`/daily-word/sessions/${session.id}/steps/${steps[step]}`, token, { method: 'PUT' });
      setSession(updated);
      if (step < 4) setStep(step + 1);
      else setMessage(tr('Today’s journey completed!', 'Parcours du jour terminé !'));
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save progress'); }
    finally { setBusy(false); }
  }
  const labels = [tr('Understand', 'Comprendre'), tr('Meditate', 'Méditer'), tr('Reflect', 'Réfléchir'), tr('Pray', 'Prier'), tr('Live the Word', 'Vivre la Parole')];
  return <Shell title={tr('Daily Word', 'Parole du jour')}>
    <div style={{ maxWidth: 850, margin: '0 auto' }}>
      <Link href="/dashboard" className="text-link">← {tr('Dashboard', 'Tableau de bord')}</Link>
      <h1 className="page-heading" style={{ marginTop: 20 }}>{tr('Today’s Word', 'Parole du jour')}</h1>
      {loading && <p role="status">{tr('Loading…', 'Chargement…')}</p>}
      {error && <div className="alert" role="alert">{error}</div>}
      {message && <p role="status">{message}</p>}
      {word && <>
        <div className="card" style={{ margin: '20px 0' }}>
          <span className="eyebrow">{word.date}</span><h2>{word.verse.reference}</h2>
          <blockquote>{word.verse.text}</blockquote><p className="muted">{word.verse.translation}</p>
          {session?.status === 'COMPLETED' && <p>{tr('Completed today ✓', 'Terminé aujourd’hui ✓')}</p>}
          {!isSignedIn && <p>{tr('Sign in to save your progress.', 'Connectez-vous pour enregistrer votre progression.')}</p>}
        </div>
        <nav aria-label={tr('Journey steps', 'Étapes')} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '20px 0' }}>
          {labels.map((label, i) => <button key={i} type="button" onClick={() => setStep(i)} className={step === i ? 'btn btn-primary' : 'btn btn-light'}>{session?.steps.some(s => s.step === steps[i]) ? '✓ ' : ''}{i + 1}. {label}</button>)}
        </nav>
        <section className="card" aria-live="polite">
          <span className="eyebrow">{tr('STEP', 'ÉTAPE')} {step + 1} / 5</span><h2>{labels[step]}</h2>
          {step === 0 && <p>{word.explanation}</p>}
          {step === 1 && <p>{word.meditation}</p>}
          {step === 2 && <><p>{word.reflectionQuestion}</p><label htmlFor="daily-reflection">{tr('Your private reflection', 'Votre réflexion privée')}</label><textarea id="daily-reflection" value={reflection} onChange={e => setReflection(e.target.value)} maxLength={10000} rows={5} style={{ width: '100%', padding: 12, marginTop: 10 }} />{session && <button className="btn btn-light" type="button" disabled={busy || !reflection.trim()} onClick={saveReflection}>{tr('Save reflection', 'Enregistrer')}</button>}</>}
          {step === 3 && <p>{word.prayer}</p>}
          {step === 4 && <p>{word.application}</p>}
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button type="button" className="btn btn-light" disabled={busy || step === 0} onClick={() => setStep(n => Math.max(0, n - 1))}>{tr('Back', 'Retour')}</button>
            <button type="button" className="btn btn-primary" disabled={busy || (step === 4 && session?.status === 'COMPLETED')} onClick={continueJourney}>{busy ? tr('Saving…', 'Enregistrement…') : step === 4 ? tr('Complete', 'Terminer') : tr('Continue', 'Continuer')}</button>
          </div>
        </section>
      </>}
    </div>
  </Shell>;
}

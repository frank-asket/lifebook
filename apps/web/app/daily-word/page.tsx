'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { ArrowRight, Check } from 'lucide-react';
import { useLanguage } from '../../components/language-provider';
import { useDailyWord } from '../../components/daily-word-provider';
import { Shell } from '../../components/shell';
import { PrayerTime } from '../../components/daily-word/PrayerTime';
import { api } from '../../lib/api';
import { DAILY_WORD_STEPS as steps, initialDailyWordStep } from '../../lib/daily-word-navigation';
import { PRAYER_LENGTHS, parseLength, type PrayerLength } from '../../lib/prayer-time';
import { calendarDay } from '../../lib/scripture';
import { errorMessage } from '../../lib/errors';
import { reportScripture } from '../../lib/fums';

type Session = {
  id: string; journeyDate: string; passageKey: string; status: 'IN_PROGRESS' | 'COMPLETED';
  steps: { step: string }[]; reflection: { content: string } | null;
};

// Length and chime are conveniences remembered on this device only.
const remember = (key: string, value?: string) => { try { if (value === undefined) return localStorage.getItem(key); localStorage.setItem(key, value); } catch { /* storage unavailable */ } return null; };

export default function DailyWordPage() {
  const { language } = useLanguage();
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const { word, loading: wordLoading, error: wordError, date, retry } = useDailyWord();
  const [session, setSession] = useState<Session | null>(null);
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);
  // Keep the active passage and session day together while the provider advances at midnight.
  const [reading, setReading] = useState<{ word: NonNullable<typeof word>; date: string } | null>(null);
  const sessionDate = open && reading ? reading.date : date;
  const [length, setLength] = useState<PrayerLength>(5);
  const [sound, setSound] = useState(false);
  const [reflection, setReflection] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const visit = useRef(0);
  const activeJourney = useRef({ userId, sessionDate, sessionId: session?.id, open, step, visit: visit.current });
  activeJourney.current = { userId, sessionDate, sessionId: session?.id, open, step, visit: visit.current };
  useEffect(() => { setLength(parseLength(remember('lifebook.prayerLength'))); setSound(remember('lifebook.prayerChime') === 'on'); }, []);
  useEffect(() => {
    if (!isLoaded || !sessionDate) return;
    let active = true;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    (async () => {
      setLoading(true); setBusy(false); setError(''); setSession(null); setReflection('');
      try {
        let current: Session | null = null;
        if (isSignedIn) {
          const token = await getToken();
          if (token) current = await api<Session>('/daily-word/sessions/today', token, { method: 'POST', body: JSON.stringify({ timezone }) });
        }
        if (!active) return;
        if (current && current.journeyDate.slice(0, 10) !== sessionDate) throw new Error(tr('The day has changed. Close prayer time and open today’s Word to save your progress.', 'Le jour a changé. Fermez le temps de prière et ouvrez la Parole du jour pour enregistrer votre progression.'));
        setSession(current); setReflection(current?.reflection?.content || '');
        const requested = new URLSearchParams(window.location.search).get('step');
        setStep(initialDailyWordStep(requested, current?.steps.map(done => done.step)));
        if (requested !== null && /^[0-4]$/.test(requested)) { if (word) setReading({ word, date }); setOpen(true); }
      } catch (e) { if (active) setError(errorMessage(e, language)); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [sessionDate, isLoaded, isSignedIn, userId, getToken, attempt]);

  useEffect(() => { if (open && !reading && word) setReading({ word, date }); }, [open, reading, word, date]);
  useEffect(() => { if (word) reportScripture(`word:${language}:${word.date}`, word.verse.fumsToken); }, [word, language]);
  const done = steps.map(s => Boolean(session?.steps.some(x => x.step === s)));
  const completed = session?.status === 'COMPLETED';
  const doneCount = done.filter(Boolean).length;
  const savedReflection = session?.reflection?.content || '';
  const reflectionDirty = Boolean(session) && reflection !== savedReflection;

  // Moving on never waits for the network; only an unsaved reflection does, because it is the person's own words.
  async function continueJourney() {
    const current = step;
    const origin = activeJourney.current;
    const stillCurrent = () => {
      const active = activeJourney.current;
      return active.open && active.userId === origin.userId && active.sessionDate === origin.sessionDate && active.sessionId === origin.sessionId && visit.current === origin.visit;
    };
    setError('');
    if (!session) { setStep(Math.min(5, current + 1)); return; }
    if (current === 2 && reflectionDirty && reflection.trim()) {
      setBusy(true);
      try {
        const token = await getToken();
        if (!stillCurrent()) return;
        await api(`/daily-word/sessions/${session.id}/reflection`, token, { method: 'PUT', body: JSON.stringify({ content: reflection }) });
        if (!stillCurrent()) return;
        setSession(s => s?.id === session.id ? { ...s, reflection: { content: reflection } } : s);
      } catch { if (stillCurrent()) setError(tr('Your reflection could not be saved. Check your connection and try again.', 'Votre réflexion n’a pas pu être enregistrée. Vérifiez votre connexion et réessayez.')); return; }
      finally { if (stillCurrent()) setBusy(false); }
    }
    if (!stillCurrent()) return;
    if (activeJourney.current.step === current) setStep(current + 1);
    if (done[current]) return;
    try {
      const token = await getToken();
      if (!stillCurrent()) return;
      const updated = await api<Session>(`/daily-word/sessions/${session.id}/steps/${steps[current]}`, token, { method: 'PUT' });
      if (!stillCurrent() || updated.id !== session.id) return;
      // Saves can finish out of order within this session, never across days or accounts.
      setSession(s => s?.id === session.id ? { ...updated, reflection: s.reflection, status: s.status === 'COMPLETED' ? s.status : updated.status, steps: [...s.steps, ...updated.steps.filter(x => !s.steps.some(y => y.step === x.step))] } : s);
    } catch { if (stillCurrent()) setError(tr('Your progress could not be saved just now. You can carry on.', 'Votre progression n’a pas pu être enregistrée. Vous pouvez continuer.')); }
  }
  const begin = () => { if (word) setReading({ word, date }); setError(''); setStep(completed ? 0 : initialDailyWordStep(null, session?.steps.map(s => s.step))); setOpen(true); };
  const chooseLength = (value: PrayerLength) => { setLength(value); remember('lifebook.prayerLength', String(value)); };
  const chooseSound = (on: boolean) => { setSound(on); remember('lifebook.prayerChime', on ? 'on' : 'off'); };
  const close = () => { visit.current += 1; setBusy(false); setReading(null); setOpen(false); setError(''); if (session) setReflection(session.reflection?.content || ''); window.history.replaceState(null, '', '/daily-word'); };

  if (open && (reading?.word || word)) return <PrayerTime word={(reading?.word || word)!} language={language} length={length} step={step} done={done} busy={busy} error={error} signedIn={Boolean(isSignedIn)}
    reflection={reflection} onReflection={setReflection} reflectionDirty={reflectionDirty} sound={sound} onSound={chooseSound}
    onBack={() => setStep(n => Math.max(0, n - 1))} onContinue={() => void continueJourney()} onGoTo={n => { setError(''); setStep(n); }} onClose={close} />;

  const ready = !loading && !wordLoading && word;
  const sections = word ? [
    [tr('Understand', 'Comprendre'), word.explanation], [tr('Meditate', 'Méditer'), word.meditation],
    [tr('Reflect', 'Réfléchir'), word.reflectionQuestion], [tr('Pray', 'Prier'), word.prayer], [tr('Live the Word', 'Vivre la Parole'), word.application],
  ] : [];
  return <Shell title={tr('Daily Word', 'Parole du jour')}>
    <div className="dw-page">
      <header className="dw-head">
        <span className="eyebrow">{date ? calendarDay(date, language) : tr('Today', 'Aujourd’hui')}</span>
        <h1 className="page-heading">{tr('Today’s Word', 'Parole du jour')}</h1>
      </header>
      {(error || wordError) && <div className="alert reader-error" role="alert"><span>{error || wordError}</span><button className="btn btn-soft" onClick={() => { retry(); setAttempt(n => n + 1); }}>{tr('Try again', 'Réessayer')}</button></div>}
      {!word ? (wordLoading || loading) && <div className="dw-verse card" aria-busy="true"><p role="status" className="sr-only">{tr('Preparing today’s Word…', 'Préparation de la Parole du jour…')}</p><span className="skeleton dw-skeleton" /><span className="skeleton dw-skeleton short" /></div> : <>
        <figure className="dw-verse card">
          <blockquote className="dw-verse-text">{word.verse.text}</blockquote>
          <figcaption><cite>{word.verse.reference}</cite><span>{word.verse.translation}</span>{word.verse.copyright && <span>{word.verse.copyright}</span>}</figcaption>
        </figure>

        <section className="card dw-begin" aria-labelledby="dw-begin-title">
          <div className="dw-begin-copy">
            <h2 id="dw-begin-title">{completed ? tr('You prayed with today’s Word', 'Vous avez prié avec la Parole du jour') : tr('Prayer time', 'Temps de prière')}</h2>
            <p className="subheading">{completed ? tr('You can return to it as often as you like.', 'Vous pouvez y revenir aussi souvent que vous le souhaitez.') : tr('Five quiet steps, one at a time: understand, be still, reflect, pray and carry it into your day.', 'Cinq étapes paisibles, une à la fois : comprendre, faire silence, réfléchir, prier et l’emporter dans votre journée.')}</p>
            {isSignedIn && session && <p className="dw-progress-line">{completed ? <><Check size={15} aria-hidden="true" /> {tr('Completed today', 'Terminé aujourd’hui')}</> : doneCount ? tr(`${doneCount} of 5 steps done`, `${doneCount} étapes sur 5 terminées`) : null}</p>}
          </div>
          <fieldset className="segmented" disabled={!ready}>
            <legend className="field-label">{tr('How long would you like?', 'Combien de temps ?')}</legend>
            <div className="segmented-options">{PRAYER_LENGTHS.map(n => <label key={n} className={length === n ? 'selected' : ''}><input type="radio" name="prayer-length" value={n} checked={length === n} onChange={() => chooseLength(n)} /><span>{n} min</span></label>)}</div>
          </fieldset>
          <label className="check-row dw-chime"><input type="checkbox" checked={sound} onChange={e => chooseSound(e.target.checked)} /> {tr('A soft chime when the stillness ends', 'Un carillon discret à la fin du silence')}</label>
          <button type="button" className="btn btn-primary dw-begin-button" disabled={!ready || (isSignedIn && !session)} onClick={begin}>
            {completed ? tr('Pray again', 'Prier à nouveau') : doneCount ? tr('Continue prayer time', 'Reprendre le temps de prière') : tr('Begin prayer time', 'Commencer le temps de prière')} <ArrowRight size={16} aria-hidden="true" />
          </button>
          {isLoaded && !isSignedIn && <p className="dw-signin muted"><Link className="text-link" href="/sign-in">{tr('Sign in', 'Connectez-vous')}</Link> {tr('to keep your progress and reflections.', 'pour garder votre progression et vos réflexions.')}</p>}
        </section>

        <details className="dw-all">
          <summary>{tr('Read all five steps on one page', 'Lire les cinq étapes sur une seule page')}</summary>
          <div className="dw-all-body">{sections.map(([title, text], i) => <section key={title}><h3><span>{i + 1}</span>{title}</h3><p>{text}</p></section>)}
            {savedReflection && <section><h3><span aria-hidden="true">·</span>{tr('Your reflection', 'Votre réflexion')}</h3><p className="dw-own">{savedReflection}</p></section>}</div>
        </details>
      </>}
    </div>
  </Shell>;
}

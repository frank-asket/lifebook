'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { X, Bell, BellOff, Check } from 'lucide-react';
import type { DailyWord } from '../../lib/daily-word';
import { breathPhase, clock, spokenDuration, stillnessSeconds, type PrayerLength } from '../../lib/prayer-time';

type Props = {
  word: DailyWord; language: 'en' | 'fr'; length: PrayerLength;
  step: number; done: readonly boolean[]; busy: boolean; error: string; signedIn: boolean;
  reflection: string; onReflection: (value: string) => void; reflectionDirty: boolean;
  sound: boolean; onSound: (on: boolean) => void;
  onBack: () => void; onContinue: () => void; onGoTo: (step: number) => void; onClose: () => void;
};

/** A soft two-partial bell. Only played at the end of the stillness and when the prayer time is finished. */
function ring(context: AudioContext | null) {
  if (!context) return;
  const now = context.currentTime;
  for (const [frequency, gain] of [[523.25, 0.12], [1046.5, 0.035]] as const) {
    const osc = context.createOscillator(); const amp = context.createGain();
    osc.type = 'sine'; osc.frequency.value = frequency;
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.exponentialRampToValueAtTime(gain, now + 0.015);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);
    osc.connect(amp).connect(context.destination); osc.start(now); osc.stop(now + 3.3);
  }
}

export function PrayerTime(props: Props) {
  const { word, language, length, step, done, busy, error, signedIn, reflection, onReflection, reflectionDirty, sound, onSound, onBack, onContinue, onGoTo, onClose } = props;
  const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const labels = [tr('Understand', 'Comprendre'), tr('Meditate', 'Méditer'), tr('Reflect', 'Réfléchir'), tr('Pray', 'Prier'), tr('Live the Word', 'Vivre la Parole')];
  const heading = useRef<HTMLHeadingElement>(null);
  const audio = useRef<AudioContext | null>(null);
  const previous = useRef(step);
  const direction = step >= previous.current ? 'forward' : 'back';
  useEffect(() => { previous.current = step; heading.current?.focus(); }, [step]);

  // An AudioContext may only start from a user gesture, so it is created when sound is switched on or the session opens with it on.
  const ensureAudio = useCallback(() => {
    if (audio.current || typeof window === 'undefined') return;
    const Context = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Context) audio.current = new Context();
  }, []);
  useEffect(() => { if (sound) ensureAudio(); }, [sound, ensureAudio]);
  useEffect(() => () => { void audio.current?.close(); }, []);
  const chime = useCallback(() => { if (sound) { void audio.current?.resume(); ring(audio.current); } }, [sound]);

  const close = useCallback(() => {
    if (reflectionDirty && !window.confirm(tr('Leave without saving your reflection?', 'Quitter sans enregistrer votre réflexion ?'))) return;
    onClose();
  }, [reflectionDirty, onClose, language]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    const root = document.documentElement; const overflow = root.style.overflow; root.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); root.style.overflow = overflow; };
  }, [close]);

  const finished = step === 5;
  useEffect(() => { if (finished) chime(); }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  const continueLabel = busy ? tr('Saving…', 'Enregistrement…') : step === 3 ? tr('Amen', 'Amen') : step === 4 ? tr('Finish', 'Terminer') : tr('Continue', 'Continuer');
  return <div className="pt" role="dialog" aria-modal="true" aria-label={tr('Prayer time', 'Temps de prière')} lang={language}>
    <header className="pt-bar">
      <button type="button" className="icon-button pt-close" onClick={close} aria-label={tr('Close prayer time', 'Fermer le temps de prière')}><X size={20} aria-hidden="true" /></button>
      {!finished && <ol className="pt-dots" aria-label={tr(`Step ${step + 1} of 5`, `Étape ${step + 1} sur 5`)}>
        {labels.map((label, i) => <li key={label} className={i === step ? 'current' : done[i] ? 'done' : ''}><button type="button" disabled={busy} onClick={() => onGoTo(i)} aria-current={i === step ? 'step' : undefined} aria-label={`${i + 1}. ${label}${done[i] ? tr(', done', ', terminée') : ''}`} /></li>)}
      </ol>}
      <button type="button" className="icon-button pt-sound" aria-pressed={sound} onClick={() => { if (!sound) ensureAudio(); onSound(!sound); }} aria-label={tr('Soft chime', 'Carillon discret')}>
        {sound ? <Bell size={18} aria-hidden="true" /> : <BellOff size={18} aria-hidden="true" />}
      </button>
    </header>

    <main className="pt-scroll">
      <div className="pt-stage" key={step} data-direction={direction}>
        {finished ? <Closing language={language} heading={heading} error={error} reflection={reflection} signedIn={signedIn} onReflect={() => onGoTo(2)} onClose={onClose} /> : <>
          <p className="pt-step-name">{labels[step]}</p>
          {step === 0 && <>
            <h1 className="pt-verse" ref={heading} tabIndex={-1}>{word.verse.text}</h1>
            <p className="pt-reference">{word.verse.reference} <span>· {word.verse.translation}</span></p>
            <p className="pt-body">{word.explanation}</p>
          </>}
          {step === 1 && <>
            <h1 className="pt-title" ref={heading} tabIndex={-1}>{tr('Be still for a moment.', 'Faites silence un instant.')}</h1>
            <p className="pt-body">{word.meditation}</p>
            <Stillness key={length} seconds={stillnessSeconds(length)} language={language} onEnd={chime} />
            <p className="pt-recall">“{word.verse.text}” <span>{word.verse.reference}</span></p>
          </>}
          {step === 2 && <>
            <h1 className="pt-title" ref={heading} tabIndex={-1}>{word.reflectionQuestion}</h1>
            <label className="sr-only" htmlFor="pt-reflection">{tr('Your private reflection', 'Votre réflexion privée')}</label>
            <textarea id="pt-reflection" className="pt-textarea" value={reflection} maxLength={10000} disabled={busy} onChange={e => onReflection(e.target.value)} placeholder={tr('Write freely. Only you can read this.', 'Écrivez librement. Vous seul pouvez lire ceci.')} rows={6} />
            <p className="pt-hint">{signedIn ? tr('Saved privately when you continue. You can also skip this.', 'Enregistrée en privé quand vous continuez. Vous pouvez aussi passer.') : tr('Sign in to keep your reflections.', 'Connectez-vous pour garder vos réflexions.')}</p>
          </>}
          {step === 3 && <>
            <h1 className="pt-title" ref={heading} tabIndex={-1}>{tr('Pray, in your own words or with these.', 'Priez avec vos mots, ou avec ceux-ci.')}</h1>
            <p className="pt-prayer">{word.prayer}</p>
          </>}
          {step === 4 && <>
            <h1 className="pt-title" ref={heading} tabIndex={-1}>{tr('Carry it into today.', 'Emportez-la dans votre journée.')}</h1>
            <p className="pt-body pt-application">{word.application}</p>
          </>}
        </>}
      </div>
    </main>

    {!finished && <footer className="pt-actions">
      {error && <p className="alert" role="alert">{error}</p>}
      <div className="pt-actions-row">
        <button type="button" className="btn btn-light" disabled={busy || step === 0} onClick={onBack}>{tr('Back', 'Retour')}</button>
        <button type="button" className="btn btn-primary" disabled={busy} onClick={onContinue}>{continueLabel}</button>
      </div>
    </footer>}
  </div>;
}

function Stillness({ seconds, language, onEnd }: { seconds: number; language: 'en' | 'fr'; onEnd: () => void }) {
  const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const [elapsed, setElapsed] = useState<number | null>(null);
  const end = useRef(onEnd); end.current = onEnd;
  useEffect(() => {
    if (elapsed === null || elapsed >= seconds) return;
    const started = performance.now() - elapsed * 1000;
    const timer = window.setInterval(() => {
      const now = (performance.now() - started) / 1000;
      if (now >= seconds) { setElapsed(seconds); end.current(); window.clearInterval(timer); } else setElapsed(now);
    }, 250);
    return () => window.clearInterval(timer);
  }, [elapsed === null, seconds]); // eslint-disable-line react-hooks/exhaustive-deps
  const running = elapsed !== null && elapsed < seconds;
  const over = elapsed !== null && elapsed >= seconds;
  const phase = elapsed === null ? null : breathPhase(elapsed);
  return <div className="pt-still" data-state={running ? 'running' : over ? 'over' : 'idle'}>
    <div className="pt-breath" data-phase={running ? phase : undefined} aria-hidden="true"><span /></div>
    <p className="pt-still-cue" aria-live="polite">{running ? (phase === 'in' ? tr('Breathe in', 'Inspirez') : tr('Breathe out', 'Expirez')) : over ? tr('Take your time. Continue when you are ready.', 'Prenez votre temps. Continuez quand vous êtes prêt.') : tr('Breathe slowly with the circle.', 'Respirez lentement avec le cercle.')}</p>
    {running ? <p className="pt-still-clock" aria-hidden="true">{clock(seconds - elapsed)}</p>
      : !over && <button type="button" className="btn btn-soft" onClick={() => setElapsed(0)}>{tr(`Begin ${spokenDuration(seconds, 'en')} of stillness`, `Commencer ${spokenDuration(seconds, 'fr')} de silence`)}</button>}
  </div>;
}

function Closing({ language, heading, error, reflection, signedIn, onReflect, onClose }: { language: 'en' | 'fr'; heading: React.RefObject<HTMLHeadingElement | null>; error: string; reflection: string; signedIn: boolean; onReflect: () => void; onClose: () => void }) {
  const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  return <div className="pt-closing">
    <span className="pt-closing-mark" aria-hidden="true"><Check size={26} /></span>
    <h1 className="pt-title" ref={heading} tabIndex={-1}>{tr('You spent time in the Word today.', 'Vous avez pris du temps dans la Parole aujourd’hui.')}</h1>
    {error && <p className="alert" role="alert">{error}</p>}
    {!error && <p className="pt-body">{signedIn ? tr('Today is marked complete. Come back tomorrow for a new passage.', 'Aujourd’hui est terminé. Revenez demain pour un nouveau passage.') : tr('Sign in to keep track of your days in the Word.', 'Connectez-vous pour garder la trace de vos jours dans la Parole.')}</p>}
    <div className="pt-closing-actions">
      <Link className="btn btn-primary" href="/dashboard">{tr('Back to home', 'Retour à l’accueil')}</Link>
      {!reflection.trim() && signedIn && <button type="button" className="btn btn-light" onClick={onReflect}>{tr('Write a private reflection', 'Écrire une réflexion privée')}</button>}
      <Link className="btn btn-light" href="/prayer">{tr('Open my prayer journal', 'Ouvrir mon journal de prière')}</Link>
      <button type="button" className="text-link pt-text-button" onClick={onClose}>{tr('Stay on today’s Word', 'Rester sur la Parole du jour')}</button>
    </div>
  </div>;
}

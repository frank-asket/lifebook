'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { Shell } from '../../../components/shell';
import { useLanguage } from '../../../components/language-provider';
import { api } from '../../../lib/api';
import { errorMessage } from '../../../lib/errors';
import { completedLessons, type PathDetail, type PathState } from '../../../lib/learning-paths';

export default function PathPage() {
  const { id } = useParams<{ id: string }>();
  const { userId } = useAuth();
  return <PathView key={`${id}:${userId ?? 'signed-out'}`} id={id} />;
}
function PathView({ id }: { id: string }) {
  const { language } = useLanguage();
  const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [path, setPath] = useState<PathDetail | null>(null);
  const [state, setState] = useState<PathState | null>(null);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [privateError, setPrivateError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const endpoint = `/paths/${encodeURIComponent(id)}`;
  useEffect(() => {
    const controller = new AbortController();
    setError(''); setPath(null);
    api<PathDetail>(endpoint, null, { signal: controller.signal }).then(value => { if (!controller.signal.aborted) setPath(value); }).catch(e => { if (!controller.signal.aborted) setError(errorMessage(e, language)); });
    return () => controller.abort();
  }, [endpoint, attempt, language]);
  useEffect(() => {
    const controller = new AbortController();
    setReady(false); setState(null); setPrivateError('');
    if (isLoaded && isSignedIn) (async () => {
      try {
        const token = await getToken(); if (!token) throw new Error(tr('Please sign in again.', 'Reconnectez-vous.'));
        const value = await api<PathState>(`${endpoint}/state`, token, { signal: controller.signal });
        if (!controller.signal.aborted) { setState(value); setReady(true); }
      } catch (e) { if (!controller.signal.aborted) setPrivateError(errorMessage(e, language)); }
    })();
    return () => controller.abort();
  }, [endpoint, isLoaded, isSignedIn, getToken, attempt, language]);
  const lesson = path?.lessons.find(item => item.id === selected) ?? path?.lessons[0];
  const done = !!state?.enrollment?.completions.some(item => item.lessonId === lesson?.id);
  async function write() {
    if (busy || !ready || !lesson) return;
    setBusy(true); setPrivateError('');
    try {
      const token = await getToken(); if (!token) throw new Error(tr('Please sign in again.', 'Reconnectez-vous.'));
      const value = await api<PathState>(state?.enrollment ? `${endpoint}/lessons/${encodeURIComponent(lesson.id)}/complete` : `${endpoint}/enroll`, token, { method: state?.enrollment ? 'PUT' : 'POST' });
      setState(value);
    } catch (e) { setPrivateError(errorMessage(e, language)); }
    finally { setBusy(false); }
  }
  return <Shell title={tr('My Journey', 'Mon parcours')}>
    <Link className="text-link" href="/discipleship">← {tr('All pathways', 'Tous les parcours')}</Link>
    {error ? <div role="alert" className="alert reader-error"><span>{error}</span><button className="btn btn-soft" onClick={() => setAttempt(n => n + 1)}>{tr('Try again', 'Réessayer')}</button></div> : !path ? <p role="status" className="notice">{tr('Loading pathway…', 'Chargement du parcours…')}</p> : <>
      <div className="page-intro"><span className="eyebrow">{tr('LEARN AT YOUR OWN PACE', 'APPRENEZ À VOTRE RYTHME')}</span><h1 className="page-heading">{path.title}</h1><p className="subheading">{path.description}</p></div>
      <p className="notice">{tr('Course progress records lessons you choose to complete. It never ranks your faith or grants ministry authority. Lessons are shown in their published language.', 'La progression indique les leçons que vous choisissez de terminer. Elle ne classe jamais votre foi et ne confère aucune autorité ministérielle. Les leçons sont présentées dans leur langue de publication.')}</p>
      {privateError ? <div role="alert" className="alert reader-error"><span>{privateError}</span><button className="btn btn-soft" disabled={busy} onClick={() => setAttempt(n => n + 1)}>{tr('Retry progress', 'Recharger la progression')}</button></div> : null}
      {state?.enrollment ? <div className="card learning-progress" role="status"><p>{completedLessons(path, state)} / {path.lessons.length} {tr('lessons completed', 'leçons terminées')}</p><progress aria-label={tr('Lesson progress', 'Progression des leçons')} max={Math.max(1, path.lessons.length)} value={completedLessons(path, state)} /></div> : null}
      {!path.lessons.length ? <div className="card"><p>{tr('Lessons are being prepared. Enrollment opens when lessons are available.', 'Les leçons se préparent. L’inscription sera disponible lorsqu’elles seront prêtes.')}</p></div> : <div className="learning-layout">
        <nav aria-label={tr('Pathway lessons', 'Leçons du parcours')}><ol className="learning-lessons">{path.lessons.map((item, index) => <li key={item.id}><button className="learning-lesson-link" aria-current={lesson?.id === item.id ? 'step' : undefined} disabled={busy} onClick={() => setSelected(item.id)}>{index + 1}. {item.title}{state?.enrollment?.completions.some(c => c.lessonId === item.id) ? ` · ${tr('Completed', 'Terminée')}` : ''}</button></li>)}</ol></nav>
        <article className="card" aria-busy={busy}><h2>{lesson?.title}</h2><div className="learning-content">{lesson?.content}</div>
          {!isSignedIn ? <p className="notice"><Link href="/sign-in">{tr('Sign in to save your progress', 'Connectez-vous pour enregistrer votre progression')}</Link>. {tr('Reading does not mark a lesson complete.', 'Lire une leçon ne la marque pas comme terminée.')}</p> : <button className="btn btn-primary" disabled={!ready || busy || (!!state?.enrollment && done)} onClick={() => void write()}>{busy ? tr('Saving…', 'Enregistrement…') : !state?.enrollment ? tr('Start this pathway', 'Commencer ce parcours') : done ? tr('Lesson completed', 'Leçon terminée') : tr('Mark lesson complete', 'Marquer la leçon comme terminée')}</button>}
        </article>
      </div>}
    </>}
  </Shell>;
}

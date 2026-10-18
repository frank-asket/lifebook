'use client';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { Shell } from '../../../components/shell';
import { useLanguage } from '../../../components/language-provider';
import { readingApi, type Enrollment, type ReadingHistory } from '../../../lib/bible-reading-api';
import { passageLabel } from '../../../lib/scripture';

export default function MyReadingPage() {
  const { language: locale } = useLanguage();
  const tr = (en: string, fr: string) => locale === 'fr' ? fr : en;
  const { getToken, isSignedIn, isLoaded, userId } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loadedFor, setLoadedFor] = useState<string>();
  const [history, setHistory] = useState<ReadingHistory[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const requestVersion = useRef(0);
  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true); setError('');
    try {
      const token = await getToken();
      if (!token) throw new Error(tr('Please sign in again to view your reading.', 'Reconnectez-vous pour voir votre lecture.'));
      const [plans, entries] = await Promise.all([readingApi.mine(token, locale), readingApi.history(token)]);
      if (version !== requestVersion.current) return;
      setEnrollments(plans); setHistory(entries); setLoadedFor(userId ?? undefined);
    } catch (e) { if (version === requestVersion.current) setError(e instanceof Error ? e.message : 'Unable to load reading progress'); }
    finally { if (version === requestVersion.current) setLoading(false); }
  }, [getToken, locale, userId]);
  useEffect(() => {
    setEnrollments([]); setHistory([]);
    if (!isLoaded) { setLoading(true); return; }
    if (isSignedIn) void load(); else setLoading(false);
    return () => { requestVersion.current++; };
  }, [isSignedIn, isLoaded, load]);
  const complete = async (id: string, day: number) => {
    const version = requestVersion.current;
    setBusy(true); setError('');
    try {
      const token = await getToken();
      if (!token) throw new Error(tr('Please sign in again.', 'Reconnectez-vous.'));
      await readingApi.complete(token, id, day);
      if (version === requestVersion.current) await load();
    } catch (e) { if (version === requestVersion.current) setError(e instanceof Error ? e.message : 'Unable to save progress'); }
    finally { setBusy(false); }
  };
  return <Shell title={tr('My Reading', 'Mon suivi')}>
    <span className="eyebrow">{tr('ONE CHAPTER AT A TIME', 'UN CHAPITRE À LA FOIS')}</span>
    <h1 className="page-heading">{tr('My reading journey', 'Mon parcours de lecture')}</h1>
    <p className="subheading">{tr('Return to a familiar passage or take the next step in your plan.', 'Retrouvez un passage ou poursuivez votre plan à votre rythme.')}</p>
    {isLoaded && !isSignedIn && <div className="card status-card"><h2>{tr('Keep your place', 'Retrouvez votre lecture')}</h2><p>{tr('Sign in to save your reading and plan progress.', 'Connectez-vous pour enregistrer votre progression.')}</p><Link className="btn btn-primary" href="/sign-in">{tr('Sign in', 'Se connecter')}</Link></div>}
    {loading && <p className="notice" role="status">{tr('Loading your reading…', 'Chargement de votre lecture…')}</p>}
    {error && <div className="alert reader-error" role="alert"><span>{error}</span><button className="btn btn-soft" onClick={() => void load()}>{tr('Try again', 'Réessayer')}</button></div>}
    {isSignedIn && loadedFor === userId && !loading && !error && <>
      {enrollments.length === 0 && <section className="card status-card"><BookOpen size={32} aria-hidden="true" /><h2>{tr('Start a reading rhythm', 'Commencez un rythme de lecture')}</h2><p>{tr('Choose a plan and take it one day at a time. Your progress will appear here.', 'Choisissez un plan et avancez un jour à la fois. Votre progression apparaîtra ici.')}</p><Link className="btn btn-primary" href="/bible/plans">{tr('Find a reading plan', 'Trouver un plan')}</Link></section>}
      {enrollments.map(e => <section key={e.id} className="card" style={{ margin: '24px 0' }}><span className="eyebrow">{tr('YOUR READING PLAN', 'VOTRE PLAN DE LECTURE')}</span><h2 style={{ marginTop: 12 }}>{e.plan.title}</h2><p className="muted reading-count">{e.completedDays} / {e.plan.duration} {tr('days completed', 'jours terminés')}</p><progress aria-label={e.plan.title} max={e.plan.duration} value={e.completedDays} /><ol className="reading-days">{e.plan.days.map(d => { const done = e.completions.some(c => c.day === d.day); return <li key={d.day}><Link href={`/bible/read?locale=${locale}&chapter=${encodeURIComponent(d.chapterId)}`}>{tr('Day', 'Jour')} {d.day} · {passageLabel(d.chapterId, locale)}</Link>{done ? <span className="reading-complete">✓ {tr('Completed', 'Terminé')}</span> : <button type="button" className="btn btn-soft btn-sm" disabled={busy} onClick={() => void complete(e.id, d.day)}>{busy ? tr('Saving…', 'Enregistrement…') : tr('Mark complete', 'Marquer terminé')}</button>}</li>; })}</ol></section>)}
      <section className="card" style={{ margin: '24px 0' }}><h2>{tr('Recent reading', 'Lectures récentes')}</h2>{history.length ? history.map(h => <div className="reading-entry" key={h.id}><Link className="text-link" href={`/bible/read?locale=${h.locale}&chapter=${encodeURIComponent(h.chapterId)}`}>{passageLabel(h.chapterId, h.locale, h.verse)} →</Link><time dateTime={h.updatedAt}>{new Date(h.updatedAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</time></div>) : <p className="muted">{tr('Chapters you open in the reader will appear here.', 'Les chapitres que vous ouvrez apparaîtront ici.')}</p>}<Link className="btn btn-outline" href={`/bible/read?locale=${locale}`}>{tr('Open the Bible', 'Ouvrir la Bible')}</Link></section>
      <Link className="text-link" href="/bible/plans">{tr('Explore more reading plans', 'Explorer d’autres plans')} →</Link>
    </>}
  </Shell>;
}

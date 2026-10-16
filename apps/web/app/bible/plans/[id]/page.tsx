'use client';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Shell } from '../../../../components/shell';
import { useLanguage } from '../../../../components/language-provider';
import { readingApi, type PlanDetails } from '../../../../lib/bible-reading-api';
export default function ReadingPlanPage() {
  const params = useParams<{id:string}>();
  const { language: locale } = useLanguage();
  const tr = (en: string, fr: string) => locale === 'fr' ? fr : en;
  const { getToken, isSignedIn } = useAuth();
  const [plan, setPlan] = useState<PlanDetails | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => { let live = true; setPlan(null); setLoading(true); setError(''); setMessage(''); readingApi.plan(params.id, locale).then(p => { if (live) setPlan(p); }).catch(e => { if (live) setError(e instanceof Error ? e.message : 'Unable to load plan'); }).finally(() => { if (live) setLoading(false); }); return () => { live = false; }; }, [params.id, locale, retry]);
  const enroll = async () => { setBusy(true); setError(''); try { const token = await getToken(); if (!token) throw new Error(tr('Please sign in again.', 'Reconnectez-vous.')); await readingApi.enroll(token, params.id); setMessage(tr('This plan is now part of your reading journey.', 'Ce plan fait maintenant partie de votre parcours.')); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to start plan'); } finally { setBusy(false); } };
  return <Shell title={plan?.title || tr('Reading Plan', 'Plan de lecture')}><Link className="text-link" href="/bible/plans">← {tr('All reading plans', 'Tous les plans')}</Link>
    {loading && <p className="notice" role="status">{tr('Preparing your plan…', 'Préparation de votre plan…')}</p>}
    {error && <div className="alert reader-error" role="alert"><span>{error}</span>{!plan && <button className="btn btn-soft" onClick={() => setRetry(n => n + 1)}>{tr('Try again', 'Réessayer')}</button>}</div>}
    {plan && <><header style={{ margin: '28px 0' }}><span className="eyebrow">{plan.duration} {tr('DAYS IN THE WORD', 'JOURS DANS LA PAROLE')}</span><h1 className="page-heading">{plan.title}</h1><p className="subheading">{plan.description}</p></header><section className="card"><h2>{tr('One day at a time', 'Un jour à la fois')}</h2><p className="muted">{tr('Read at your own pace. You can mark each day complete from My Reading.', 'Lisez à votre rythme. Vous pouvez marquer chaque jour terminé depuis Mon suivi.')}</p>{message ? <div className="notice" role="status"><p>{message}</p><Link className="btn btn-primary" href="/bible/my-reading">{tr('View my progress', 'Voir ma progression')} →</Link></div> : isSignedIn ? <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void enroll()}>{busy ? tr('Starting…', 'Démarrage…') : tr('Start this plan', 'Commencer ce plan')}</button> : <Link className="btn btn-primary" href="/sign-in">{tr('Sign in to save progress', 'Se connecter pour enregistrer sa progression')}</Link>}<ol className="reading-days">{plan.days.map(d => <li key={d.day}><Link href={`/bible/read?locale=${locale}&chapter=${encodeURIComponent(d.chapterId)}`}>{tr('Day', 'Jour')} {d.day} · {d.chapterId}<span aria-hidden="true"> →</span></Link></li>)}</ol></section></>}
  </Shell>;
}

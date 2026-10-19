'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GraduationCap, BookOpen, Compass, ArrowRight } from 'lucide-react';
import { Shell } from '../../components/shell';
import { EmptyState } from '../../components/section';
import { useLanguage } from '../../components/language-provider';
import { api, type LearningPath } from '../../lib/api';
export default function Discipleship() {
  const { language } = useLanguage();
  const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => { const controller = new AbortController(); setLoading(true); setError(''); api<LearningPath[]>('/paths', null, { signal: controller.signal }).then(value => { if (!controller.signal.aborted) setPaths(value); }).catch(e => { if (!controller.signal.aborted) setError(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); }); return () => controller.abort(); }, [retry]);
  return <Shell title={tr('My Journey', 'Mon parcours')}><span className="eyebrow">{tr('GROW AT YOUR OWN PACE', 'GRANDISSEZ À VOTRE RYTHME')}</span><h1 className="page-heading" style={{ marginTop: 9 }}>{tr('Your discipleship journey', 'Votre parcours de disciple')}</h1><p className="subheading">{tr('Explore biblical foundations through thoughtfully curated pathways.', 'Explorez les fondements bibliques à travers des parcours soigneusement préparés.')}</p><div className="hero" style={{ marginTop: 26, minHeight: 215 }}><div className="hero-content"><span className="eyebrow">{tr('A JOURNEY, NOT A SCORE', 'UN PARCOURS, PAS UNE NOTE')}</span><h2>{tr('One step at a time.', 'Un pas à la fois.')}</h2><p>{tr('Choose a pathway that supports your learning. Progress reflects lessons completed, not spiritual worth.', 'Choisissez un parcours pour apprendre. La progression reflète les leçons terminées, pas votre valeur spirituelle.')}</p><Link className="btn btn-light" href="/onboarding?step=goals">{tr('Update my goals', 'Modifier mes objectifs')} <ArrowRight size={16} /></Link></div></div><div className="section-title" style={{ marginTop: 30 }}><h2>{tr('Available pathways', 'Parcours disponibles')}</h2></div>
    {loading && <p className="notice" role="status">{tr('Loading pathways…', 'Chargement des parcours…')}</p>}
    {error && <div className="alert reader-error" role="alert"><span>{error}</span><button className="btn btn-soft" onClick={() => setRetry(n => n + 1)}>{tr('Try again', 'Réessayer')}</button></div>}
    {!loading && !error && (paths.length ? <div className="grid cols-3">{paths.map(p => <div className="card feature-card" key={p.id}><span className="feature-icon lilac"><BookOpen /></span><h3>{p.title}</h3><p>{p.description || tr('Explore this discipleship pathway.', 'Découvrez ce parcours de disciple.')}</p><Link className="btn btn-outline" href={`/discipleship/${encodeURIComponent(p.id)}`}>{tr('Open pathway', 'Ouvrir le parcours')} <ArrowRight size={16} aria-hidden="true" /></Link></div>)}</div> : <div className="card status-card"><EmptyState icon={GraduationCap} title={tr('New pathways are being prepared', 'De nouveaux parcours se préparent')} description={tr('In the meantime, start with a guided Bible reading plan.', 'En attendant, commencez par un plan de lecture biblique.')} /><Link className="btn btn-primary" href="/bible/plans">{tr('Find a reading plan', 'Trouver un plan de lecture')}</Link></div>)}
    {!loading && !error && paths.length >= 100 ? <p className="notice">{tr('Showing the first 100 published pathways.', 'Les 100 premiers parcours publiés sont affichés.')}</p> : null}
    <div className="notice" style={{ marginTop: 23 }}><Compass size={16} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 8 }} />{tr('LifeBook does not use course completion to rank spiritual maturity or determine ministry calling.', 'LifeBook ne classe pas la maturité spirituelle et ne détermine pas un appel au ministère selon les cours terminés.')}</div>
  </Shell>;
}

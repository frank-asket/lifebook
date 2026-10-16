'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, ArrowRight } from 'lucide-react';
import { Shell } from '../../../components/shell';
import { useLanguage } from '../../../components/language-provider';
import { readingApi, type Plan } from '../../../lib/bible-reading-api';
export default function ReadingPlansPage() {
  const { language: locale } = useLanguage();
  const tr = (en: string, fr: string) => locale === 'fr' ? fr : en;
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => { let live = true; setLoading(true); setError(''); setPlans([]); readingApi.plans(locale).then(x => { if (live) setPlans(x); }).catch(e => { if (live) setError(e instanceof Error ? e.message : 'Unable to load plans'); }).finally(() => { if (live) setLoading(false); }); return () => { live = false; }; }, [locale, retry]);
  return <Shell title={tr('Reading Plans', 'Plans de lecture')}><span className="eyebrow">{tr('A RHYTHM THAT FITS YOUR LIFE', 'UN RYTHME À VOTRE MESURE')}</span><h1 className="page-heading">{tr('Make space for Scripture', 'Faites place à la Parole')}</h1><p className="subheading">{tr('Choose a guided path through the Bible. A few minutes, one chapter, one day at a time.', 'Choisissez un parcours biblique. Quelques minutes, un chapitre, un jour à la fois.')}</p><div className="page-actions"><Link className="btn btn-outline" href="/bible/my-reading">{tr('My progress', 'Ma progression')}</Link><Link className="text-link" href={`/bible/read?locale=${locale}`}>{tr('Read at my own pace', 'Lire à mon rythme')} →</Link></div>
    {loading && <p className="notice" role="status">{tr('Loading reading plans…', 'Chargement des plans…')}</p>}
    {error && <div className="alert reader-error" role="alert"><span>{error}</span><button className="btn btn-soft" onClick={() => setRetry(n => n + 1)}>{tr('Try again', 'Réessayer')}</button></div>}
    {!loading && !error && plans.length === 0 && <div className="card status-card"><BookOpen size={32} aria-hidden="true" /><h2>{tr('More paths are on their way', 'De nouveaux parcours arrivent')}</h2><p>{tr('You can explore Scripture in the Bible Reader while plans are being prepared.', 'Vous pouvez lire la Bible pendant la préparation des plans.')}</p><Link className="btn btn-primary" href={`/bible/read?locale=${locale}`}>{tr('Open the Bible', 'Ouvrir la Bible')}</Link></div>}
    <div className="reading-plan-grid">{plans.map(p => <article className="card reading-plan" key={p.id}><span className="pill"><BookOpen size={15} aria-hidden="true" /> {p.duration} {tr('days', 'jours')}</span><h2>{p.title}</h2><p className="subheading">{p.description}</p><Link className="btn btn-soft" href={`/bible/plans/${encodeURIComponent(p.id)}`}>{tr('Explore this plan', 'Découvrir ce plan')}<ArrowRight size={16} aria-hidden="true" /></Link></article>)}</div>
  </Shell>;
}

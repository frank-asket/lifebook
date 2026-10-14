'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shell } from '../../../components/shell';
import { useLanguage } from '../../../components/language-provider';
import { readingApi, type Plan } from '../../../lib/bible-reading-api';
export default function ReadingPlansPage() {
 const { language } = useLanguage(); const locale = language === 'fr' ? 'fr' : 'en';
 const [plans,setPlans] = useState<Plan[]>([]); const [error,setError] = useState('');
 useEffect(() => { let live = true; readingApi.plans(locale).then(x => {if(live)setPlans(x)}).catch(e => {if(live)setError(String(e))}); return () => {live=false}; },[locale]);
 return <Shell title={locale === 'fr' ? 'Plans de lecture' : 'Reading Plans'}><h1 className="page-heading">{locale === 'fr' ? 'Choisir un plan' : 'Choose a reading plan'}</h1>{error && <p role="alert">{error}</p>}{plans.map(p => <div className="card" style={{padding:20,marginBottom:14}} key={p.id}><h2>{p.title}</h2><p>{p.description}</p><p>{p.duration} {locale === 'fr' ? 'jours' : 'days'}</p><Link href={`/bible/plans/${p.id}`}>{locale === 'fr' ? 'Voir le plan →' : 'View plan →'}</Link></div>)}</Shell>;
}

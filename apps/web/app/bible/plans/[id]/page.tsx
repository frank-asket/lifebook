'use client';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shell } from '../../../../components/shell';
import { useLanguage } from '../../../../components/language-provider';
import { readingApi, type PlanDetails } from '../../../../lib/bible-reading-api';
export default function ReadingPlanPage({ params }: { params: { id: string } }) {
 const { language } = useLanguage(); const locale = language === 'fr' ? 'fr' : 'en'; const { getToken, isSignedIn } = useAuth();
 const [plan,setPlan] = useState<PlanDetails|null>(null); const [error,setError] = useState(''); const [message,setMessage] = useState('');
 useEffect(() => {let live=true;readingApi.plan(params.id,locale).then(p=>{if(live)setPlan(p)}).catch(e=>{if(live)setError(String(e))});return()=>{live=false}},[params.id,locale]);
 const enroll = async () => {try{setError('');const token=await getToken();await readingApi.enroll(token,params.id);setMessage(locale==='fr'?'Plan ajouté à votre parcours.':'Plan added to your reading journey.')}catch(e){setError(String(e))}};
 return <Shell title={plan?.title || 'Reading Plan'}><h1 className="page-heading">{plan?.title}</h1><p>{plan?.description}</p>{error&&<p role="alert">{error}</p>}{message&&<p role="status">{message} <Link href="/bible/my-reading">{locale==='fr'?'Voir mon suivi':'View my progress'}</Link></p>}{isSignedIn?<button type="button" onClick={enroll}>{locale==='fr'?'Commencer le plan':'Start this plan'}</button>:<p>{locale==='fr'?'Connectez-vous pour enregistrer votre progression.':'Sign in to save your progress.'}</p>}<ol>{plan?.days.map(d=><li key={d.day}><Link href={`/bible/read?locale=${locale}&chapter=${d.chapterId}`}>{locale==='fr'?'Jour':'Day'} {d.day}: {d.chapterId}</Link></li>)}</ol></Shell>;
}

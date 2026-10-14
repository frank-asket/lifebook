'use client';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shell } from '../../../components/shell';
import { useLanguage } from '../../../components/language-provider';
import { readingApi, type Enrollment, type ReadingHistory } from '../../../lib/bible-reading-api';
export default function MyReadingPage() {
 const {language}=useLanguage(); const locale=language==='fr'?'fr':'en'; const {getToken,isSignedIn}=useAuth();
 const [enrollments,setEnrollments]=useState<Enrollment[]>([]); const [history,setHistory]=useState<ReadingHistory[]>([]); const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
 const refresh=async()=>{try{const token=await getToken();const [e,h]=await Promise.all([readingApi.mine(token,locale),readingApi.history(token)]);setEnrollments(e);setHistory(h)}catch(e){setError(String(e))}};
 useEffect(()=>{if(isSignedIn)void refresh()},[isSignedIn,locale,getToken]);
 const complete=async(id:string,day:number)=>{setBusy(true);try{const token=await getToken();await readingApi.complete(token,id,day);await refresh()}catch(e){setError(String(e))}finally{setBusy(false)}};
 return <Shell title={locale==='fr'?'Mon suivi':'My Reading'}><h1 className="page-heading">{locale==='fr'?'Ma progression':'My Reading Progress'}</h1>{!isSignedIn&&<p>{locale==='fr'?'Connectez-vous pour voir votre progression.':'Sign in to view your progress.'}</p>}{error&&<p role="alert">{error}</p>}{enrollments.map(e=><section key={e.id} className="card" style={{padding:20,marginBottom:16}}><h2>{e.plan.title}</h2><p>{e.completedDays}/{e.plan.duration} {locale==='fr'?'jours terminés':'days completed'}</p><progress max={e.plan.duration} value={e.completedDays}/><ol>{e.plan.days.map(d=>{const done=e.completions.some(c=>c.day===d.day);return <li key={d.day}><Link href={`/bible/read?locale=${locale}&chapter=${d.chapterId}`}>{locale==='fr'?'Jour':'Day'} {d.day}: {d.chapterId}</Link> {' '}{done?'✓':<button type="button" disabled={busy} onClick={()=>complete(e.id,d.day)}>{locale==='fr'?'Marquer terminé':'Mark complete'}</button>}</li>})}</ol></section>)}<h2>{locale==='fr'?'Lectures récentes':'Recent reading'}</h2><ul>{history.map(h=><li key={h.id}><Link href={`/bible/read?locale=${h.locale}&chapter=${h.chapterId}`}>{h.chapterId}</Link> — {new Date(h.updatedAt).toLocaleDateString(locale)}</li>)}</ul><Link href="/bible/plans">{locale==='fr'?'Découvrir les plans':'Browse reading plans'}</Link></Shell>;
}

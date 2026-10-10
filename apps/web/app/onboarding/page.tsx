'use client';
import { useAuth } from '@clerk/nextjs';
import { useState } from 'react';
import Link from 'next/link';
const journeys = ['EXPLORING','NEW_BELIEVER','GROWING_BELIEVER','DISCIPLESHIP','MINISTRY_PREPARATION','SERVING_IN_MINISTRY'];
export default function Onboarding(){
 const {getToken,isSignedIn} = useAuth(); const [journey,setJourney]=useState('NEW_BELIEVER');
 const [language,setLanguage]=useState('en'); const [consent,setConsent]=useState(false);
 const [goals,setGoals]=useState<string[]>([]); const [formats,setFormats]=useState<string[]>(['TEXT']);
 const [message,setMessage]=useState('');
 async function save(){try {const token=await getToken();if(!token)throw Error('Sign in required');
 const api=process.env.NEXT_PUBLIC_API_URL;if(!api)throw Error('API URL not configured');
 const response=await fetch(`${api}/api/v1/me/profile`,{method:'PUT',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({journey,language,learningGoals:goals,preferredFormats:formats,personalizationConsent:consent})});
 if(!response.ok)throw Error(`Save failed (${response.status})`);setMessage('Profile saved. You can change it later.');}catch(e){setMessage(e instanceof Error?e.message:'Unable to save');}}
 if(!isSignedIn)return <main>Please sign in first.</main>;
 return <main style={{padding:32,fontFamily:'sans-serif'}}><h1>Your LifeBook journey</h1><p>Your choice personalizes learning; it is not a measure of spiritual maturity.</p>
 <label>Journey <select value={journey} onChange={e=>setJourney(e.target.value)}>{journeys.map(j=><option key={j} value={j}>{j.replaceAll('_',' ')}</option>)}</select></label><br/>
 <label>Language <select value={language} onChange={e=>setLanguage(e.target.value)}><option value="en">English</option><option value="fr">Français</option></select></label><br/>
 <label><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/> Use my selected learning preferences for recommendations</label><br/>
 <fieldset><legend>Learning goals (optional)</legend>{['BIBLE_READING','PRAYER','UNDERSTAND_SALVATION','CHRISTIAN_SERVICE'].map(g=><label key={g} style={{display:'block'}}><input type="checkbox" checked={goals.includes(g)} onChange={e=>setGoals(v=>e.target.checked?[...v,g]:v.filter(x=>x!==g))}/>{g.replaceAll('_',' ')}</label>)}</fieldset>
 <fieldset><legend>Preferred formats</legend>{['TEXT','AUDIO','VIDEO'].map(f=><label key={f} style={{display:'block'}}><input type="checkbox" checked={formats.includes(f)} onChange={e=>setFormats(v=>e.target.checked?[...v,f]:v.filter(x=>x!==f))}/>{f}</label>)}</fieldset>
 <button onClick={save}>Save profile</button> <Link href="/dashboard">Dashboard</Link><p role="status">{message}</p></main>;
}

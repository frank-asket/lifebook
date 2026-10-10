'use client';
import { useAuth, UserButton } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Link from 'next/link';
type Profile = { journey?: string; language?: string; learningGoals?: string[] };
export default function Dashboard(){
 const {getToken,isLoaded,isSignedIn}=useAuth();
 const [profile,setProfile]=useState<Profile|null>(null);const [error,setError]=useState('');
 useEffect(()=>{if(!isLoaded||!isSignedIn)return;let active=true;(async()=>{try{
 const token=await getToken();const base=process.env.NEXT_PUBLIC_API_URL;
 if(!base||!token)throw Error('API or session not configured');
 const res=await fetch(`${base}/api/v1/me/profile`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});
 if(!res.ok)throw Error(`Profile request failed (${res.status})`);
 const data=await res.json();if(active)setProfile(data.profile);
 }catch(e){if(active)setError(e instanceof Error?e.message:'Unable to load profile')}})();return()=>{active=false};},[getToken,isLoaded,isSignedIn]);
 if(!isLoaded)return <main>Loading…</main>;
 if(!isSignedIn)return <main>Please <Link href="/sign-in">sign in</Link>.</main>;
 return <main style={{maxWidth:760,margin:'40px auto',fontFamily:'sans-serif',padding:20}}>
 <header style={{display:'flex',justifyContent:'space-between'}}><h1>LifeBook Dashboard</h1><UserButton/></header>
 <p>Your faith journey is self-selected and never a measure of spiritual maturity.</p>
 {error&&<p role="alert">{error}</p>}
 {!profile?<p><Link href="/onboarding">Complete your onboarding</Link></p>:<section><h2>Your learning journey</h2><p>{profile.journey?.replaceAll('_',' ')||'Not selected'}</p><p>Language: {profile.language}</p><p>Goals: {profile.learningGoals?.join(', ')||'Not selected'}</p><Link href="/onboarding">Edit preferences</Link></section>}
 <hr/><h2>Coming next</h2><p>Daily Bible Meditation · Prayer Sanctuary · LivingWord</p>
 </main>;
}

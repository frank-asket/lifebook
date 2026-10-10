import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useEffect,useState } from 'react';
import { View,Text,Button,ScrollView } from 'react-native';
export default function Dashboard(){const {getToken,isSignedIn}=useAuth();const router=useRouter();const [journey,setJourney]=useState('');const [status,setStatus]=useState('');
 useEffect(()=>{if(!isSignedIn)return;let active=true;(async()=>{try{const token=await getToken();const api=process.env.EXPO_PUBLIC_API_URL;
 if(!api||!token)throw Error('API or session missing');const res=await fetch(`${api}/api/v1/me/profile`,{headers:{Authorization:`Bearer ${token}`}});
 if(!res.ok)throw Error('Could not load profile');const data=await res.json();if(active)setJourney(data.profile?.journey||'');
 }catch(e){if(active)setStatus(e instanceof Error?e.message:'Error')}})();return()=>{active=false};},[isSignedIn,getToken]);
 return <ScrollView contentContainerStyle={{padding:24,gap:18}}><Text style={{fontSize:28}}>LifeBook</Text><Text>Your journey: {journey.replaceAll('_',' ')||'Not selected'}</Text>
 <Text>Daily Bible Meditation · Prayer Sanctuary · LivingWord (upcoming)</Text><Button title="Edit learning profile" onPress={()=>router.push('/onboarding')}/><Text>{status}</Text></ScrollView>;
}

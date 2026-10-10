import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View,Text,Button,TextInput,ScrollView,Switch,Pressable } from 'react-native';
const journeys=['EXPLORING','NEW_BELIEVER','GROWING_BELIEVER','DISCIPLESHIP','MINISTRY_PREPARATION','SERVING_IN_MINISTRY'];
const goals=['BIBLE_READING','PRAYER','UNDERSTAND_SALVATION','CHRISTIAN_SERVICE'];
export default function Onboarding(){const {getToken,isSignedIn}=useAuth();const router=useRouter();
 const [journey,setJourney]=useState('NEW_BELIEVER');const [language,setLanguage]=useState('en');
 const [consent,setConsent]=useState(false);const [selectedGoals,setSelectedGoals]=useState<string[]>([]);
 const [status,setStatus]=useState('');const [saving,setSaving]=useState(false);
 async function save(){setSaving(true);setStatus('');try{const token=await getToken();const api=process.env.EXPO_PUBLIC_API_URL;
 if(!token||!api)throw Error('Session or API URL unavailable');
 const response=await fetch(`${api}/api/v1/me/profile`,{method:'PUT',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({journey,language,learningGoals:selectedGoals,preferredFormats:['TEXT'],personalizationConsent:consent})});
 if(!response.ok)throw Error(`Unable to save (${response.status})`);router.replace('/dashboard');
 }catch(e){setStatus(e instanceof Error?e.message:'Could not save profile')}finally{setSaving(false)}}
 if(!isSignedIn)return <View style={{padding:24}}><Text>Sign in first.</Text></View>;
 return <ScrollView contentContainerStyle={{padding:24,gap:14}}><Text style={{fontSize:26,fontWeight:'bold'}}>Your LifeBook journey</Text>
 <Text>Your selection guides learning, not spiritual maturity or ministry authority.</Text>
 {journeys.map(j=><Pressable key={j} accessibilityRole="radio" accessibilityState={{checked:journey===j}} onPress={()=>setJourney(j)} style={{padding:12,borderWidth:1,borderColor:journey===j?'#2563eb':'#bbb',borderRadius:8}}><Text>{j.replaceAll('_',' ')}</Text></Pressable>)}
 <Text>Language (en or fr)</Text><TextInput accessibilityLabel="Language" value={language} onChangeText={setLanguage} autoCapitalize="none" style={{borderWidth:1,padding:10}}/>
 <Text>Learning goals (optional)</Text>{goals.map(g=><Pressable key={g} onPress={()=>setSelectedGoals(v=>v.includes(g)?v.filter(x=>x!==g):[...v,g])}><Text>{selectedGoals.includes(g)?'☑':'☐'} {g.replaceAll('_',' ')}</Text></Pressable>)}
 <View style={{flexDirection:'row',alignItems:'center',gap:12}}><Switch value={consent} onValueChange={setConsent}/><Text style={{flex:1}}>Use my selected preferences for learning recommendations</Text></View>
 <Button title={saving?'Saving…':'Save and continue'} disabled={saving||!['en','fr'].includes(language)} onPress={save}/><Text accessibilityRole="alert">{status}</Text>
 </ScrollView>;
}

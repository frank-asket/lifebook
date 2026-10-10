import { View,Text,Button } from 'react-native';
import { useAuth, useSSO } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
export default function Home(){const {isSignedIn,signOut}=useAuth();const {startSSOFlow}=useSSO();const router=useRouter();
 async function signIn(){try{const {createdSessionId,setActive}=await startSSOFlow({strategy:'oauth_google'});if(createdSessionId && setActive){await setActive({session:createdSessionId});router.push('/onboarding')}}catch(e){console.warn('Sign-in failed',e)}}
 return <View style={{padding:30,gap:12}}><Text>LifeBook</Text>{isSignedIn?<><Button title="Set up your profile" onPress={()=>router.push('/onboarding')}/><Button title="Sign out" onPress={()=>signOut()}/></>:<Button title="Continue with Google" onPress={signIn}/>}</View>}

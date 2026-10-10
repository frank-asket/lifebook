import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { Stack } from 'expo-router';
const tokenCache={async getToken(key:string){try{return await SecureStore.getItemAsync(key)}catch{return null}},async saveToken(key:string,value:string){try{await SecureStore.setItemAsync(key,value)}catch{}}};
export default function Layout(){const key=process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;if(!key)throw Error('Missing Clerk publishable key');return <ClerkProvider publishableKey={key} tokenCache={tokenCache}><ClerkLoaded><Stack /></ClerkLoaded></ClerkProvider>}

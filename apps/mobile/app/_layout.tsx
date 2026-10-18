import { useMemo } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { ClerkProvider, ClerkLoaded, useAuth, useSSO, useUser } from '@clerk/clerk-expo';
import { AppProvider, DailyWordProvider, SessionContext, useApp, type Session } from '../lib/app';

WebBrowser.maybeCompleteAuthSession();
const tokenCache = { async getToken(key: string) { try { return await SecureStore.getItemAsync(key); } catch { return null; } }, async saveToken(key: string, value: string) { try { await SecureStore.setItemAsync(key, value); } catch { /* not persisted */ } } };
const clerkKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

function ClerkSession({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth();
  const { user } = useUser();
  const { startSSOFlow } = useSSO();
  const value = useMemo<Session>(() => ({
    ready: isLoaded, isSignedIn: !!isSignedIn, firstName: user?.firstName ?? null, getToken: () => getToken(),
    signIn: async () => { const { createdSessionId, setActive } = await startSSOFlow({ strategy: 'oauth_google' }); if (createdSessionId && setActive) await setActive({ session: createdSessionId }); },
    signOut: async () => { await signOut(); },
  }), [isLoaded, isSignedIn, user?.firstName, getToken, signOut, startSSOFlow]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

function Navigation() {
  const { c, dark } = useApp();
  return <>
    <StatusBar style={dark ? 'light' : 'dark'} />
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="prayer-time" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="reader-settings" options={{ presentation: 'formSheet', sheetAllowedDetents: [0.62], sheetGrabberVisible: true, sheetCornerRadius: 22, contentStyle: { backgroundColor: c.paper } }} />
      <Stack.Screen name="books" options={{ presentation: 'modal' }} />
      <Stack.Screen name="onboarding" options={{ presentation: 'modal' }} />
    </Stack>
  </>;
}

export default function Layout() {
  const app = <AppProvider><DailyWordProvider><Navigation /></DailyWordProvider></AppProvider>;
  if (!clerkKey) return app;
  return <ClerkProvider publishableKey={clerkKey} tokenCache={tokenCache}><ClerkLoaded><ClerkSession>{app}</ClerkSession></ClerkLoaded></ClerkProvider>;
}

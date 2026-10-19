import { useCallback, useMemo } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { makeRedirectUri } from 'expo-auth-session';
import { tokenCache } from '@clerk/expo/token-cache';
import { ClerkProvider, ClerkLoaded, useAuth, useSSO, useUser } from '@clerk/expo';
import { AppProvider, DailyWordProvider, SessionContext, useApp, useSession, type Session } from '../lib/app';

const clerkKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

function ClerkSession({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, userId, getToken, signOut } = useAuth();
  const { user } = useUser();
  const { startSSOFlow } = useSSO();
  const readToken = useCallback(() => getToken(), [getToken]);
  const value = useMemo<Session>(() => ({
    ready: isLoaded, isSignedIn: !!isSignedIn, userId: userId ?? null, firstName: user?.firstName ?? null, getToken: readToken,
    signIn: async () => {
      const { createdSessionId, setActive, signUp } = await startSSOFlow({ strategy: 'oauth_google', redirectUrl: makeRedirectUri({ scheme: 'lifebook' }) });
      if (createdSessionId && setActive) { await setActive({ session: createdSessionId }); return; }
      // No session: the browser was closed, or Clerk needs more sign-up details than Google gave.
      throw new Error(signUp?.missingFields?.length ? `Missing: ${signUp.missingFields.join(', ')}` : 'Sign-in was not completed');
    },
    signOut: async () => { await signOut(); },
  }), [isLoaded, isSignedIn, userId, user?.firstName, readToken, signOut, startSSOFlow]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

function Navigation() {
  const { c, dark } = useApp();
  return <>
    <StatusBar style={dark ? 'light' : 'dark'} />
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="prayer-time" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureEnabled: false }} />
      <Stack.Screen name="reader-settings" options={{ presentation: 'formSheet', sheetAllowedDetents: [0.62], sheetGrabberVisible: true, sheetCornerRadius: 22, contentStyle: { backgroundColor: c.paper } }} />
      <Stack.Screen name="books" options={{ presentation: 'modal' }} />
      <Stack.Screen name="reading-plans" />
      <Stack.Screen name="saved-verses" />
      <Stack.Screen name="meditations" />
      <Stack.Screen name="daily-word-history" />
      <Stack.Screen name="onboarding" options={{ presentation: 'modal', gestureEnabled: false }} />
    </Stack>
  </>;
}

export function SessionNavigation() {
  const session = useSession();
  // Discard private screen state and in-flight callbacks whenever the account changes.
  return <Navigation key={session.userId ?? 'signed-out'} />;
}

export default function Layout() {
  const app = <AppProvider><DailyWordProvider><SessionNavigation /></DailyWordProvider></AppProvider>;
  if (!clerkKey) return app;
  return <ClerkProvider publishableKey={clerkKey} tokenCache={tokenCache}><ClerkLoaded><ClerkSession>{app}</ClerkSession></ClerkLoaded></ClerkProvider>;
}

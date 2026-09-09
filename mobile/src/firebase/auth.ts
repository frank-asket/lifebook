import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig, isFirebaseConfigured } from './firebaseConfig';

// Everything below is guarded by isFirebaseConfigured() so that a fresh
// checkout with placeholder config never crashes on startup — it just
// behaves as if Firebase isn't there yet, same dev-fallback philosophy as
// the backend's ANTHROPIC_API_KEY / Firebase Admin handling.

let auth: ReturnType<typeof initializeAuth> | null = null;

if (isFirebaseConfigured()) {
  const app = initializeApp(firebaseConfig);
  // getReactNativePersistence keeps the user logged in across app restarts,
  // backed by AsyncStorage — without this, Firebase Auth defaults to
  // in-memory only and logs everyone out on every app launch.
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function signUp(email: string, password: string) {
  if (!auth) throw new Error('Firebase is not configured — fill in mobile/src/firebase/firebaseConfig.ts');
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signIn(email: string, password: string) {
  if (!auth) throw new Error('Firebase is not configured — fill in mobile/src/firebase/firebaseConfig.ts');
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signOut() {
  if (!auth) return;
  await firebaseSignOut(auth);
}

export async function getIdToken(): Promise<string | null> {
  if (!auth || !auth.currentUser) return null;
  return auth.currentUser.getIdToken();
}

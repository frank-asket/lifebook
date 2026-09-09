// --------------------------------------------------------------------------
// Fill these in from your own Firebase project:
// Firebase console → Project settings → General → "Your apps" → Web app
// (yes, use the Web app config even though this is Expo/React Native —
// the Firebase JS SDK works fine in Expo's managed workflow and avoids
// needing native google-services.json / GoogleService-Info.plist files).
//
// This file cannot be tested from the sandbox this was built in — there's
// no real Firebase project to point it at. Treat the auth flow as written
// but unverified until you've run it against your own project.
// --------------------------------------------------------------------------

export const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

export function isFirebaseConfigured(): boolean {
  return firebaseConfig.apiKey !== 'YOUR_API_KEY';
}

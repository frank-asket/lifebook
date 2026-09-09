// --------------------------------------------------------------------------
// Firebase Admin setup.
//
// This file cannot be exercised in the sandbox this was built in — there's
// no network access to reach Firebase, and no real Firebase project exists
// yet. It's written against the current Firebase Admin SDK API and follows
// Google's documented service-account initialization pattern, but treat it
// as unverified until you've run it against a real project (see
// backend/README.md, "Setting up real Firebase Auth").
// --------------------------------------------------------------------------

let adminApp: any = null;

export function isFirebaseConfigured(): boolean {
  return Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
}

// Lazily require + initialize so the `firebase-admin` package is only
// touched when it's actually configured — the server still runs with zero
// Firebase setup, same dev-fallback philosophy as the rest of this backend.
export function getAdminAuth() {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured — set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
  }

  if (!adminApp) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const admin = require('firebase-admin');
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Service account keys downloaded from the Firebase console have
          // literal "\n" sequences in the private key when stored in a
          // single-line env var — this restores real newlines.
          privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        }),
      });
    }
    adminApp = admin;
  }
  return adminApp.auth();
}

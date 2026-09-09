import { IncomingMessage } from 'node:http';
import { isFirebaseConfigured, getAdminAuth } from './firebaseAdmin';

export interface Identity {
  userId: string;
  verified: boolean;
}

// --------------------------------------------------------------------------
// This is the single choke point every route should use to find out "who is
// making this request" — never trust a client-supplied deviceId directly
// once Firebase is configured.
//
// - Firebase NOT configured (no env vars set): dev-fallback mode. Reads
//   deviceId from the request body/query, same as before. Nothing is
//   cryptographically verified — fine for local development, not for
//   anything public.
// - Firebase configured: requires a valid "Authorization: Bearer <idToken>"
//   header, verifies it against the real Firebase project, and returns the
//   verified uid. Any client-supplied deviceId is ignored.
// --------------------------------------------------------------------------

export async function resolveIdentity(req: IncomingMessage, fallbackDeviceId?: string): Promise<Identity> {
  if (!isFirebaseConfigured()) {
    if (!fallbackDeviceId) throw new Error('deviceId is required (dev-fallback mode, no Firebase configured)');
    return { userId: fallbackDeviceId, verified: false };
  }

  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    throw new Error('Missing Authorization: Bearer <idToken> header');
  }
  const idToken = header.slice('Bearer '.length);

  const decoded = await getAdminAuth().verifyIdToken(idToken);
  return { userId: decoded.uid, verified: true };
}

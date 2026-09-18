import { IncomingMessage } from 'node:http';

export interface Identity {
  userId: string;
  verified: boolean;
}

// --------------------------------------------------------------------------
export function isClerkConfigured(): boolean {
  return Boolean(process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY);
}

let cachedClerk: any = null;

function getClerk() {
  if (!cachedClerk) {
    try {
      const { createClerkClient } = require('@clerk/backend');
      cachedClerk = createClerkClient({
        secretKey: process.env.CLERK_SECRET_KEY!,
        publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
      });
    } catch (e: any) {
      throw new Error(`@clerk/backend is not installed or failed to initialize: ${e?.message || e}`);
    }
  }
  return cachedClerk;
}

export async function resolveIdentity(req: IncomingMessage, fallbackDeviceId?: string): Promise<Identity> {
  if (!isClerkConfigured()) {
    // Dev-fallback mode: Allows testing API without requiring Clerk keys
    if (fallbackDeviceId) {
      return { userId: fallbackDeviceId, verified: false };
    }
    const header = req.headers['authorization'];
    if (header && header.startsWith('Bearer ')) {
      return { userId: header.slice('Bearer '.length), verified: false };
    }
    return { userId: 'dev-user', verified: false };
  }

  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    throw new Error('Missing Authorization: Bearer <sessionToken> header');
  }
  const token = header.slice('Bearer '.length);
  const clerk = getClerk();
  const result = await clerk.authenticateRequest(new Request('http://lifebook.internal', { headers: { Authorization: `Bearer ${token}` } }));
  if (!result.isAuthenticated || !result.toAuth().userId) throw new Error('Invalid or expired Clerk session token');
  return { userId: result.toAuth().userId, verified: true };
}

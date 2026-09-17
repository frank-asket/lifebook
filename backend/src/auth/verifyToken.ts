import { IncomingMessage } from 'node:http';
import { createClerkClient } from '@clerk/backend';

export interface Identity {
  userId: string;
  verified: boolean;
}

// --------------------------------------------------------------------------
export function isClerkConfigured(): boolean {
  return Boolean(process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY);
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
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY!, publishableKey: process.env.CLERK_PUBLISHABLE_KEY! });
  const result = await clerk.authenticateRequest(new Request('http://lifebook.internal', { headers: { Authorization: `Bearer ${token}` } }));
  if (!result.isAuthenticated || !result.toAuth().userId) throw new Error('Invalid or expired Clerk session token');
  return { userId: result.toAuth().userId, verified: true };
}

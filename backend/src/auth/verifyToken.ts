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

export async function resolveIdentity(req: IncomingMessage, _ignoredLegacyDeviceId?: string): Promise<Identity> {
  if (!isClerkConfigured()) throw new Error('Clerk is not configured — set CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY');

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

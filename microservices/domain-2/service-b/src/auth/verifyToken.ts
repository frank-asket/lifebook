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
    let createClerkClient: any;
    try {
      createClerkClient = require('@clerk/nextjs/server').createClerkClient;
    } catch {
      try {
        createClerkClient = require('@clerk/backend').createClerkClient;
      } catch (e: any) {
        throw new Error(`Clerk backend client failed to initialize: ${e?.message || e}`);
      }
    }
    cachedClerk = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY!,
      publishableKey: process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    });
  }
  return cachedClerk;
}

export async function resolveIdentity(req: IncomingMessage, fallbackDeviceId?: string): Promise<Identity> {
  const explicitUserId = (req.headers['x-user-id'] as string) || fallbackDeviceId;

  if (!isClerkConfigured()) {
    // Dev-fallback mode: Allows testing API without requiring Clerk keys
    if (explicitUserId) {
      return { userId: explicitUserId, verified: false };
    }
    const header = req.headers['authorization'];
    if (header && header.startsWith('Bearer ')) {
      return { userId: header.slice('Bearer '.length), verified: false };
    }
    return { userId: 'dev-user', verified: false };
  }

  const header = req.headers['authorization'];
  if (header && header.startsWith('Bearer ')) {
    const token = header.slice('Bearer '.length).trim();
    // If it's a local ChristianAuth/demo user session token (e.g. usr_...)
    if (token.startsWith('usr_')) {
      return { userId: token, verified: false };
    }

    try {
      const clerk = getClerk();
      const result = await clerk.authenticateRequest(
        new Request('http://lifebook.internal', { headers: { Authorization: `Bearer ${token}` } })
      );
      const auth = result.toAuth();
      if (result.isAuthenticated && auth?.userId) {
        return { userId: auth.userId, verified: true };
      }
    } catch (e: any) {
      if (explicitUserId) {
        return { userId: explicitUserId, verified: false };
      }
      throw new Error(`Invalid or expired Clerk session token: ${e?.message || e}`);
    }
  }

  if (explicitUserId) {
    return { userId: explicitUserId, verified: false };
  }

  throw new Error('Missing Authorization: Bearer <sessionToken> header');
}

import { IncomingMessage } from 'node:http';

export interface Identity {
  userId: string;
  verified: boolean;
  role?: string;
  isStaff: boolean;
  claims?: Record<string, any>;
}

// --------------------------------------------------------------------------
export function isClerkConfigured(): boolean {
  const secret = process.env.CLERK_SECRET_KEY;
  const pub = process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return Boolean(secret && pub && !pub.includes('dummy'));
}

let cachedClerk: any = null;

function getClerk() {
  if (!cachedClerk) {
    let createClerkClient: any;
    try {
      createClerkClient = require('@clerk/backend').createClerkClient;
    } catch {
      try {
        createClerkClient = require('@clerk/nextjs/server').createClerkClient;
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

export function checkStaffFromClaims(claims: any, authObj?: any): boolean {
  if (!claims && !authObj) return false;

  if (authObj?.has) {
    if (
      authObj.has({ role: 'admin' }) ||
      authObj.has({ role: 'org:admin' }) ||
      authObj.has({ permission: 'org:moderation:review' })
    ) {
      return true;
    }
  }

  const role =
    claims?.metadata?.role ||
    claims?.public_metadata?.role ||
    claims?.publicMetadata?.role ||
    claims?.role ||
    claims?.org_role;

  if (typeof role === 'string' && ['admin', 'moderator', 'reviewer', 'staff', 'org:admin'].includes(role.toLowerCase())) {
    return true;
  }

  if (claims?.publicMetadata?.isStaff === true || claims?.metadata?.isStaff === true || claims?.is_staff === true) {
    return true;
  }

  const perms = claims?.permissions || [];
  if (perms.includes('org:moderation:review') || perms.includes('org:admin')) {
    return true;
  }

  return false;
}

export async function resolveIdentity(req: IncomingMessage, fallbackDeviceId?: string): Promise<Identity> {
  const explicitUserId = (req.headers['x-user-id'] as string) || fallbackDeviceId;

  if (!isClerkConfigured()) {
    // Local dev-fallback mode: only active when Clerk keys are not configured
    if (explicitUserId) {
      const isStaff = explicitUserId === 'dev_reviewer_admin' || req.headers['x-reviewer'] === 'true';
      return { userId: explicitUserId, verified: false, isStaff, role: isStaff ? 'admin' : 'dev-user' };
    }
    const header = req.headers['authorization'];
    if (header && header.startsWith('Bearer ')) {
      const token = header.slice('Bearer '.length).trim();
      const isStaff = token === 'dev_reviewer_admin';
      return { userId: token, verified: false, isStaff, role: isStaff ? 'admin' : 'dev-user' };
    }
    return { userId: 'dev-user', verified: false, isStaff: false, role: 'dev-user' };
  }

  // When Clerk is configured, client-supplied x-user-id and deviceId MUST NOT be trusted
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    throw new Error('Authentication required: Missing Authorization: Bearer <sessionToken> header');
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    throw new Error('Authentication required: Empty Bearer token');
  }

  try {
    const clerk = getClerk();
    const result = await clerk.authenticateRequest(
      new Request('http://lifebook.internal', { headers: { Authorization: `Bearer ${token}` } })
    );
    const auth = result.toAuth();
    if (result.isAuthenticated && auth?.userId) {
      const claims = auth.sessionClaims || {};
      const isStaff = checkStaffFromClaims(claims, auth);
      const role =
        claims.metadata?.role ||
        claims.public_metadata?.role ||
        claims.publicMetadata?.role ||
        claims.role;

      return {
        userId: auth.userId,
        verified: true,
        role: typeof role === 'string' ? role : undefined,
        isStaff,
        claims,
      };
    }
    throw new Error('Clerk token authentication failed or user ID not found');
  } catch (e: any) {
    // Under strict Clerk mode, reject immediately. Never fallback to client x-user-id
    throw new Error(`Invalid or expired Clerk session token: ${e?.message || e}`);
  }
}


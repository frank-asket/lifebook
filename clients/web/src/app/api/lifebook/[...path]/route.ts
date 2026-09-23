import { auth } from '@clerk/nextjs/server';

const API_URL = process.env.LIFEBOOK_API_URL || 'http://127.0.0.1:8787';
const pubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY;
const isRealClerkConfigured = Boolean(
  process.env.CLERK_SECRET_KEY &&
  pubKey &&
  !pubKey.includes("dummy")
);

interface SessionClaimsRecord {
  metadata?: { role?: string; isStaff?: boolean };
  public_metadata?: { role?: string };
  publicMetadata?: { role?: string; isStaff?: boolean };
  role?: string;
  org_role?: string;
  is_staff?: boolean;
  permissions?: string[];
  [key: string]: unknown;
}

type AuthResult = Awaited<ReturnType<typeof auth>>;

function isStaffAuth(authResult: AuthResult | null | undefined): boolean {
  if (!authResult || !authResult.userId) return false;
  if (typeof authResult.has === 'function') {
    if (
      authResult.has({ role: 'admin' }) ||
      authResult.has({ role: 'org:admin' }) ||
      authResult.has({ permission: 'org:moderation:review' })
    ) {
      return true;
    }
  }
  const claims = (authResult.sessionClaims as SessionClaimsRecord | null | undefined) || {};
  const role =
    claims.metadata?.role ||
    claims.public_metadata?.role ||
    claims.publicMetadata?.role ||
    claims.role ||
    claims.org_role;
  if (typeof role === 'string' && ['admin', 'moderator', 'reviewer', 'staff', 'org:admin'].includes(role.toLowerCase())) {
    return true;
  }
  if (claims.publicMetadata?.isStaff === true || claims.metadata?.isStaff === true || claims.is_staff === true) {
    return true;
  }
  const perms = claims.permissions || [];
  if (Array.isArray(perms) && (perms.includes('org:moderation:review') || perms.includes('org:admin'))) {
    return true;
  }
  return false;
}

async function forward(request: Request, path: string[]) {
  if (!API_URL) return Response.json({ error: 'LIFEBOOK_API_URL is not configured' }, { status: 503 });
  
  let token: string | null = null;
  let userId: string | null = null;
  let isStaff = false;

  if (isRealClerkConfigured) {
    try {
      const authResult = await auth();
      userId = authResult.userId;
      token = await authResult.getToken();
      isStaff = isStaffAuth(authResult);
    } catch {
      // In development or when Clerk credentials are not provisioned
    }
  }

  // Enforce staff-only authorization for moderation endpoints
  if (path[0] === 'moderation') {
    if (isRealClerkConfigured) {
      if (!userId) {
        return Response.json({ error: 'unauthorized', detail: 'Authentication required' }, { status: 401 });
      }
      if (!isStaff) {
        return Response.json({ error: 'forbidden', detail: 'Staff or reviewer permission required' }, { status: 403 });
      }
    } else {
      // Local dev mode fallback: allow dev reviewer
      const authHeader = request.headers.get('authorization') || '';
      const xDevUser = request.headers.get('x-user-id');
      const isDevReviewer = authHeader.includes('dev_reviewer_admin') || xDevUser === 'dev_reviewer_admin';
      if (!isDevReviewer && request.headers.get('x-enforce-auth') === 'true') {
        return Response.json({ error: 'forbidden', detail: 'Staff permission required' }, { status: 403 });
      }
    }
  }

  const isPublicRoute = path[0] === 'health' || 
    path[0] === 'journeys' || 
    path[0] === 'analytics' || 
    path[0] === 'waitlist' || 
    (path[0] === 'livingword' && path[1] !== 'playlists');

  if (isRealClerkConfigured && !userId && !isPublicRoute && (path[0] === 'me' || path[0] === 'subscription' || (path[0] === 'livingword' && path[1] === 'playlists'))) {
    return Response.json({ error: 'unauthorized', detail: 'Valid session required' }, { status: 401 });
  }

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);

  const incomingAuth = request.headers.get('authorization');
  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  } else if (incomingAuth) {
    headers.set('authorization', incomingAuth);
  }

  // Never forward client x-user-id if Clerk is configured
  if (!isRealClerkConfigured) {
    const incomingUserId = request.headers.get('x-user-id') || userId;
    if (incomingUserId) {
      headers.set('x-user-id', incomingUserId);
    }
  }

  const bodyBuffer = request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer();

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL.replace(/\/$/, '')}/api/${path.join('/')}${new URL(request.url).search}`, {
      method: request.method,
      headers,
      body: bodyBuffer,
      cache: 'no-store',
      signal: AbortSignal.timeout(6000),
    });
  } catch {
    if (API_URL !== 'http://127.0.0.1:8787') {
      try {
        upstream = await fetch(`http://127.0.0.1:8787/api/${path.join('/')}${new URL(request.url).search}`, {
          method: request.method,
          headers,
          body: bodyBuffer,
          cache: 'no-store',
          signal: AbortSignal.timeout(6000),
        });
      } catch {
        return Response.json({ error: 'service_unavailable', detail: 'Local and remote backend unreachable' }, { status: 503 });
      }
    } else {
      return Response.json({ error: 'service_unavailable', detail: 'Backend service unreachable' }, { status: 503 });
    }
  }

  return new Response(await upstream.arrayBuffer(), { status: upstream.status, headers: { 'content-type': upstream.headers.get('content-type') || 'application/json' } });
}


export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) { return forward(request, (await params).path); }
export async function POST(request: Request, { params }: { params: Promise<{ path: string[] }> }) { return forward(request, (await params).path); }
export async function PATCH(request: Request, { params }: { params: Promise<{ path: string[] }> }) { return forward(request, (await params).path); }
export async function DELETE(request: Request, { params }: { params: Promise<{ path: string[] }> }) { return forward(request, (await params).path); }

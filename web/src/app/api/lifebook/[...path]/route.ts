import { auth } from '@clerk/nextjs/server';

const API_URL = process.env.LIFEBOOK_API_URL;
const pubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY;
const isRealClerkConfigured = Boolean(
  process.env.CLERK_SECRET_KEY &&
  pubKey &&
  !pubKey.includes("dummy")
);

async function forward(request: Request, path: string[]) {
  if (!API_URL) return Response.json({ error: 'LIFEBOOK_API_URL is not configured' }, { status: 503 });
  
  let token: string | null = null;
  let userId: string | null = null;

  if (isRealClerkConfigured) {
    try {
      const authResult = await auth();
      userId = authResult.userId;
      token = await authResult.getToken();
    } catch {
      // In development or when Clerk credentials are not provisioned
    }
  }

  if (isRealClerkConfigured && !userId) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  if (token) headers.set('authorization', `Bearer ${token}`);
  const upstream = await fetch(`${API_URL.replace(/\/$/, '')}/api/${path.join('/')}${new URL(request.url).search}`, {
    method: request.method, headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer(), cache: 'no-store',
  });
  return new Response(await upstream.arrayBuffer(), { status: upstream.status, headers: { 'content-type': upstream.headers.get('content-type') || 'application/json' } });
}

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) { return forward(request, (await params).path); }
export async function POST(request: Request, { params }: { params: Promise<{ path: string[] }> }) { return forward(request, (await params).path); }

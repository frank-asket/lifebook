import { auth } from '@clerk/nextjs/server';

const API_URL = process.env.LIFEBOOK_API_URL;

async function forward(request: Request, path: string[]) {
  if (!API_URL) return Response.json({ error: 'LIFEBOOK_API_URL is not configured' }, { status: 503 });
  const { getToken, userId } = await auth();
  if (!userId) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const token = await getToken();
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

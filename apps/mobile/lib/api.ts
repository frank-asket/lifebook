import { ApiError } from '../../web/lib/api';

const base = (process.env.EXPO_PUBLIC_API_URL || (__DEV__ ? 'http://localhost:4100' : '')).trim().replace(/\/+$/, '').replace(/\/api\/v1$/, '');

export async function requireToken(getToken: () => Promise<string | null>): Promise<string> {
  const token = await getToken();
  if (!token) throw new ApiError('Please sign in again.', 401);
  return token;
}

/** Public configuration only. Private content stays in memory, never in a device cache. */
export async function api<T>(path: string, token?: string | null, init: RequestInit = {}): Promise<T> {
  if (!base || (!__DEV__ && !base.startsWith('https://'))) throw new ApiError('LifeBook is temporarily unavailable. Please try again later.');
  if (!path.startsWith('/')) throw new Error('API path must start with "/"');
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (init.signal?.aborted) abort();
  else init.signal?.addEventListener('abort', abort);
  const timer = setTimeout(abort, 20000);
  try {
    const res = await fetch(`${base}/api/v1${path}`, { ...init, headers, cache: 'no-store', signal: controller.signal });
    if (res.status === 204) return undefined as T;
    let body: unknown;
    try { body = JSON.parse(await res.text()); } catch { /* invalid JSON gets a safe message */ }
    if (!res.ok) {
      const message = body && typeof body === 'object' && 'message' in body ? body.message : null;
      throw new ApiError(res.status === 429 ? 'Too many requests. Please wait a moment and try again.' : typeof message === 'string' ? message : 'We could not load this content. Please try again shortly.', res.status);
    }
    if (body === undefined) throw new ApiError('We could not load this content. Please try again shortly.');
    return body as T;
  } catch (error) {
    if (init.signal?.aborted || error instanceof ApiError) throw error;
    throw new ApiError('Cannot connect to LifeBook right now. Please check your connection and try again.');
  } finally {
    clearTimeout(timer);
    init.signal?.removeEventListener('abort', abort);
  }
}

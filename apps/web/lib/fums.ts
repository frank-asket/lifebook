// Reports Scripture a reader actually saw to API.Bible's Fair Use Management System, through our API,
// so the browser never contacts API.Bible. Random device and session IDs only; nothing about the person.

// Same base as lib/api.ts: the configured URL may or may not end in /api/v1.
const API = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '').replace(/\/api\/v1$/, '');
const sent = new Set<string>();

function randomId(): string {
  try { return crypto.randomUUID(); } catch { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`; }
}
function stored(storage: 'localStorage' | 'sessionStorage', key: string): string {
  try {
    const store = window[storage];
    const existing = store.getItem(key);
    if (existing && /^[A-Za-z0-9-]{8,64}$/.test(existing)) return existing;
    const id = randomId(); store.setItem(key, id); return id;
  } catch { return randomId(); }
}

/**
 * Which views still need reporting: one per thing shown (a chapter in a language, today's Word), not per fetch,
 * because the same chapter can be fetched twice and API.Bible issues a new token each time. Exported for tests.
 */
export function pending(views: readonly { key: string; token: string | null | undefined }[], already: ReadonlySet<string>): { key: string; token: string }[] {
  const out = new Map<string, string>();
  for (const v of views) if (typeof v.token === 'string' && v.token.length >= 8 && !already.has(v.key) && !out.has(v.key)) out.set(v.key, v.token);
  return Array.from(out, ([key, token]) => ({ key, token })).slice(0, 20);
}

/** Fire and forget: never blocks or breaks reading. `key` names what was shown, e.g. "chapter:fr:PSA.23". */
export function reportScripture(key: string, token: string | null | undefined): void {
  if (typeof window === 'undefined' || !API) return;
  const fresh = pending([{ key, token }], sent);
  if (!fresh.length) return;
  fresh.forEach(v => sent.add(v.key));
  const body = JSON.stringify({ tokens: fresh.map(v => v.token), deviceId: stored('localStorage', 'lifebook.device'), sessionId: stored('sessionStorage', 'lifebook.session') });
  fetch(`${API}/api/v1/bible-content/usage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => undefined);
}

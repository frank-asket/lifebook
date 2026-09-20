// --------------------------------------------------------------------------
// CORS is a browser-enforced mechanism — native mobile HTTP requests (the
// Expo app) don't send an Origin header and aren't subject to it at all.
// This only matters for browser-based callers (a web build, a dev tool
// hitting the API from a webpage, etc.).
//
// Dev-fallback: ALLOWED_ORIGINS unset → every origin is allowed, same as
// before. Set ALLOWED_ORIGINS (comma-separated) in production to lock this
// down to your actual app domain(s).
// --------------------------------------------------------------------------

function allowedOrigins(): string[] | null {
  const raw = process.env.ALLOWED_ORIGINS;
  if (!raw) return null; // null = allow-all (dev-fallback)
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

export function isOriginAllowed(origin: string | undefined): boolean {
  const allowList = allowedOrigins();
  if (!allowList) return true; // dev-fallback: wide open
  if (!origin) return true; // no Origin header = not a browser request (e.g. native app) — not CORS's concern
  return allowList.includes(origin);
}

export function corsOriginHeader(origin: string | undefined): string {
  const allowList = allowedOrigins();
  if (!allowList) return '*';
  if (origin && allowList.includes(origin)) return origin;
  // No matching origin and an allow-list is configured: don't echo '*' back,
  // since that would defeat the point of configuring a list at all.
  return allowList[0] || '*';
}

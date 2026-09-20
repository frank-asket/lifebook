// --------------------------------------------------------------------------
// A simple in-memory fixed-window rate limiter. Deliberately zero external
// dependencies, consistent with the rest of this backend.
//
// Known real limitation: this state lives in one process's memory. Behind
// a load balancer with multiple instances, each instance enforces its own
// limit independently, so the *effective* limit is (per-instance limit) x
// (instance count) — not a hard global cap. That's fine for a single-
// instance deployment (most small pilots), not fine once you scale
// horizontally. At that point, move this to a shared store (Redis) or use
// your platform's built-in rate limiting (Cloudflare, Render, etc.) instead.
// --------------------------------------------------------------------------

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Periodic cleanup so this Map doesn't grow forever with one-off callers.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, 5 * 60 * 1000).unref?.();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(key: string, maxRequests: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  if (existing.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: maxRequests - existing.count, resetAt: existing.resetAt };
}

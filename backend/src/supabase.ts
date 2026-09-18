function getServiceKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && getServiceKey());
}

let cachedSupabaseAdmin: any = null;

/** Server-only client with singleton reuse to prevent connection exhaustion. */
export function getSupabaseAdmin() {
  if (cachedSupabaseAdmin) return cachedSupabaseAdmin;

  const serviceKey = getServiceKey();
  if (!process.env.SUPABASE_URL || !serviceKey) {
    throw new Error('Supabase is not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }

  try {
    const { createClient } = require('@supabase/supabase-js');
    cachedSupabaseAdmin = createClient(process.env.SUPABASE_URL, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    return cachedSupabaseAdmin;
  } catch (e: any) {
    throw new Error(`@supabase/supabase-js is not installed or failed to initialize: ${e?.message || e}`);
  }
}

import { createClient } from '@supabase/supabase-js';

function getServiceKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && getServiceKey());
}

/** Server-only client. Never expose SUPABASE_SERVICE_ROLE_KEY to either app. */
export function getSupabaseAdmin() {
  const serviceKey = getServiceKey();
  if (!process.env.SUPABASE_URL || !serviceKey) {
    throw new Error('Supabase is not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(process.env.SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

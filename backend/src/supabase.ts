import { createClient } from '@supabase/supabase-js';

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Server-only client. Never expose SUPABASE_SERVICE_ROLE_KEY to either app. */
export function getSupabaseAdmin() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient<any>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

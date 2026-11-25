// ---------------------------------------------------------------------------
// Server-side Supabase admin client (service role key — never import in client code)
// ---------------------------------------------------------------------------
import '@tanstack/react-start/server-only';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL!;
const key = process.env.MARG_SERVICE_ROLE_KEY!;

if (!url || !key) {
  console.error('[supabaseAdmin] VITE_SUPABASE_URL or MARG_SERVICE_ROLE_KEY is missing');
}

export const supabaseAdmin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

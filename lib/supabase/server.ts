import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Service role client — bypasses RLS. Use ONLY in /api routes, never in frontend.
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Server-side client with service role key — full read/write, bypasses RLS.
// Only use in Server Components, Server Actions, and Route Handlers.
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')
  return createClient<Database>(url, key)
}

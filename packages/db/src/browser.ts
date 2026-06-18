import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Browser client with anon key — used in the player portal (read-only, RLS filtered).
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')
  return createClient<Database>(url, key)
}

'use client'

import { createBrowserClient } from '@supabase/ssr'

// No Database generic — cast results explicitly (see server.ts for explanation).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

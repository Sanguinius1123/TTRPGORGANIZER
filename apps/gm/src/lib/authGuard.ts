'server-only'

import { createAnonClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

/** Returns the profile if the caller is a GM, otherwise null. Use at the top of GM server actions. */
export async function requireGm() {
  const anonClient = await createAnonClient()
  const { data: { user } } = await anonClient.auth.getUser()
  if (!user) return null
  const { data } = await db().from('profiles').select('is_gm, is_admin').eq('id', user.id).single()
  const profile = (data as { is_gm: boolean; is_admin: boolean } | null) ?? null
  if (!profile?.is_gm) return null
  return profile
}

/** Returns the profile if the caller is an admin, otherwise null. */
export async function requireAdmin() {
  const profile = await requireGm()
  if (!profile?.is_admin) return null
  return profile
}

import { cookies } from 'next/headers'

export const ACTIVE_PC_COOKIE = 'active_pc_id'

export async function getActivePcId(): Promise<string | null> {
  const store = await cookies()
  return store.get(ACTIVE_PC_COOKIE)?.value ?? null
}

'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { ACTIVE_PC_COOKIE } from '@/lib/activePC'

export async function switchPC(formData: FormData) {
  const pcId = formData.get('pc_id') as string
  if (!pcId) return
  const store = await cookies()
  store.set(ACTIVE_PC_COOKIE, pcId, { path: '/', httpOnly: true, sameSite: 'lax' })
  revalidatePath('/play', 'layout')
  redirect('/play')
}

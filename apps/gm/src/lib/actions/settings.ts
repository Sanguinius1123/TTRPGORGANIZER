'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function updateRegistrationCode(formData: FormData) {
  const supabase = db()
  const code = (formData.get('registration_code') as string).trim()
  await supabase
    .from('settings')
    .upsert({ key: 'registration_code', value: code })
  revalidatePath('/settings')
}

export async function assignProfileToPC(formData: FormData) {
  const supabase = db()
  const pc_id     = formData.get('pc_id') as string
  const profile_id = (formData.get('profile_id') as string) || null
  await supabase
    .from('player_characters')
    .update({ profile_id })
    .eq('id', pc_id)
  revalidatePath(`/player-characters/${pc_id}`)
  revalidatePath('/settings')
}

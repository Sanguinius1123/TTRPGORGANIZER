'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function addLoreLocation(lore_id: string, location_id: string, notes?: string) {
  const supabase = db()
  const { error } = await supabase.from('lore_locations').insert({ lore_id, location_id, notes: notes || null })
  if (error) throw new Error(error.message)
  revalidatePath(`/lore/${lore_id}`)
}

export async function removeLoreLocation(id: string, lore_id: string) {
  const supabase = db()
  const { error } = await supabase.from('lore_locations').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/lore/${lore_id}`)
}

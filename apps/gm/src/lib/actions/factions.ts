'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createFaction(formData: FormData) {
  const supabase = db()
  const { data, error } = await supabase
    .from('factions')
    .insert({
      name: formData.get('name') as string,
      disposition: (formData.get('disposition') as string) || null,
      goal: (formData.get('goal') as string) || null,
      description: (formData.get('description') as string) || null,
      parent_faction_id: (formData.get('parent_faction_id') as string) || null,
      visible: false,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  redirect(`/factions/${data.id}`)
}

export async function updateFaction(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const { error } = await supabase
    .from('factions')
    .update({
      name: formData.get('name') as string,
      disposition: (formData.get('disposition') as string) || null,
      goal: (formData.get('goal') as string) || null,
      description: (formData.get('description') as string) || null,
      parent_faction_id: (formData.get('parent_faction_id') as string) || null,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath(`/factions/${id}`)
  revalidatePath('/factions')
}

export async function deleteFaction(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const { error } = await supabase.from('factions').delete().eq('id', id)
  if (error) throw new Error(error.message)
  redirect('/factions')
}

export async function toggleFactionVisibility(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const visible = formData.get('visible') === 'true'
  const { error } = await supabase.from('factions').update({ visible: !visible }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/factions/${id}`)
  revalidatePath('/factions')
}

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
      goal: (formData.get('goal') as string) || null,
      description: (formData.get('description') as string) || null,
      species: (formData.get('species') as string) || null,
      culture: (formData.get('culture') as string) || null,
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
      goal: (formData.get('goal') as string) || null,
      description: (formData.get('description') as string) || null,
      species: (formData.get('species') as string) || null,
      culture: (formData.get('culture') as string) || null,
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

export async function addFactionRelationship(formData: FormData) {
  const supabase = db()
  const from_faction_id = formData.get('faction_id') as string
  const to_faction_id   = formData.get('to_faction_id') as string
  const relationship_type = (formData.get('relationship_type') as string) || 'neutral'
  // ignoreDuplicates: silently skip if this direction already exists
  const { error } = await supabase.from('faction_relationships')
    .upsert({ from_faction_id, to_faction_id, relationship_type },
             { onConflict: 'from_faction_id,to_faction_id', ignoreDuplicates: true })
  if (error) throw new Error(error.message)
  revalidatePath(`/factions/${from_faction_id}`)
}

export async function removeFactionRelationship(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const faction_id = formData.get('faction_id') as string
  const { error } = await supabase.from('faction_relationships').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/factions/${faction_id}`)
}

export async function addFactionLocation(formData: FormData) {
  const supabase = db()
  const faction_id  = formData.get('faction_id') as string
  const location_id = formData.get('location_id') as string
  const { error } = await supabase.from('faction_locations').insert({ faction_id, location_id })
  if (error) throw new Error(error.message)
  revalidatePath(`/factions/${faction_id}`)
}

export async function removeFactionLocation(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const faction_id = formData.get('faction_id') as string
  const { error } = await supabase.from('faction_locations').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/factions/${faction_id}`)
}

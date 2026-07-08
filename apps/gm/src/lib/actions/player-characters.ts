'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPlayerCharacter(formData: FormData) {
  const supabase = db()
  const { data, error } = await supabase
    .from('player_characters')
    .insert({
      name: formData.get('name') as string,
      player_name: (formData.get('player_name') as string) || null,
      species: (formData.get('species') as string) || null,
      culture: (formData.get('culture') as string) || null,
      background: (formData.get('background') as string) || null,
      notes: (formData.get('notes') as string) || null,
      gm_notes: (formData.get('gm_notes') as string) || null,
      campaign_id: formData.get('campaign_id') as string,
      visible: true,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  redirect(`/player-characters/${data.id}`)
}

export async function updatePlayerCharacter(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const { error } = await supabase
    .from('player_characters')
    .update({
      name: formData.get('name') as string,
      player_name: (formData.get('player_name') as string) || null,
      species: (formData.get('species') as string) || null,
      culture: (formData.get('culture') as string) || null,
      background: (formData.get('background') as string) || null,
      notes: (formData.get('notes') as string) || null,
      private_notes: (formData.get('private_notes') as string) || null,
      personality_notes: (formData.get('personality_notes') as string) || null,
      gm_notes: (formData.get('gm_notes') as string) || null,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath(`/player-characters/${id}`)
  revalidatePath('/player-characters')
}

export async function setPcLocation(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const current_location_id = (formData.get('current_location_id') as string) || null
  const { error } = await supabase.from('player_characters').update({ current_location_id }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/player-characters/${id}`)
}

export async function deletePlayerCharacter(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const { error } = await supabase.from('player_characters').delete().eq('id', id)
  if (error) throw new Error(error.message)
  redirect('/player-characters')
}

export async function togglePlayerCharacterVisibility(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const visible = formData.get('visible') === 'true'
  const { error } = await supabase.from('player_characters').update({ visible: !visible }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/player-characters/${id}`)
  revalidatePath('/player-characters')
}

export async function setPartyFaction(formData: FormData) {
  const supabase = db()
  const id               = formData.get('pc_id') as string
  const party_faction_id = (formData.get('party_faction_id') as string) || null
  const { error } = await supabase.from('player_characters').update({ party_faction_id }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/player-characters/${id}`)
}

export async function addPcFaction(formData: FormData) {
  const supabase = db()
  const pc_id      = formData.get('pc_id') as string
  const faction_id = formData.get('faction_id') as string
  const role       = (formData.get('role') as string) || null
  const { error } = await supabase.from('pc_factions').insert({ pc_id, faction_id, role })
  if (error) throw new Error(error.message)
  revalidatePath(`/player-characters/${pc_id}`)
}

export async function removePcFaction(formData: FormData) {
  const supabase = db()
  const id    = formData.get('id') as string
  const pc_id = formData.get('pc_id') as string
  const { error } = await supabase.from('pc_factions').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/player-characters/${pc_id}`)
}

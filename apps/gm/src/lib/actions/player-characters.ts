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
      background: (formData.get('background') as string) || null,
      notes: (formData.get('notes') as string) || null,
      visible: false,
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
      background: (formData.get('background') as string) || null,
      notes: (formData.get('notes') as string) || null,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath(`/player-characters/${id}`)
  revalidatePath('/player-characters')
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

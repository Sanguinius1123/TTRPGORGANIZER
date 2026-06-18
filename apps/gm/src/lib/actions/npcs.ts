'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createNpc(formData: FormData) {
  const supabase = db()
  const { data, error } = await supabase
    .from('npcs')
    .insert({
      name: formData.get('name') as string,
      species: (formData.get('species') as string) || null,
      profession: (formData.get('profession') as string) || null,
      culture: (formData.get('culture') as string) || null,
      background: (formData.get('background') as string) || null,
      disposition: (formData.get('disposition') as string) || null,
      notes: (formData.get('notes') as string) || null,
      visible: false,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  redirect(`/npcs/${data.id}`)
}

export async function updateNpc(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string

  const { error } = await supabase
    .from('npcs')
    .update({
      name: formData.get('name') as string,
      species: (formData.get('species') as string) || null,
      profession: (formData.get('profession') as string) || null,
      culture: (formData.get('culture') as string) || null,
      background: (formData.get('background') as string) || null,
      disposition: (formData.get('disposition') as string) || null,
      notes: (formData.get('notes') as string) || null,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath(`/npcs/${id}`)
  revalidatePath('/npcs')
}

export async function deleteNpc(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const { error } = await supabase.from('npcs').delete().eq('id', id)
  if (error) throw new Error(error.message)
  redirect('/npcs')
}

export async function toggleNpcVisibility(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const visible = formData.get('visible') === 'true'
  const { error } = await supabase.from('npcs').update({ visible: !visible }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/npcs/${id}`)
  revalidatePath('/npcs')
}

export async function addNpcFact(formData: FormData) {
  const supabase = db()
  const npc_id = formData.get('npc_id') as string
  const { error } = await supabase.from('npc_facts').insert({
    npc_id,
    fact_text: formData.get('fact_text') as string,
    revealed: false,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/npcs/${npc_id}`)
}

export async function toggleFactRevealed(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const npc_id = formData.get('npc_id') as string
  const revealed = formData.get('revealed') === 'true'
  const { error } = await supabase.from('npc_facts').update({ revealed: !revealed }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/npcs/${npc_id}`)
}

export async function deleteNpcFact(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const npc_id = formData.get('npc_id') as string
  const { error } = await supabase.from('npc_facts').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/npcs/${npc_id}`)
}

'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createEncounter(formData: FormData) {
  const supabase = db()
  const { data, error } = await supabase
    .from('encounters')
    .insert({
      title: formData.get('title') as string,
      location_id: (formData.get('location_id') as string) || null,
      session_id: (formData.get('session_id') as string) || null,
      status: (formData.get('status') as string) || 'prep',
      notes: (formData.get('notes') as string) || null,
      summary: null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  redirect(`/encounters/${data.id}`)
}

export async function updateEncounter(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const { error } = await supabase
    .from('encounters')
    .update({
      title: formData.get('title') as string,
      location_id: (formData.get('location_id') as string) || null,
      session_id: (formData.get('session_id') as string) || null,
      status: formData.get('status') as string,
      notes: (formData.get('notes') as string) || null,
      summary: (formData.get('summary') as string) || null,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath(`/encounters/${id}`)
  revalidatePath('/encounters')
}

export async function deleteEncounter(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const { error } = await supabase.from('encounters').delete().eq('id', id)
  if (error) throw new Error(error.message)
  redirect('/encounters')
}

export async function addParticipant(formData: FormData) {
  const supabase = db()
  const encounter_id = formData.get('encounter_id') as string
  const count = formData.get('count') as string
  const { error } = await supabase.from('encounter_participants').insert({
    encounter_id,
    npc_id: (formData.get('npc_id') as string) || null,
    label: formData.get('label') as string,
    count: count ? parseInt(count) : 1,
    role: (formData.get('role') as string) || null,
    notes: (formData.get('notes') as string) || null,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/encounters/${encounter_id}`)
}

export async function deleteParticipant(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const encounter_id = formData.get('encounter_id') as string
  const { error } = await supabase.from('encounter_participants').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/encounters/${encounter_id}`)
}

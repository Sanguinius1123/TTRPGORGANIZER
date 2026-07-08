'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createSpecies(formData: FormData) {
  const supabase = db()
  const { data, error } = await supabase
    .from('species')
    .insert({
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || null,
      gm_notes: (formData.get('gm_notes') as string) || null,
      campaign_id: formData.get('campaign_id') as string,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  redirect(`/species/${data.id}`)
}

export async function updateSpecies(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const { error } = await supabase
    .from('species')
    .update({
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || null,
      gm_notes: (formData.get('gm_notes') as string) || null,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/species/${id}`)
  revalidatePath('/species')
}

export async function setSpeciesOriginLocation(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const origin_location_id = (formData.get('origin_location_id') as string) || null
  const { error } = await supabase
    .from('species')
    .update({ origin_location_id })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/species/${id}`)
}

export async function toggleSpeciesVisibility(id: string, visible: boolean) {
  const supabase = db()
  await supabase.from('species').update({ visible }).eq('id', id)
  revalidatePath(`/species/${id}`)
  revalidatePath('/species')
}

export async function deleteSpecies(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const { error } = await supabase.from('species').delete().eq('id', id)
  if (error) throw new Error(error.message)
  redirect('/species')
}

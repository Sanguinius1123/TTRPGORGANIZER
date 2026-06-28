'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createCulture(formData: FormData) {
  const supabase = db()
  const { data, error } = await supabase
    .from('cultures')
    .insert({
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || null,
      campaign_id: formData.get('campaign_id') as string,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  redirect(`/cultures/${data.id}`)
}

export async function updateCulture(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const { error } = await supabase
    .from('cultures')
    .update({
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || null,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/cultures/${id}`)
  revalidatePath('/cultures')
}

export async function addCultureLocation(formData: FormData) {
  const supabase = db()
  const culture_id  = formData.get('culture_id') as string
  const location_id = formData.get('location_id') as string
  const { error } = await supabase
    .from('culture_locations')
    .insert({ culture_id, location_id })
  if (error) throw new Error(error.message)
  revalidatePath(`/cultures/${culture_id}`)
}

export async function removeCultureLocation(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const culture_id = formData.get('culture_id') as string
  const { error } = await supabase.from('culture_locations').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/cultures/${culture_id}`)
}

export async function deleteCulture(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const { error } = await supabase.from('cultures').delete().eq('id', id)
  if (error) throw new Error(error.message)
  redirect('/cultures')
}

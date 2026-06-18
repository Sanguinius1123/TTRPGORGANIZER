'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createLocation(formData: FormData) {
  const supabase = db()
  const { data, error } = await supabase
    .from('locations')
    .insert({
      name: formData.get('name') as string,
      type: (formData.get('type') as string) || null,
      status: (formData.get('status') as string) || null,
      area: (formData.get('area') as string) || null,
      description: (formData.get('description') as string) || null,
      parent_location_id: (formData.get('parent_location_id') as string) || null,
      visible: false,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  redirect(`/locations/${data.id}`)
}

export async function updateLocation(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string

  const { error } = await supabase
    .from('locations')
    .update({
      name: formData.get('name') as string,
      type: (formData.get('type') as string) || null,
      status: (formData.get('status') as string) || null,
      area: (formData.get('area') as string) || null,
      description: (formData.get('description') as string) || null,
      parent_location_id: (formData.get('parent_location_id') as string) || null,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath(`/locations/${id}`)
  revalidatePath('/locations')
}

export async function deleteLocation(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const { error } = await supabase.from('locations').delete().eq('id', id)
  if (error) throw new Error(error.message)
  redirect('/locations')
}

export async function toggleLocationVisibility(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const visible = formData.get('visible') === 'true'
  const { error } = await supabase.from('locations').update({ visible: !visible }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/locations/${id}`)
  revalidatePath('/locations')
}

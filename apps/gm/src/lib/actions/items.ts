'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createItem(formData: FormData) {
  const supabase = db()
  const basePrice = formData.get('base_price') as string
  const { data, error } = await supabase
    .from('items')
    .insert({
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || null,
      base_price: basePrice ? parseInt(basePrice) : null,
      category: (formData.get('category') as string) || null,
      descriptor: (formData.get('descriptor') as string) || null,
      properties: JSON.parse((formData.get('properties') as string) || '{}'),
      location_id: (formData.get('location_id') as string) || null,
      campaign_id: formData.get('campaign_id') as string,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  redirect(`/items/${data.id}`)
}

export async function updateItem(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const basePrice = formData.get('base_price') as string
  const { error } = await supabase
    .from('items')
    .update({
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || null,
      base_price: basePrice ? parseInt(basePrice) : null,
      category: (formData.get('category') as string) || null,
      descriptor: (formData.get('descriptor') as string) || null,
      properties: JSON.parse((formData.get('properties') as string) || '{}'),
      location_id: (formData.get('location_id') as string) || null,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath(`/items/${id}`)
  revalidatePath('/items')
}

export async function toggleItemVisibility(id: string, visible: boolean) {
  const supabase = db()
  await supabase.from('items').update({ visible }).eq('id', id)
  revalidatePath(`/items/${id}`)
  revalidatePath('/items')
}

export async function deleteItem(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const { error } = await supabase.from('items').delete().eq('id', id)
  if (error) throw new Error(error.message)
  redirect('/items')
}

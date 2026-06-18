'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createLoreEntry(formData: FormData) {
  const supabase = db()
  const { data, error } = await supabase
    .from('lore_entries')
    .insert({
      title: formData.get('title') as string,
      category: (formData.get('category') as string) || null,
      description: (formData.get('description') as string) || null,
      visible: false,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  redirect(`/lore/${data.id}`)
}

export async function updateLoreEntry(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const { error } = await supabase
    .from('lore_entries')
    .update({
      title: formData.get('title') as string,
      category: (formData.get('category') as string) || null,
      description: (formData.get('description') as string) || null,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath(`/lore/${id}`)
  revalidatePath('/lore')
}

export async function deleteLoreEntry(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const { error } = await supabase.from('lore_entries').delete().eq('id', id)
  if (error) throw new Error(error.message)
  redirect('/lore')
}

export async function toggleLoreVisibility(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const visible = formData.get('visible') === 'true'
  const { error } = await supabase.from('lore_entries').update({ visible: !visible }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/lore/${id}`)
  revalidatePath('/lore')
}

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

export async function deleteCulture(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const { error } = await supabase.from('cultures').delete().eq('id', id)
  if (error) throw new Error(error.message)
  redirect('/cultures')
}

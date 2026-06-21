'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createSession(formData: FormData) {
  const supabase = db()
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      session_number: parseInt(formData.get('session_number') as string),
      title: (formData.get('title') as string) || null,
      summary: (formData.get('summary') as string) || null,
      loose_threads: (formData.get('loose_threads') as string) || null,
      faction_id: (formData.get('faction_id') as string) || null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  redirect(`/sessions/${data.id}`)
}

export async function updateSession(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const { error } = await supabase
    .from('sessions')
    .update({
      session_number: parseInt(formData.get('session_number') as string),
      title: (formData.get('title') as string) || null,
      summary: (formData.get('summary') as string) || null,
      loose_threads: (formData.get('loose_threads') as string) || null,
      faction_id: (formData.get('faction_id') as string) || null,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath(`/sessions/${id}`)
  revalidatePath('/sessions')
}

export async function deleteSession(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const { error } = await supabase.from('sessions').delete().eq('id', id)
  if (error) throw new Error(error.message)
  redirect('/sessions')
}

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
      campaign_id: formData.get('campaign_id') as string,
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

export async function addSessionPlotThread(formData: FormData) {
  const supabase = db()
  const session_id      = formData.get('session_id') as string
  const plot_thread_ids = formData.getAll('plot_thread_id') as string[]
  if (!plot_thread_ids.length) return
  const rows = plot_thread_ids.map(plot_thread_id => ({ session_id, plot_thread_id }))
  const { error } = await supabase
    .from('session_plot_threads')
    .upsert(rows, { onConflict: 'session_id,plot_thread_id', ignoreDuplicates: true })
  if (error) throw new Error(error.message)
  revalidatePath(`/sessions/${session_id}`)
}

export async function removeSessionPlotThread(formData: FormData) {
  const supabase = db()
  const id         = formData.get('id') as string
  const session_id = formData.get('session_id') as string
  const { error } = await supabase.from('session_plot_threads').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/sessions/${session_id}`)
}

export async function updateSessionNote(formData: FormData) {
  const supabase = db()
  const id         = formData.get('id') as string
  const session_id = formData.get('session_id') as string
  const notes_text = (formData.get('notes_text') as string) || null
  await supabase.from('session_notes').update({ notes_text }).eq('id', id)
  revalidatePath(`/sessions/${session_id}`)
}

export async function deleteSessionNote(formData: FormData) {
  const supabase = db()
  const id         = formData.get('id') as string
  const session_id = formData.get('session_id') as string
  await supabase.from('session_notes').delete().eq('id', id)
  revalidatePath(`/sessions/${session_id}`)
}

export async function deleteSession(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const { error } = await supabase.from('sessions').delete().eq('id', id)
  if (error) throw new Error(error.message)
  redirect('/sessions')
}

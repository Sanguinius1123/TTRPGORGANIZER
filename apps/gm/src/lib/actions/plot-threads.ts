'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPlotThread(formData: FormData) {
  const supabase = db()
  const { data, error } = await supabase
    .from('plot_threads')
    .insert({
      title: formData.get('title') as string,
      type: (formData.get('type') as string) || 'thread',
      description: (formData.get('description') as string) || null,
      status: (formData.get('status') as string) || 'active',
      notes: (formData.get('notes') as string) || null,
      parent_id: (formData.get('parent_id') as string) || null,
      visible: false,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  redirect(`/plot-threads/${data.id}`)
}

export async function updatePlotThread(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const { error } = await supabase
    .from('plot_threads')
    .update({
      title: formData.get('title') as string,
      type: formData.get('type') as string,
      description: (formData.get('description') as string) || null,
      status: formData.get('status') as string,
      notes: (formData.get('notes') as string) || null,
      parent_id: (formData.get('parent_id') as string) || null,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath(`/plot-threads/${id}`)
  revalidatePath('/plot-threads')
}

export async function deletePlotThread(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const { error } = await supabase.from('plot_threads').delete().eq('id', id)
  if (error) throw new Error(error.message)
  redirect('/plot-threads')
}

export async function linkPlotThreadFaction(formData: FormData) {
  const supabase = db()
  const plot_thread_id = formData.get('plot_thread_id') as string
  const faction_id     = formData.get('faction_id') as string
  const { error } = await supabase.from('plot_thread_factions').insert({ plot_thread_id, faction_id })
  if (error && !error.message.includes('unique')) throw new Error(error.message)
  revalidatePath(`/plot-threads/${plot_thread_id}`)
}

export async function unlinkPlotThreadFaction(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const plot_thread_id = formData.get('plot_thread_id') as string
  const { error } = await supabase.from('plot_thread_factions').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/plot-threads/${plot_thread_id}`)
}

export async function linkPlotThreadCharacter(formData: FormData) {
  const supabase = db()
  const plot_thread_id = formData.get('plot_thread_id') as string
  const pc_id  = (formData.get('pc_id') as string) || null
  const npc_id = (formData.get('npc_id') as string) || null
  const { error } = await supabase.from('plot_thread_characters').insert({ plot_thread_id, pc_id, npc_id })
  if (error && !error.message.includes('unique') && !error.message.includes('plot_thread_characters')) throw new Error(error.message)
  revalidatePath(`/plot-threads/${plot_thread_id}`)
}

export async function unlinkPlotThreadCharacter(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const plot_thread_id = formData.get('plot_thread_id') as string
  const { error } = await supabase.from('plot_thread_characters').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/plot-threads/${plot_thread_id}`)
}

export async function togglePlotThreadVisibility(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const visible = formData.get('visible') === 'true'
  const { error } = await supabase.from('plot_threads').update({ visible: !visible }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/plot-threads/${id}`)
  revalidatePath('/plot-threads')
}

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

export async function togglePlotThreadVisibility(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const visible = formData.get('visible') === 'true'
  const { error } = await supabase.from('plot_threads').update({ visible: !visible }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/plot-threads/${id}`)
  revalidatePath('/plot-threads')
}

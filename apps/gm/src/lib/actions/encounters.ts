'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createEncounter(formData: FormData) {
  const supabase = db()
  const { data, error } = await supabase
    .from('encounters')
    .insert({
      title: formData.get('title') as string,
      location_id: (formData.get('location_id') as string) || null,
      status: (formData.get('status') as string) || 'prep',
      notes: (formData.get('notes') as string) || null,
      summary: null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  redirect(`/encounters/${data.id}`)
}

export async function updateEncounter(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const { error } = await supabase
    .from('encounters')
    .update({
      title: formData.get('title') as string,
      location_id: (formData.get('location_id') as string) || null,
      status: formData.get('status') as string,
      notes: (formData.get('notes') as string) || null,
      summary: (formData.get('summary') as string) || null,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath(`/encounters/${id}`)
  revalidatePath('/encounters')
}

export async function duplicateEncounter(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string

  const { data: orig } = await supabase.from('encounters').select('*').eq('id', id).single()
  if (!orig) throw new Error('Encounter not found')
  const o = orig as { title: string; location_id: string | null; status: string; notes: string | null }

  const { data: newEnc, error: encErr } = await supabase
    .from('encounters')
    .insert({
      title: `${o.title} (copy)`,
      location_id: o.location_id,
      status: 'prep',
      notes: o.notes,
      summary: null,
    })
    .select()
    .single()
  if (encErr || !newEnc) throw new Error(encErr?.message ?? 'Failed to duplicate')
  const newId = (newEnc as { id: string }).id

  const { data: parts } = await supabase
    .from('encounter_participants')
    .select('*')
    .eq('encounter_id', id)

  if (parts && parts.length > 0) {
    const rows = (parts as Array<{ label: string; count: number; role: string | null; dr: number | null; notes: string | null; npc_id: string | null }>)
      .map(p => ({
        encounter_id: newId,
        label: p.label,
        count: p.count,
        role: p.role,
        dr: p.dr,
        notes: p.notes,
        npc_id: p.npc_id,
      }))
    await supabase.from('encounter_participants').insert(rows)
  }

  revalidatePath('/encounters')
  redirect(`/encounters/${newId}`)
}

// Called from session sidebar — form fields: id=encounter_id, session_id
export async function addEncounterToSession(formData: FormData) {
  const supabase = db()
  const encounter_id = formData.get('id') as string
  const session_id   = formData.get('session_id') as string
  const { error } = await supabase.from('session_encounters').insert({ session_id, encounter_id })
  if (error && !error.message.includes('unique')) throw new Error(error.message)
  revalidatePath(`/sessions/${session_id}`)
  revalidatePath(`/encounters/${encounter_id}`)
}

// Called from session sidebar — form fields: id=encounter_id, session_id
export async function removeEncounterFromSession(formData: FormData) {
  const supabase = db()
  const encounter_id = formData.get('id') as string
  const session_id   = formData.get('session_id') as string
  const { error } = await supabase
    .from('session_encounters')
    .delete()
    .eq('session_id', session_id)
    .eq('encounter_id', encounter_id)
  if (error) throw new Error(error.message)
  revalidatePath(`/sessions/${session_id}`)
  revalidatePath(`/encounters/${encounter_id}`)
}

// Called from encounter detail sidebar — form fields: encounter_id, session_id
export async function linkEncounterSession(formData: FormData) {
  const supabase = db()
  const encounter_id = formData.get('encounter_id') as string
  const session_id   = formData.get('session_id') as string
  const { error } = await supabase.from('session_encounters').insert({ session_id, encounter_id })
  if (error && !error.message.includes('unique')) throw new Error(error.message)
  revalidatePath(`/encounters/${encounter_id}`)
  revalidatePath(`/sessions/${session_id}`)
}

// Called from encounter detail sidebar — form fields: encounter_id, session_id
export async function unlinkEncounterSession(formData: FormData) {
  const supabase = db()
  const encounter_id = formData.get('encounter_id') as string
  const session_id   = formData.get('session_id') as string
  const { error } = await supabase
    .from('session_encounters')
    .delete()
    .eq('session_id', session_id)
    .eq('encounter_id', encounter_id)
  if (error) throw new Error(error.message)
  revalidatePath(`/encounters/${encounter_id}`)
  revalidatePath(`/sessions/${session_id}`)
}

export async function deleteEncounter(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const { error } = await supabase.from('encounters').delete().eq('id', id)
  if (error) throw new Error(error.message)
  redirect('/encounters')
}

export async function addParticipant(formData: FormData) {
  const supabase = db()
  const encounter_id = formData.get('encounter_id') as string
  const count = formData.get('count') as string
  const dr    = formData.get('dr') as string
  const { error } = await supabase.from('encounter_participants').insert({
    encounter_id,
    npc_id: (formData.get('npc_id') as string) || null,
    label: formData.get('label') as string,
    count: count ? parseInt(count) : 1,
    role: (formData.get('role') as string) || null,
    dr: dr ? parseFloat(dr) : null,
    notes: (formData.get('notes') as string) || null,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/encounters/${encounter_id}`)
}

export async function deleteParticipant(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const encounter_id = formData.get('encounter_id') as string
  const { error } = await supabase.from('encounter_participants').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/encounters/${encounter_id}`)
}

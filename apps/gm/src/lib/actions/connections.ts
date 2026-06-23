'use server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function createLocationConnection(
  from_location_id: string,
  to_location_id: string,
  bidirectional: boolean = true,
  travel_time: string | null = null,
  travel_time_manual: boolean = false
) {
  const supabase = db()
  const { error } = await supabase.from('location_connections').insert({
    from_location_id,
    to_location_id,
    bidirectional,
    travel_time,
    travel_time_manual,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/map')
}

export async function updateConnectionTravelTime(
  id: string,
  value: string | null,
  manual: boolean
) {
  const supabase = db()
  const { error } = await supabase
    .from('location_connections')
    .update({ travel_time: value, travel_time_manual: manual })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/map')
}

export async function updateConnectionBidirectional(id: string, bidirectional: boolean) {
  const supabase = db()
  const { error } = await supabase
    .from('location_connections')
    .update({ bidirectional })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/map')
}

export async function deleteLocationConnection(id: string) {
  const supabase = db()
  const { error } = await supabase.from('location_connections').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/map')
}

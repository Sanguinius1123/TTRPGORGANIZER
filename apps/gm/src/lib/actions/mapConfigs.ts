'use server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function upsertMapConfig(
  locationId: string | null,
  mapScale: string,
  travelUnit: string,
  distanceScale: number
) {
  const supabase = db()
  // Find existing config for this map level
  const query = supabase.from('map_configs').select('id')
  const { data: existing } = await (locationId
    ? query.eq('location_id', locationId)
    : query.is('location_id', null)
  ).maybeSingle()

  if (existing) {
    await supabase.from('map_configs').update({
      map_scale: mapScale || null,
      travel_unit: travelUnit || null,
      distance_scale: distanceScale,
    }).eq('id', (existing as { id: string }).id)
  } else {
    await supabase.from('map_configs').insert({
      location_id: locationId,
      map_scale: mapScale || null,
      travel_unit: travelUnit || null,
      distance_scale: distanceScale,
    })
  }

  revalidatePath('/map')
  if (locationId) revalidatePath(`/map/${locationId}`)
}

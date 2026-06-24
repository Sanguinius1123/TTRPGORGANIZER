'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Location } from '@ttrpg/db'

export async function createLocation(formData: FormData) {
  const supabase = db()
  const { data, error } = await supabase
    .from('locations')
    .insert({
      name: formData.get('name') as string,
      type: (formData.get('type') as string) || null,
      descriptor: (formData.get('descriptor') as string) || null,
      status: (formData.get('status') as string) || null,
      area: (formData.get('area') as string) || null,
      description: (formData.get('description') as string) || null,
      parent_location_id: (formData.get('parent_location_id') as string) || null,
      visible: false,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  redirect(`/locations/${data.id}`)
}

export async function updateLocation(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string

  const { error } = await supabase
    .from('locations')
    .update({
      name: formData.get('name') as string,
      type: (formData.get('type') as string) || null,
      descriptor: (formData.get('descriptor') as string) || null,
      status: (formData.get('status') as string) || null,
      area: (formData.get('area') as string) || null,
      description: (formData.get('description') as string) || null,
      parent_location_id: (formData.get('parent_location_id') as string) || null,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath(`/locations/${id}`)
  revalidatePath('/locations')
}

export async function deleteLocation(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const { error } = await supabase.from('locations').delete().eq('id', id)
  if (error) throw new Error(error.message)
  redirect('/locations')
}

export async function toggleLocationVisibility(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const visible = formData.get('visible') === 'true'
  const { error } = await supabase.from('locations').update({ visible: !visible }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/locations/${id}`)
  revalidatePath('/locations')
}

export async function updateLocationPosition(id: string, x: number, y: number) {
  const supabase = db()
  const { error } = await supabase.from('locations').update({ map_x: x, map_y: y }).eq('id', id)
  if (error) throw new Error(error.message)
  // no revalidatePath — position saves are fire-and-forget during drag
}

export async function placeLocationOnMap(id: string, x: number, y: number) {
  const supabase = db()
  const { error } = await supabase.from('locations').update({ map_x: x, map_y: y }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/map')
}

export async function removeLocationFromMap(id: string) {
  const supabase = db()
  const { error } = await supabase.from('locations').update({ map_x: null, map_y: null }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/map')
}

export async function updateLocationWaypoint(
  id: string,
  terrain: string | null,
  path_modifiers: string[]
) {
  const supabase = db()
  const { error } = await supabase
    .from('locations')
    .update({ terrain, path_modifiers })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/map')
}

export async function createWaypoint(
  map_x: number,
  map_y: number,
  terrain: string | null,
  parent_location_id: string | null
) {
  const supabase = db()
  const { data, error } = await supabase
    .from('locations')
    .insert({ name: null, waypoint: true, map_x, map_y, terrain, path_modifiers: [], parent_location_id, visible: false })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/map')
  return data as { id: string }
}

export async function setLocationVisibility(id: string, visible: boolean) {
  const supabase = db()
  const { error } = await supabase.from('locations').update({ visible }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/locations/${id}`)
  revalidatePath('/locations')
}

export async function toggleLocationSubmap(id: string, hasSubmap: boolean) {
  const supabase = db()
  const { error } = await supabase
    .from('locations')
    .update({ has_submap: hasSubmap })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/map')
  revalidatePath(`/map/${id}`)
}

export async function toggleLocationMystery(id: string, mystery: boolean) {
  const supabase = db()
  const { error } = await supabase.from('locations').update({ mystery }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/locations/${id}`)
  revalidatePath('/map')
}

export async function createMapLocation(
  name: string,
  locType: string,
  map_x: number,
  map_y: number,
  parent_location_id: string | null
) {
  const supabase = db()
  const { data, error } = await supabase
    .from('locations')
    .insert({
      name,
      type: locType,
      waypoint: false,
      visible: false,
      map_x,
      map_y,
      parent_location_id: parent_location_id ?? null,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/map')
  if (parent_location_id) revalidatePath(`/map/${parent_location_id}`)
  return data as Location
}

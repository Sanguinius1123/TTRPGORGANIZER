'use server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function upsertMapTypeRule(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string | null
  const parent_type = (formData.get('parent_type') as string) || null
  const child_types = ((formData.get('child_types') as string) || '')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean)
  const color = formData.get('color') as string
  const travel_unit = formData.get('travel_unit') as string
  const distance_scale = parseFloat(formData.get('distance_scale') as string) || 100

  if (id && id.trim()) {
    const { error } = await supabase
      .from('map_type_rules')
      .update({ parent_type, child_types, color, travel_unit, distance_scale })
      .eq('id', id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('map_type_rules')
      .insert({ parent_type, child_types, color, travel_unit, distance_scale })
    if (error) throw new Error(error.message)
  }
  revalidatePath('/settings/map-rules')
}

export async function deleteMapTypeRule(id: string) {
  const supabase = db()
  const { error } = await supabase.from('map_type_rules').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/settings/map-rules')
}

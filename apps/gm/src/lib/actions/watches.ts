'use server'
import { createAnonClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleWatch(pcId: string, entityType: string, entityId: string, currentlyWatching: boolean) {
  const supabase = await createAnonClient()
  if (currentlyWatching) {
    await supabase.from('pc_watches').delete()
      .eq('pc_id', pcId).eq('entity_type', entityType).eq('entity_id', entityId)
  } else {
    await supabase.from('pc_watches').insert({ pc_id: pcId, entity_type: entityType, entity_id: entityId })
  }
  revalidatePath('/play', 'layout')
  revalidatePath('/play/watchlist')
  revalidatePath('/watch-overview')
}

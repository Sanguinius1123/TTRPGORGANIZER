import { createClient } from '@/lib/supabase/server'

/**
 * Returns the campaign_id of the player's first assigned player character.
 * Used by portal list pages (locations, npcs, factions, etc.) to scope
 * queries to the correct campaign. Returns null if no PCs are assigned.
 */
export async function getPlayerCampaignId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('player_characters')
    .select('campaign_id')
    .eq('profile_id', user.id)
    .order('name')
    .limit(1)
    .single()

  return (data as { campaign_id: string } | null)?.campaign_id ?? null
}

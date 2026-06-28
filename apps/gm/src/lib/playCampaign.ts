import { createAnonClient } from '@/lib/supabase/server'
import { getActivePcId } from '@/lib/activePC'

/**
 * Returns the campaign_id of the player's active PC (from cookie), falling
 * back to their first PC alphabetically. Used by /play/* pages to scope
 * queries to the correct campaign. Returns null if the user has no PCs.
 */
export async function getPlayCampaignId(): Promise<string | null> {
  const supabase = await createAnonClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const activePcId = await getActivePcId()

  if (activePcId) {
    const { data } = await supabase
      .from('player_characters')
      .select('campaign_id')
      .eq('id', activePcId)
      .eq('profile_id', user.id)
      .single()
    const cid = (data as { campaign_id: string } | null)?.campaign_id
    if (cid) return cid
  }

  const { data } = await supabase
    .from('player_characters')
    .select('campaign_id')
    .eq('profile_id', user.id)
    .order('name')
    .limit(1)
    .single()

  return (data as { campaign_id: string } | null)?.campaign_id ?? null
}

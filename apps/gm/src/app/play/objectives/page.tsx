import { db } from '@/lib/db'
import { createAnonClient } from '@/lib/supabase/server'
import { BoardPosting, Location, NPC, Faction, PlayerCharacter } from '@ttrpg/db'
import { getPlayCampaignId } from '@/lib/playCampaign'
import { getActivePcId } from '@/lib/activePC'
import { redirect } from 'next/navigation'
import { ObjectivesBoard } from '@/components/ObjectivesBoard'
import { CreatePlayerPostingForm } from '@/components/CreatePlayerPostingForm'

export default async function PlayObjectivesPage() {
  const campaignId = await getPlayCampaignId()
  if (!campaignId) redirect('/play')

  const activePcId = await getActivePcId()

  // Use service role for reads (RLS handles visibility separately)
  const supabase = db()
  const anonSupabase = await createAnonClient()
  const { data: { user } } = await anonSupabase.auth.getUser()
  if (!user) redirect('/login')

  const results = await Promise.all([
    supabase.from('board_postings').select('*').eq('campaign_id', campaignId).order('sort_order'),
    supabase.from('locations').select('id, name').eq('campaign_id', campaignId).eq('waypoint', false).order('name'),
    supabase.from('npcs').select('id, name').eq('campaign_id', campaignId).order('name'),
    supabase.from('factions').select('id, name').eq('campaign_id', campaignId).order('name'),
    supabase.from('player_characters').select('id, name').eq('campaign_id', campaignId).order('name'),
  ])

  const allPostings = (results[0].data ?? []) as BoardPosting[]
  const locations   = (results[1].data ?? []) as Array<Pick<Location, 'id' | 'name'>>
  const npcs        = (results[2].data ?? []) as Array<Pick<NPC, 'id' | 'name'>>
  const factions    = (results[3].data ?? []) as Array<Pick<Faction, 'id' | 'name'>>
  const pcs         = (results[4].data ?? []) as Array<Pick<PlayerCharacter, 'id' | 'name'>>

  // Player-side filter: exclude GM-hidden postings they didn't create,
  // and exclude other players' hidden goals
  const visiblePostings = allPostings.filter(p => {
    if (!p.visible && p.created_by_pc_id !== activePcId) return false
    if (p.hidden_goal && p.created_by_pc_id !== activePcId) return false
    return true
  })

  const locationNames = Object.fromEntries(locations.map(l => [l.id, l.name ?? '']))
  const npcNames      = Object.fromEntries(npcs.map(n => [n.id, n.name]))
  const factionNames  = Object.fromEntries(factions.map(f => [f.id, f.name]))
  const pcNames       = Object.fromEntries(pcs.map(p => [p.id, p.name]))

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-slate-100">Objectives</h1>
        {activePcId && (
          <CreatePlayerPostingForm campaignId={campaignId} pcId={activePcId} />
        )}
      </div>

      <ObjectivesBoard
        mode="player"
        campaignId={campaignId}
        activePcId={activePcId}
        allPostings={visiblePostings}
        locationNames={locationNames}
        npcNames={npcNames}
        factionNames={factionNames}
        pcNames={pcNames}
      />
    </div>
  )
}

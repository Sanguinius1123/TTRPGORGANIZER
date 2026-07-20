import { db } from '@/lib/db'
import { BoardPosting, Location, NPC, Faction, PlayerCharacter } from '@ttrpg/db'
import { getActiveCampaignId } from '@/lib/activeCampaign'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ObjectivesBoard } from '@/components/ObjectivesBoard'

export default async function ObjectivesPage() {
  const campaignId = await getActiveCampaignId()
  if (!campaignId) redirect('/')

  const supabase = db()
  const results = await Promise.all([
    supabase.from('board_postings').select('*').eq('campaign_id', campaignId).order('sort_order'),
    supabase.from('locations').select('id, name').eq('campaign_id', campaignId).order('name'),
    supabase.from('npcs').select('id, name').eq('campaign_id', campaignId).order('name'),
    supabase.from('factions').select('id, name').eq('campaign_id', campaignId).order('name'),
    supabase.from('player_characters').select('id, name').eq('campaign_id', campaignId).order('name'),
  ])

  const postings       = (results[0].data ?? []) as BoardPosting[]
  const locations      = (results[1].data ?? []) as Array<Pick<Location, 'id' | 'name'>>
  const npcs           = (results[2].data ?? []) as Array<Pick<NPC, 'id' | 'name'>>
  const factions       = (results[3].data ?? []) as Array<Pick<Faction, 'id' | 'name'>>
  const pcs            = (results[4].data ?? []) as Array<Pick<PlayerCharacter, 'id' | 'name'>>

  const locationNames  = Object.fromEntries(locations.map(l => [l.id, l.name ?? '']))
  const npcNames       = Object.fromEntries(npcs.map(n => [n.id, n.name]))
  const factionNames   = Object.fromEntries(factions.map(f => [f.id, f.name]))
  const pcNames        = Object.fromEntries(pcs.map(p => [p.id, p.name]))

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Story Board</h1>
          <p className="text-sm text-slate-500 mt-0.5">{postings.length} postings</p>
        </div>
        <Link href="/objectives/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          New Posting
        </Link>
      </div>

      <ObjectivesBoard
        mode="gm"
        campaignId={campaignId}
        allPostings={postings}
        locationNames={locationNames}
        npcNames={npcNames}
        factionNames={factionNames}
        pcNames={pcNames}
      />
    </div>
  )
}

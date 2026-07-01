import { db } from '@/lib/db'
import { getActiveCampaignId } from '@/lib/activeCampaign'

type PC = { id: string; name: string }
type WatchRow = { pc_id: string; entity_type: string; entity_id: string }

export default async function WatchOverviewPage() {
  const supabase = db()
  const campaignId = await getActiveCampaignId()

  if (!campaignId) {
    return (
      <div className="p-8 max-w-5xl">
        <h1 className="text-2xl font-bold text-slate-100 mb-4">Watch Overview</h1>
        <p className="text-sm text-slate-400">No active campaign selected.</p>
      </div>
    )
  }

  // Get all PCs for this campaign
  const { data: rawPCs } = await supabase
    .from('player_characters')
    .select('id, name')
    .eq('campaign_id', campaignId)
    .eq('visible', true)
    .order('name')
  const pcs = (rawPCs ?? []) as PC[]

  if (pcs.length === 0) {
    return (
      <div className="p-8 max-w-5xl">
        <h1 className="text-2xl font-bold text-slate-100 mb-4">Watch Overview</h1>
        <p className="text-sm text-slate-400">No visible player characters in this campaign.</p>
      </div>
    )
  }

  const pcIds = pcs.map(p => p.id)

  // Get all watches for those PCs
  const { data: rawWatches } = await supabase
    .from('pc_watches')
    .select('pc_id, entity_type, entity_id')
    .in('pc_id', pcIds)
  const watches = (rawWatches ?? []) as WatchRow[]

  // Collect entity ids by type
  const byType: Record<string, Set<string>> = { npc: new Set(), faction: new Set(), location: new Set(), lore: new Set() }
  for (const w of watches) {
    if (byType[w.entity_type]) byType[w.entity_type].add(w.entity_id)
  }

  // Resolve entity names
  const [npcResults, factionResults, locationResults, loreResults] = await Promise.all([
    byType.npc.size > 0
      ? supabase.from('npcs').select('id, name').in('id', [...byType.npc])
      : Promise.resolve({ data: [] }),
    byType.faction.size > 0
      ? supabase.from('factions').select('id, name').in('id', [...byType.faction])
      : Promise.resolve({ data: [] }),
    byType.location.size > 0
      ? supabase.from('locations').select('id, name').in('id', [...byType.location])
      : Promise.resolve({ data: [] }),
    byType.lore.size > 0
      ? supabase.from('lore_entries').select('id, title').in('id', [...byType.lore])
      : Promise.resolve({ data: [] }),
  ])

  const npcMap = Object.fromEntries(((npcResults.data ?? []) as Array<{ id: string; name: string }>).map(x => [x.id, x.name]))
  const factionMap = Object.fromEntries(((factionResults.data ?? []) as Array<{ id: string; name: string }>).map(x => [x.id, x.name]))
  const locationMap = Object.fromEntries(((locationResults.data ?? []) as Array<{ id: string; name: string | null }>).map(x => [x.id, x.name ?? '(unnamed)']))
  const loreMap = Object.fromEntries(((loreResults.data ?? []) as Array<{ id: string; title: string }>).map(x => [x.id, x.title]))

  // Build a lookup: entityType:entityId -> Set<pcId>
  const watchSet: Record<string, Set<string>> = {}
  for (const w of watches) {
    const key = `${w.entity_type}:${w.entity_id}`
    if (!watchSet[key]) watchSet[key] = new Set()
    watchSet[key].add(w.pc_id)
  }

  function EyeIcon({ active }: { active: boolean }) {
    if (!active) return <span className="text-slate-700">—</span>
    return (
      <svg className="w-4 h-4 text-indigo-400 mx-auto" fill="currentColor" viewBox="0 0 24 24">
        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    )
  }

  function Section({ title, entityType, entityMap, href }: {
    title: string
    entityType: string
    entityMap: Record<string, string>
    href: (id: string) => string
  }) {
    const entityIds = Object.keys(entityMap)
    if (entityIds.length === 0) return null

    return (
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="px-6 py-3 border-b border-slate-700/50">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{title}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left px-6 py-2.5 font-medium text-slate-500 min-w-48">Entity</th>
                {pcs.map(pc => (
                  <th key={pc.id} className="text-center px-3 py-2.5 font-medium text-slate-500 min-w-24 max-w-32">
                    <span className="truncate block text-xs">{pc.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entityIds.map(entityId => {
                const key = `${entityType}:${entityId}`
                const watchers = watchSet[key] ?? new Set()
                return (
                  <tr key={entityId} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-700/30">
                    <td className="px-6 py-3">
                      <a href={href(entityId)} className="text-indigo-400 hover:underline text-sm">
                        {entityMap[entityId]}
                      </a>
                    </td>
                    {pcs.map(pc => (
                      <td key={pc.id} className="px-3 py-3 text-center">
                        <EyeIcon active={watchers.has(pc.id)} />
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const isEmpty = watches.length === 0

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-slate-100 mb-2">Watch Overview</h1>
      <p className="text-sm text-slate-400 mb-8">What each player is tracking across the campaign.</p>

      {isEmpty ? (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 text-center">
          <p className="text-slate-400 text-sm">No player is watching any entities yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <Section title="Locations" entityType="location" entityMap={locationMap} href={id => `/locations/${id}`} />
          <Section title="NPCs" entityType="npc" entityMap={npcMap} href={id => `/npcs/${id}`} />
          <Section title="Factions" entityType="faction" entityMap={factionMap} href={id => `/factions/${id}`} />
          <Section title="Lore" entityType="lore" entityMap={loreMap} href={id => `/lore/${id}`} />
        </div>
      )}
    </div>
  )
}

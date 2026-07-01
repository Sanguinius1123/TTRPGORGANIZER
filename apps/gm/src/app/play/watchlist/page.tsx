import { createAnonClient } from '@/lib/supabase/server'
import { getActivePcId } from '@/lib/activePC'
import Link from 'next/link'

type WatchRow = { id: string; entity_type: string; entity_id: string }

export default async function WatchlistPage() {
  const supabase = await createAnonClient()
  const activePcId = await getActivePcId()

  if (!activePcId) {
    return (
      <div className="p-8 max-w-4xl">
        <h1 className="text-2xl font-bold text-slate-100 mb-4">My Watchlist</h1>
        <p className="text-sm text-slate-400">No active character selected.</p>
      </div>
    )
  }

  const { data: rawWatches } = await supabase
    .from('pc_watches')
    .select('id, entity_type, entity_id')
    .eq('pc_id', activePcId)
    .order('created_at')
  const watches = (rawWatches ?? []) as WatchRow[]

  const byType: Record<string, string[]> = { npc: [], faction: [], location: [], lore: [] }
  for (const w of watches) {
    if (byType[w.entity_type]) byType[w.entity_type].push(w.entity_id)
  }

  // Resolve entity names in parallel, each as a separate query (no join aliases)
  const [npcResults, factionResults, locationResults, loreResults] = await Promise.all([
    byType.npc.length > 0
      ? supabase.from('npcs').select('id, name, visible').in('id', byType.npc)
      : Promise.resolve({ data: [] }),
    byType.faction.length > 0
      ? supabase.from('factions').select('id, name, visible').in('id', byType.faction)
      : Promise.resolve({ data: [] }),
    byType.location.length > 0
      ? supabase.from('locations').select('id, name, visible').in('id', byType.location)
      : Promise.resolve({ data: [] }),
    byType.lore.length > 0
      ? supabase.from('lore_entries').select('id, title, visible').in('id', byType.lore)
      : Promise.resolve({ data: [] }),
  ])

  const npcs = ((npcResults.data ?? []) as Array<{ id: string; name: string; visible: boolean }>)
    .filter(x => x.visible)
  const factions = ((factionResults.data ?? []) as Array<{ id: string; name: string; visible: boolean }>)
    .filter(x => x.visible)
  const locations = ((locationResults.data ?? []) as Array<{ id: string; name: string | null; visible: boolean }>)
    .filter(x => x.visible)
  const loreEntries = ((loreResults.data ?? []) as Array<{ id: string; title: string; visible: boolean }>)
    .filter(x => x.visible)

  const isEmpty = npcs.length === 0 && factions.length === 0 && locations.length === 0 && loreEntries.length === 0

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-100 mb-8">My Watchlist</h1>

      {isEmpty ? (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 text-center">
          <p className="text-slate-400 text-sm">Nothing on your watchlist yet.</p>
          <p className="text-slate-500 text-xs mt-2">Visit NPC, faction, location, or lore pages and click the eye icon to track them here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {locations.length > 0 && (
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <div className="px-6 py-3 border-b border-slate-700/50">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Locations</h2>
              </div>
              <ul className="divide-y divide-slate-700/50">
                {locations.map(loc => (
                  <li key={loc.id}>
                    <Link
                      href={`/play/locations/${loc.id}`}
                      className="flex items-center justify-between px-6 py-3 hover:bg-slate-700/50 transition-colors"
                    >
                      <span className="text-sm text-indigo-400 hover:underline">{loc.name ?? '(unnamed)'}</span>
                      <span className="text-slate-600 text-xs">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {npcs.length > 0 && (
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <div className="px-6 py-3 border-b border-slate-700/50">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">NPCs</h2>
              </div>
              <ul className="divide-y divide-slate-700/50">
                {npcs.map(npc => (
                  <li key={npc.id}>
                    <Link
                      href={`/play/npcs/${npc.id}`}
                      className="flex items-center justify-between px-6 py-3 hover:bg-slate-700/50 transition-colors"
                    >
                      <span className="text-sm text-indigo-400 hover:underline">{npc.name}</span>
                      <span className="text-slate-600 text-xs">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {factions.length > 0 && (
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <div className="px-6 py-3 border-b border-slate-700/50">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Factions</h2>
              </div>
              <ul className="divide-y divide-slate-700/50">
                {factions.map(faction => (
                  <li key={faction.id}>
                    <Link
                      href={`/play/factions/${faction.id}`}
                      className="flex items-center justify-between px-6 py-3 hover:bg-slate-700/50 transition-colors"
                    >
                      <span className="text-sm text-indigo-400 hover:underline">{faction.name}</span>
                      <span className="text-slate-600 text-xs">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {loreEntries.length > 0 && (
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <div className="px-6 py-3 border-b border-slate-700/50">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Lore</h2>
              </div>
              <ul className="divide-y divide-slate-700/50">
                {loreEntries.map(entry => (
                  <li key={entry.id}>
                    <Link
                      href={`/play/lore/${entry.id}`}
                      className="flex items-center justify-between px-6 py-3 hover:bg-slate-700/50 transition-colors"
                    >
                      <span className="text-sm text-indigo-400 hover:underline">{entry.title}</span>
                      <span className="text-slate-600 text-xs">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

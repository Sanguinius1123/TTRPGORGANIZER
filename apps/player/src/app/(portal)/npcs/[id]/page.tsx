import { createClient } from '@/lib/supabase/server'
import { NPC, NPCFact } from '@ttrpg/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function NPCDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const results = await Promise.all([
    supabase.from('npcs').select('*').eq('id', id).eq('visible', true).single(),
    supabase.from('npc_facts').select('*').eq('npc_id', id).eq('revealed', true).order('created_at'),
    supabase.from('species').select('id, name').order('name'),
    supabase.from('cultures').select('id, name').order('name'),
    supabase.from('npc_factions').select('faction_id, role').eq('npc_id', id),
  ])

  const raw = results[0].data
  if (!raw) notFound()
  const npc = raw as NPC
  const facts = (results[1].data ?? []) as NPCFact[]
  const speciesList = (results[2].data ?? []) as Array<{ id: string; name: string }>
  const culturesList = (results[3].data ?? []) as Array<{ id: string; name: string }>
  const npcFactionRows = (results[4].data ?? []) as Array<{ faction_id: string; role: string | null }>

  const speciesIdByName = Object.fromEntries(speciesList.map(s => [s.name, s.id]))
  const cultureIdByName = Object.fromEntries(culturesList.map(c => [c.name, c.id]))

  // Load visible factions this NPC belongs to
  const factionIds = npcFactionRows.map(r => r.faction_id)
  const factionRows: Array<{ id: string; name: string; visible: boolean }> = []
  if (factionIds.length > 0) {
    const { data } = await supabase.from('factions').select('id, name, visible').in('id', factionIds).eq('visible', true)
    factionRows.push(...((data ?? []) as typeof factionRows))
  }
  const factionById = Object.fromEntries(factionRows.map(f => [f.id, f]))

  const hasProperties = npc.species || npc.profession || npc.culture || npc.disposition

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/npcs" className="text-zinc-500 hover:text-zinc-700">NPCs</Link>
        <span className="text-zinc-300">/</span>
        <span className="text-zinc-900 font-medium">{npc.name}</span>
      </div>

      <h1 className="text-2xl font-bold text-zinc-900 mb-6">{npc.name}</h1>

      <div className="space-y-6">
        {hasProperties && (
          <div className="bg-white rounded-lg border border-zinc-200 p-6">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              {npc.species && (
                <div>
                  <dt className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Species / Ancestry</dt>
                  <dd className="text-sm text-zinc-800">
                    {speciesIdByName[npc.species]
                      ? <Link href={`/species/${speciesIdByName[npc.species]}`} className="text-indigo-600 hover:underline">{npc.species}</Link>
                      : npc.species}
                  </dd>
                </div>
              )}
              {npc.profession && (
                <div>
                  <dt className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Profession</dt>
                  <dd className="text-sm text-zinc-800">{npc.profession}</dd>
                </div>
              )}
              {npc.culture && (
                <div>
                  <dt className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Culture</dt>
                  <dd className="text-sm text-zinc-800">
                    {cultureIdByName[npc.culture]
                      ? <Link href={`/cultures/${cultureIdByName[npc.culture]}`} className="text-indigo-600 hover:underline">{npc.culture}</Link>
                      : npc.culture}
                  </dd>
                </div>
              )}
              {npc.disposition && (
                <div>
                  <dt className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Disposition</dt>
                  <dd className="text-sm text-zinc-800">{npc.disposition}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {npc.background && (
          <div className="bg-white rounded-lg border border-zinc-200 p-6">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Background</h2>
            <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">{npc.background}</p>
          </div>
        )}

        {facts.length > 0 && (
          <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
            <div className="px-6 py-3 border-b border-zinc-100 bg-zinc-50">
              <h2 className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">Known Facts</h2>
            </div>
            <ul className="divide-y divide-zinc-100">
              {facts.map(fact => (
                <li key={fact.id} className="px-6 py-3 text-sm text-zinc-700 pl-9 relative before:absolute before:left-6 before:top-3.5 before:w-1.5 before:h-1.5 before:rounded-full before:bg-zinc-300">
                  {fact.fact_text}
                </li>
              ))}
            </ul>
          </div>
        )}

        {npcFactionRows.length > 0 && factionRows.length > 0 && (
          <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
            <div className="px-6 py-3 border-b border-zinc-100 bg-zinc-50">
              <h2 className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">Faction Memberships</h2>
            </div>
            <ul className="divide-y divide-zinc-100">
              {npcFactionRows.map(row => {
                const faction = factionById[row.faction_id]
                if (!faction) return null
                return (
                  <li key={row.faction_id} className="px-6 py-3 flex items-center justify-between">
                    <Link href={`/factions/${faction.id}`} className="text-sm font-medium text-indigo-600 hover:underline">
                      {faction.name}
                    </Link>
                    {row.role && <span className="text-xs text-zinc-400">{row.role}</span>}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

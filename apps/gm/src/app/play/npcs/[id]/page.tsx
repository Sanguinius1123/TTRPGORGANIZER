import { createAnonClient } from '@/lib/supabase/server'
import { NPC, NPCFact } from '@ttrpg/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { renderMentions } from '@/lib/mentions'
import { buildVisibleMentionSet } from '@/lib/mentionVisibility'

export default async function NPCDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createAnonClient()

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

  // Build visibility set for mentions in this NPC's text fields
  const visibleIds = await buildVisibleMentionSet(supabase, [
    npc.background, npc.notes, ...facts.map(f => f.fact_text),
  ])

  const hasProperties = npc.species || npc.profession || npc.culture || npc.disposition

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/play/npcs" className="text-slate-500 hover:text-slate-300">NPCs</Link>
        <span className="text-slate-600">/</span>
        <span className="text-slate-100 font-medium">{npc.name}</span>
      </div>

      <h1 className="text-2xl font-bold text-slate-100 mb-6">{npc.name}</h1>

      <div className="space-y-6">
        {hasProperties && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              {npc.species && (
                <div>
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Species / Ancestry</dt>
                  <dd className="text-sm text-slate-100">
                    {speciesIdByName[npc.species]
                      ? <Link href={`/play/species/${speciesIdByName[npc.species]}`} className="text-indigo-400 hover:underline">{npc.species}</Link>
                      : npc.species}
                  </dd>
                </div>
              )}
              {npc.profession && (
                <div>
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Profession</dt>
                  <dd className="text-sm text-slate-100">{npc.profession}</dd>
                </div>
              )}
              {npc.culture && (
                <div>
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Culture</dt>
                  <dd className="text-sm text-slate-100">
                    {cultureIdByName[npc.culture]
                      ? <Link href={`/play/cultures/${cultureIdByName[npc.culture]}`} className="text-indigo-400 hover:underline">{npc.culture}</Link>
                      : npc.culture}
                  </dd>
                </div>
              )}
              {npc.disposition && (
                <div>
                  <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Disposition</dt>
                  <dd className="text-sm text-slate-100">{npc.disposition}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {npc.background && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Background</h2>
            <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{renderMentions(npc.background, visibleIds)}</p>
          </div>
        )}

        {facts.length > 0 && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <div className="px-6 py-3 border-b border-slate-700/50 bg-slate-800">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Known Facts</h2>
            </div>
            <ul className="divide-y divide-slate-700/50">
              {facts.map(fact => (
                <li key={fact.id} className="px-6 py-3 text-sm text-slate-300 pl-9 relative before:absolute before:left-6 before:top-3.5 before:w-1.5 before:h-1.5 before:rounded-full before:bg-slate-600">
                  {renderMentions(fact.fact_text, visibleIds)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {npcFactionRows.length > 0 && factionRows.length > 0 && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <div className="px-6 py-3 border-b border-slate-700/50 bg-slate-800">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Faction Memberships</h2>
            </div>
            <ul className="divide-y divide-slate-700/50">
              {npcFactionRows.map(row => {
                const faction = factionById[row.faction_id]
                if (!faction) return null
                return (
                  <li key={row.faction_id} className="px-6 py-3 flex items-center justify-between">
                    <Link href={`/play/factions/${faction.id}`} className="text-sm font-medium text-indigo-400 hover:underline">
                      {faction.name}
                    </Link>
                    {row.role && <span className="text-xs text-slate-500">{row.role}</span>}
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

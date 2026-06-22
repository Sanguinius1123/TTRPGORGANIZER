import { createClient } from '@/lib/supabase/server'
import { Faction, NPC } from '@ttrpg/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function FactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const results = await Promise.all([
    supabase.from('factions').select('*').eq('id', id).eq('visible', true).single(),
    supabase.from('npc_factions').select('npc_id, role').eq('faction_id', id),
  ])

  const raw = results[0].data
  if (!raw) notFound()
  const faction = raw as Faction
  const memberships = (results[1].data ?? []) as Array<{ npc_id: string; role: string | null }>

  // Load visible NPCs for members
  const npcIds = memberships.map(m => m.npc_id)
  const members: Array<{ npc: Pick<NPC, 'id' | 'name'>; role: string | null }> = []
  if (npcIds.length > 0) {
    const { data: rawNpcData } = await supabase
      .from('npcs')
      .select('id, name')
      .in('id', npcIds)
      .eq('visible', true)
    const npcData = (rawNpcData ?? []) as Array<{ id: string; name: string }>
    const npcMap = Object.fromEntries(npcData.map(n => [n.id, n]))
    memberships.forEach(m => {
      const npc = npcMap[m.npc_id]
      if (npc) members.push({ npc, role: m.role })
    })
  }

  const hasProperties = faction.disposition || faction.species || faction.culture

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/factions" className="text-zinc-500 hover:text-zinc-700">Factions</Link>
        <span className="text-zinc-300">/</span>
        <span className="text-zinc-900 font-medium">{faction.name}</span>
      </div>

      <h1 className="text-2xl font-bold text-zinc-900 mb-6">{faction.name}</h1>

      <div className="space-y-6">
        {hasProperties && (
          <div className="bg-white rounded-lg border border-zinc-200 p-6">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              {faction.disposition && (
                <div>
                  <dt className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Disposition</dt>
                  <dd className="text-sm text-zinc-800">{faction.disposition}</dd>
                </div>
              )}
              {faction.species && (
                <div>
                  <dt className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Species / Ancestry</dt>
                  <dd className="text-sm text-zinc-800">{faction.species}</dd>
                </div>
              )}
              {faction.culture && (
                <div>
                  <dt className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Culture</dt>
                  <dd className="text-sm text-zinc-800">{faction.culture}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {faction.goal && (
          <div className="bg-white rounded-lg border border-zinc-200 p-6">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Goal</h2>
            <p className="text-sm text-zinc-700 leading-relaxed">{faction.goal}</p>
          </div>
        )}

        {faction.description && (
          <div className="bg-white rounded-lg border border-zinc-200 p-6">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Description</h2>
            <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">{faction.description}</p>
          </div>
        )}

        {members.length > 0 && (
          <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
            <div className="px-6 py-3 border-b border-zinc-100 bg-zinc-50">
              <h2 className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">Known Members</h2>
            </div>
            <ul className="divide-y divide-zinc-100">
              {members.map(({ npc, role }) => (
                <li key={npc.id} className="px-6 py-3 flex items-center justify-between">
                  <Link href={`/npcs/${npc.id}`} className="text-sm font-medium text-indigo-600 hover:underline">
                    {npc.name}
                  </Link>
                  {role && <span className="text-xs text-zinc-400">{role}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

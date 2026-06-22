import { createClient } from '@/lib/supabase/server'
import { Faction, NPC } from '@ttrpg/db'
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

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div>
        {faction.disposition && (
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">{faction.disposition}</p>
        )}
        <h1 className="text-2xl font-bold text-zinc-900">{faction.name}</h1>
      </div>

      {faction.goal && (
        <section>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Goal</h2>
          <p className="text-sm text-zinc-700">{faction.goal}</p>
        </section>
      )}

      {faction.description && (
        <p className="text-zinc-700 whitespace-pre-wrap">{faction.description}</p>
      )}

      {members.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Known Members</h2>
          <ul className="space-y-1">
            {members.map(({ npc, role }) => (
              <li key={npc.id} className="flex items-center gap-2 text-sm">
                <a href={`/npcs/${npc.id}`} className="text-indigo-600 hover:underline font-medium">{npc.name}</a>
                {role && <span className="text-zinc-400">· {role}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

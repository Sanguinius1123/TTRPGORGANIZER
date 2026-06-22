import { createClient } from '@/lib/supabase/server'
import { NPC, NPCFact } from '@ttrpg/db'
import { notFound } from 'next/navigation'

export default async function NPCDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const results = await Promise.all([
    supabase.from('npcs').select('*').eq('id', id).eq('visible', true).single(),
    supabase.from('npc_facts').select('*').eq('npc_id', id).eq('revealed', true).order('created_at'),
  ])

  const raw = results[0].data
  if (!raw) notFound()
  const npc = raw as NPC
  const facts = (results[1].data ?? []) as NPCFact[]

  const fields = [
    { label: 'Species',     value: npc.species },
    { label: 'Profession',  value: npc.profession },
    { label: 'Culture',     value: npc.culture },
    { label: 'Disposition', value: npc.disposition },
  ].filter(f => f.value)

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">{npc.name}</h1>

      {fields.length > 0 && (
        <dl className="grid grid-cols-2 gap-3">
          {fields.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">{label}</dt>
              <dd className="mt-0.5 text-sm text-zinc-800">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {npc.background && (
        <section>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Background</h2>
          <p className="text-sm text-zinc-700 whitespace-pre-wrap">{npc.background}</p>
        </section>
      )}

      {facts.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Known Facts</h2>
          <ul className="space-y-1.5">
            {facts.map(fact => (
              <li key={fact.id} className="text-sm text-zinc-700 pl-3 border-l-2 border-zinc-200">
                {fact.fact_text}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

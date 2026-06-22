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
  ])

  const raw = results[0].data
  if (!raw) notFound()
  const npc = raw as NPC
  const facts = (results[1].data ?? []) as NPCFact[]
  const speciesList = (results[2].data ?? []) as Array<{ id: string; name: string }>
  const culturesList = (results[3].data ?? []) as Array<{ id: string; name: string }>
  const speciesIdByName = Object.fromEntries(speciesList.map(s => [s.name, s.id]))
  const cultureIdByName = Object.fromEntries(culturesList.map(c => [c.name, c.id]))

  const plainFields = [
    { label: 'Profession',  value: npc.profession },
    { label: 'Disposition', value: npc.disposition },
  ].filter(f => f.value)

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">{npc.name}</h1>

      <dl className="grid grid-cols-2 gap-3">
        {npc.species && (
          <div>
            <dt className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Species</dt>
            <dd className="mt-0.5 text-sm text-zinc-800">
              {speciesIdByName[npc.species]
                ? <Link href={`/species/${speciesIdByName[npc.species]}`} className="text-indigo-600 hover:underline">{npc.species}</Link>
                : npc.species}
            </dd>
          </div>
        )}
        {npc.culture && (
          <div>
            <dt className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Culture</dt>
            <dd className="mt-0.5 text-sm text-zinc-800">
              {cultureIdByName[npc.culture]
                ? <Link href={`/cultures/${cultureIdByName[npc.culture]}`} className="text-indigo-600 hover:underline">{npc.culture}</Link>
                : npc.culture}
            </dd>
          </div>
        )}
        {plainFields.map(({ label, value }) => (
          <div key={label}>
            <dt className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">{label}</dt>
            <dd className="mt-0.5 text-sm text-zinc-800">{value}</dd>
          </div>
        ))}
      </dl>

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

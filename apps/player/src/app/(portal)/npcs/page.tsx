import { createClient } from '@/lib/supabase/server'
import { NPC } from '@ttrpg/db'
import { FilterBar } from '@/components/FilterBar'
import { ClickableRow, SubLink } from '@/components/TableRow'
import { Suspense } from 'react'

type SearchParams = Promise<{ species?: string; culture?: string; disposition?: string }>

export default async function NPCsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const supabase = await createClient()

  const results = await Promise.all([
    (() => {
      let q = supabase.from('npcs').select('*').eq('visible', true).order('name')
      if (params.species) q = q.eq('species', params.species)
      if (params.culture) q = q.eq('culture', params.culture)
      if (params.disposition) q = q.ilike('disposition', `%${params.disposition}%`)
      return q
    })(),
    supabase.from('species').select('id, name').order('name'),
    supabase.from('cultures').select('id, name').order('name'),
  ])

  const npcs = (results[0].data ?? []) as NPC[]
  const speciesList = (results[1].data ?? []) as Array<{ id: string; name: string }>
  const culturesList = (results[2].data ?? []) as Array<{ id: string; name: string }>
  const speciesIdByName = Object.fromEntries(speciesList.map(s => [s.name, s.id]))
  const cultureIdByName = Object.fromEntries(culturesList.map(c => [c.name, c.id]))

  const filters = [
    { type: 'select' as const, name: 'species', label: 'Species', options: speciesList.map(s => ({ value: s.name, label: s.name })) },
    { type: 'select' as const, name: 'culture', label: 'Culture', options: culturesList.map(c => ({ value: c.name, label: c.name })) },
    { type: 'text' as const, name: 'disposition', label: 'Disposition', placeholder: 'friendly, hostile…' },
  ]

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">NPCs</h1>
        <p className="text-sm text-zinc-500 mt-1">{npcs.length} {npcs.length === 1 ? 'entry' : 'entries'}</p>
      </div>

      <Suspense fallback={null}>
        <FilterBar filters={filters} />
      </Suspense>

      {npcs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center">
          <p className="text-zinc-500 text-sm">No NPCs match the current filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Species / Ancestry</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Profession</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Culture</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Disposition</th>
              </tr>
            </thead>
            <tbody>
              {npcs.map(npc => (
                <ClickableRow key={npc.id} href={`/npcs/${npc.id}`} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <SubLink href={`/npcs/${npc.id}`} className="font-medium text-zinc-900 hover:text-indigo-600">
                      {npc.name}
                    </SubLink>
                  </td>
                  <td className="px-4 py-3">
                    {npc.species
                      ? speciesIdByName[npc.species]
                        ? <SubLink href={`/species/${speciesIdByName[npc.species]}`} className="text-zinc-500 hover:text-indigo-600">{npc.species}</SubLink>
                        : <span className="text-zinc-500">{npc.species}</span>
                      : <span className="text-zinc-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{npc.profession ?? '—'}</td>
                  <td className="px-4 py-3">
                    {npc.culture
                      ? cultureIdByName[npc.culture]
                        ? <SubLink href={`/cultures/${cultureIdByName[npc.culture]}`} className="text-zinc-500 hover:text-indigo-600">{npc.culture}</SubLink>
                        : <span className="text-zinc-500">{npc.culture}</span>
                      : <span className="text-zinc-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{npc.disposition ?? '—'}</td>
                </ClickableRow>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

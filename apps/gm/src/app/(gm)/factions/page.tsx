import { db } from '@/lib/db'
import { toggleFactionVisibility } from '@/lib/actions/factions'
import { FilterBar } from '@/components/FilterBar'
import { ClickableRow, SubLink, StopPropCell } from '@/components/TableRow'
import Link from 'next/link'
import { Suspense } from 'react'

interface FactionRow {
  id: string
  name: string
  species: string | null
  culture: string | null
  visible: boolean
  parent: { id: string; name: string } | null
}

type SearchParams = Promise<{ species?: string; culture?: string; visible?: string }>

export default async function FactionsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const supabase = db()

  const results = await Promise.all([
    (() => {
      let q = supabase.from('factions').select('*, parent:parent_faction_id(id, name)').order('name')
      if (params.species) q = q.eq('species', params.species)
      if (params.culture) q = q.eq('culture', params.culture)
      if (params.visible === 'true') q = q.eq('visible', true)
      else if (params.visible === 'false') q = q.eq('visible', false)
      return q
    })(),
    supabase.from('species').select('id, name').order('name'),
    supabase.from('cultures').select('id, name').order('name'),
  ])

  const factions = (results[0].data ?? []) as unknown as FactionRow[]
  const speciesList = (results[1].data ?? []) as Array<{ id: string; name: string }>
  const culturesList = (results[2].data ?? []) as Array<{ id: string; name: string }>

  const speciesIdByName = Object.fromEntries(speciesList.map(s => [s.name, s.id]))
  const cultureIdByName = Object.fromEntries(culturesList.map(c => [c.name, c.id]))

  const speciesOptions = speciesList.map(s => ({ value: s.name, label: s.name }))
  const cultureOptions = culturesList.map(c => ({ value: c.name, label: c.name }))

  const filters = [
    { type: 'select' as const, name: 'species', label: 'Species', options: speciesOptions },
    { type: 'select' as const, name: 'culture', label: 'Culture', options: cultureOptions },
    { type: 'select' as const, name: 'visible', label: 'Visibility', options: [{ value: 'true', label: 'Visible' }, { value: 'false', label: 'Hidden' }] },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Factions</h1>
          <p className="text-sm text-slate-500 mt-1">{factions.length} entries</p>
        </div>
        <Link href="/factions/new" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          New Faction
        </Link>
      </div>

      <Suspense fallback={null}>
        <FilterBar filters={filters} />
      </Suspense>

      {!factions.length ? (
        <div className="rounded-lg border border-dashed border-slate-600 p-12 text-center">
          <p className="text-slate-500 text-sm">No factions match the current filters.</p>
          <Link href="/factions/new" className="mt-3 inline-block text-sm font-medium text-indigo-400 hover:text-indigo-300">
            Create the first one →
          </Link>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800">
                <th className="text-left px-4 py-3 font-medium text-slate-400">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Parent Faction</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Species</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Culture</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Visible</th>
              </tr>
            </thead>
            <tbody>
              {factions.map((f) => (
                <ClickableRow key={f.id} href={`/factions/${f.id}`} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-700/50">
                  <td className="px-4 py-3">
                    <SubLink href={`/factions/${f.id}`} className="font-medium text-slate-100 hover:text-indigo-400">
                      {f.name}
                    </SubLink>
                  </td>
                  <td className="px-4 py-3">
                    {f.parent
                      ? <SubLink href={`/factions/${f.parent.id}`} className="text-slate-500 hover:text-indigo-400">{f.parent.name}</SubLink>
                      : <span className="text-slate-500">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {f.species
                      ? speciesIdByName[f.species]
                        ? <SubLink href={`/species/${speciesIdByName[f.species]}`} className="text-slate-500 hover:text-indigo-400">{f.species}</SubLink>
                        : <span className="text-slate-500">{f.species}</span>
                      : <span className="text-slate-500">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {f.culture
                      ? cultureIdByName[f.culture]
                        ? <SubLink href={`/cultures/${cultureIdByName[f.culture]}`} className="text-slate-500 hover:text-indigo-400">{f.culture}</SubLink>
                        : <span className="text-slate-500">{f.culture}</span>
                      : <span className="text-slate-500">—</span>}
                  </td>
                  <StopPropCell className="px-4 py-3">
                    <form action={toggleFactionVisibility}>
                      <input type="hidden" name="id" value={f.id} />
                      <input type="hidden" name="visible" value={String(f.visible)} />
                      <button type="submit" className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer transition-colors ${
                        f.visible ? 'bg-green-900/40 text-green-400 hover:bg-green-900/60' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                      }`}>
                        {f.visible ? 'Visible' : 'Hidden'}
                      </button>
                    </form>
                  </StopPropCell>
                </ClickableRow>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

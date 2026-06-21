import { db } from '@/lib/db'
import { PlayerCharacter } from '@ttrpg/db'
import { togglePlayerCharacterVisibility } from '@/lib/actions/player-characters'
import { FilterBar } from '@/components/FilterBar'
import { ClickableRow, SubLink, StopPropCell } from '@/components/TableRow'
import Link from 'next/link'
import { Suspense } from 'react'

type SearchParams = Promise<{ species?: string; visible?: string }>

export default async function PlayerCharactersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const supabase = db()

  const results = await Promise.all([
    (() => {
      let q = supabase.from('player_characters').select('*').order('name')
      if (params.species) q = q.eq('species', params.species)
      if (params.visible === 'true') q = q.eq('visible', true)
      else if (params.visible === 'false') q = q.eq('visible', false)
      return q
    })(),
    supabase.from('species').select('id, name').order('name'),
  ])

  const pcs = (results[0].data ?? []) as PlayerCharacter[]
  const speciesList = (results[1].data ?? []) as Array<{ id: string; name: string }>

  const speciesIdByName = Object.fromEntries(speciesList.map(s => [s.name, s.id]))
  const speciesOptions = speciesList.map(s => ({ value: s.name, label: s.name }))

  const filters = [
    { type: 'select' as const, name: 'species', label: 'Species', options: speciesOptions },
    { type: 'select' as const, name: 'visible', label: 'Visibility', options: [{ value: 'true', label: 'Visible' }, { value: 'false', label: 'Hidden' }] },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Player Characters</h1>
          <p className="text-sm text-zinc-500 mt-1">{pcs.length} entries</p>
        </div>
        <Link href="/player-characters/new" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          New Character
        </Link>
      </div>

      <Suspense fallback={null}>
        <FilterBar filters={filters} />
      </Suspense>

      {!pcs.length ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center">
          <p className="text-zinc-500 text-sm">No player characters yet.</p>
          <Link href="/player-characters/new" className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700">
            Create the first one →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Character Name</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Player</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Species / Ancestry</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Visible</th>
              </tr>
            </thead>
            <tbody>
              {pcs.map((pc) => (
                <ClickableRow key={pc.id} href={`/player-characters/${pc.id}`} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <SubLink href={`/player-characters/${pc.id}`} className="font-medium text-zinc-900 hover:text-indigo-600">
                      {pc.name}
                    </SubLink>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{pc.player_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    {pc.species
                      ? speciesIdByName[pc.species]
                        ? <SubLink href={`/species/${speciesIdByName[pc.species]}`} className="text-zinc-500 hover:text-indigo-600">{pc.species}</SubLink>
                        : <span className="text-zinc-500">{pc.species}</span>
                      : <span className="text-zinc-400">—</span>}
                  </td>
                  <StopPropCell className="px-4 py-3">
                    <form action={togglePlayerCharacterVisibility}>
                      <input type="hidden" name="id" value={pc.id} />
                      <input type="hidden" name="visible" value={String(pc.visible)} />
                      <button type="submit" className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer transition-colors ${
                        pc.visible ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}>
                        {pc.visible ? 'Visible' : 'Hidden'}
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

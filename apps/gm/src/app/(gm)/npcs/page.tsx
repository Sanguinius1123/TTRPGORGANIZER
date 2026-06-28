import { db } from '@/lib/db'
import { NPC } from '@ttrpg/db'
import { toggleNpcVisibility } from '@/lib/actions/npcs'
import { FilterBar } from '@/components/FilterBar'
import { ClickableRow, SubLink, StopPropCell } from '@/components/TableRow'
import Link from 'next/link'
import { Suspense } from 'react'
import { getActiveCampaignId } from '@/lib/activeCampaign'
import { redirect } from 'next/navigation'

type SearchParams = Promise<{ species?: string; culture?: string; profession?: string; visible?: string }>

export default async function NpcsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const campaignId = await getActiveCampaignId()
  if (!campaignId) redirect('/')
  const supabase = db()

  const results = await Promise.all([
    (() => {
      let q = supabase.from('npcs').select('*').eq('campaign_id', campaignId).order('name')
      if (params.species) q = q.eq('species', params.species)
      if (params.culture) q = q.eq('culture', params.culture)
      if (params.profession) q = q.ilike('profession', `%${params.profession}%`)
      if (params.visible === 'true') q = q.eq('visible', true)
      else if (params.visible === 'false') q = q.eq('visible', false)
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

  const speciesOptions = speciesList.map(s => ({ value: s.name, label: s.name }))
  const cultureOptions = culturesList.map(c => ({ value: c.name, label: c.name }))

  const filters = [
    { type: 'select' as const, name: 'species', label: 'Species', options: speciesOptions },
    { type: 'select' as const, name: 'culture', label: 'Culture', options: cultureOptions },
    { type: 'text' as const, name: 'profession', label: 'Profession', placeholder: 'filter…' },
    { type: 'select' as const, name: 'visible', label: 'Visibility', options: [{ value: 'true', label: 'Visible' }, { value: 'false', label: 'Hidden' }] },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">NPCs</h1>
          <p className="text-sm text-slate-500 mt-1">{npcs.length} entries</p>
        </div>
        <Link href="/npcs/new" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          New NPC
        </Link>
      </div>

      <Suspense fallback={null}>
        <FilterBar filters={filters} />
      </Suspense>

      {!npcs.length ? (
        <div className="rounded-lg border border-dashed border-slate-600 p-12 text-center">
          <p className="text-slate-500 text-sm">No NPCs match the current filters.</p>
          <Link href="/npcs/new" className="mt-3 inline-block text-sm font-medium text-indigo-400 hover:text-indigo-300">
            Create the first one →
          </Link>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800">
                <th className="text-left px-4 py-3 font-medium text-slate-400">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Species / Ancestry</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Profession</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Culture</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Visible</th>
              </tr>
            </thead>
            <tbody>
              {npcs.map((npc) => (
                <ClickableRow key={npc.id} href={`/npcs/${npc.id}`} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-700/50">
                  <td className="px-4 py-3">
                    <SubLink href={`/npcs/${npc.id}`} className="font-medium text-slate-100 hover:text-indigo-400">
                      {npc.name}
                    </SubLink>
                  </td>
                  <td className="px-4 py-3">
                    {npc.species
                      ? speciesIdByName[npc.species]
                        ? <SubLink href={`/species/${speciesIdByName[npc.species]}`} className="text-slate-500 hover:text-indigo-400">{npc.species}</SubLink>
                        : <span className="text-slate-500">{npc.species}</span>
                      : <span className="text-slate-500">—</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{npc.profession ?? '—'}</td>
                  <td className="px-4 py-3">
                    {npc.culture
                      ? cultureIdByName[npc.culture]
                        ? <SubLink href={`/cultures/${cultureIdByName[npc.culture]}`} className="text-slate-500 hover:text-indigo-400">{npc.culture}</SubLink>
                        : <span className="text-slate-500">{npc.culture}</span>
                      : <span className="text-slate-500">—</span>}
                  </td>
                  <StopPropCell className="px-4 py-3">
                    <form action={toggleNpcVisibility}>
                      <input type="hidden" name="id" value={npc.id} />
                      <input type="hidden" name="visible" value={String(npc.visible)} />
                      <button type="submit" className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer transition-colors ${
                        npc.visible ? 'bg-green-900/40 text-green-400 hover:bg-green-900/60' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                      }`}>
                        {npc.visible ? 'Visible' : 'Hidden'}
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

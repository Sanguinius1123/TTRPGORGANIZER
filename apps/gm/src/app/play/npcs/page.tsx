import { createAnonClient } from '@/lib/supabase/server'
import { NPC } from '@ttrpg/db'
import { FilterBar } from '@/components/FilterBar'
import { ClickableRow, SubLink } from '@/components/TableRow'
import { Suspense } from 'react'
import { getPlayCampaignId } from '@/lib/playCampaign'

type SearchParams = Promise<{ species?: string; culture?: string; disposition?: string }>

export default async function NPCsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const campaignId = await getPlayCampaignId()
  const supabase = await createAnonClient()

  const results = await Promise.all([
    (() => {
      let q = supabase.from('npcs').select('*').eq('visible', true)
      if (campaignId) q = q.eq('campaign_id', campaignId)
      q = q.order('name')
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
        <h1 className="text-2xl font-bold text-slate-100">NPCs</h1>
        <p className="text-sm text-slate-500 mt-1">{npcs.length} {npcs.length === 1 ? 'entry' : 'entries'}</p>
      </div>

      <Suspense fallback={null}>
        <FilterBar filters={filters} />
      </Suspense>

      {npcs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-600 p-12 text-center">
          <p className="text-slate-500 text-sm">No NPCs match the current filters.</p>
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
                <th className="text-left px-4 py-3 font-medium text-slate-400">Disposition</th>
              </tr>
            </thead>
            <tbody>
              {npcs.map(npc => (
                <ClickableRow key={npc.id} href={`/play/npcs/${npc.id}`} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-800">
                  <td className="px-4 py-3">
                    <SubLink href={`/play/npcs/${npc.id}`} className="font-medium text-slate-100 hover:text-indigo-400">
                      {npc.name}
                    </SubLink>
                  </td>
                  <td className="px-4 py-3">
                    {npc.species
                      ? speciesIdByName[npc.species]
                        ? <SubLink href={`/play/species/${speciesIdByName[npc.species]}`} className="text-slate-500 hover:text-indigo-400">{npc.species}</SubLink>
                        : <span className="text-slate-500">{npc.species}</span>
                      : <span className="text-slate-500">—</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{npc.profession ?? '—'}</td>
                  <td className="px-4 py-3">
                    {npc.culture
                      ? cultureIdByName[npc.culture]
                        ? <SubLink href={`/play/cultures/${cultureIdByName[npc.culture]}`} className="text-slate-500 hover:text-indigo-400">{npc.culture}</SubLink>
                        : <span className="text-slate-500">{npc.culture}</span>
                      : <span className="text-slate-500">—</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{npc.disposition ?? '—'}</td>
                </ClickableRow>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

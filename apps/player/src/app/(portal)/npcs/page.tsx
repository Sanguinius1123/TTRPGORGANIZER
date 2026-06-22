import { createClient } from '@/lib/supabase/server'
import { NPC } from '@ttrpg/db'
import Link from 'next/link'

export default async function NPCsPage() {
  const supabase = await createClient()

  const results = await Promise.all([
    supabase.from('npcs').select('*').eq('visible', true).order('name'),
    supabase.from('species').select('id, name').order('name'),
    supabase.from('cultures').select('id, name').order('name'),
  ])

  const npcs = (results[0].data ?? []) as NPC[]
  const speciesList = (results[1].data ?? []) as Array<{ id: string; name: string }>
  const culturesList = (results[2].data ?? []) as Array<{ id: string; name: string }>
  const speciesIdByName = Object.fromEntries(speciesList.map(s => [s.name, s.id]))
  const cultureIdByName = Object.fromEntries(culturesList.map(c => [c.name, c.id]))

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">NPCs</h1>
        <p className="text-sm text-zinc-500 mt-1">{npcs.length} {npcs.length === 1 ? 'entry' : 'entries'}</p>
      </div>

      {npcs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center">
          <p className="text-zinc-500 text-sm">No NPCs have been revealed yet.</p>
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
                <tr key={npc.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <Link href={`/npcs/${npc.id}`} className="font-medium text-zinc-900 hover:text-indigo-600">
                      {npc.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {npc.species
                      ? speciesIdByName[npc.species]
                        ? <Link href={`/species/${speciesIdByName[npc.species]}`} className="text-zinc-500 hover:text-indigo-600">{npc.species}</Link>
                        : <span className="text-zinc-500">{npc.species}</span>
                      : <span className="text-zinc-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{npc.profession ?? '—'}</td>
                  <td className="px-4 py-3">
                    {npc.culture
                      ? cultureIdByName[npc.culture]
                        ? <Link href={`/cultures/${cultureIdByName[npc.culture]}`} className="text-zinc-500 hover:text-indigo-600">{npc.culture}</Link>
                        : <span className="text-zinc-500">{npc.culture}</span>
                      : <span className="text-zinc-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{npc.disposition ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

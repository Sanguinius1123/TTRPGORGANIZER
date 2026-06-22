import { createClient } from '@/lib/supabase/server'
import { NPC } from '@ttrpg/db'
import Link from 'next/link'

export default async function NPCsPage() {
  const supabase = await createClient()
  const { data: raw } = await supabase
    .from('npcs')
    .select('*')
    .eq('visible', true)
    .order('name')
  const npcs = (raw ?? []) as NPC[]

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">NPCs</h1>
      {npcs.length === 0 ? (
        <p className="text-zinc-500 text-sm">No NPCs have been revealed yet.</p>
      ) : (
        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Profession</th>
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
                  <td className="px-4 py-3 text-zinc-500">{npc.profession ?? '—'}</td>
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

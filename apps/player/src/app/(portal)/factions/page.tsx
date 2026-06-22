import { createClient } from '@/lib/supabase/server'
import { Faction } from '@ttrpg/db'
import Link from 'next/link'

export default async function FactionsPage() {
  const supabase = await createClient()
  const { data: raw } = await supabase
    .from('factions')
    .select('*')
    .eq('visible', true)
    .order('name')
  const factions = (raw ?? []) as Faction[]

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Factions</h1>
        <p className="text-sm text-zinc-500 mt-1">{factions.length} {factions.length === 1 ? 'entry' : 'entries'}</p>
      </div>

      {factions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center">
          <p className="text-zinc-500 text-sm">No factions have been revealed yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Disposition</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Goal</th>
              </tr>
            </thead>
            <tbody>
              {factions.map(f => (
                <tr key={f.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <Link href={`/factions/${f.id}`} className="font-medium text-zinc-900 hover:text-indigo-600">
                      {f.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{f.disposition ?? '—'}</td>
                  <td className="px-4 py-3 text-zinc-500 max-w-xs">
                    {f.goal ? <span className="line-clamp-1">{f.goal}</span> : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

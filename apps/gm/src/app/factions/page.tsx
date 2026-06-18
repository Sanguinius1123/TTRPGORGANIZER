import { db } from '@/lib/db'
import Link from 'next/link'

interface FactionRow {
  id: string
  name: string
  disposition: string | null
  visible: boolean
  parent: { name: string } | null
}

export default async function FactionsPage() {
  const supabase = db()
  const { data: raw } = await supabase
    .from('factions')
    .select('*, parent:parent_faction_id(name)')
    .order('name')

  const factions = (raw ?? []) as unknown as FactionRow[]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Factions</h1>
          <p className="text-sm text-zinc-500 mt-1">{factions.length} entries</p>
        </div>
        <Link href="/factions/new" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          New Faction
        </Link>
      </div>

      {!factions.length ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center">
          <p className="text-zinc-500 text-sm">No factions yet.</p>
          <Link href="/factions/new" className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700">
            Create the first one →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Parent Faction</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Disposition</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Visible</th>
              </tr>
            </thead>
            <tbody>
              {factions.map((f) => (
                <tr key={f.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <Link href={`/factions/${f.id}`} className="font-medium text-zinc-900 hover:text-indigo-600">
                      {f.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{f.parent?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-zinc-500">{f.disposition ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      f.visible ? 'bg-green-100 text-green-800' : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      {f.visible ? 'Visible' : 'Hidden'}
                    </span>
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

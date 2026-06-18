import { db } from '@/lib/db'
import Link from 'next/link'

interface LocationRow {
  id: string
  name: string
  type: string | null
  status: string | null
  visible: boolean
  parent: { name: string } | null
}

export default async function LocationsPage() {
  const supabase = db()
  const { data: raw } = await supabase
    .from('locations')
    .select('*, parent:parent_location_id(name)')
    .order('name')

  const locations = (raw ?? []) as unknown as LocationRow[]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Locations</h1>
          <p className="text-sm text-zinc-500 mt-1">{locations.length} entries</p>
        </div>
        <Link href="/locations/new" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          New Location
        </Link>
      </div>

      {!locations.length ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center">
          <p className="text-zinc-500 text-sm">No locations yet.</p>
          <Link href="/locations/new" className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700">
            Create the first one →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Parent</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Visible</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((loc) => (
                <tr key={loc.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <Link href={`/locations/${loc.id}`} className="font-medium text-zinc-900 hover:text-indigo-600">
                      {loc.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{loc.type ?? '—'}</td>
                  <td className="px-4 py-3 text-zinc-500">{loc.parent?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-zinc-500">{loc.status ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      loc.visible ? 'bg-green-100 text-green-800' : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      {loc.visible ? 'Visible' : 'Hidden'}
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

import { createClient } from '@/lib/supabase/server'
import { Location } from '@ttrpg/db'
import Link from 'next/link'

export default async function LocationsPage() {
  const supabase = await createClient()
  const { data: raw } = await supabase
    .from('locations')
    .select('*')
    .eq('visible', true)
    .order('name')
  const locations = (raw ?? []) as Location[]

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">Locations</h1>
      {locations.length === 0 ? (
        <p className="text-zinc-500 text-sm">No locations have been revealed yet.</p>
      ) : (
        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {locations.map(loc => (
                <tr key={loc.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <Link href={`/locations/${loc.id}`} className="font-medium text-zinc-900 hover:text-indigo-600">
                      {loc.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {loc.type ?? '—'}
                    {loc.descriptor && <span className="text-zinc-400 ml-1">· {loc.descriptor}</span>}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{loc.status ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

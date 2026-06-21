import { db } from '@/lib/db'
import { FilterBar } from '@/components/FilterBar'
import Link from 'next/link'
import { Suspense } from 'react'

interface EncounterRow {
  id: string
  title: string
  status: string
  location: { name: string } | null
  session: { session_number: number } | null
}

const statusColor: Record<string, string> = {
  prep: 'bg-yellow-100 text-yellow-800',
  active: 'bg-blue-100 text-blue-800',
  archived: 'bg-zinc-100 text-zinc-600',
}

type SearchParams = Promise<{ status?: string }>

export default async function EncountersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const supabase = db()

  let q = supabase.from('encounters').select('*, location:location_id(name), session:session_id(session_number)').order('created_at', { ascending: false })
  if (params.status) q = q.eq('status', params.status)

  const { data: raw } = await q
  const encounters = (raw ?? []) as unknown as EncounterRow[]

  const filters = [
    { type: 'select' as const, name: 'status', label: 'Status', options: [
      { value: 'prep', label: 'Prep' },
      { value: 'active', label: 'Active' },
      { value: 'archived', label: 'Archived' },
    ]},
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Encounters</h1>
          <p className="text-sm text-zinc-500 mt-1">{encounters.length} entries</p>
        </div>
        <Link href="/encounters/new" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          New Encounter
        </Link>
      </div>

      <Suspense fallback={null}>
        <FilterBar filters={filters} />
      </Suspense>

      {!encounters.length ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center">
          <p className="text-zinc-500 text-sm">No encounters match the current filters.</p>
          <Link href="/encounters/new" className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700">
            Build the first one →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Title</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Location</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Session</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {encounters.map((e) => (
                <tr key={e.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <Link href={`/encounters/${e.id}`} className="font-medium text-zinc-900 hover:text-indigo-600">
                      {e.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{e.location?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-zinc-500">
                    {e.session ? `#${e.session.session_number}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[e.status] ?? 'bg-zinc-100 text-zinc-600'}`}>
                      {e.status}
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

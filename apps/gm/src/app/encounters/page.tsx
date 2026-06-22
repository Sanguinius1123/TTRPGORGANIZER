import { db } from '@/lib/db'
import { FilterBar } from '@/components/FilterBar'
import { ClickableRow, SubLink } from '@/components/TableRow'
import Link from 'next/link'
import { Suspense } from 'react'

interface EncounterRow {
  id: string
  title: string
  status: string
  location: { id: string; name: string } | null
  session: { id: string; session_number: number } | null
}

const statusColor: Record<string, string> = {
  prep: 'bg-yellow-900/40 text-yellow-300',
  active: 'bg-blue-900/40 text-blue-300',
  archived: 'bg-slate-700 text-slate-400',
}

type SearchParams = Promise<{ status?: string }>

export default async function EncountersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const supabase = db()

  let q = supabase.from('encounters').select('*, location:location_id(id, name), session:session_id(id, session_number)').order('created_at', { ascending: false })
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
          <h1 className="text-2xl font-bold text-slate-100">Encounters</h1>
          <p className="text-sm text-slate-500 mt-1">{encounters.length} entries</p>
        </div>
        <Link href="/encounters/new" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          New Encounter
        </Link>
      </div>

      <Suspense fallback={null}>
        <FilterBar filters={filters} />
      </Suspense>

      {!encounters.length ? (
        <div className="rounded-lg border border-dashed border-slate-600 p-12 text-center">
          <p className="text-slate-500 text-sm">No encounters match the current filters.</p>
          <Link href="/encounters/new" className="mt-3 inline-block text-sm font-medium text-indigo-400 hover:text-indigo-300">
            Build the first one →
          </Link>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800">
                <th className="text-left px-4 py-3 font-medium text-slate-400">Title</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Location</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Session</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {encounters.map((e) => (
                <ClickableRow key={e.id} href={`/encounters/${e.id}`} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-800">
                  <td className="px-4 py-3">
                    <SubLink href={`/encounters/${e.id}`} className="font-medium text-slate-100 hover:text-indigo-400">
                      {e.title}
                    </SubLink>
                  </td>
                  <td className="px-4 py-3">
                    {e.location
                      ? <SubLink href={`/locations/${e.location.id}`} className="text-slate-500 hover:text-indigo-400">{e.location.name}</SubLink>
                      : <span className="text-slate-500">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {e.session
                      ? <SubLink href={`/sessions/${e.session.id}`} className="text-slate-500 hover:text-indigo-400">#{e.session.session_number}</SubLink>
                      : <span className="text-slate-500">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[e.status] ?? 'bg-slate-700 text-slate-400'}`}>
                      {e.status}
                    </span>
                  </td>
                </ClickableRow>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

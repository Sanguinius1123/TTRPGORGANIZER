import { db } from '@/lib/db'
import { FilterBar } from '@/components/FilterBar'
import { ClickableRow, SubLink } from '@/components/TableRow'
import Link from 'next/link'
import { Suspense } from 'react'
import { getActiveCampaignId } from '@/lib/activeCampaign'
import { redirect } from 'next/navigation'

interface EncounterRow {
  id: string
  title: string
  status: string
  location: { id: string; name: string | null } | null
}
interface ParticipantDr { encounter_id: string; role: string | null; dr: number | null; count: number }
interface SessionLink { encounter_id: string; session_id: string }
interface SessionRow { id: string; session_number: number }

const statusColor: Record<string, string> = {
  prep:     'bg-yellow-900/40 text-yellow-300',
  active:   'bg-blue-900/40 text-blue-300',
  archived: 'bg-slate-700 text-slate-400',
}

function formatDr(dr: number): string {
  return Number.isInteger(dr) ? String(dr) : dr.toFixed(2).replace(/\.?0+$/, '')
}

type SearchParams = Promise<{ status?: string; sort?: string }>

export default async function EncountersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const campaignId = await getActiveCampaignId()
  if (!campaignId) redirect('/')
  const supabase = db()

  const encResult = await supabase.from('encounters').select('*, location:location_id(id, name)').eq('campaign_id', campaignId).order('created_at', { ascending: false })
  let encounters = (encResult.data ?? []) as unknown as EncounterRow[]
  const encounterIds = encounters.map(e => e.id)

  const [partResult, linkResult, sessResult] = encounterIds.length > 0
    ? await Promise.all([
        supabase.from('encounter_participants').select('encounter_id, role, dr, count').in('encounter_id', encounterIds),
        supabase.from('session_encounters').select('encounter_id, session_id').in('encounter_id', encounterIds),
        supabase.from('sessions').select('id, session_number').eq('campaign_id', campaignId),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }]

  const participants = (partResult.data ?? []) as ParticipantDr[]
  const sessionLinks = (linkResult.data ?? []) as SessionLink[]
  const sessions     = (sessResult.data ?? []) as SessionRow[]

  // Filter by status
  if (params.status) encounters = encounters.filter(e => e.status === params.status)

  // Compute net DR per encounter (enemies add, allies subtract)
  const netDrMap = new Map<string, number>()
  for (const p of participants) {
    if (p.dr === null) continue
    const prev = netDrMap.get(p.encounter_id) ?? 0
    if (p.role === 'enemy')     netDrMap.set(p.encounter_id, prev + p.dr * p.count)
    else if (p.role === 'ally') netDrMap.set(p.encounter_id, prev - p.dr * p.count)
  }

  // Build sorted session number list per encounter
  const sessionById = new Map(sessions.map(s => [s.id, s.session_number]))
  const sessionsForEncounter = new Map<string, number[]>()
  for (const link of sessionLinks) {
    const num = sessionById.get(link.session_id)
    if (num === undefined) continue
    const arr = sessionsForEncounter.get(link.encounter_id) ?? []
    arr.push(num)
    sessionsForEncounter.set(link.encounter_id, arr)
  }

  // Sort by DR if requested
  const sortBy = params.sort ?? ''
  if (sortBy === 'dr') {
    encounters = [...encounters].sort((a, b) => (netDrMap.get(b.id) ?? 0) - (netDrMap.get(a.id) ?? 0))
  } else if (sortBy === '-dr') {
    encounters = [...encounters].sort((a, b) => (netDrMap.get(a.id) ?? 0) - (netDrMap.get(b.id) ?? 0))
  }

  const filters = [
    { type: 'select' as const, name: 'status', label: 'Status', options: [
      { value: 'prep',     label: 'Prep' },
      { value: 'active',   label: 'Active' },
      { value: 'archived', label: 'Archived' },
    ]},
  ]

  const nextDrSort = sortBy === 'dr' ? '-dr' : 'dr'
  const drSortArrow = sortBy === 'dr' ? ' ▼' : sortBy === '-dr' ? ' ▲' : ''
  const statusParam: Record<string, string> = params.status ? { status: params.status } : {}

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
                <th className="text-left px-4 py-3 font-medium text-slate-400">
                  <Link
                    href={`/encounters?${new URLSearchParams({ ...statusParam, sort: nextDrSort }).toString()}`}
                    className="hover:text-slate-200 transition-colors"
                  >
                    Net DR{drSortArrow}
                  </Link>
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Sessions</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Location</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {encounters.map((e) => {
                const netDr = netDrMap.get(e.id)
                const sessNums = (sessionsForEncounter.get(e.id) ?? []).sort((a, b) => a - b)
                return (
                  <ClickableRow key={e.id} href={`/encounters/${e.id}`} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-800">
                    <td className="px-4 py-3">
                      <SubLink href={`/encounters/${e.id}`} className="font-medium text-slate-100 hover:text-indigo-400">
                        {e.title}
                      </SubLink>
                    </td>
                    <td className="px-4 py-3">
                      {netDr !== undefined ? (
                        <span className={`inline-flex rounded px-1.5 py-0.5 text-xs font-semibold ${
                          netDr > 0 ? 'bg-red-900/30 text-red-400' :
                          netDr < 0 ? 'bg-green-900/40 text-green-400' :
                          'bg-slate-700 text-slate-400'
                        }`}>
                          {formatDr(netDr)}
                        </span>
                      ) : <span className="text-slate-500">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {sessNums.length > 0 ? sessNums.map(n => `#${n}`).join(', ') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {e.location
                        ? <SubLink href={`/locations/${e.location.id}`} className="text-slate-500 hover:text-indigo-400">{e.location.name}</SubLink>
                        : <span className="text-slate-500">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[e.status] ?? 'bg-slate-700 text-slate-400'}`}>
                        {e.status}
                      </span>
                    </td>
                  </ClickableRow>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

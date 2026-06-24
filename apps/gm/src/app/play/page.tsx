import { createAnonClient } from '@/lib/supabase/server'
import { PlayerCharacter, Faction } from '@ttrpg/db'
import { redirect } from 'next/navigation'
import { CharacterForm } from './character/CharacterForm'
import { PCSwitch } from './character/PCSwitch'
import Link from 'next/link'

interface PlotThreadRow { id: string; title: string; type: string; status: string }

const threadStatusColor: Record<string, string> = {
  active:    'text-green-400',
  completed: 'text-slate-500',
  abandoned: 'text-red-400',
}

type SearchParams = Promise<{ pc?: string }>

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const supabase = await createAnonClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const results = await Promise.all([
    supabase.from('player_characters').select('*').eq('profile_id', user.id).order('name'),
    supabase.from('species').select('id, name').order('name'),
    supabase.from('cultures').select('id, name').order('name'),
  ])

  const allMyPCs     = (results[0].data ?? []) as PlayerCharacter[]
  const speciesList  = (results[1].data ?? []) as Array<{ id: string; name: string }>
  const culturesList = (results[2].data ?? []) as Array<{ id: string; name: string }>

  if (allMyPCs.length === 0) {
    return (
      <div className="p-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-slate-100 mb-6">My Character</h1>
        <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-6">
          <p className="text-sm font-medium text-amber-300">No character assigned</p>
          <p className="text-sm text-amber-300 mt-1">
            Ask your GM to assign you a player character to unlock your character sheet.
          </p>
        </div>
      </div>
    )
  }

  const pc = (params.pc ? allMyPCs.find(c => c.id === params.pc) : null) ?? allMyPCs[0]

  // Load faction memberships + party + plot threads in parallel
  const { data: rawPCFactions } = await supabase
    .from('pc_factions').select('faction_id, role').eq('pc_id', pc.id)
  const pcFactionRows = (rawPCFactions ?? []) as Array<{ faction_id: string; role: string | null }>
  const factionIds = pcFactionRows.map(r => r.faction_id)

  const results2 = await Promise.all([
    factionIds.length > 0
      ? supabase.from('factions').select('id, name').in('id', factionIds)
      : Promise.resolve({ data: [] }),
    pc.party_faction_id
      ? supabase.from('player_characters')
          .select('id, name, player_name, species')
          .eq('party_faction_id', pc.party_faction_id)
          .eq('visible', true)
          .neq('id', pc.id)
          .order('name')
      : Promise.resolve({ data: [] }),
    pc.party_faction_id
      ? supabase.from('factions').select('id, name').eq('id', pc.party_faction_id).single()
      : Promise.resolve({ data: null }),
    // Plot threads linked to party faction
    pc.party_faction_id
      ? supabase
          .from('plot_thread_factions')
          .select('plot_thread_id')
          .eq('faction_id', pc.party_faction_id)
      : Promise.resolve({ data: [] }),
    // Plot threads linked to current PC
    supabase
      .from('plot_thread_characters')
      .select('plot_thread_id')
      .eq('pc_id', pc.id),
  ])

  const factions     = (results2[0].data ?? []) as Pick<Faction, 'id' | 'name'>[]
  const partyMembers = (results2[1].data ?? []) as Array<{ id: string; name: string; player_name: string | null; species: string | null }>
  const partyFaction = results2[2].data as { id: string; name: string } | null
  const factionThreadLinks  = (results2[3].data ?? []) as Array<{ plot_thread_id: string }>
  const charThreadLinks     = (results2[4].data ?? []) as Array<{ plot_thread_id: string }>

  const pcFactions = pcFactionRows
    .map(r => ({ faction: factions.find(f => f.id === r.faction_id), role: r.role }))
    .filter(r => r.faction)

  // Merge thread IDs from both sources (dedup)
  const allThreadIds = [...new Set([
    ...factionThreadLinks.map(l => l.plot_thread_id),
    ...charThreadLinks.map(l => l.plot_thread_id),
  ])]

  let partyPlotThreads: PlotThreadRow[] = []
  let pcPlotThreads: PlotThreadRow[] = []

  if (allThreadIds.length > 0) {
    const { data: rawThreads } = await supabase
      .from('plot_threads')
      .select('id, title, type, status')
      .in('id', allThreadIds)
      .eq('visible', true)
      .order('status')
      .order('title')
    const allThreads = (rawThreads ?? []) as PlotThreadRow[]
    const factionThreadSet = new Set(factionThreadLinks.map(l => l.plot_thread_id))
    const charThreadSet    = new Set(charThreadLinks.map(l => l.plot_thread_id))
    partyPlotThreads = allThreads.filter(t => factionThreadSet.has(t.id))
    pcPlotThreads    = allThreads.filter(t => charThreadSet.has(t.id) && !factionThreadSet.has(t.id))
  }

  const hasPlotThreads = partyPlotThreads.length > 0 || pcPlotThreads.length > 0

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <PCSwitch pcs={allMyPCs.map(c => ({ id: c.id, name: c.name }))} currentId={pc.id} />
      </div>

      <div className="flex gap-6 items-start">

        {/* ── Left: character form + factions ── */}
        <div className="flex-1 min-w-0 space-y-6">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <CharacterForm pc={pc} speciesList={speciesList} culturesList={culturesList} />
          </div>

          {pcFactions.length > 0 && (
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-5">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Faction Memberships</h2>
              <ul className="space-y-1.5">
                {pcFactions.map(({ faction, role }) => (
                  <li key={faction!.id} className="flex items-center gap-2 text-sm">
                    <Link href={`/play/factions/${faction!.id}`} className="text-indigo-400 hover:underline font-medium">{faction!.name}</Link>
                    {role && <span className="text-slate-500">· {role}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ── Right: party + plot threads ── */}
        <div className="w-64 shrink-0 space-y-4">

          {/* Party sidebar */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-800">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                {partyFaction ? partyFaction.name : 'Party'}
              </h3>
            </div>
            <div className="p-3 space-y-1">
              {!pc.party_faction_id ? (
                <p className="text-xs text-slate-500 px-1 py-1">No party faction assigned.</p>
              ) : partyMembers.length === 0 ? (
                <p className="text-xs text-slate-500 px-1 py-1">No other visible party members.</p>
              ) : (
                partyMembers.map(member => (
                  <Link
                    key={member.id}
                    href={`/play/player-characters/${member.id}`}
                    className="flex flex-col rounded px-1 py-2 hover:bg-slate-700/50 transition-colors"
                  >
                    <span className="text-sm font-medium text-slate-100 hover:text-indigo-400">{member.name}</span>
                    {(member.player_name || member.species) && (
                      <span className="text-xs text-slate-500">
                        {[member.player_name, member.species].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Plot threads */}
          {hasPlotThreads && (
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-800">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Plot Threads</h3>
              </div>
              <div className="p-3 space-y-1">
                {partyPlotThreads.length > 0 && (
                  <>
                    {partyFaction && (
                      <p className="text-[10px] text-slate-600 uppercase tracking-wide px-1 pt-1 pb-0.5">{partyFaction.name}</p>
                    )}
                    {partyPlotThreads.map(t => (
                      <Link
                        key={t.id}
                        href={`/play/plot-threads/${t.id}`}
                        className="flex items-center justify-between rounded px-1 py-1.5 hover:bg-slate-700/50 transition-colors gap-2"
                      >
                        <span className="text-sm text-slate-100 hover:text-indigo-400 truncate">{t.title}</span>
                        <span className={`shrink-0 text-xs font-medium ${threadStatusColor[t.status] ?? 'text-slate-400'}`}>{t.status}</span>
                      </Link>
                    ))}
                  </>
                )}
                {pcPlotThreads.length > 0 && (
                  <>
                    <p className="text-[10px] text-slate-600 uppercase tracking-wide px-1 pt-2 pb-0.5">{pc.name}</p>
                    {pcPlotThreads.map(t => (
                      <Link
                        key={t.id}
                        href={`/play/plot-threads/${t.id}`}
                        className="flex items-center justify-between rounded px-1 py-1.5 hover:bg-slate-700/50 transition-colors gap-2"
                      >
                        <span className="text-sm text-slate-100 hover:text-indigo-400 truncate">{t.title}</span>
                        <span className={`shrink-0 text-xs font-medium ${threadStatusColor[t.status] ?? 'text-slate-400'}`}>{t.status}</span>
                      </Link>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

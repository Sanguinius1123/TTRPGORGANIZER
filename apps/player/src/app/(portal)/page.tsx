import { createClient } from '@/lib/supabase/server'
import { PlayerCharacter, Faction } from '@ttrpg/db'
import { redirect } from 'next/navigation'
import { CharacterForm } from './character/CharacterForm'
import Link from 'next/link'

type SearchParams = Promise<{ pc?: string }>

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const results = await Promise.all([
    supabase.from('player_characters').select('*').eq('profile_id', user.id).order('name'),
    supabase.from('species').select('id, name').order('name'),
    supabase.from('cultures').select('id, name').order('name'),
  ])

  const allMyPCs  = (results[0].data ?? []) as PlayerCharacter[]
  const speciesList  = (results[1].data ?? []) as Array<{ id: string; name: string }>
  const culturesList = (results[2].data ?? []) as Array<{ id: string; name: string }>

  if (allMyPCs.length === 0) {
    return (
      <div className="p-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-zinc-900 mb-6">My Character</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <p className="text-sm font-medium text-amber-800">No character assigned</p>
          <p className="text-sm text-amber-700 mt-1">
            Ask your GM to assign you a player character to unlock your character sheet.
          </p>
        </div>
      </div>
    )
  }

  // If multiple PCs, let the player pick with ?pc=<id>; default to first
  const pc = (params.pc ? allMyPCs.find(c => c.id === params.pc) : null) ?? allMyPCs[0]

  // Load faction memberships
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
  ])

  const factions     = (results2[0].data ?? []) as Pick<Faction, 'id' | 'name'>[]
  const partyMembers = (results2[1].data ?? []) as Array<{ id: string; name: string; player_name: string | null; species: string | null }>
  const partyFaction = results2[2].data as { id: string; name: string } | null

  const pcFactions = pcFactionRows
    .map(r => ({ faction: factions.find(f => f.id === r.faction_id), role: r.role }))
    .filter(r => r.faction)

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">{pc.name}</h1>
        {allMyPCs.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Character:</span>
            <div className="flex gap-1">
              {allMyPCs.map(c => (
                <Link
                  key={c.id}
                  href={c.id === pc.id ? '/' : `/?pc=${c.id}`}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    c.id === pc.id
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-zinc-300 text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-6 items-start">

        {/* ── Left: character form + factions ── */}
        <div className="flex-1 min-w-0 space-y-6">
          <div className="bg-white rounded-lg border border-zinc-200 p-6">
            <CharacterForm pc={pc} speciesList={speciesList} culturesList={culturesList} />
          </div>

          {pcFactions.length > 0 && (
            <div className="bg-white rounded-lg border border-zinc-200 p-5">
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Faction Memberships</h2>
              <ul className="space-y-1.5">
                {pcFactions.map(({ faction, role }) => (
                  <li key={faction!.id} className="flex items-center gap-2 text-sm">
                    <Link href={`/factions/${faction!.id}`} className="text-indigo-600 hover:underline font-medium">{faction!.name}</Link>
                    {role && <span className="text-zinc-400">· {role}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ── Right: party sidebar ── */}
        <div className="w-64 shrink-0">
          <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-zinc-100 bg-zinc-50">
              <h3 className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">
                {partyFaction ? partyFaction.name : 'Party'}
              </h3>
            </div>
            <div className="p-3 space-y-1">
              {!pc.party_faction_id ? (
                <p className="text-xs text-zinc-400 px-1 py-1">No party faction assigned.</p>
              ) : partyMembers.length === 0 ? (
                <p className="text-xs text-zinc-400 px-1 py-1">No other visible party members.</p>
              ) : (
                partyMembers.map(member => (
                  <div key={member.id} className="flex flex-col rounded px-1 py-2">
                    <span className="text-sm font-medium text-zinc-900">{member.name}</span>
                    {(member.player_name || member.species) && (
                      <span className="text-xs text-zinc-400">
                        {[member.player_name, member.species].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

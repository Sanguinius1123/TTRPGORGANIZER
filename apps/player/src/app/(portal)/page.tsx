import { createClient } from '@/lib/supabase/server'
import { PlayerCharacter, Faction } from '@ttrpg/db'
import { redirect } from 'next/navigation'
import { CharacterForm } from './character/CharacterForm'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const results = await Promise.all([
    supabase.from('player_characters').select('*').eq('profile_id', user.id).maybeSingle(),
    supabase.from('species').select('id, name').order('name'),
    supabase.from('cultures').select('id, name').order('name'),
  ])

  const raw = results[0].data
  const speciesList   = (results[1].data ?? []) as Array<{ id: string; name: string }>
  const culturesList  = (results[2].data ?? []) as Array<{ id: string; name: string }>

  if (!raw) {
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

  const pc = raw as PlayerCharacter

  // Load faction memberships
  const { data: rawPCFactions } = await supabase
    .from('pc_factions').select('faction_id, role').eq('pc_id', pc.id)
  const pcFactionRows = (rawPCFactions ?? []) as Array<{ faction_id: string; role: string | null }>
  const factionIds = pcFactionRows.map(r => r.faction_id)

  // Load party members (other visible PCs sharing the same party_faction_id)
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

  const factions = (results2[0].data ?? []) as Pick<Faction, 'id' | 'name'>[]
  const partyMembers = (results2[1].data ?? []) as Array<{ id: string; name: string; player_name: string | null; species: string | null }>
  const partyFaction = results2[2].data as { id: string; name: string } | null

  const pcFactions = pcFactionRows
    .map(r => ({ faction: factions.find(f => f.id === r.faction_id), role: r.role }))
    .filter(r => r.faction)

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">{pc.name}</h1>

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
                  <Link
                    key={member.id}
                    href={`/npcs`}
                    className="flex flex-col rounded px-1 py-2 hover:bg-zinc-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-zinc-900">{member.name}</span>
                    {(member.player_name || member.species) && (
                      <span className="text-xs text-zinc-400">
                        {[member.player_name, member.species].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

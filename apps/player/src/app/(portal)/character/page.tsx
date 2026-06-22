import { createClient } from '@/lib/supabase/server'
import { PlayerCharacter, Faction } from '@ttrpg/db'
import { notFound, redirect } from 'next/navigation'
import { CharacterForm } from './CharacterForm'

export default async function CharacterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const results = await Promise.all([
    supabase.from('player_characters').select('*').eq('profile_id', user.id).maybeSingle(),
    supabase.from('species').select('id, name').order('name'),
    supabase.from('cultures').select('id, name').order('name'),
  ])

  const raw = results[0].data
  if (!raw) notFound()
  const pc = raw as PlayerCharacter
  const speciesList = (results[1].data ?? []) as Array<{ id: string; name: string }>
  const culturesList = (results[2].data ?? []) as Array<{ id: string; name: string }>

  // Load faction memberships — cast results to avoid never inference with @supabase/ssr
  const { data: rawPCFactions } = await supabase
    .from('pc_factions')
    .select('faction_id, role')
    .eq('pc_id', pc.id)
  const pcFactionRows = (rawPCFactions ?? []) as Array<{ faction_id: string; role: string | null }>
  const factionIds = pcFactionRows.map(r => r.faction_id)
  let factions: Pick<Faction, 'id' | 'name'>[] = []
  if (factionIds.length > 0) {
    const { data } = await supabase.from('factions').select('id, name').in('id', factionIds)
    factions = (data ?? []) as Pick<Faction, 'id' | 'name'>[]
  }
  const pcFactions = pcFactionRows.map(r => ({
    faction: factions.find(f => f.id === r.faction_id),
    role: r.role,
  })).filter(r => r.faction)

  return (
    <div className="p-8 max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-zinc-900">My Character</h1>

      <CharacterForm pc={pc} speciesList={speciesList} culturesList={culturesList} />

      {pcFactions.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">Faction Memberships</h2>
          <ul className="space-y-1">
            {pcFactions.map(({ faction, role }) => (
              <li key={faction!.id} className="flex items-center gap-2 text-sm">
                <a href={`/factions/${faction!.id}`} className="text-indigo-600 hover:underline font-medium">{faction!.name}</a>
                {role && <span className="text-zinc-400">· {role}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

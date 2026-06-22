import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const results = await Promise.all([
    supabase.from('locations').select('id', { count: 'exact', head: true }).eq('visible', true),
    supabase.from('npcs').select('id', { count: 'exact', head: true }).eq('visible', true),
    supabase.from('factions').select('id', { count: 'exact', head: true }).eq('visible', true),
    supabase.from('lore_entries').select('id', { count: 'exact', head: true }).eq('visible', true),
    supabase.from('sessions').select('id', { count: 'exact', head: true }),
    supabase.from('player_characters').select('id, name').eq('profile_id', user!.id).maybeSingle(),
  ])

  const myPC = results[5].data as { id: string; name: string } | null

  const stats = [
    { label: 'Locations',    count: results[0].count ?? 0, href: '/locations' },
    { label: 'NPCs',         count: results[1].count ?? 0, href: '/npcs' },
    { label: 'Factions',     count: results[2].count ?? 0, href: '/factions' },
    { label: 'Lore Entries', count: results[3].count ?? 0, href: '/lore' },
    { label: 'Sessions',     count: results[4].count ?? 0, href: '/sessions' },
  ]

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Welcome back</h1>
        {myPC && (
          <p className="mt-1 text-sm text-zinc-500">
            Playing as{' '}
            <a href="/character" className="text-indigo-600 hover:underline font-medium">{myPC.name}</a>
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, count, href }) => (
          <a
            key={label}
            href={href}
            className="bg-white rounded-lg border border-zinc-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all"
          >
            <p className="text-3xl font-bold text-zinc-900">{count}</p>
            <p className="text-sm text-zinc-500 mt-1">{label}</p>
          </a>
        ))}
      </div>

      {!myPC && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
          <p className="text-sm font-medium text-amber-800">No character assigned</p>
          <p className="text-sm text-amber-700 mt-1">
            Ask your GM to assign you a player character to unlock the character sheet and session notes.
          </p>
        </div>
      )}
    </div>
  )
}

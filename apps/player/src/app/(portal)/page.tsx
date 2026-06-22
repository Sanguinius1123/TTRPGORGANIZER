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

  const [locations, npcs, factions, lore, sessions, myPC] = results

  const stats = [
    { label: 'Locations',    count: locations.count ?? 0, href: '/locations' },
    { label: 'NPCs',         count: npcs.count ?? 0,      href: '/npcs' },
    { label: 'Factions',     count: factions.count ?? 0,  href: '/factions' },
    { label: 'Lore Entries', count: lore.count ?? 0,      href: '/lore' },
    { label: 'Sessions',     count: sessions.count ?? 0,  href: '/sessions' },
  ]

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Welcome back</h1>
        {myPC.data && (
          <p className="mt-1 text-sm text-zinc-500">
            Playing as <a href="/character" className="text-indigo-600 hover:underline font-medium">{myPC.data.name}</a>
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stats.map(({ label, count, href }) => (
          <a key={label} href={href} className="rounded-lg bg-white border border-zinc-200 p-4 hover:border-indigo-300 transition-colors">
            <p className="text-2xl font-bold text-zinc-900">{count}</p>
            <p className="text-sm text-zinc-500 mt-0.5">{label}</p>
          </a>
        ))}
      </div>
    </div>
  )
}

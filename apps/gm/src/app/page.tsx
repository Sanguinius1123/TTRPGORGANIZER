import { db } from '@/lib/db'
import Link from 'next/link'

const sections = [
  { label: 'Locations', href: '/locations', table: 'locations' as const },
  { label: 'NPCs', href: '/npcs', table: 'npcs' as const },
  { label: 'Player Characters', href: '/player-characters', table: 'player_characters' as const },
  { label: 'Factions', href: '/factions', table: 'factions' as const },
  { label: 'Items', href: '/items', table: 'items' as const },
  { label: 'Sessions', href: '/sessions', table: 'sessions' as const },
  { label: 'Encounters', href: '/encounters', table: 'encounters' as const },
  { label: 'Plot Threads', href: '/plot-threads', table: 'plot_threads' as const },
  { label: 'Lore Entries', href: '/lore', table: 'lore_entries' as const },
]

export default async function DashboardPage() {
  const supabase = db()

  const counts = await Promise.all(
    sections.map(async ({ table }) => {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      return count ?? 0
    })
  )

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-100 mb-1">Dashboard</h1>
      <p className="text-sm text-slate-500 mb-8">Your campaign at a glance.</p>

      <div className="grid grid-cols-3 gap-4">
        {sections.map(({ label, href }, i) => (
          <Link
            key={href}
            href={href}
            className="bg-slate-800 rounded-lg border border-slate-700 p-5 hover:border-indigo-300 hover:shadow-sm transition-all"
          >
            <p className="text-3xl font-bold text-slate-100">{counts[i]}</p>
            <p className="text-sm text-slate-500 mt-1">{label}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  {
    group: 'Campaign',
    items: [
      { label: 'Dashboard', href: '/' },
      { label: 'Settings', href: '/settings' },
    ],
  },
  {
    group: 'Setting',
    items: [
      { label: 'Locations', href: '/locations' },
      { label: 'Lore & Knowledge', href: '/lore' },
    ],
  },
  {
    group: 'People',
    items: [
      { label: 'NPCs', href: '/npcs' },
      { label: 'Player Characters', href: '/player-characters' },
      { label: 'Factions', href: '/factions' },
    ],
  },
  {
    group: 'Commerce',
    items: [{ label: 'Items', href: '/items' }],
  },
  {
    group: 'Story',
    items: [
      { label: 'Sessions', href: '/sessions' },
      { label: 'Encounters', href: '/encounters' },
      { label: 'Plot Threads', href: '/plot-threads' },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <aside className="w-56 shrink-0 bg-slate-950 flex flex-col overflow-y-auto">
      <div className="px-4 py-5 border-b border-slate-700">
        <span className="text-white font-semibold text-sm tracking-wide">TTRPG Organizer</span>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-6">
        {nav.map(({ group, items }) => (
          <div key={group}>
            <p className="px-3 mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {group}
            </p>
            {items.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive(href)
                    ? 'bg-slate-700 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  {
    group: 'Campaign',
    items: [
      { label: 'Dashboard', href: '/' },
    ],
  },
  {
    group: 'Setting',
    items: [
      { label: 'Map', href: '/map' },
      { label: 'Locations', href: '/locations' },
      { label: 'Lore & Knowledge', href: '/lore' },
      { label: 'Timeline', href: '/lore/timeline', sub: true },
      { label: 'Species', href: '/species', sub: true },
      { label: 'Cultures', href: '/cultures', sub: true },
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

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    if (href === '/settings') return pathname === '/settings'
    if (href === '/lore') return pathname === '/lore' || (pathname.startsWith('/lore/') && !pathname.startsWith('/lore/timeline'))
    return pathname.startsWith(href)
  }

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
            {items.map(({ label, href, sub }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center rounded-md text-sm transition-colors ${
                  sub ? 'pl-6 pr-3 py-1.5' : 'px-3 py-2'
                } ${
                  isActive(href)
                    ? 'bg-slate-700 text-white font-medium'
                    : sub
                    ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`}
              >
                {sub && <span className="mr-1.5 text-slate-600">·</span>}
                {label}
              </Link>
            ))}
          </div>
        ))}

        {isAdmin && (
          <div>
            <p className="px-3 mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Admin
            </p>
            <Link
              href="/settings"
              className={`flex items-center rounded-md text-sm transition-colors px-3 py-2 ${
                isActive('/settings')
                  ? 'bg-slate-700 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`}
            >
              Settings
            </Link>
          </div>
        )}
      </nav>
      <div className="px-2 pb-4 border-t border-slate-700 pt-4">
        <Link
          href="/play"
          className="flex items-center px-3 py-2 rounded-md text-sm text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
        >
          View as Player →
        </Link>
      </div>
    </aside>
  )
}

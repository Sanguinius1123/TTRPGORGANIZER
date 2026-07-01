'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  {
    group: 'People',
    items: [
      { label: 'Player Characters', href: '/player-characters' },
      { label: 'NPCs', href: '/npcs' },
      { label: 'Factions', href: '/factions' },
      { label: 'Watch Overview', href: '/watch-overview' },
    ],
  },
  {
    group: 'Story',
    items: [
      { label: 'Sessions', href: '/sessions' },
      { label: 'Plot Threads', href: '/plot-threads' },
      { label: 'Encounters', href: '/encounters' },
    ],
  },
  {
    group: 'Setting',
    items: [
      { label: 'Map', href: '/map' },
      { label: 'Locations', href: '/locations' },
      { label: 'Lore & Knowledge', href: '/lore' },
      { label: 'Species', href: '/species', sub: true },
      { label: 'Cultures', href: '/cultures', sub: true },
      { label: 'Timeline', href: '/lore/timeline' },
    ],
  },
  {
    group: 'Commerce',
    items: [{ label: 'Items', href: '/items' }],
  },
]

export function Sidebar({ isAdmin, activeCampaignName }: { isAdmin: boolean; activeCampaignName?: string }) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    if (href === '/settings') return pathname === '/settings'
    if (href === '/lore') return pathname === '/lore' || (pathname.startsWith('/lore/') && !pathname.startsWith('/lore/timeline'))
    return pathname.startsWith(href)
  }

  const linkCls = (href: string, sub?: boolean) => `flex items-center rounded-md text-sm transition-colors ${
    sub ? 'pl-6 pr-3 py-1' : 'px-3 py-1.5'
  } ${
    isActive(href)
      ? 'bg-slate-700 text-white font-medium'
      : sub
      ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
  }`

  return (
    <aside className="w-56 shrink-0 bg-slate-950 flex flex-col overflow-y-auto">
      <div className="px-4 py-5 border-b border-slate-700">
        <span className="text-white font-semibold text-sm tracking-wide">TTRPG Organizer</span>
      </div>
      {activeCampaignName && (
        <div className="px-4 py-2 border-b border-slate-700/50 bg-slate-900/50">
          <Link href="/" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium truncate block">
            {activeCampaignName}
          </Link>
        </div>
      )}
      <nav className="flex-1 px-2 py-3 space-y-3">

        {/* Dashboard — standalone, no group label */}
        <Link href="/" className={linkCls('/')}>
          Dashboard
        </Link>

        {nav.map(({ group, items }) => (
          <div key={group}>
            <p className="px-3 pt-1 pb-0.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {group}
            </p>
            {items.map(({ label, href, sub }) => (
              <Link key={href} href={href} className={linkCls(href, sub)}>
                {sub && <span className="mr-1.5 text-slate-600">·</span>}
                {label}
              </Link>
            ))}
          </div>
        ))}

        {isAdmin && (
          <div>
            <p className="px-3 pt-1 pb-0.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Admin
            </p>
            <Link href="/settings" className={linkCls('/settings')}>
              Settings
            </Link>
          </div>
        )}
      </nav>
      <div className="px-2 pb-4 border-t border-slate-700 pt-4">
        <Link
          href="/play"
          className="flex items-center px-3 py-1.5 rounded-md text-sm text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
        >
          View as Player →
        </Link>
      </div>
    </aside>
  )
}

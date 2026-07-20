'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type NavItem = {
  label: string
  href: string
  exact?: boolean
  children?: { label: string; href: string }[]
}

const navItems: NavItem[] = [
  { label: 'My Character',    href: '/play', exact: true },
  { label: 'Objectives',      href: '/play/objectives' },
  { label: 'My Watchlist',   href: '/play/watchlist' },
  { label: 'Sessions',        href: '/play/sessions' },
  { label: 'Map',             href: '/play/map' },
  { label: 'Locations',       href: '/play/locations' },
  { label: 'NPCs',            href: '/play/npcs' },
  { label: 'Factions',        href: '/play/factions' },
  {
    label: 'Lore & Knowledge', href: '/play/lore',
    children: [
      { label: 'Species',  href: '/play/species' },
      { label: 'Cultures', href: '/play/cultures' },
    ],
  },
  { label: 'Timeline', href: '/play/lore/timeline' },
]

export function PlayerNav({ displayName, isGm }: { displayName: string; isGm: boolean }) {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    if (href === '/play/lore') return pathname === '/play/lore' || (pathname.startsWith('/play/lore/') && pathname !== '/play/lore/timeline' && !pathname.startsWith('/play/species') && !pathname.startsWith('/play/cultures'))
    return pathname === href || pathname.startsWith(href + '/')
  }

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-52 shrink-0 bg-slate-950 flex flex-col overflow-y-auto">
      <div className="px-4 py-5 border-b border-slate-700">
        <span className="text-white font-semibold text-sm tracking-wide">TTRPG Organizer</span>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => (
          <div key={item.href}>
            <Link
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                isActive(item.href, item.exact)
                  ? 'bg-slate-700 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`}
            >
              {item.label}
            </Link>
            {item.children?.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className={`flex items-center pl-7 pr-3 py-1.5 rounded-md text-xs transition-colors ${
                  pathname === child.href || pathname.startsWith(child.href + '/')
                    ? 'text-indigo-400 font-medium'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span className="mr-2 text-slate-600">·</span>
                {child.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-slate-700 space-y-1">
        {isGm && (
          <Link
            href="/"
            className="block text-xs text-indigo-400 hover:text-indigo-300 transition-colors py-1"
          >
            GM Portal →
          </Link>
        )}
        <p className="text-xs text-slate-500 truncate">{displayName}</p>
        <button
          onClick={signOut}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}

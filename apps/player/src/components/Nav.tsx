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
  { label: 'My Character', href: '/', exact: true },
  { label: 'Sessions',     href: '/sessions' },
  { label: 'Map',          href: '/map' },
  { label: 'Locations',    href: '/locations' },
  { label: 'NPCs',         href: '/npcs' },
  { label: 'Factions',     href: '/factions' },
  {
    label: 'Lore', href: '/lore',
    children: [
      { label: 'Timeline', href: '/lore/timeline' },
    ],
  },
]

export function Nav({ displayName }: { displayName: string }) {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || (pathname.startsWith(href + '/') && href !== '/lore/timeline')

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
                  pathname === child.href
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

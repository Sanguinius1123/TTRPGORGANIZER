'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { label: 'My Character', href: '/' },
  { label: 'Sessions',     href: '/sessions' },
  { label: 'Locations',    href: '/locations' },
  { label: 'NPCs',         href: '/npcs' },
  { label: 'Factions',     href: '/factions' },
  { label: 'Lore',         href: '/lore' },
]

export function Nav({ displayName }: { displayName: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href)

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-52 shrink-0 bg-zinc-900 flex flex-col overflow-y-auto">
      <div className="px-4 py-5 border-b border-zinc-700">
        <span className="text-white font-semibold text-sm tracking-wide">TTRPG Organizer</span>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
              isActive(href)
                ? 'bg-zinc-700 text-white font-medium'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-zinc-700 space-y-1">
        <p className="text-xs text-zinc-500 truncate">{displayName}</p>
        <button
          onClick={signOut}
          className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}

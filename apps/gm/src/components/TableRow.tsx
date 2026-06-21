'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Makes an entire <tr> navigate to href on click
export function ClickableRow({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  const router = useRouter()
  return (
    <tr className={`${className ?? ''} cursor-pointer`} onClick={() => router.push(href)}>
      {children}
    </tr>
  )
}

// A link inside a ClickableRow — stops the click from also triggering row navigation
export function SubLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={className} onClick={e => e.stopPropagation()}>
      {children}
    </Link>
  )
}

// A <td> inside a ClickableRow that blocks row navigation — use for visibility toggles
export function StopPropCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={className} onClick={e => e.stopPropagation()}>
      {children}
    </td>
  )
}

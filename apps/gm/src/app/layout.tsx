import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { Sidebar } from '@/components/Sidebar'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TTRPG Organizer — GM',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.className}>
      <body className="flex h-screen overflow-hidden bg-zinc-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </body>
    </html>
  )
}

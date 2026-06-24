import { db } from '@/lib/db'
import { createAnonClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'

export default async function GmLayout({ children }: { children: React.ReactNode }) {
  const anonClient = await createAnonClient()
  const { data: { user } } = await anonClient.auth.getUser()
  if (!user) redirect('/login')

  const supabase = db()
  const { data: profile } = await supabase.from('profiles').select('is_gm, is_admin').eq('id', user.id).single()
  if (!profile?.is_gm) redirect('/play')

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900">
      <Sidebar isAdmin={profile.is_admin ?? false} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}

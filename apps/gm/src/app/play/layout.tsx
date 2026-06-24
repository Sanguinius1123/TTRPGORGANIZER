import { createAnonClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PlayerNav } from '@/components/PlayerNav'

export default async function PlayLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createAnonClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, is_gm')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900">
      <PlayerNav
        displayName={profile?.display_name ?? user.email ?? 'Player'}
        isGm={profile?.is_gm ?? false}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}

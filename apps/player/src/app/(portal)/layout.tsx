import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Nav } from '@/components/Nav'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  const { data: myPC } = await supabase
    .from('player_characters')
    .select('id, name')
    .eq('profile_id', user.id)
    .maybeSingle()

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <Nav displayName={profile?.display_name ?? user.email ?? 'Player'} myPCId={myPC?.id ?? null} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}

import { createAnonClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { PlayerNav } from '@/components/PlayerNav'
import { DiceRoller } from '@/components/DiceRoller'
import { getActivePcId } from '@/lib/activePC'
import { getPlayCampaignId } from '@/lib/playCampaign'

export default async function PlayLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createAnonClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, is_gm')
    .eq('id', user.id)
    .single()

  const [pcId, campaignId] = await Promise.all([
    getActivePcId(),
    getPlayCampaignId(),
  ])

  let pcName: string | undefined
  if (pcId) {
    const supabaseDb = db()
    const { data: rawPc } = await supabaseDb
      .from('player_characters')
      .select('id, name')
      .eq('id', pcId)
      .eq('profile_id', user.id)
      .single()
    pcName = (rawPc as { id: string; name: string } | null)?.name
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900">
      <PlayerNav
        displayName={profile?.display_name ?? user.email ?? 'Player'}
        isGm={profile?.is_gm ?? false}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <DiceRoller
        mode="player"
        campaignId={campaignId}
        pcId={pcId ?? undefined}
        pcName={pcName}
      />
    </div>
  )
}

import { db } from '@/lib/db'
import { createAnonClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { Sidebar } from '@/components/Sidebar'
import { DiceRoller } from '@/components/DiceRoller'
import { CAMPAIGN_COOKIE } from '@/lib/activeCampaign'

export default async function GmLayout({ children }: { children: React.ReactNode }) {
  const anonClient = await createAnonClient()
  const { data: { user } } = await anonClient.auth.getUser()
  if (!user) redirect('/login')

  const supabase = db()
  const { data: profile } = await supabase.from('profiles').select('is_gm, is_admin').eq('id', user.id).single()
  if (!profile?.is_gm) redirect('/play')

  const store = await cookies()
  let activeCampaignId = store.get(CAMPAIGN_COOKIE)?.value ?? null
  let activeCampaignName: string | undefined

  if (!activeCampaignId) {
    const { data: rawCampaigns } = await supabase.from('campaigns').select('id, name').order('created_at').limit(1)
    const firstCampaign = (rawCampaigns ?? [])[0] as { id: string; name: string } | undefined
    if (firstCampaign) {
      activeCampaignId = firstCampaign.id
      activeCampaignName = firstCampaign.name
    }
  } else {
    const { data: rawCampaign } = await supabase.from('campaigns').select('name').eq('id', activeCampaignId).single()
    activeCampaignName = (rawCampaign as { name: string } | null)?.name
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900">
      <Sidebar isAdmin={profile.is_admin ?? false} activeCampaignName={activeCampaignName} />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <DiceRoller mode="gm" campaignId={activeCampaignId} />
    </div>
  )
}

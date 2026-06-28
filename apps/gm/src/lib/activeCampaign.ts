import { cookies } from 'next/headers'

export const CAMPAIGN_COOKIE = 'active_campaign_id'

export async function getActiveCampaignId(): Promise<string | null> {
  const store = await cookies()
  return store.get(CAMPAIGN_COOKIE)?.value ?? null
}

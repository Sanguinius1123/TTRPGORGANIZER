'use server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { CAMPAIGN_COOKIE } from '@/lib/activeCampaign'
import type { Campaign } from '@ttrpg/db'

export async function getCampaigns(): Promise<Campaign[]> {
  const supabase = db()
  const { data } = await supabase.from('campaigns').select('*').order('created_at')
  return (data ?? []) as Campaign[]
}

export async function createCampaign(formData: FormData) {
  const supabase = db()
  const name = formData.get('name') as string
  const description = (formData.get('description') as string) || null
  const { data, error } = await supabase
    .from('campaigns')
    .insert({ name, description })
    .select()
    .single()
  if (error) throw new Error(error.message)
  const campaign = data as Campaign
  const store = await cookies()
  store.set(CAMPAIGN_COOKIE, campaign.id, { path: '/' })
  revalidatePath('/')
  redirect('/')
}

export async function switchCampaign(campaignId: string) {
  const store = await cookies()
  store.set(CAMPAIGN_COOKIE, campaignId, { path: '/' })
  revalidatePath('/', 'layout')
  redirect('/')
}

'use server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { CAMPAIGN_COOKIE } from '@/lib/activeCampaign'
import type { Campaign } from '@ttrpg/db'

export async function deleteCampaign(formData: FormData) {
  const id = formData.get('campaign_id') as string
  if (!id) return
  const supabase = db()
  await supabase.from('campaigns').delete().eq('id', id)
  // Clear the active campaign cookie if it pointed to the deleted campaign
  const store = await cookies()
  if (store.get(CAMPAIGN_COOKIE)?.value === id) {
    store.delete(CAMPAIGN_COOKIE)
  }
  revalidatePath('/settings')
  revalidatePath('/')
  redirect('/settings')
}

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

export async function updateCampaign(formData: FormData) {
  const supabase = db()
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const description = (formData.get('description') as string) || null
  await supabase.from('campaigns').update({ name, description }).eq('id', id)
  revalidatePath('/')
}

export async function switchCampaign(campaignId: string) {
  const store = await cookies()
  store.set(CAMPAIGN_COOKIE, campaignId, { path: '/' })
  revalidatePath('/', 'layout')
  redirect('/')
}

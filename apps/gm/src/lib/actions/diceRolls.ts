'use server'
import { db } from '@/lib/db'
import { getActiveCampaignId } from '@/lib/activeCampaign'
import { getPlayCampaignId } from '@/lib/playCampaign'
import { revalidatePath } from 'next/cache'
import type { DiceRoll } from '@ttrpg/db'

function parseDice(notation: string): { individual_rolls: number[]; total: number } {
  const match = notation.trim().match(/^(\d*)d(\d+)([+-]\d+)?$/i)
  if (!match) throw new Error('Invalid dice notation. Use format like 2d6, 1d20+5, d8-1')
  const count = parseInt(match[1] || '1')
  const sides = parseInt(match[2])
  const modifier = parseInt(match[3] || '0')
  if (count < 1 || count > 100 || sides < 2 || sides > 1000) throw new Error('Invalid dice values')
  const individual_rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1)
  const total = individual_rolls.reduce((a, b) => a + b, 0) + modifier
  return { individual_rolls, total }
}

// GM roll — uses service role, campaign from cookie
export async function rollDiceGm(formData: FormData): Promise<{ roll: DiceRoll | null; error: string | null }> {
  const supabase = db()
  const notation = (formData.get('notation') as string ?? '').trim()
  const description = (formData.get('description') as string ?? '').trim() || null

  let parsed: { individual_rolls: number[]; total: number }
  try { parsed = parseDice(notation) } catch (e) { return { roll: null, error: (e as Error).message } }

  const campaignId = await getActiveCampaignId()
  if (!campaignId) return { roll: null, error: 'No active campaign' }

  const { data, error } = await supabase
    .from('dice_rolls')
    .insert({
      campaign_id: campaignId,
      rolled_by_name: 'GM',
      dice_notation: notation,
      individual_rolls: parsed.individual_rolls,
      total: parsed.total,
      description,
    })
    .select()
    .single()

  if (error) return { roll: null, error: error.message }
  revalidatePath('/')
  return { roll: data as DiceRoll, error: null }
}

// Player roll — uses anon client (RLS), pc_id from cookie
export async function rollDicePlayer(formData: FormData, pcId: string, pcName: string): Promise<{ roll: DiceRoll | null; error: string | null }> {
  const { createAnonClient } = await import('@/lib/supabase/server')
  const supabase = await createAnonClient()
  const notation = (formData.get('notation') as string ?? '').trim()
  const description = (formData.get('description') as string ?? '').trim() || null

  let parsed: { individual_rolls: number[]; total: number }
  try { parsed = parseDice(notation) } catch (e) { return { roll: null, error: (e as Error).message } }

  const campaignId = await getPlayCampaignId()
  if (!campaignId) return { roll: null, error: 'No active campaign' }

  const { data, error } = await supabase
    .from('dice_rolls')
    .insert({
      campaign_id: campaignId,
      rolled_by_pc_id: pcId,
      rolled_by_name: pcName,
      dice_notation: notation,
      individual_rolls: parsed.individual_rolls,
      total: parsed.total,
      description,
    })
    .select()
    .single()

  if (error) return { roll: null, error: error.message }
  return { roll: data as DiceRoll, error: null }
}

export async function getRecentRolls(campaignId: string): Promise<DiceRoll[]> {
  const supabase = db()
  const { data } = await supabase
    .from('dice_rolls')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })
    .limit(20)
  return (data ?? []) as DiceRoll[]
}

'use server'
import { db } from '@/lib/db'
import { requireGm } from '@/lib/authGuard'
import { getActiveCampaignId } from '@/lib/activeCampaign'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ── GM actions ────────────────────────────────────────────────────────────────

export async function createPosting(formData: FormData) {
  await requireGm()
  const campaignId = await getActiveCampaignId()
  if (!campaignId) return

  const supabase = db()
  const originLocationId = (formData.get('origin_location_id') as string) || null
  const postedByNpcId    = (formData.get('posted_by_npc_id') as string) || null
  const postedByFactionId = (formData.get('posted_by_faction_id') as string) || null

  // New postings go to the bottom of the active sort order
  const { data: last } = await supabase
    .from('board_postings')
    .select('sort_order')
    .eq('campaign_id', campaignId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()
  const sortOrder = last ? (last as { sort_order: number }).sort_order + 1000 : 1000

  const { data } = await supabase.from('board_postings').insert({
    campaign_id:          campaignId,
    title:                formData.get('title') as string,
    description:          (formData.get('description') as string) || null,
    gm_notes:             (formData.get('gm_notes') as string) || null,
    board_label:          (formData.get('board_label') as string) || null,
    origin_location_id:   originLocationId,
    posted_by_npc_id:     postedByNpcId,
    posted_by_faction_id: postedByFactionId,
    posted_by_name:       (formData.get('posted_by_name') as string) || null,
    difficulty:           (formData.get('difficulty') as string) || 'unknown',
    reward:               (formData.get('reward') as string) || null,
    deadline:             (formData.get('deadline') as string) || null,
    visible:              formData.get('visible') !== 'false',
    sort_order:           sortOrder,
  }).select('id').single()

  if (data) redirect(`/objectives/${(data as { id: string }).id}`)
}

export async function updatePosting(id: string, formData: FormData) {
  await requireGm()
  const supabase = db()

  const originLocationId = (formData.get('origin_location_id') as string) || null
  const postedByNpcId    = (formData.get('posted_by_npc_id') as string) || null
  const postedByFactionId = (formData.get('posted_by_faction_id') as string) || null

  await supabase.from('board_postings').update({
    title:                formData.get('title') as string,
    description:          (formData.get('description') as string) || null,
    gm_notes:             (formData.get('gm_notes') as string) || null,
    board_label:          (formData.get('board_label') as string) || null,
    origin_location_id:   originLocationId,
    posted_by_npc_id:     postedByNpcId,
    posted_by_faction_id: postedByFactionId,
    posted_by_name:       (formData.get('posted_by_name') as string) || null,
    difficulty:           (formData.get('difficulty') as string) || 'unknown',
    reward:               (formData.get('reward') as string) || null,
    deadline:             (formData.get('deadline') as string) || null,
  }).eq('id', id)

  revalidatePath('/objectives')
  revalidatePath(`/objectives/${id}`)
}

export async function setPostingStatus(id: string, status: string) {
  await requireGm()
  const supabase = db()
  const isArchive = ['completed', 'expired', 'failed', 'abandoned'].includes(status)
  await supabase.from('board_postings').update(
    isArchive
      ? { status, resolved_at: new Date().toISOString() }
      : { status }
  ).eq('id', id)
  revalidatePath('/objectives')
  revalidatePath(`/objectives/${id}`)
}

export async function togglePostingVisible(id: string, visible: boolean) {
  await requireGm()
  await db().from('board_postings').update({ visible }).eq('id', id)
  revalidatePath('/objectives')
}

export async function deletePosting(id: string) {
  await requireGm()
  await db().from('board_postings').delete().eq('id', id)
  redirect('/objectives')
}

export async function updateGmNotes(id: string, gm_notes: string) {
  await requireGm()
  await db().from('board_postings').update({ gm_notes: gm_notes || null }).eq('id', id)
  revalidatePath(`/objectives/${id}`)
}

// ── Shared GM + Player actions ────────────────────────────────────────────────

export async function claimPosting(id: string) {
  const supabase = db()
  await supabase.from('board_postings').update({ status: 'active' }).eq('id', id)
  revalidatePath('/objectives')
  revalidatePath('/play/objectives')
}

export async function untrackPosting(id: string) {
  const supabase = db()
  await supabase.from('board_postings').update({ status: 'open' }).eq('id', id)
  revalidatePath('/objectives')
  revalidatePath('/play/objectives')
}

export async function updatePartyNotes(id: string, party_notes: string) {
  const supabase = db()
  await supabase.from('board_postings').update({ party_notes: party_notes || null }).eq('id', id)
  revalidatePath(`/objectives/${id}`)
  revalidatePath('/play/objectives')
}

export async function updateSortOrders(updates: Array<{ id: string; sort_order: number }>) {
  const supabase = db()
  await Promise.all(
    updates.map(({ id, sort_order }) =>
      supabase.from('board_postings').update({ sort_order }).eq('id', id)
    )
  )
  revalidatePath('/objectives')
  revalidatePath('/play/objectives')
}

// ── Player-only actions ───────────────────────────────────────────────────────

export async function createPlayerPosting(formData: FormData) {
  const supabase = db()
  const campaignId = formData.get('campaign_id') as string
  const pcId       = formData.get('pc_id') as string
  const hidden     = formData.get('hidden_goal') === 'true'

  const { data: last } = await supabase
    .from('board_postings')
    .select('sort_order')
    .eq('campaign_id', campaignId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()
  const sortOrder = last ? (last as { sort_order: number }).sort_order + 1000 : 1000

  await supabase.from('board_postings').insert({
    campaign_id:      campaignId,
    title:            formData.get('title') as string,
    description:      (formData.get('description') as string) || null,
    status:           'active',
    difficulty:       'unknown',
    visible:          true,
    created_by_pc_id: pcId,
    hidden_goal:      hidden,
    sort_order:       sortOrder,
  })

  revalidatePath('/play/objectives')
}

export async function publishHiddenGoal(id: string) {
  const supabase = db()
  await supabase.from('board_postings').update({ hidden_goal: false }).eq('id', id)
  revalidatePath('/play/objectives')
  revalidatePath('/objectives')
}

export async function updatePostingSection(id: string, active_section: string | null) {
  const supabase = db()
  await supabase.from('board_postings').update({ active_section }).eq('id', id)
  revalidatePath('/play/objectives')
  revalidatePath('/objectives')
}

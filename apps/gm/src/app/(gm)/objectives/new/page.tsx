import { db } from '@/lib/db'
import { Location, NPC, Faction } from '@ttrpg/db'
import { getActiveCampaignId } from '@/lib/activeCampaign'
import { redirect } from 'next/navigation'
import { createPosting } from '@/lib/actions/boardPostings'
import MentionTextarea from '@/components/MentionTextarea'
import Link from 'next/link'

const input = 'block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none'
const label = 'block text-sm font-medium text-slate-300 mb-1'
const select = `${input} appearance-none`

const DIFFICULTIES = ['unknown', 'trivial', 'challenging', 'deadly', 'suicide'] as const
const DIFFICULTY_LABELS: Record<string, string> = {
  unknown: 'Unknown', trivial: 'Trivial', challenging: 'Challenging',
  deadly: 'Deadly', suicide: 'Suicide Mission',
}

export default async function NewObjectivePage() {
  const campaignId = await getActiveCampaignId()
  if (!campaignId) redirect('/')

  const supabase = db()
  const results = await Promise.all([
    supabase.from('locations').select('id, name').eq('campaign_id', campaignId).eq('waypoint', false).order('name'),
    supabase.from('npcs').select('id, name').eq('campaign_id', campaignId).order('name'),
    supabase.from('factions').select('id, name').eq('campaign_id', campaignId).order('name'),
  ])

  const locations = (results[0].data ?? []) as Array<Pick<Location, 'id' | 'name'>>
  const npcs      = (results[1].data ?? []) as Array<Pick<NPC, 'id' | 'name'>>
  const factions  = (results[2].data ?? []) as Array<Pick<Faction, 'id' | 'name'>>

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/objectives" className="text-sm text-slate-400 hover:text-slate-300">Story Board</Link>
        <span className="text-slate-600">/</span>
        <span className="text-sm text-slate-100 font-medium">New Posting</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-100 mb-6">New Posting</h1>

      <form action={createPosting} className="space-y-5">
        <input type="hidden" name="campaign_id" value={campaignId} />

        <div>
          <label className={label}>Title <span className="text-red-500">*</span></label>
          <input name="title" required autoFocus className={input} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Difficulty</label>
            <select name="difficulty" defaultValue="unknown" className={select}>
              {DIFFICULTIES.map(d => (
                <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Board Label</label>
            <input name="board_label" placeholder="e.g. Official Board" className={input} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Reward</label>
            <input name="reward" placeholder="e.g. 500 gold" className={input} />
          </div>
          <div>
            <label className={label}>Deadline</label>
            <input name="deadline" placeholder="e.g. Before the new moon" className={input} />
          </div>
        </div>

        <div>
          <label className={label}>Origin Location</label>
          <select name="origin_location_id" className={select}>
            <option value="">— None / Unknown —</option>
            {locations.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Posted By (NPC)</label>
            <select name="posted_by_npc_id" className={select}>
              <option value="">— None —</option>
              {npcs.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Posted By (Faction)</label>
            <select name="posted_by_faction_id" className={select}>
              <option value="">— None —</option>
              {factions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={label}>Posted By (Name — freetext)</label>
          <input name="posted_by_name" placeholder="e.g. Unknown merchant" className={input} />
        </div>

        <div>
          <label className={label}>Description</label>
          <MentionTextarea name="description" rows={5} className={`${input} resize-none`} />
        </div>

        <div className="bg-amber-950/30 border border-amber-800/40 rounded-lg p-4">
          <label className="block text-sm font-medium text-amber-400 mb-1">GM Notes (hidden from players)</label>
          <textarea name="gm_notes" rows={3}
            className="block w-full rounded-md border border-amber-800/40 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none" />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" name="visible" value="true" id="visible" defaultChecked
            className="rounded border-slate-600 bg-slate-700 text-indigo-500" />
          <label htmlFor="visible" className="text-sm text-slate-300">Visible to players</label>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Create Posting
          </button>
          <Link href="/objectives" className="rounded-md border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-600">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

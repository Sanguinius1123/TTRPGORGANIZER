import { db } from '@/lib/db'
import { BoardPosting, Location, NPC, Faction } from '@ttrpg/db'
import { getActiveCampaignId } from '@/lib/activeCampaign'
import { notFound, redirect } from 'next/navigation'
import { updatePosting, deletePosting, setPostingStatus } from '@/lib/actions/boardPostings'
import MentionTextarea from '@/components/MentionTextarea'
import Link from 'next/link'

const input = 'block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none'
const label = 'block text-sm font-medium text-slate-300 mb-1'
const sel = `${input} appearance-none`

const DIFFICULTIES = ['unknown', 'trivial', 'challenging', 'deadly', 'suicide'] as const
const DIFFICULTY_LABELS: Record<string, string> = {
  unknown: 'Unknown', trivial: 'Trivial', challenging: 'Challenging',
  deadly: 'Deadly', suicide: 'Suicide Mission',
}
const ARCHIVE_STATUSES = ['completed', 'failed', 'expired', 'abandoned'] as const
const STATUS_COLORS: Record<string, string> = {
  open: 'text-slate-400', active: 'text-indigo-300',
  completed: 'text-green-400', failed: 'text-red-400',
  expired: 'text-amber-400', abandoned: 'text-slate-500',
}

export default async function ObjectiveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const campaignId = await getActiveCampaignId()
  if (!campaignId) redirect('/')

  const supabase = db()
  const results = await Promise.all([
    supabase.from('board_postings').select('*').eq('id', id).single(),
    supabase.from('locations').select('id, name').eq('campaign_id', campaignId).eq('waypoint', false).order('name'),
    supabase.from('npcs').select('id, name').eq('campaign_id', campaignId).order('name'),
    supabase.from('factions').select('id, name').eq('campaign_id', campaignId).order('name'),
  ])

  const raw = results[0].data
  if (!raw) notFound()
  const posting = raw as BoardPosting

  const locations = (results[1].data ?? []) as Array<Pick<Location, 'id' | 'name'>>
  const npcs      = (results[2].data ?? []) as Array<Pick<NPC, 'id' | 'name'>>
  const factions  = (results[3].data ?? []) as Array<Pick<Faction, 'id' | 'name'>>

  const updateWithId = updatePosting.bind(null, id)
  const deleteWithId = deletePosting.bind(null, id)

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/objectives" className="text-sm text-slate-400 hover:text-slate-300">Story Board</Link>
        <span className="text-slate-600">/</span>
        <span className="text-sm text-slate-100 font-medium truncate">{posting.title}</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{posting.title}</h1>
          <p className={`text-sm mt-1 capitalize ${STATUS_COLORS[posting.status] ?? 'text-slate-400'}`}>
            {posting.status}
            {!posting.visible && <span className="ml-2 text-slate-500 text-xs">(hidden from players)</span>}
          </p>
        </div>
        {/* Status transition buttons */}
        <div className="flex gap-2">
          {posting.status === 'open' && (
            <form action={setPostingStatus.bind(null, id, 'active')}>
              <button className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">
                Mark Active
              </button>
            </form>
          )}
          {posting.status === 'active' && ARCHIVE_STATUSES.map(s => (
            <form key={s} action={setPostingStatus.bind(null, id, s)}>
              <button className="rounded-md border border-slate-600 bg-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-600 capitalize">
                {s}
              </button>
            </form>
          ))}
        </div>
      </div>

      <form action={updateWithId} className="space-y-5">
        <div>
          <label className={label}>Title <span className="text-red-500">*</span></label>
          <input name="title" required defaultValue={posting.title} className={input} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Difficulty</label>
            <select name="difficulty" defaultValue={posting.difficulty} className={sel}>
              {DIFFICULTIES.map(d => <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Board Label</label>
            <input name="board_label" defaultValue={posting.board_label ?? ''} placeholder="e.g. Official Board" className={input} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Reward</label>
            <input name="reward" defaultValue={posting.reward ?? ''} className={input} />
          </div>
          <div>
            <label className={label}>Deadline</label>
            <input name="deadline" defaultValue={posting.deadline ?? ''} className={input} />
          </div>
        </div>

        <div>
          <label className={label}>Origin Location</label>
          <select name="origin_location_id" defaultValue={posting.origin_location_id ?? ''} className={sel}>
            <option value="">— None / Unknown —</option>
            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Posted By (NPC)</label>
            <select name="posted_by_npc_id" defaultValue={posting.posted_by_npc_id ?? ''} className={sel}>
              <option value="">— None —</option>
              {npcs.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Posted By (Faction)</label>
            <select name="posted_by_faction_id" defaultValue={posting.posted_by_faction_id ?? ''} className={sel}>
              <option value="">— None —</option>
              {factions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={label}>Posted By (freetext)</label>
          <input name="posted_by_name" defaultValue={posting.posted_by_name ?? ''} className={input} />
        </div>

        <div>
          <label className={label}>Description</label>
          <MentionTextarea name="description" rows={5} defaultValue={posting.description ?? ''} className={`${input} resize-none`} />
        </div>

        {posting.party_notes && (
          <div>
            <label className={label}>Party Notes (read-only here)</label>
            <p className="text-sm text-slate-400 bg-slate-800 rounded-md px-3 py-2 whitespace-pre-wrap">{posting.party_notes}</p>
          </div>
        )}

        <div className="bg-amber-950/30 border border-amber-800/40 rounded-lg p-4">
          <label className="block text-sm font-medium text-amber-400 mb-1">GM Notes (hidden from players)</label>
          <textarea name="gm_notes" rows={3} defaultValue={posting.gm_notes ?? ''}
            className="block w-full rounded-md border border-amber-800/40 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none" />
        </div>

        <div className="flex gap-3 pt-2 border-t border-slate-700">
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Save Changes
          </button>
          <Link href="/objectives" className="rounded-md border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-600">
            Back
          </Link>
          <form action={deleteWithId} className="ml-auto">
            <button type="submit"
              onClick={e => { if (!confirm('Delete this posting?')) e.preventDefault() }}
              className="rounded-md border border-red-800 bg-red-950/30 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-900/30">
              Delete
            </button>
          </form>
        </div>
      </form>
    </div>
  )
}

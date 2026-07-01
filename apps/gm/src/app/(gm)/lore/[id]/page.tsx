import { db } from '@/lib/db'
import { updateLoreEntry, deleteLoreEntry, toggleLoreVisibility } from '@/lib/actions/lore'
import { addLoreLocation, removeLoreLocation } from '@/lib/actions/loreLocations'
import { LoreEntry, LoreLocation } from '@ttrpg/db'
import MentionTextarea from '@/components/MentionTextarea'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getActiveCampaignId } from '@/lib/activeCampaign'
import { SubmitButton } from '@/components/SubmitButton'

const input = 'block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none'
const label = 'block text-sm font-medium text-slate-300 mb-1'

const LORE_CATEGORIES = [
  'History', 'Myth & Legend', 'Religion & Faith', 'Magic / Technology',
  'Culture & Society', 'Politics & Law', 'Cosmology', 'Bestiary',
  'Languages & Scripts', 'Artifacts & Relics', 'Geography & Astronomy', 'Economy & Trade',
]

export default async function LoreEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const campaignId = await getActiveCampaignId()
  const supabase = db()

  const [entryRes, loreLocsRes, allLocsRes] = await Promise.all([
    supabase.from('lore_entries').select('*').eq('id', id).single(),
    supabase.from('lore_locations').select('id, location_id, notes').eq('lore_id', id),
    campaignId
      ? supabase.from('locations').select('id, name').eq('campaign_id', campaignId).order('name')
      : supabase.from('locations').select('id, name').order('name'),
  ])

  if (!entryRes.data) notFound()
  const entry = entryRes.data as LoreEntry
  const loreLocs = (loreLocsRes.data ?? []) as LoreLocation[]
  const allLocations = (allLocsRes.data ?? []) as Array<{ id: string; name: string | null }>
  const linkedIds = new Set(loreLocs.map(ll => ll.location_id))
  const linkedLocNames = Object.fromEntries(
    allLocations.filter(l => linkedIds.has(l.id)).map(l => [l.id, l.name ?? '(unnamed)'])
  )

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/lore" className="text-sm text-slate-500 hover:text-slate-300">Lore & Knowledge</Link>
        <span className="text-slate-600">/</span>
        <span className="text-sm text-slate-100 font-medium">{entry.title}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-100">{entry.title}</h1>
        <form action={toggleLoreVisibility}>
          <input type="hidden" name="id" value={entry.id} />
          <input type="hidden" name="visible" value={String(entry.visible)} />
          <button type="submit" className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
            entry.visible ? 'bg-green-900/40 text-green-400 border-green-700 hover:bg-green-900/60' : 'bg-slate-700 text-slate-400 border-slate-700 hover:bg-slate-600'
          }`}>
            {entry.visible ? 'Visible to players' : 'Hidden from players'}
          </button>
        </form>
      </div>

      <form action={updateLoreEntry} className="bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-5 mb-8">
        <input type="hidden" name="id" value={entry.id} />
        <div>
          <label className={label}>Title</label>
          <input spellCheck name="title" defaultValue={entry.title} required className={input} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Category</label>
            <select key={entry.category ?? ''} name="category" defaultValue={entry.category ?? ''} className={input}>
              <option value="">— None —</option>
              {LORE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Descriptor</label>
            <input spellCheck name="descriptor" defaultValue={entry.descriptor ?? ''} placeholder="Era, pantheon, creature type…" className={input} />
          </div>
        </div>
        {entry.category === 'History' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Event Timestamp</label>
              <input spellCheck name="event_timestamp" defaultValue={entry.event_timestamp ?? ''} placeholder="Year 1247, Age of Ruin…" className={input} />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="major_event" value="true" defaultChecked={entry.major_event} className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-indigo-500" />
                <span className="text-sm text-slate-300">Major event</span>
              </label>
            </div>
          </div>
        )}
        <div>
          <label className={label}>Description</label>
          <MentionTextarea name="description" defaultValue={entry.description ?? ''} rows={10} className={`${input} resize-none`} />
        </div>
        <div className="flex gap-3 pt-2">
          <SubmitButton label="Save Changes" />
        </div>
      </form>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Linked Locations</h2>
        {loreLocs.length > 0 && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden mb-3">
            <table className="w-full text-sm">
              <tbody>
                {loreLocs.map(ll => (
                  <tr key={ll.id} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-700/50">
                    <td className="px-4 py-2.5">
                      <Link href={`/locations/${ll.location_id}`} className="font-medium text-slate-100 hover:text-indigo-400">
                        {linkedLocNames[ll.location_id] ?? ll.location_id}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{ll.notes ?? ''}</td>
                    <td className="px-4 py-2.5 text-right">
                      <form action={removeLoreLocation.bind(null, ll.id, id)}>
                        <button type="submit" className="text-xs text-red-400 hover:text-red-300">Remove</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <form action={async (fd: FormData) => {
          'use server'
          const loc = fd.get('location_id') as string
          if (loc) await addLoreLocation(id, loc)
        }} className="flex gap-2">
          <select name="location_id" className={`${input} flex-1`} defaultValue="">
            <option value="">— Link a location —</option>
            {allLocations.filter(l => !linkedIds.has(l.id)).map(l => (
              <option key={l.id} value={l.id}>{l.name ?? '(unnamed)'}</option>
            ))}
          </select>
          <button type="submit" className="shrink-0 rounded-md bg-slate-700 border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:bg-slate-600">
            Link
          </button>
        </form>
      </section>

      <div className="border-t border-slate-700 pt-6">
        <form action={deleteLoreEntry}>
          <input type="hidden" name="id" value={entry.id} />
          <button type="submit" className="rounded-md bg-red-900/30 border border-red-700 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-900/50">
            Delete Entry
          </button>
        </form>
      </div>
    </div>
  )
}

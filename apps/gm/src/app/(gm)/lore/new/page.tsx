import { createLoreEntry } from '@/lib/actions/lore'
import MentionTextarea from '@/components/MentionTextarea'
import Link from 'next/link'
import { getActiveCampaignId } from '@/lib/activeCampaign'
import { redirect } from 'next/navigation'

const input = 'block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none'
const label = 'block text-sm font-medium text-slate-300 mb-1'

const LORE_CATEGORIES = [
  'History', 'Myth & Legend', 'Religion & Faith', 'Magic / Technology',
  'Culture & Society', 'Politics & Law', 'Cosmology', 'Bestiary',
  'Languages & Scripts', 'Artifacts & Relics', 'Geography & Astronomy', 'Economy & Trade',
]

export default async function NewLorePage() {
  const campaignId = await getActiveCampaignId()
  if (!campaignId) redirect('/')
  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/lore" className="text-sm text-slate-500 hover:text-slate-300">Lore & Knowledge</Link>
        <span className="text-slate-600">/</span>
        <span className="text-sm text-slate-100 font-medium">New</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-100 mb-6">New Lore Entry</h1>

      <form action={createLoreEntry} className="space-y-5">
        <input type="hidden" name="campaign_id" value={campaignId} />
        <div>
          <label className={label}>Title <span className="text-red-500">*</span></label>
          <input spellCheck name="title" required className={input} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Category</label>
            <select name="category" className={input}>
              <option value="">— None —</option>
              {LORE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Descriptor</label>
            <input spellCheck name="descriptor" placeholder="Era, pantheon, creature type…" className={input} />
          </div>
        </div>
        <div>
          <label className={label}>Description</label>
          <MentionTextarea name="description" rows={8} className={`${input} resize-none`} />
        </div>
        <div className="rounded-lg border border-amber-800/50 bg-amber-950/20 p-4 space-y-2">
          <label className="block text-sm font-medium text-amber-400 mb-1">
            GM Notes <span className="text-xs text-amber-600 font-normal ml-1">— never shown to players</span>
          </label>
          <MentionTextarea name="gm_notes" rows={4} className={`${input} resize-none`} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Create Entry
          </button>
          <Link href="/lore" className="rounded-md border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

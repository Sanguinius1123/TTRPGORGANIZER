import { db } from '@/lib/db'
import { updateLoreEntry, deleteLoreEntry, toggleLoreVisibility } from '@/lib/actions/lore'
import { LoreEntry } from '@ttrpg/db'
import MentionTextarea from '@/components/MentionTextarea'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const input = 'block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none'
const label = 'block text-sm font-medium text-slate-300 mb-1'

const LORE_CATEGORIES = [
  'History', 'Myth & Legend', 'Religion & Faith', 'Magic / Technology',
  'Culture & Society', 'Politics & Law', 'Cosmology', 'Bestiary',
  'Languages & Scripts', 'Artifacts & Relics', 'Geography & Astronomy', 'Economy & Trade',
]

export default async function LoreEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = db()
  const { data: raw } = await supabase.from('lore_entries').select('*').eq('id', id).single()
  if (!raw) notFound()
  const entry = raw as LoreEntry

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
          <input name="title" defaultValue={entry.title} required className={input} />
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
            <input name="descriptor" defaultValue={entry.descriptor ?? ''} placeholder="Era, pantheon, creature type…" className={input} />
          </div>
        </div>
        <div>
          <label className={label}>Description</label>
          <MentionTextarea name="description" defaultValue={entry.description ?? ''} rows={10} className={`${input} resize-none`} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Save Changes
          </button>
        </div>
      </form>

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

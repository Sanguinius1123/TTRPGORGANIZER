import { db } from '@/lib/db'
import { updateLoreEntry, deleteLoreEntry, toggleLoreVisibility } from '@/lib/actions/lore'
import { LoreEntry } from '@ttrpg/db'
import MentionTextarea from '@/components/MentionTextarea'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const input = 'block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
const label = 'block text-sm font-medium text-zinc-700 mb-1'

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
        <Link href="/lore" className="text-sm text-zinc-500 hover:text-zinc-700">Lore & Knowledge</Link>
        <span className="text-zinc-300">/</span>
        <span className="text-sm text-zinc-900 font-medium">{entry.title}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">{entry.title}</h1>
        <form action={toggleLoreVisibility}>
          <input type="hidden" name="id" value={entry.id} />
          <input type="hidden" name="visible" value={String(entry.visible)} />
          <button type="submit" className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
            entry.visible ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200'
          }`}>
            {entry.visible ? 'Visible to players' : 'Hidden from players'}
          </button>
        </form>
      </div>

      <form action={updateLoreEntry} className="bg-white rounded-lg border border-zinc-200 p-6 space-y-5 mb-8">
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

      <div className="border-t border-zinc-200 pt-6">
        <form action={deleteLoreEntry}>
          <input type="hidden" name="id" value={entry.id} />
          <button type="submit" className="rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100">
            Delete Entry
          </button>
        </form>
      </div>
    </div>
  )
}

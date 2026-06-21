import { createLoreEntry } from '@/lib/actions/lore'
import MentionTextarea from '@/components/MentionTextarea'
import Link from 'next/link'

const input = 'block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
const label = 'block text-sm font-medium text-zinc-700 mb-1'

export default function NewLorePage() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/lore" className="text-sm text-zinc-500 hover:text-zinc-700">Lore Entries</Link>
        <span className="text-zinc-300">/</span>
        <span className="text-sm text-zinc-900 font-medium">New</span>
      </div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">New Lore Entry</h1>

      <form action={createLoreEntry} className="space-y-5">
        <div>
          <label className={label}>Title <span className="text-red-500">*</span></label>
          <input name="title" required className={input} autoFocus />
        </div>
        <div>
          <label className={label}>Category</label>
          <input name="category" placeholder="history, religion, geography, magic…" className={input} />
        </div>
        <div>
          <label className={label}>Description</label>
          <MentionTextarea name="description" rows={8} className={`${input} resize-none`} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Create Entry
          </button>
          <Link href="/lore" className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

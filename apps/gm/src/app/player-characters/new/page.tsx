import { createPlayerCharacter } from '@/lib/actions/player-characters'
import Link from 'next/link'

const input = 'block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
const label = 'block text-sm font-medium text-zinc-700 mb-1'

export default function NewPlayerCharacterPage() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/player-characters" className="text-sm text-zinc-500 hover:text-zinc-700">Player Characters</Link>
        <span className="text-zinc-300">/</span>
        <span className="text-sm text-zinc-900 font-medium">New</span>
      </div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">New Player Character</h1>

      <form action={createPlayerCharacter} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Character Name <span className="text-red-500">*</span></label>
            <input name="name" required className={input} autoFocus />
          </div>
          <div>
            <label className={label}>Player Name</label>
            <input name="player_name" className={input} />
          </div>
        </div>
        <div>
          <label className={label}>Species / Ancestry</label>
          <input name="species" className={input} />
        </div>
        <div>
          <label className={label}>Background</label>
          <textarea name="background" rows={4} className={`${input} resize-none`} />
        </div>
        <div>
          <label className={label}>Notes <span className="text-xs text-zinc-400">(private)</span></label>
          <textarea name="notes" rows={3} className={`${input} resize-none`} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Create Character
          </button>
          <Link href="/player-characters" className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

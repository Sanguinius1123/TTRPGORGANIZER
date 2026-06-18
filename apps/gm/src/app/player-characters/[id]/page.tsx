import { db } from '@/lib/db'
import { updatePlayerCharacter, deletePlayerCharacter, togglePlayerCharacterVisibility } from '@/lib/actions/player-characters'
import { PlayerCharacter } from '@ttrpg/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const input = 'block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
const label = 'block text-sm font-medium text-zinc-700 mb-1'

export default async function PlayerCharacterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = db()
  const { data: raw } = await supabase.from('player_characters').select('*').eq('id', id).single()
  if (!raw) notFound()
  const pc = raw as PlayerCharacter

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/player-characters" className="text-sm text-zinc-500 hover:text-zinc-700">Player Characters</Link>
        <span className="text-zinc-300">/</span>
        <span className="text-sm text-zinc-900 font-medium">{pc.name}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{pc.name}</h1>
          {pc.player_name && <p className="text-sm text-zinc-500 mt-0.5">Played by {pc.player_name}</p>}
        </div>
        <form action={togglePlayerCharacterVisibility}>
          <input type="hidden" name="id" value={pc.id} />
          <input type="hidden" name="visible" value={String(pc.visible)} />
          <button type="submit" className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
            pc.visible ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200'
          }`}>
            {pc.visible ? 'Visible to players' : 'Hidden from players'}
          </button>
        </form>
      </div>

      <form action={updatePlayerCharacter} className="bg-white rounded-lg border border-zinc-200 p-6 space-y-5 mb-8">
        <input type="hidden" name="id" value={pc.id} />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Character Name</label>
            <input name="name" defaultValue={pc.name} required className={input} />
          </div>
          <div>
            <label className={label}>Player Name</label>
            <input name="player_name" defaultValue={pc.player_name ?? ''} className={input} />
          </div>
        </div>
        <div>
          <label className={label}>Species / Ancestry</label>
          <input name="species" defaultValue={pc.species ?? ''} className={input} />
        </div>
        <div>
          <label className={label}>Background</label>
          <textarea name="background" defaultValue={pc.background ?? ''} rows={4} className={`${input} resize-none`} />
        </div>
        <div>
          <label className={label}>Notes <span className="text-xs text-zinc-400">(private)</span></label>
          <textarea name="notes" defaultValue={pc.notes ?? ''} rows={3} className={`${input} resize-none`} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Save Changes
          </button>
        </div>
      </form>

      <div className="border-t border-zinc-200 pt-6">
        <form action={deletePlayerCharacter}>
          <input type="hidden" name="id" value={pc.id} />
          <button type="submit" className="rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100">
            Delete Character
          </button>
        </form>
      </div>
    </div>
  )
}

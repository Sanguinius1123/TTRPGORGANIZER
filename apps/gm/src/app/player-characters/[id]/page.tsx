import { db } from '@/lib/db'
import { updatePlayerCharacter, deletePlayerCharacter, togglePlayerCharacterVisibility, setPcLocation } from '@/lib/actions/player-characters'
import { PlayerCharacter } from '@ttrpg/db'
import MentionTextarea from '@/components/MentionTextarea'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const input = 'block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none'
const label = 'block text-sm font-medium text-zinc-700 mb-1'
const smallInput = 'block w-full rounded border border-zinc-300 px-2 py-1.5 text-xs text-zinc-900 focus:border-indigo-500 outline-none'

export default async function PlayerCharacterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = db()

  const { data: raw } = await supabase.from('player_characters').select('*').eq('id', id).single()
  if (!raw) notFound()
  const pc = raw as PlayerCharacter

  const [r1, r2, r3] = await Promise.all([
    supabase.from('species').select('id, name').order('name'),
    supabase.from('cultures').select('id, name').order('name'),
    supabase.from('locations').select('id, name').order('name'),
  ])
  const speciesList  = (r1.data ?? []) as Array<{ id: string; name: string }>
  const culturesList = (r2.data ?? []) as Array<{ id: string; name: string }>
  const allLocations = (r3.data ?? []) as Array<{ id: string; name: string }>

  return (
    <div className="p-8 max-w-5xl">
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

      <div className="flex gap-6 items-start">

        {/* ── Left: main form + delete ── */}
        <div className="flex-1 min-w-0">
          <form action={updatePlayerCharacter} className="bg-white rounded-lg border border-zinc-200 p-6 space-y-5 mb-6">
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={label}>Species / Ancestry</label>
                <select key={pc.species ?? ''} name="species" defaultValue={pc.species ?? ''} className={input}>
                  <option value="">— None —</option>
                  {speciesList.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Culture</label>
                <select key={pc.culture ?? ''} name="culture" defaultValue={pc.culture ?? ''} className={input}>
                  <option value="">— None —</option>
                  {culturesList.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={label}>Background</label>
              <MentionTextarea name="background" defaultValue={pc.background ?? ''} rows={4} className={`${input} resize-none`} />
            </div>
            <div>
              <label className={label}>Notes <span className="text-xs text-zinc-400">(private)</span></label>
              <MentionTextarea name="notes" defaultValue={pc.notes ?? ''} rows={3} className={`${input} resize-none`} />
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

        {/* ── Right: sidebar ── */}
        <div className="w-64 shrink-0">
          <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-zinc-100 bg-zinc-50">
              <h3 className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">Known Location</h3>
            </div>
            <div className="p-3 space-y-2">
              <form action={setPcLocation} className="space-y-2">
                <input type="hidden" name="id" value={id} />
                <select key={pc.current_location_id ?? ''} name="current_location_id" defaultValue={pc.current_location_id ?? ''} className={smallInput}>
                  <option value="">Unknown</option>
                  {allLocations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
                <button type="submit" className="w-full rounded bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700">
                  Save
                </button>
              </form>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

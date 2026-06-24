import { db } from '@/lib/db'
import {
  updatePlayerCharacter, deletePlayerCharacter, togglePlayerCharacterVisibility,
  setPcLocation, addPcFaction, removePcFaction, setPartyFaction,
} from '@/lib/actions/player-characters'
import { assignProfileToPC } from '@/lib/actions/settings'
import { PlayerCharacter } from '@ttrpg/db'
import MentionTextarea from '@/components/MentionTextarea'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const input = 'block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none'
const label = 'block text-sm font-medium text-slate-300 mb-1'
const smallInput = 'block w-full rounded border border-slate-600 bg-slate-700 px-2 py-1.5 text-xs text-slate-100 focus:border-indigo-400 outline-none'

interface FactionLink { id: string; role: string | null; faction_id: string }
interface SimpleFaction { id: string; name: string }

export default async function PlayerCharacterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = db()

  const { data: raw } = await supabase.from('player_characters').select('*').eq('id', id).single()
  if (!raw) notFound()
  const pc = raw as PlayerCharacter

  const [r1, r2, r3, r4, r5, r6] = await Promise.all([
    supabase.from('species').select('id, name').order('name'),
    supabase.from('cultures').select('id, name').order('name'),
    supabase.from('locations').select('id, name').order('name'),
    supabase.from('factions').select('id, name').order('name'),
    supabase.from('pc_factions').select('id, role, faction_id').eq('pc_id', id),
    supabase.from('profiles').select('id, display_name').order('display_name'),
  ])
  const speciesList  = (r1.data ?? []) as Array<{ id: string; name: string }>
  const culturesList = (r2.data ?? []) as Array<{ id: string; name: string }>
  const allLocations = (r3.data ?? []) as Array<{ id: string; name: string }>
  const allFactions  = (r4.data ?? []) as SimpleFaction[]
  const factionLinks = (r5.data ?? []) as FactionLink[]
  const profiles     = (r6.data ?? []) as Array<{ id: string; display_name: string | null }>
  const factionById  = Object.fromEntries(allFactions.map((f) => [f.id, f]))
  const speciesIdByName = Object.fromEntries(speciesList.map(s => [s.name, s.id]))
  const cultureIdByName = Object.fromEntries(culturesList.map(c => [c.name, c.id]))

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/player-characters" className="text-sm text-slate-400 hover:text-slate-300">Player Characters</Link>
        <span className="text-slate-600">/</span>
        <span className="text-sm text-slate-100 font-medium">{pc.name}</span>
      </div>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{pc.name}</h1>
          {pc.player_name && <p className="text-sm text-slate-500 mt-0.5">Played by {pc.player_name}</p>}
        </div>

        {/* ── Assignment controls ── */}
        <div className="flex flex-col gap-2 shrink-0">
          <form action={assignProfileToPC} className="flex items-center gap-2">
            <input type="hidden" name="pc_id" value={pc.id} />
            <label className="text-xs font-medium text-slate-400 whitespace-nowrap w-24 text-right">Player account</label>
            <select
              key={pc.profile_id ?? ''}
              name="profile_id"
              defaultValue={pc.profile_id ?? ''}
              className={smallInput + ' w-44'}
            >
              <option value="">— Unassigned —</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.display_name ?? p.id}</option>
              ))}
            </select>
            <button type="submit" className="rounded bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 whitespace-nowrap">
              Assign
            </button>
          </form>
          <form action={setPartyFaction} className="flex items-center gap-2">
            <input type="hidden" name="pc_id" value={pc.id} />
            <label className="text-xs font-medium text-slate-400 whitespace-nowrap w-24 text-right">Party faction</label>
            <select
              key={pc.party_faction_id ?? ''}
              name="party_faction_id"
              defaultValue={pc.party_faction_id ?? ''}
              className={smallInput + ' w-44'}
            >
              <option value="">— None —</option>
              {allFactions.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <button type="submit" className="rounded bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 whitespace-nowrap">
              Set
            </button>
          </form>
        </div>

        <form action={togglePlayerCharacterVisibility}>
          <input type="hidden" name="id" value={pc.id} />
          <input type="hidden" name="visible" value={String(pc.visible)} />
          <button type="submit" className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
            pc.visible ? 'bg-green-900/40 text-green-400 border-green-700 hover:bg-green-900/60' : 'bg-slate-700 text-slate-400 border-slate-600 hover:bg-slate-600'
          }`}>
            {pc.visible ? 'Visible to players' : 'Hidden from players'}
          </button>
        </form>
      </div>

      <div className="flex gap-6 items-start">

        {/* ── Left: main form + delete ── */}
        <div className="flex-1 min-w-0">
          <form action={updatePlayerCharacter} className="bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-5 mb-6">
            <input type="hidden" name="id" value={pc.id} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={label}>Character Name</label>
                <input spellCheck name="name" defaultValue={pc.name} required className={input} />
              </div>
              <div>
                <label className={label}>Player Name</label>
                <input spellCheck name="player_name" defaultValue={pc.player_name ?? ''} className={input} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-slate-300">Species / Ancestry</label>
                  {pc.species && speciesIdByName[pc.species] && (
                    <Link href={`/species/${speciesIdByName[pc.species]}`} className="text-xs text-indigo-400 hover:text-indigo-300">View →</Link>
                  )}
                </div>
                <select key={pc.species ?? ''} name="species" defaultValue={pc.species ?? ''} className={input}>
                  <option value="">— None —</option>
                  {speciesList.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-slate-300">Culture</label>
                  {pc.culture && cultureIdByName[pc.culture] && (
                    <Link href={`/cultures/${cultureIdByName[pc.culture]}`} className="text-xs text-indigo-400 hover:text-indigo-300">View →</Link>
                  )}
                </div>
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
              <label className={label}>Notes <span className="text-xs text-slate-500">(visible to players)</span></label>
              <MentionTextarea name="notes" defaultValue={pc.notes ?? ''} rows={3} className={`${input} resize-none`} />
            </div>
            <div>
              <label className={label}>Private notes <span className="text-xs text-slate-500">(GM + player only, hidden from other players)</span></label>
              <MentionTextarea name="private_notes" defaultValue={pc.private_notes ?? ''} rows={3} className={`${input} resize-none`} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                Save Changes
              </button>
            </div>
          </form>

          <div className="border-t border-slate-700 pt-6">
            <form action={deletePlayerCharacter}>
              <input type="hidden" name="id" value={pc.id} />
              <button type="submit" className="rounded-md bg-red-900/30 border border-red-700 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-900/50">
                Delete Character
              </button>
            </form>
          </div>
        </div>

        {/* ── Right: sidebar ── */}
        <div className="w-64 shrink-0 space-y-4">

          {/* Factions panel */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-800">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Factions</h3>
            </div>
            <div className="p-3 space-y-1">
              {factionLinks.length === 0 && (
                <p className="text-xs text-slate-500 px-1 py-1">No faction memberships.</p>
              )}
              {factionLinks.map((link) => {
                const faction = factionById[link.faction_id]
                if (!faction) return null
                return (
                  <div key={link.id} className="flex items-start gap-2 group rounded px-1 py-1.5 hover:bg-slate-700/50">
                    <div className="flex-1 min-w-0">
                      <Link href={`/factions/${faction.id}`} className="text-sm font-medium text-slate-100 hover:text-indigo-400 block truncate">
                        {faction.name}
                      </Link>
                      {link.role && <p className="text-xs text-slate-500 truncate">{link.role}</p>}
                    </div>
                    <form action={removePcFaction}>
                      <input type="hidden" name="id" value={link.id} />
                      <input type="hidden" name="pc_id" value={id} />
                      <button type="submit" className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-500 text-xs pt-0.5">✕</button>
                    </form>
                  </div>
                )
              })}
            </div>
            <form action={addPcFaction} className="px-3 pb-3 pt-2 border-t border-slate-700/50 space-y-1.5">
              <input type="hidden" name="pc_id" value={id} />
              <select name="faction_id" required className={smallInput}>
                <option value="">Select faction…</option>
                {allFactions.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <div className="flex gap-1.5">
                <input spellCheck name="role" placeholder="Role (optional)" className={`${smallInput} flex-1`} />
                <button type="submit" className="rounded bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 whitespace-nowrap">
                  Add
                </button>
              </div>
            </form>
          </div>

          {/* Known Location panel */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-800">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Known Location</h3>
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

import { db } from '@/lib/db'
import {
  updateNpc, deleteNpc, toggleNpcVisibility,
  addNpcFact, toggleFactRevealed, deleteNpcFact,
  addNpcFaction, removeNpcFaction, setNpcLocation,
} from '@/lib/actions/npcs'
import { NPC, NPCFact } from '@ttrpg/db'
import MentionTextarea from '@/components/MentionTextarea'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SubmitButton } from '@/components/SubmitButton'
import { getActiveCampaignId } from '@/lib/activeCampaign'

const input = 'block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none'
const label = 'block text-sm font-medium text-slate-300 mb-1'
const smallInput = 'block w-full rounded border border-slate-600 bg-slate-700 px-2 py-1.5 text-xs text-slate-100 focus:border-indigo-400 outline-none'

interface FactionLink { id: string; role: string | null; faction_id: string }
interface SimpleFaction { id: string; name: string }
interface SimpleLocation { id: string; name: string }

export default async function NpcPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const campaignId = await getActiveCampaignId()
  const supabase = db()

  const { data: raw } = await supabase.from('npcs').select('*').eq('id', id).single()
  if (!raw) notFound()
  const npc = raw as NPC

  const cid = campaignId ?? npc.campaign_id
  const [r1, r2, r3, r4, r5, r6] = await Promise.all([
    supabase.from('npc_facts').select('*').eq('npc_id', id).order('created_at'),
    supabase.from('npc_factions').select('id, role, faction_id').eq('npc_id', id),
    supabase.from('factions').select('id, name').eq('campaign_id', cid).order('name'),
    supabase.from('species').select('id, name').eq('campaign_id', cid).order('name'),
    supabase.from('cultures').select('id, name').eq('campaign_id', cid).order('name'),
    supabase.from('locations').select('id, name').eq('campaign_id', cid).order('name'),
  ])

  const facts        = (r1.data ?? []) as NPCFact[]
  const factionLinks = (r2.data ?? []) as FactionLink[]
  const allFactions  = (r3.data ?? []) as SimpleFaction[]
  const speciesList  = (r4.data ?? []) as Array<{ id: string; name: string }>
  const culturesList = (r5.data ?? []) as Array<{ id: string; name: string }>
  const allLocations = (r6.data ?? []) as SimpleLocation[]
  const factionById  = Object.fromEntries(allFactions.map((f) => [f.id, f]))
  const speciesIdByName = Object.fromEntries(speciesList.map(s => [s.name, s.id]))
  const cultureIdByName = Object.fromEntries(culturesList.map(c => [c.name, c.id]))

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/npcs" className="text-sm text-slate-500 hover:text-slate-300">NPCs</Link>
        <span className="text-slate-600">/</span>
        <span className="text-sm text-slate-100 font-medium">{npc.name}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-100">{npc.name}</h1>
        <form action={toggleNpcVisibility}>
          <input type="hidden" name="id" value={npc.id} />
          <input type="hidden" name="visible" value={String(npc.visible)} />
          <button type="submit" className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
            npc.visible
              ? 'bg-green-900/40 text-green-400 border-green-700 hover:bg-green-900/60'
              : 'bg-slate-700 text-slate-400 border-slate-600 hover:bg-slate-600'
          }`}>
            {npc.visible ? 'Visible to players' : 'Hidden from players'}
          </button>
        </form>
      </div>

      <div className="flex gap-6 items-start">

        {/* ── Left: main form + facts + delete ── */}
        <div className="flex-1 min-w-0">
          <form action={updateNpc} className="bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-5 mb-6">
            <input type="hidden" name="id" value={npc.id} />
            <div>
              <label className={label}>Name</label>
              <input spellCheck name="name" defaultValue={npc.name} required className={input} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-slate-300">Species / Ancestry</label>
                  {npc.species && speciesIdByName[npc.species] && (
                    <Link href={`/species/${speciesIdByName[npc.species]}`} className="text-xs text-indigo-400 hover:text-indigo-300">View →</Link>
                  )}
                </div>
                <select key={npc.species ?? ''} name="species" defaultValue={npc.species ?? ''} className={input}>
                  <option value="">— None —</option>
                  {speciesList.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Profession</label>
                <input spellCheck name="profession" defaultValue={npc.profession ?? ''} className={input} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-slate-300">Culture</label>
                {npc.culture && cultureIdByName[npc.culture] && (
                  <Link href={`/cultures/${cultureIdByName[npc.culture]}`} className="text-xs text-indigo-400 hover:text-indigo-300">View →</Link>
                )}
              </div>
              <select key={npc.culture ?? ''} name="culture" defaultValue={npc.culture ?? ''} className={input}>
                <option value="">— None —</option>
                {culturesList.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Background</label>
              <MentionTextarea name="background" defaultValue={npc.background ?? ''} rows={4} className={`${input} resize-none`} />
            </div>
            <div>
              <label className={label}>GM Notes <span className="text-xs text-slate-500">(private)</span></label>
              <MentionTextarea name="notes" defaultValue={npc.notes ?? ''} rows={3} className={`${input} resize-none`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-400 mb-1">
                Personality Notes <span className="text-xs text-slate-500">(voice, behaviour, triggers — for character agent)</span>
              </label>
              <textarea
                name="personality_notes"
                defaultValue={npc.personality_notes ?? ''}
                rows={5}
                spellCheck
                placeholder={"Speech patterns, sentence length, what they never say, emotional tells, how they act under pressure, lies they tell themselves…"}
                className="block w-full rounded-md border border-purple-900/60 bg-purple-950/20 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none"
              />
            </div>
            <div className="rounded-lg border border-amber-800/50 bg-amber-950/20 p-4 space-y-2">
              <label className="block text-sm font-medium text-amber-400 mb-1">
                GM Notes <span className="text-xs text-amber-600 font-normal ml-1">— never shown to players</span>
              </label>
              <MentionTextarea name="gm_notes" defaultValue={npc.gm_notes ?? ''} rows={4} className={`${input} resize-none`} />
            </div>
            <div className="flex gap-3 pt-2">
              <SubmitButton label="Save Changes" />
            </div>
          </form>

          {/* Facts */}
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Facts</h2>
              <span className="text-xs text-slate-500">Toggle revealed to show on player portal</span>
            </div>
            <div className="space-y-2 mb-3">
              {!facts.length ? (
                <p className="text-sm text-slate-500">No facts added yet.</p>
              ) : (
                facts.map((fact) => (
                  <div key={fact.id} className="flex items-start gap-3 bg-slate-800 rounded-lg border border-slate-700 px-4 py-3">
                    <form action={toggleFactRevealed} className="pt-0.5">
                      <input type="hidden" name="id" value={fact.id} />
                      <input type="hidden" name="npc_id" value={id} />
                      <input type="hidden" name="revealed" value={String(fact.revealed)} />
                      <button type="submit" className={`w-4 h-4 rounded border flex-shrink-0 transition-colors ${
                        fact.revealed ? 'bg-green-500 border-green-500' : 'border-slate-600 hover:border-indigo-400'
                      }`} title={fact.revealed ? 'Click to hide' : 'Click to reveal'} />
                    </form>
                    <p className={`flex-1 text-sm ${fact.revealed ? 'text-slate-100' : 'text-slate-500'}`}>{fact.fact_text}</p>
                    <form action={deleteNpcFact}>
                      <input type="hidden" name="id" value={fact.id} />
                      <input type="hidden" name="npc_id" value={id} />
                      <button type="submit" className="text-slate-600 hover:text-red-500 text-xs">✕</button>
                    </form>
                  </div>
                ))
              )}
            </div>
            <form action={addNpcFact} className="flex gap-2">
              <input type="hidden" name="npc_id" value={id} />
              <input spellCheck name="fact_text" required placeholder="Add a fact…" className={`${input} flex-1`} />
              <button type="submit" className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 whitespace-nowrap">
                Add Fact
              </button>
            </form>
          </section>

          <div className="border-t border-slate-700 pt-6">
            <form action={deleteNpc}>
              <input type="hidden" name="id" value={npc.id} />
              <button type="submit" className="rounded-md bg-red-900/30 border border-red-700 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-900/50">
                Delete NPC
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
                  <div key={link.id} className="flex items-start gap-2 group rounded px-1 py-1.5 hover:bg-slate-800">
                    <div className="flex-1 min-w-0">
                      <Link href={`/factions/${faction.id}`} className="text-sm font-medium text-slate-100 hover:text-indigo-400 block truncate">
                        {faction.name}
                      </Link>
                      {link.role && <p className="text-xs text-slate-500 truncate">{link.role}</p>}
                    </div>
                    <form action={removeNpcFaction}>
                      <input type="hidden" name="id" value={link.id} />
                      <input type="hidden" name="npc_id" value={id} />
                      <button type="submit" className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-500 text-xs pt-0.5">✕</button>
                    </form>
                  </div>
                )
              })}
            </div>
            <form action={addNpcFaction} className="px-3 pb-3 pt-2 border-t border-slate-700/50 space-y-1.5">
              <input type="hidden" name="npc_id" value={id} />
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

          {/* Primary Location panel */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-700/50 bg-slate-800">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Known Location</h3>
            </div>
            <div className="p-3 space-y-2">
              <form action={setNpcLocation} className="space-y-2">
                <input type="hidden" name="id" value={id} />
                <select key={npc.current_location_id ?? ''} name="current_location_id" defaultValue={npc.current_location_id ?? ''} className={smallInput}>
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

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { PlayerCharacter } from '@ttrpg/db'

type Props = {
  pc: PlayerCharacter
  speciesList: Array<{ id: string; name: string }>
  culturesList: Array<{ id: string; name: string }>
}

export function CharacterForm({ pc, speciesList, culturesList }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [fields, setFields] = useState({
    name:          pc.name ?? '',
    player_name:   pc.player_name ?? '',
    species:       pc.species ?? '',
    culture:       pc.culture ?? '',
    background:    pc.background ?? '',
    notes:         pc.notes ?? '',
    private_notes: pc.private_notes ?? '',
  })

  function set(key: keyof typeof fields) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setFields(prev => ({ ...prev, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    const supabase = createClient()
    await supabase.from('player_characters').update({
      name:          fields.name,
      player_name:   fields.player_name || null,
      species:       fields.species || null,
      culture:       fields.culture || null,
      background:    fields.background || null,
      notes:         fields.notes || null,
      private_notes: fields.private_notes || null,
    }).eq('id', pc.id)
    setSaving(false)
    setSaved(true)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Character name">
          <input value={fields.name} onChange={set('name')} required className={input} />
        </Field>
        <Field label="Player name">
          <input value={fields.player_name} onChange={set('player_name')} className={input} />
        </Field>
        <Field label="Species / Ancestry">
          <select value={fields.species} onChange={set('species')} className={input}>
            <option value="">— select —</option>
            {speciesList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="Culture">
          <select value={fields.culture} onChange={set('culture')} className={input}>
            <option value="">— select —</option>
            {culturesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Background">
        <textarea value={fields.background} onChange={set('background')} rows={3} className={textarea} />
      </Field>

      <Field label="Notes (visible to everyone)">
        <textarea value={fields.notes} onChange={set('notes')} rows={3} className={textarea} />
      </Field>

      <Field label="Private notes (only you can see these)">
        <textarea
          value={fields.private_notes}
          onChange={set('private_notes')}
          rows={3}
          className={`${textarea} border-amber-200 focus:ring-amber-400`}
          placeholder="Your private thoughts, plans, secrets…"
        />
      </Field>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {saved && <span className="text-sm text-green-600">Saved!</span>}
      </div>
    </form>
  )
}

const input = 'w-full rounded-md bg-white border border-zinc-200 px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500'
const textarea = `${input} resize-none`

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-500 mb-1">{label}</label>
      {children}
    </div>
  )
}

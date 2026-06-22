'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Props = {
  sessionId: string
  pcId: string
  profileId: string
  existingNote: { id: string; notes_text: string } | null
}

export function NoteForm({ sessionId, pcId, profileId, existingNote }: Props) {
  const [text, setText] = useState(existingNote?.notes_text ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setSaving(true)
    setSaved(false)
    const supabase = createClient()

    if (existingNote) {
      await supabase.from('session_notes').update({ notes_text: text.trim() }).eq('id', existingNote.id)
    } else {
      await supabase.from('session_notes').insert({
        session_id: sessionId,
        pc_id: pcId,
        profile_id: profileId,
        notes_text: text.trim(),
      })
    }

    setSaving(false)
    setSaved(true)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={text}
        onChange={e => { setText(e.target.value); setSaved(false) }}
        rows={4}
        placeholder="What did your character do or observe this session?"
        className="w-full rounded-md bg-white border border-zinc-200 px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving || !text.trim()}
          className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
        >
          {saving ? 'Saving…' : existingNote ? 'Save changes' : 'Post note'}
        </button>
        {saved && <span className="text-xs text-green-600">Saved!</span>}
      </div>
    </form>
  )
}

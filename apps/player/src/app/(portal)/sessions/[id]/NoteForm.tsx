'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function NoteForm({ sessionId, pcId, profileId }: { sessionId: string; pcId: string; profileId: string }) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('session_notes').insert({
      session_id: sessionId,
      pc_id: pcId,
      profile_id: profileId,
      notes_text: text.trim(),
    })
    setText('')
    setSaving(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide">Add your notes</label>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={4}
        placeholder="What did your character do or observe this session?"
        className="w-full rounded-md bg-white border border-zinc-200 px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
      />
      <button
        type="submit"
        disabled={saving || !text.trim()}
        className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
      >
        {saving ? 'Saving…' : 'Post note'}
      </button>
    </form>
  )
}

import { createClient } from '@/lib/supabase/server'
import { Session, SessionNote, PlayerCharacter, Profile } from '@ttrpg/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { NoteForm } from './NoteForm'

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const results = await Promise.all([
    supabase.from('sessions').select('*').eq('id', id).single(),
    supabase.from('session_notes').select('*').eq('session_id', id).order('created_at'),
    supabase.from('player_characters').select('id, name, player_name').eq('profile_id', user!.id).maybeSingle(),
    supabase.from('profiles').select('id, display_name'),
    supabase.from('player_characters').select('id, name, player_name, profile_id'),
  ])

  const raw = results[0].data
  if (!raw) notFound()
  const session = raw as Session
  const notes = (results[1].data ?? []) as SessionNote[]
  const myPC = results[2].data as Pick<PlayerCharacter, 'id' | 'name' | 'player_name'> | null
  const profiles = (results[3].data ?? []) as Pick<Profile, 'id' | 'display_name'>[]
  const allPCs = (results[4].data ?? []) as Pick<PlayerCharacter, 'id' | 'name' | 'player_name' | 'profile_id'>[]

  const profileById = Object.fromEntries(profiles.map(p => [p.id, p]))
  const pcById = Object.fromEntries(allPCs.map(p => [p.id, p]))

  // Find my existing note for this session (one per PC per session)
  const myNote = myPC
    ? (notes.find(n => n.pc_id === myPC.id) ?? null)
    : null

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/sessions" className="text-zinc-500 hover:text-zinc-700">Sessions</Link>
        <span className="text-zinc-300">/</span>
        <span className="text-zinc-900 font-medium">Session {session.session_number}</span>
      </div>

      <div className="mb-6">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Session {session.session_number}</p>
        <h1 className="text-2xl font-bold text-zinc-900">{session.title ?? 'Untitled'}</h1>
      </div>

      <div className="space-y-6">
        {session.summary && (
          <div className="bg-white rounded-lg border border-zinc-200 p-6">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Summary</h2>
            <p className="text-zinc-700 whitespace-pre-wrap text-sm leading-relaxed">{session.summary}</p>
          </div>
        )}

        {session.loose_threads && (
          <div className="bg-white rounded-lg border border-zinc-200 p-6">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Loose Threads</h2>
            <p className="text-zinc-700 whitespace-pre-wrap text-sm leading-relaxed">{session.loose_threads}</p>
          </div>
        )}

        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">Player Notes</h2>
            <span className="text-xs text-zinc-400">{notes.length} {notes.length === 1 ? 'note' : 'notes'}</span>
          </div>
          <div className="divide-y divide-zinc-100">
            {notes.length === 0 && !myPC && (
              <p className="px-6 py-4 text-sm text-zinc-400">No player notes yet.</p>
            )}
            {notes.map(note => {
              const pc = note.pc_id ? pcById[note.pc_id] : null
              const profile = note.profile_id ? profileById[note.profile_id] : null
              const isMyNote = myPC && note.pc_id === myPC.id

              // "Character Name — Player Name" format
              const pcLabel = pc
                ? [pc.name, pc.player_name].filter(Boolean).join(' — ')
                : (note.author_name ?? profile?.display_name ?? 'Unknown')

              // Skip my own note — it's shown in the edit form below
              if (isMyNote) return null

              return (
                <div key={note.id} className="px-6 py-4">
                  <p className="text-xs font-semibold text-indigo-600 mb-1.5">{pcLabel}</p>
                  <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">{note.notes_text}</p>
                </div>
              )
            })}

            {myPC && (
              <div className="px-6 py-4 bg-zinc-50">
                <p className="text-xs font-semibold text-indigo-600 mb-3">
                  {[myPC.name, myPC.player_name].filter(Boolean).join(' — ')} (you)
                </p>
                <NoteForm
                  sessionId={id}
                  pcId={myPC.id}
                  profileId={user!.id}
                  existingNote={myNote ? { id: myNote.id, notes_text: myNote.notes_text ?? '' } : null}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

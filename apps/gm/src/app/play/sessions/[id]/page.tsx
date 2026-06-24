import { createAnonClient } from '@/lib/supabase/server'
import { Session, SessionNote, PlayerCharacter, Profile } from '@ttrpg/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { NoteForm } from './NoteForm'
import { renderMentions } from '@/lib/mentions'
import { buildVisibleMentionSet } from '@/lib/mentionVisibility'

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createAnonClient()
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

  const visibleIds = await buildVisibleMentionSet(supabase, [session.summary, session.loose_threads])

  // Find my existing note for this session (one per PC per session)
  const myNote = myPC
    ? (notes.find(n => n.pc_id === myPC.id) ?? null)
    : null

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/play/sessions" className="text-slate-400 hover:text-slate-300">Sessions</Link>
        <span className="text-slate-600">/</span>
        <span className="text-slate-100 font-medium">Session {session.session_number}</span>
      </div>

      <div className="mb-6">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Session {session.session_number}</p>
        <h1 className="text-2xl font-bold text-slate-100">{session.title ?? 'Untitled'}</h1>
      </div>

      <div className="space-y-6">
        {session.summary && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Summary</h2>
            <p className="text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">{renderMentions(session.summary, visibleIds)}</p>
          </div>
        )}

        {session.loose_threads && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Loose Threads</h2>
            <p className="text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">{renderMentions(session.loose_threads, visibleIds)}</p>
          </div>
        )}

        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-800 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Player Notes</h2>
            <span className="text-xs text-slate-500">{notes.length} {notes.length === 1 ? 'note' : 'notes'}</span>
          </div>
          <div className="divide-y divide-slate-700/50">
            {notes.length === 0 && !myPC && (
              <p className="px-6 py-4 text-sm text-slate-500">No player notes yet.</p>
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
                  <p className="text-xs font-semibold text-indigo-400 mb-1.5">{pcLabel}</p>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{note.notes_text}</p>
                </div>
              )
            })}

            {myPC && (
              <div className="px-6 py-4 bg-slate-700/30">
                <p className="text-xs font-semibold text-indigo-400 mb-3">
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

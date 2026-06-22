import { createClient } from '@/lib/supabase/server'
import { Session, SessionNote, PlayerCharacter, Profile } from '@ttrpg/db'
import { notFound } from 'next/navigation'
import { NoteForm } from './NoteForm'

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const results = await Promise.all([
    supabase.from('sessions').select('*').eq('id', id).single(),
    supabase.from('session_notes').select('*').eq('session_id', id).order('created_at'),
    supabase.from('player_characters').select('id, name').eq('profile_id', user!.id).maybeSingle(),
    supabase.from('profiles').select('id, display_name'),
    supabase.from('player_characters').select('id, name, profile_id'),
  ])

  const raw = results[0].data
  if (!raw) notFound()
  const session = raw as Session
  const notes = (results[1].data ?? []) as SessionNote[]
  const myPC = results[2].data as Pick<PlayerCharacter, 'id' | 'name'> | null
  const profiles = (results[3].data ?? []) as Pick<Profile, 'id' | 'display_name'>[]
  const allPCs = (results[4].data ?? []) as Pick<PlayerCharacter, 'id' | 'name' | 'profile_id'>[]

  const profileById = Object.fromEntries(profiles.map(p => [p.id, p]))
  const pcById = Object.fromEntries(allPCs.map(p => [p.id, p]))

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <div>
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Session {session.session_number}</p>
        <h1 className="text-2xl font-bold text-zinc-900">{session.title ?? 'Untitled'}</h1>
      </div>

      {session.summary && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-2">Summary</h2>
          <p className="text-zinc-700 whitespace-pre-wrap">{session.summary}</p>
        </section>
      )}

      {session.loose_threads && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-2">Loose Threads</h2>
          <p className="text-zinc-700 whitespace-pre-wrap">{session.loose_threads}</p>
        </section>
      )}

      {/* Player notes */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">Player Notes</h2>
        {notes.length === 0 && <p className="text-sm text-zinc-400">No player notes yet.</p>}
        {notes.map(note => {
          const pc = note.pc_id ? pcById[note.pc_id] : null
          const profile = note.profile_id ? profileById[note.profile_id] : null
          const author = pc ? `${pc.name}` : note.author_name ?? profile?.display_name ?? 'Unknown'
          return (
            <div key={note.id} className="rounded-lg bg-white border border-zinc-200 p-4">
              <p className="text-xs font-semibold text-indigo-600 mb-1">{author}</p>
              <p className="text-sm text-zinc-700 whitespace-pre-wrap">{note.notes_text}</p>
            </div>
          )
        })}

        {myPC && (
          <NoteForm sessionId={id} pcId={myPC.id} profileId={user!.id} />
        )}
      </section>
    </div>
  )
}

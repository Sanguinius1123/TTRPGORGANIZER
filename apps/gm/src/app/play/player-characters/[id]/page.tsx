import { createAnonClient } from '@/lib/supabase/server'
import { PlayerCharacter, SessionNote } from '@ttrpg/db'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { renderMentionsPlayer } from '@/lib/mentions'
import { buildVisibleMentionSet } from '@/lib/mentionVisibility'

export default async function PCDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createAnonClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // If this is the player's own character, send them to the home page (character sheet)
  const { data: myRaw } = await supabase
    .from('player_characters').select('id').eq('profile_id', user.id).eq('id', id).maybeSingle()
  if (myRaw) redirect('/play')

  const results = await Promise.all([
    supabase.from('player_characters').select('id, name, player_name, species, culture, background, notes, image_url, visible, current_location_id, profile_id, party_faction_id, campaign_id, created_at').eq('id', id).single(),
    supabase.from('species').select('id, name').order('name'),
    supabase.from('cultures').select('id, name').order('name'),
    supabase.from('session_notes').select('*, session:session_id(session_number, title)').eq('pc_id', id).order('created_at'),
  ])

  const raw = results[0].data
  if (!raw) notFound()
  const pc = raw as PlayerCharacter
  const speciesList  = (results[1].data ?? []) as Array<{ id: string; name: string }>
  const culturesList = (results[2].data ?? []) as Array<{ id: string; name: string }>
  const notes        = (results[3].data ?? []) as unknown as Array<SessionNote & { session: { session_number: number; title: string | null } | null }>

  const speciesIdByName  = Object.fromEntries(speciesList.map(s => [s.name, s.id]))
  const cultureIdByName  = Object.fromEntries(culturesList.map(c => [c.name, c.id]))

  const visibleIds = await buildVisibleMentionSet(supabase, [pc.background, pc.notes])

  const field = 'text-sm text-slate-100'
  const label = 'text-xs font-medium text-slate-500 mb-0.5'

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/play" className="text-slate-500 hover:text-slate-300">My Character</Link>
        <span className="text-slate-600">/</span>
        <span className="text-slate-100 font-medium">{pc.name}</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">{pc.name}</h1>
        {pc.player_name && <p className="text-sm text-slate-500 mt-0.5">Played by {pc.player_name}</p>}
      </div>

      <div className="space-y-6">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <p className={label}>Species / Ancestry</p>
              {pc.species ? (
                speciesIdByName[pc.species]
                  ? <Link href={`/play/species/${speciesIdByName[pc.species]}`} className="text-sm text-indigo-400 hover:underline">{pc.species}</Link>
                  : <p className={field}>{pc.species}</p>
              ) : <p className="text-sm text-slate-500">—</p>}
            </div>
            <div>
              <p className={label}>Culture</p>
              {pc.culture ? (
                cultureIdByName[pc.culture]
                  ? <Link href={`/play/cultures/${cultureIdByName[pc.culture]}`} className="text-sm text-indigo-400 hover:underline">{pc.culture}</Link>
                  : <p className={field}>{pc.culture}</p>
              ) : <p className="text-sm text-slate-500">—</p>}
            </div>
          </div>
          {pc.background && (
            <div>
              <p className={label}>Background</p>
              <p className={`${field} whitespace-pre-wrap leading-relaxed`}>{renderMentionsPlayer(pc.background, visibleIds)}</p>
            </div>
          )}
          {pc.notes && (
            <div>
              <p className={label}>Notes</p>
              <p className={`${field} whitespace-pre-wrap leading-relaxed`}>{renderMentionsPlayer(pc.notes, visibleIds)}</p>
            </div>
          )}
        </div>

        {notes.length > 0 && (
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-700/50 bg-slate-800">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Session Notes</h2>
            </div>
            <div className="divide-y divide-slate-700/50">
              {notes.map(note => (
                <div key={note.id} className="px-5 py-4">
                  {note.session && (
                    <Link href={`/play/sessions/${note.session_id}`} className="text-xs font-semibold text-indigo-500 hover:text-indigo-300 mb-1.5 block">
                      Session {note.session.session_number}{note.session.title ? ` — ${note.session.title}` : ''}
                    </Link>
                  )}
                  <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{note.notes_text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

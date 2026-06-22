import { createClient } from '@/lib/supabase/server'
import { PlayerCharacter, SessionNote } from '@ttrpg/db'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

export default async function PCDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // If this is the player's own character, send them to the home page (character sheet)
  const { data: myRaw } = await supabase
    .from('player_characters').select('id').eq('profile_id', user.id).eq('id', id).maybeSingle()
  if (myRaw) redirect('/')

  const results = await Promise.all([
    supabase.from('player_characters').select('*').eq('id', id).single(),
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

  const field = 'text-sm text-zinc-800'
  const label = 'text-xs font-medium text-zinc-500 mb-0.5'

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/" className="text-zinc-500 hover:text-zinc-700">My Character</Link>
        <span className="text-zinc-300">/</span>
        <span className="text-zinc-900 font-medium">{pc.name}</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">{pc.name}</h1>
        {pc.player_name && <p className="text-sm text-zinc-500 mt-0.5">Played by {pc.player_name}</p>}
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-zinc-200 p-6 space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <p className={label}>Species / Ancestry</p>
              {pc.species ? (
                speciesIdByName[pc.species]
                  ? <Link href={`/species/${speciesIdByName[pc.species]}`} className="text-sm text-indigo-600 hover:underline">{pc.species}</Link>
                  : <p className={field}>{pc.species}</p>
              ) : <p className="text-sm text-zinc-400">—</p>}
            </div>
            <div>
              <p className={label}>Culture</p>
              {pc.culture ? (
                cultureIdByName[pc.culture]
                  ? <Link href={`/cultures/${cultureIdByName[pc.culture]}`} className="text-sm text-indigo-600 hover:underline">{pc.culture}</Link>
                  : <p className={field}>{pc.culture}</p>
              ) : <p className="text-sm text-zinc-400">—</p>}
            </div>
          </div>
          {pc.background && (
            <div>
              <p className={label}>Background</p>
              <p className={`${field} whitespace-pre-wrap leading-relaxed`}>{pc.background}</p>
            </div>
          )}
          {pc.notes && (
            <div>
              <p className={label}>Notes</p>
              <p className={`${field} whitespace-pre-wrap leading-relaxed`}>{pc.notes}</p>
            </div>
          )}
        </div>

        {notes.length > 0 && (
          <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50">
              <h2 className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">Session Notes</h2>
            </div>
            <div className="divide-y divide-zinc-100">
              {notes.map(note => (
                <div key={note.id} className="px-5 py-4">
                  {note.session && (
                    <Link href={`/sessions/${note.session_id}`} className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 mb-1.5 block">
                      Session {note.session.session_number}{note.session.title ? ` — ${note.session.title}` : ''}
                    </Link>
                  )}
                  <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">{note.notes_text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

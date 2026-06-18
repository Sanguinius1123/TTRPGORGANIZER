import { db } from '@/lib/db'
import { PlayerCharacter } from '@ttrpg/db'
import Link from 'next/link'

export default async function PlayerCharactersPage() {
  const supabase = db()
  const { data: rawPcs } = await supabase.from('player_characters').select('*').order('name')
  const pcs = (rawPcs ?? []) as PlayerCharacter[]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Player Characters</h1>
          <p className="text-sm text-zinc-500 mt-1">{pcs.length} entries</p>
        </div>
        <Link href="/player-characters/new" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          New Character
        </Link>
      </div>

      {!pcs.length ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center">
          <p className="text-zinc-500 text-sm">No player characters yet.</p>
          <Link href="/player-characters/new" className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700">
            Create the first one →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Character Name</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Player</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Species / Ancestry</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Visible</th>
              </tr>
            </thead>
            <tbody>
              {pcs.map((pc) => (
                <tr key={pc.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <Link href={`/player-characters/${pc.id}`} className="font-medium text-zinc-900 hover:text-indigo-600">
                      {pc.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{pc.player_name ?? '—'}</td>
                  <td className="px-4 py-3 text-zinc-500">{pc.species ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      pc.visible ? 'bg-green-100 text-green-800' : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      {pc.visible ? 'Visible' : 'Hidden'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

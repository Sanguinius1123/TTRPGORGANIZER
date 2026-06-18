import { db } from '@/lib/db'
import { LoreEntry } from '@ttrpg/db'
import Link from 'next/link'

export default async function LorePage() {
  const supabase = db()
  const { data: rawEntries } = await supabase.from('lore_entries').select('*').order('category', { ascending: true })
  const entries = (rawEntries ?? []) as LoreEntry[]

  const byCategory = entries.reduce<Record<string, LoreEntry[]>>((acc, entry) => {
    const cat = entry.category ?? 'Uncategorised'
    if (!acc[cat]) acc[cat] = []
    acc[cat]!.push(entry)
    return acc
  }, {})

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Lore Entries</h1>
          <p className="text-sm text-zinc-500 mt-1">{entries.length} entries</p>
        </div>
        <Link href="/lore/new" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          New Entry
        </Link>
      </div>

      {!entries.length ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center">
          <p className="text-zinc-500 text-sm">No lore entries yet.</p>
          <Link href="/lore/new" className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700">
            Create the first one →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byCategory).map(([category, items]) => (
            <div key={category}>
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">{category}</h2>
              <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {items.map((entry) => (
                      <tr key={entry.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                        <td className="px-4 py-3">
                          <Link href={`/lore/${entry.id}`} className="font-medium text-zinc-900 hover:text-indigo-600">
                            {entry.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            entry.visible ? 'bg-green-100 text-green-800' : 'bg-zinc-100 text-zinc-600'
                          }`}>
                            {entry.visible ? 'Visible' : 'Hidden'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

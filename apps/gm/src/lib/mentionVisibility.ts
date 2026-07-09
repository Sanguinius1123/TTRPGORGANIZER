import { extractMentions } from './mentions'

// Tables that have RLS visibility restrictions (only visible=true rows returned)
const GATED_TABLE: Record<string, string> = {
  npc:          'npcs',
  location:     'locations',
  faction:      'factions',
  lore:         'lore_entries',
  'plot-thread':'plot_threads',
  pc:           'player_characters',
  item:         'items',
}

// Types that are always visible (no RLS gate, or always returned)
const ALWAYS_VISIBLE = new Set(['session', 'species', 'culture'])

/**
 * Given a Supabase client and a list of text fields, query which mentioned
 * entity IDs are actually visible (RLS does the work — invisible rows simply
 * aren't returned). Returns a Set of visible IDs.
 *
 * Pass the result into renderMentions() as `visibleIds`.
 */
export async function buildVisibleMentionSet(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  texts: (string | null | undefined)[],
): Promise<Set<string>> {
  const mentions = extractMentions(texts)
  if (mentions.length === 0) return new Set()

  const visibleIds = new Set<string>()

  // Group by type
  const byType = new Map<string, string[]>()
  for (const { type, id } of mentions) {
    if (ALWAYS_VISIBLE.has(type)) { visibleIds.add(id); continue }
    if (!byType.has(type)) byType.set(type, [])
    byType.get(type)!.push(id)
  }

  // Batch-query each gated table (RLS returns only visible rows)
  const queries = Array.from(byType.entries()).map(async ([type, ids]) => {
    const table = GATED_TABLE[type]
    if (!table) return // unknown type — default to hidden, not visible
    const { data } = await supabase.from(table).select('id').in('id', ids)
    for (const row of (data ?? [])) visibleIds.add(row.id)
  })

  await Promise.all(queries)
  return visibleIds
}

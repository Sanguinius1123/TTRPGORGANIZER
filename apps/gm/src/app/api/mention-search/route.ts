'use server'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? ''
  if (!q || q.length < 1) return NextResponse.json([])

  const supabase = db()
  const like = `%${q}%`

  const results = await Promise.all([
    supabase.from('locations').select('id, name').ilike('name', like).limit(4),
    supabase.from('npcs').select('id, name').ilike('name', like).limit(4),
    supabase.from('factions').select('id, name').ilike('name', like).limit(3),
    supabase.from('player_characters').select('id, name').ilike('name', like).limit(3),
    supabase.from('items').select('id, name').ilike('name', like).limit(2),
    supabase.from('lore_entries').select('id, title').ilike('title', like).limit(2),
    supabase.from('plot_threads').select('id, title').ilike('title', like).limit(2),
    supabase.from('species').select('id, name').ilike('name', like).limit(3),
    supabase.from('cultures').select('id, name').ilike('name', like).limit(3),
  ])

  type NameRow  = { id: string; name: string }
  type TitleRow = { id: string; title: string }

  const suggestions = [
    ...(results[0].data ?? [] as NameRow[]).map((r: any) => ({ type: 'location',     id: r.id, name: r.name  })),
    ...(results[1].data ?? [] as NameRow[]).map((r: any) => ({ type: 'npc',          id: r.id, name: r.name  })),
    ...(results[2].data ?? [] as NameRow[]).map((r: any) => ({ type: 'faction',      id: r.id, name: r.name  })),
    ...(results[3].data ?? [] as NameRow[]).map((r: any) => ({ type: 'pc',           id: r.id, name: r.name  })),
    ...(results[4].data ?? [] as NameRow[]).map((r: any) => ({ type: 'item',         id: r.id, name: r.name  })),
    ...(results[5].data ?? [] as TitleRow[]).map((r: any) => ({ type: 'lore',        id: r.id, name: r.title })),
    ...(results[6].data ?? [] as TitleRow[]).map((r: any) => ({ type: 'plot-thread', id: r.id, name: r.title })),
    ...(results[7].data ?? [] as NameRow[]).map((r: any) => ({ type: 'species',      id: r.id, name: r.name  })),
    ...(results[8].data ?? [] as NameRow[]).map((r: any) => ({ type: 'culture',      id: r.id, name: r.name  })),
  ]

  return NextResponse.json(suggestions)
}

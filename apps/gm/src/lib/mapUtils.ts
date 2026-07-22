export const SCALE_TYPES: Record<string, string[]> = {
  galaxy: ['Sector', 'Star System', 'POI'],
  system: ['World', 'Space Station', 'Star / Singularity', 'Planetoid', 'POI'],
  body: [
    'Wilderness', 'Ruin', 'Settlement', 'District', 'Fortification',
    'Residence', 'Commerce', 'Tavern / Inn', 'Place of Worship', 'Government',
    'Prison', 'Guild / Organization', 'Workshop', 'Research / Laboratory',
    'Medical / Healthcare', 'Entertainment', 'Transport Hub', 'POI',
  ],
  local: [
    'District', 'Residence', 'Commerce', 'Tavern / Inn', 'Place of Worship',
    'Government', 'Prison', 'Guild / Organization', 'Workshop',
    'Research / Laboratory', 'Medical / Healthcare', 'Entertainment',
    'Transport Hub', 'Fortification', 'POI',
  ],
  internal: [
    'Room', 'Corridor', 'Chamber', 'Vault', 'Common Area', 'Barracks',
    'Cell', 'Storage', 'Airlock', 'Bridge', 'Cargo Hold', 'Engineering',
    'Access Tunnel', 'Medical Bay', 'Armory', 'POI',
  ],
}

export const TERRAIN_MULT: Record<string, number> = {
  'Forest': 1.3,
  'Mountain': 2.0,
  'Plains': 1.0,
  'Desert': 1.5,
  'Ocean': 1.8,
  'River / Lake': 1.4,
  'Coastal': 1.2,
  'Swamp / Wetland': 1.8,
  'Arctic / Tundra': 1.8,
  'Underground': 1.4,
  'Urban': 0.9,
  'Wasteland': 1.5,
  'Jungle': 1.6,
  'Volcanic': 2.5,
}

export const PATH_MULT: Record<string, number> = {
  'Road': 0.6,
  'Trail / Path': 0.85,
  'Tunnel': 0.7,
  'Bridge': 0.8,
  'Ferry / Crossing': 1.2,
  'Mountain Pass': 1.5,
}

export const TERRAIN_COLORS: Record<string, string> = {
  'Forest': '#166534',
  'Mountain': '#475569',
  'Plains': '#65a30d',
  'Desert': '#d97706',
  'Ocean': '#0369a1',
  'River / Lake': '#0284c7',
  'Coastal': '#0891b2',
  'Swamp / Wetland': '#4d7c0f',
  'Arctic / Tundra': '#e2e8f0',
  'Underground': '#44403c',
  'Urban': '#6b7280',
  'Wasteland': '#78716c',
  'Jungle': '#14532d',
  'Volcanic': '#991b1b',
}

export const TERRAIN_LIST = Object.keys(TERRAIN_MULT)
export const PATH_MODIFIER_LIST = Object.keys(PATH_MULT)

export function calcTravelCost(
  ax: number, ay: number, aterrain: string | null, apaths: string[],
  bx: number, by: number, bterrain: string | null, bpaths: string[],
  distanceScale: number
): number {
  const dx = bx - ax
  const dy = by - ay
  const rawDist = Math.sqrt(dx * dx + dy * dy)
  const scaled = rawDist / (distanceScale || 100)

  const multA = TERRAIN_MULT[aterrain ?? ''] ?? 1.0
  const multB = TERRAIN_MULT[bterrain ?? ''] ?? 1.0
  // River-to-river: traveling on the water is twice as fast as open terrain
  const avgTerrain = (aterrain === 'River / Lake' && bterrain === 'River / Lake')
    ? 0.5
    : (multA + multB) / 2

  // Only apply a path modifier if both endpoints share it (road must connect both nodes)
  const sharedPaths = apaths.filter(p => bpaths.includes(p))
  const pathMult = sharedPaths.length > 0
    ? Math.min(...sharedPaths.map(p => PATH_MULT[p] ?? 1.0))
    : 1.0

  const raw = scaled * avgTerrain * pathMult
  // One decimal for small values (<10), integer for larger ones
  return raw < 10 ? Math.round(raw * 10) / 10 : Math.round(raw)
}

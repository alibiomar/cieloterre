import type { Property } from '@/lib/cieloterre-data'

// --- Static option lists (frozen so they can double as literal-type sources) ---

export const SEARCH_LOCATIONS = [
  'La Marsa', 'Carthage', 'Gammarth', 'Sidi Bou Said',
  'Lac 2', 'La Soukra', 'Hammamet', 'Sousse', 'Djerba',
] as const

export const SEARCH_TYPES = ['Appartement', 'Villa', 'Maison', 'Terrain'] as const

export const SEARCH_FEATURES = [
  'Piscine', 'Jardin', 'Terrasse', 'Vue mer',
  'Parking', 'Ascenseur', 'Climatisation', 'Meublé',
] as const

export const SEARCH_SORTS = ['pertinence', 'prix-croissant', 'prix-decroissant', 'surface'] as const

export type SearchLocation = (typeof SEARCH_LOCATIONS)[number]
export type SearchType = (typeof SEARCH_TYPES)[number]
export type SearchFeature = (typeof SEARCH_FEATURES)[number]
export type SearchSort = (typeof SEARCH_SORTS)[number]
export type SearchTransaction = 'sale' | 'rent' | 'new'

export interface PropertyQuery {
  ville: SearchLocation | ''
  type: SearchType | ''
  transaction: SearchTransaction
  minPrice?: number
  maxPrice?: number
  chambres?: number
  features: SearchFeature[]
  sort: SearchSort
  page: number
  view: 'liste' | 'carte'
}

const DEFAULT_SORT: SearchSort = 'pertinence'
const DEFAULT_VIEW: PropertyQuery['view'] = 'liste'

export const PAGE_SIZE = 6

// --- Small parsing helpers ---

/** Parses a positive-ish number from a query param, or `undefined` if absent/invalid. */
function parseNumberParam(value: string | null, min = 0): number | undefined {
  if (value === null || value === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= min ? parsed : undefined
}

/** Returns `value` only if it belongs to the allowed literal set, else `''`. */
function parseEnumParam<T extends string>(value: string | null, allowed: readonly T[]): T | '' {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : ''
}

// --- Query <-> URLSearchParams ---

export function parsePropertyQuery(params: URLSearchParams): PropertyQuery {
  const rawPage = parseNumberParam(params.get('page'), 1) ?? 1

  return {
    ville: parseEnumParam(params.get('ville'), SEARCH_LOCATIONS),
    type: parseEnumParam(params.get('type'), SEARCH_TYPES),
    transaction: parseEnumParam(params.get('transaction'), ['sale', 'rent', 'new']) || 'sale',
    minPrice: parseNumberParam(params.get('minPrice')),
    maxPrice: parseNumberParam(params.get('maxPrice')),
    chambres: parseNumberParam(params.get('chambres'), 1),
    features: dedupeFeatures(params.getAll('feature')),
    sort: parseEnumParam(params.get('sort'), SEARCH_SORTS) || DEFAULT_SORT,
    page: Math.max(1, Math.floor(rawPage)),
    view: params.get('view') === 'carte' ? 'carte' : DEFAULT_VIEW,
  }
}

function dedupeFeatures(values: string[]): SearchFeature[] {
  const allowed = new Set<string>(SEARCH_FEATURES)
  return [...new Set(values)].filter((v): v is SearchFeature => allowed.has(v))
}

export function serializePropertyQuery(query: PropertyQuery): URLSearchParams {
  const params = new URLSearchParams()

  if (query.ville) params.set('ville', query.ville)
  if (query.type) params.set('type', query.type)
  if (query.transaction !== 'sale') params.set('transaction', query.transaction)
  if (query.minPrice !== undefined) params.set('minPrice', String(query.minPrice))
  if (query.maxPrice !== undefined) params.set('maxPrice', String(query.maxPrice))
  if (query.chambres !== undefined) params.set('chambres', String(query.chambres))
  for (const feature of query.features) params.append('feature', feature)
  if (query.sort !== DEFAULT_SORT) params.set('sort', query.sort)
  if (query.page > 1) params.set('page', String(query.page))
  if (query.view !== DEFAULT_VIEW) params.set('view', query.view)

  return params
}

// --- Filtering & sorting ---

const SORT_COMPARATORS: Record<SearchSort, (a: Property, b: Property) => number> = {
  'pertinence': () => 0,
  'prix-croissant': (a, b) => a.numericPrice - b.numericPrice,
  'prix-decroissant': (a, b) => b.numericPrice - a.numericPrice,
  'surface': (a, b) => b.area - a.area,
}

export function filterProperties(properties: Property[], query: PropertyQuery): Property[] {
  const matches = properties.filter((property) => {
    if (query.ville && property.city !== query.ville) return false
    if (query.type && property.type !== query.type) return false
    if (query.minPrice !== undefined && property.numericPrice < query.minPrice) return false
    if (query.maxPrice !== undefined && property.numericPrice > query.maxPrice) return false
    if (query.chambres !== undefined && property.bedrooms < query.chambres) return false
    if (query.features.length > 0 && !query.features.every((f) => property.features?.includes(f))) return false
    return true
  })

  return matches.sort(SORT_COMPARATORS[query.sort])
}

// --- Pagination ---

export function pageCount(total: number, pageSize = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / pageSize))
}

export function pageItems<T>(items: T[], page: number, pageSize = PAGE_SIZE): T[] {
  const start = (page - 1) * pageSize
  return items.slice(start, start + pageSize)
}

// --- Display labels for active filter chips ---

type LabelableKey = 'ville' | 'type' | 'minPrice' | 'maxPrice' | 'chambres'

const formatTND = (value: number) => value.toLocaleString('fr-FR')

export function queryLabel(key: LabelableKey, value: string | number): string {
  switch (key) {
    case 'ville':
    case 'type':
      return String(value)
    case 'minPrice':
      return `Dès ${formatTND(Number(value))} TND`
    case 'maxPrice':
      return `Jusqu'à ${formatTND(Number(value))} TND`
    case 'chambres':
      return `${value} chambres`
    default:
      return String(value)
  }
}
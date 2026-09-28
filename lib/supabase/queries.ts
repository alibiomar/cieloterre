import { createClient } from './server'
import type { Tables } from './database.types'
import type { Property } from '@/lib/cieloterre-data'
import type { Agency, Agent, Article } from '@/lib/cieloterre-data'
import { publicMediaUrl } from './mappers'

// --- Types ---

export interface PropertyFilters {
  city?: string
  type?: string
  transaction?: 'sale' | 'rent' | 'new'
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  features?: string[]
  limit?: number
  offset?: number
}

type AgencySummary = Pick<Tables<'agencies'>, 'name' | 'slug'>
type AgentSummary = Pick<Tables<'agents'>, 'slug' | 'phone' | 'email'>

export type PropertyListRow = Tables<'properties'> & {
  agencies: AgencySummary | null
  agents: AgentSummary | null
}

export type PropertyDetailRow = Tables<'properties'> & {
  property_images: Tables<'property_images'>[]
  agencies: Tables<'agencies'> | null
  agents: Tables<'agents'> | null
}

const TRANSACTION_LABELS: Record<string, Property['transaction']> = {
  rent: 'À louer',
  new: 'Neuf',
  sale: 'À vendre',
}

const DEFAULT_PAGE_SIZE = 24
const MAX_PAGE_SIZE = 100

/** Escapes `%` and `_` so user-influenced values can't be used as ILIKE wildcards. */
function escapeIlike(value: string): string {
  return value.replace(/[%_]/g, (char) => `\\${char}`)
}

// --- Queries ---

export async function getPublishedProperties(
  filters: PropertyFilters = {},
): Promise<PropertyListRow[]> {
  const supabase = await createClient()
  const limit = Math.min(filters.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)
  const offset = Math.max(filters.offset ?? 0, 0)

  let query = supabase
    .from('properties')
    .select('*, agencies(name, slug), agents(slug, phone, email)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (filters.city) query = query.ilike('city', escapeIlike(filters.city))
  if (filters.type) query = query.ilike('property_type', escapeIlike(filters.type))
  if (filters.transaction) query = query.eq('transaction_type', filters.transaction)
  if (filters.minPrice !== undefined) query = query.gte('price', filters.minPrice)
  if (filters.maxPrice !== undefined) query = query.lte('price', filters.maxPrice)
  if (filters.bedrooms !== undefined) query = query.gte('bedrooms', filters.bedrooms)
  if (filters.features?.length) query = query.contains('features', filters.features)

  const { data, error } = await query

  if (error) {
    console.error('[getPublishedProperties] Supabase error:', error)
    throw new Error('Impossible de charger les biens')
  }

  return (data ?? []) as PropertyListRow[]
}

export async function getPropertyBySlug(slug: string): Promise<PropertyDetailRow | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('properties')
    .select('*, property_images(*), agencies(*), agents(*)')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error) {
    console.error(`[getPropertyBySlug] Supabase error for slug "${slug}":`, error)
    throw new Error('Impossible de charger le bien')
  }

  // maybeSingle() returns null (no error) when nothing matches — pass that
  // through so callers can render a 404 instead of treating it as a failure.
  return data as PropertyDetailRow | null
}
export async function getSiteSetting<T = any>(key: string): Promise<T | null> {
  const supabase = await createClient()
  const { data } = await (supabase.from('site_settings') as any).select('value').eq('key', key).maybeSingle()
  return (data?.value as T) ?? null
}

export async function getPublishedPropertyById(
  id: string,
): Promise<PropertyListRow | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('properties')
    .select('*, agencies(name, slug), agents(slug, phone, email)')
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle()

  return data as PropertyListRow | null
}
export async function getPublicAgencies(): Promise<Agency[]> {
  const supabase = await createClient()
  let { data, error } = await (supabase.from('agencies') as any)
    .select('id, name, slug, description, city, address, phone, email, website, logo_path, agents(count)')
    .order('name')
  if (error?.code === '42703') {
    ({ data, error } = await (supabase.from('agencies') as any)
      .select('id, name, slug, description, phone, email, website, logo_path')
      .order('name'))
  }
  if (error) throw new Error('Impossible de charger les agences')
  return (data ?? []).map((agency: any) => ({
    slug: agency.slug,
    name: agency.name,
    city: agency.city ?? agency.description ?? '',
    address: agency.address ?? agency.description ?? '',
    phone: agency.phone ?? '',
    image: publicMediaUrl(agency.logo_path, '/cieloterre-hero.png'),
    agents: Array.isArray(agency.agents) ? Number(agency.agents[0]?.count ?? 0) : 0,
    email: agency.email ?? '',
    website: agency.website ?? '',
    description: agency.description ?? '',
  }))
}

export async function getPublicAgents(): Promise<Agent[]> {
  const supabase = await createClient()
  const baseQuery = (select: string) => (supabase.from('agents') as any)
    .select(select)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
  let { data, error } = await baseQuery(
    'slug, name, bio, phone, email, avatar_path, languages, is_public, agencies(name), profiles(full_name, phone, role)',
  )
  if (error?.code === '42703') {
    ({ data, error } = await baseQuery(
      'slug, bio, phone, email, avatar_path, is_public, agencies(name), profiles(full_name, phone, role)',
    ))
  }
  if (error) {
    if (['42P01', '42703', '42501', 'PGRST204', 'PGRST205'].includes(error.code)) {
      console.warn('[getPublicAgents] Public agent data is unavailable:', {
        code: error.code,
        message: error.message,
      })
      return []
    }
    throw new Error('Impossible de charger les agents')
  }
  return (data ?? []).map((agent: any) => {
    const profile = Array.isArray(agent.profiles) ? agent.profiles[0] : agent.profiles;
    const slugName = String(agent.slug ?? '')
      .replace(/-[a-z0-9]{1,8}$/i, '')
      .split('-')
      .filter(Boolean)
      .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
    return {
    slug: agent.slug,
    name: agent.name?.trim() || profile?.full_name?.trim() || slugName || agent.email || 'Conseiller CieloTerre',
    role: profile?.role === 'agency_admin' ? 'Responsable d’agence' : 'Conseiller immobilier',
    city: agent.agencies?.name ?? '',
    languages: Array.isArray(agent.languages) && agent.languages.length ? agent.languages : ['Français', 'Arabe'],
    image: publicMediaUrl(agent.avatar_path, '/cieloterre-hero.png'),
    bio: agent.bio ?? '',
    phone: agent.phone ?? profile?.phone ?? '',
    email: agent.email ?? '',
    };
  })
}

export async function getPublicArticles(): Promise<Article[]> {
  const supabase = await createClient()
  const { data, error } = await (supabase.from('crm_articles') as any)
    .select('slug, category, title, excerpt, body, image_url, read_time')
    .eq('published', true)
    .order('published_at', { ascending: false })
  if (error) {
    // The public site must remain available while the CRM migration or its
    // public read policy is being applied in Supabase.
    if (['42P01', '42501', 'PGRST204', 'PGRST205'].includes(error.code)) {
      console.warn('[getPublicArticles] CRM articles are unavailable:', {
        code: error.code,
        message: error.message,
      })
      return []
    }
    throw new Error('Impossible de charger les conseils')
  }
  return (data ?? []).map((article: any) => ({
    slug: article.slug,
    category: article.category,
    title: article.title,
    excerpt: article.excerpt,
    body: article.body ?? '',
    image: publicMediaUrl(article.image_url, '/cieloterre-hero.png'),
    readTime: article.read_time || '5 min',
  }))
}

export async function getPublicAgencyBySlug(slug: string): Promise<Agency | null> {
  return (await getPublicAgencies()).find((agency) => agency.slug === slug) ?? null
}

export async function getPublicAgentBySlug(slug: string): Promise<Agent | null> {
  return (await getPublicAgents()).find((agent) => agent.slug === slug) ?? null
}

export async function getPublicArticleBySlug(slug: string): Promise<Article | null> {
  return (await getPublicArticles()).find((article) => article.slug === slug) ?? null
}

// --- Mapping to view model ---
export { toPropertyCard } from './mappers'

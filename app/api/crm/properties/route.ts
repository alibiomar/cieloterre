import { NextResponse } from 'next/server'
import { requireStaff, isStaffError, parseJson, escapePostgrestFilterValue, dbError } from '@/lib/crm/auth'
import { SEARCH_FEATURES } from '@/lib/property-search'

const PROPERTY_SELECT = 'id, slug, title, city, neighborhood, property_type, transaction_type, price, bedrooms, bathrooms, area_m2, description, cover_path, status, agency_id, agent_id, owner_id, created_by, updated_by, features, created_at, updated_at'

function sanitizeFeatures(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && (SEARCH_FEATURES as readonly string[]).includes(item))
}

function slugify(input: string) {
  return input.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80)
}

export async function GET(request: Request) {
  const auth = await requireStaff()
  if (isStaffError(auth)) return auth.error
  const { supabase } = auth
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('q')?.trim()

  let query = supabase.from('properties').select(PROPERTY_SELECT).order('created_at', { ascending: false })
  if (auth.role !== 'admin' && auth.agencyId) query = query.eq('agency_id', auth.agencyId)
  if (search) {
    const safe = escapePostgrestFilterValue(search)
    if (safe) query = query.or(`title.ilike.%${safe}%,city.ilike.%${safe}%`)
  }

  const { data, error } = await query
  if (error) return dbError('Impossible de charger les biens.', error)
  return NextResponse.json({ properties: data ?? [] })
}

export async function POST(request: Request) {
  const auth = await requireStaff()
  if (isStaffError(auth)) return auth.error
  const { supabase } = auth
  const body = await parseJson(request)
  if (!body?.title || !body?.city || !body?.property_type || !body?.transaction_type || body.price === undefined) {
    return NextResponse.json({ error: 'Titre, ville, type, transaction et prix sont requis.' }, { status: 400 })
  }
  const price = Number(body.price)
  if (!Number.isFinite(price) || price < 0) return NextResponse.json({ error: 'Prix invalide.' }, { status: 400 })

  const baseSlug = slugify(String(body.title)) || 'bien'
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`

  // Non-admin staff can only publish under their own agency; agents are
  // attributed as the listing agent automatically.
  const agencyId = auth.role === 'admin' ? (body.agency_id || null) : auth.agencyId
  const agentId = auth.role === 'agent' ? auth.user.id : (auth.role === 'admin' ? (body.agent_id || null) : (body.agent_id || null))

  const imagePaths = Array.isArray(body.imagePaths) ? body.imagePaths.filter((path: unknown): path is string => typeof path === "string" && path.startsWith("crm/")) : [];
  const { data, error } = await supabase.from('properties').insert({
    slug,
    title: String(body.title).slice(0, 160),
    description: body.description ? String(body.description).slice(0, 4000) : null,
    city: String(body.city).slice(0, 80),
    neighborhood: body.neighborhood ? String(body.neighborhood).slice(0, 80) : null,
    property_type: String(body.property_type).slice(0, 40),
    transaction_type: String(body.transaction_type).slice(0, 20),
    price,
    bedrooms: Number.isFinite(Number(body.bedrooms)) ? Number(body.bedrooms) : 0,
    bathrooms: Number.isFinite(Number(body.bathrooms)) ? Number(body.bathrooms) : 0,
    area_m2: Number.isFinite(Number(body.area_m2)) ? Number(body.area_m2) : 0,
    status: ['draft', 'published', 'archived'].includes(body.status) ? body.status : 'draft',
    cover_path: typeof body.cover_path === 'string' ? body.cover_path : null,
    features: sanitizeFeatures(body.features),
    agency_id: agencyId,
    agent_id: agentId,
    owner_id: agentId || auth.user.id,
    created_by: auth.user.id,
  }).select(PROPERTY_SELECT).single()

  if (error) return dbError('Impossible de créer le bien.', error)
  if (data && imagePaths.length) {
    await supabase.from("property_images").insert(imagePaths.map((path: string, index: number) => ({ property_id: data.id, path, sort_order: index })));
  }
  return NextResponse.json({ property: data })
}

import { NextResponse } from 'next/server'
import { requireStaff, isStaffError, parseJson, dbError } from '@/lib/crm/auth'
import { SEARCH_FEATURES } from '@/lib/property-search'
import { createAdminClient, deleteStaleMedia, extractStoragePath } from '@/lib/supabase/admin'

const PROPERTY_SELECT = 'id, slug, title, city, neighborhood, property_type, transaction_type, price, bedrooms, bathrooms, area_m2, description, cover_path, status, agency_id, agent_id, features, created_at, updated_at'

const editableStrings = ['title', 'description', 'city', 'neighborhood', 'property_type', 'transaction_type', 'status', 'cover_path'] as const
const editableNumbers = ['price', 'bedrooms', 'bathrooms', 'area_m2'] as const

async function assertScopedProperty(supabase: any, id: string, auth: { role: string; agencyId: string | null }) {
  if (auth.role === 'admin') return null
  const { data: existing, error } = await supabase.from('properties').select('id, agency_id').eq('id', id).maybeSingle()
  if (error || !existing) return NextResponse.json({ error: 'Bien introuvable.' }, { status: 404 })
  if (!auth.agencyId || existing.agency_id !== auth.agencyId) return NextResponse.json({ error: "Vous n'avez pas accès à ce bien." }, { status: 403 })
  return null
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff()
  if (isStaffError(auth)) return auth.error
  const { supabase } = auth
  const { id } = await params

  const scopeError = await assertScopedProperty(supabase, id, auth)
  if (scopeError) return scopeError

  const body = await parseJson(request)
  if (!body) return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })

  let oldCoverPath: string | null = null
  if ('cover_path' in body) {
    const { data: existingCover } = await supabase.from('properties').select('cover_path').eq('id', id).maybeSingle()
    oldCoverPath = existingCover?.cover_path ?? null
  }

  const update: Record<string, unknown> = {}
  for (const key of editableStrings) if (key in body) update[key] = body[key] === '' ? null : body[key]
  for (const key of editableNumbers) if (key in body && Number.isFinite(Number(body[key]))) update[key] = Number(body[key])
  if ('features' in body) update.features = Array.isArray(body.features) ? body.features.filter((item: unknown): item is string => typeof item === 'string' && (SEARCH_FEATURES as readonly string[]).includes(item)) : []
  if (auth.role === 'admin') {
    if ('agency_id' in body) update.agency_id = body.agency_id || null
    if ('agent_id' in body) update.agent_id = body.agent_id || null
  }
  if (Object.keys(update).length === 0 && !(Array.isArray(body.imagePaths) && body.imagePaths.length)) {
    return NextResponse.json({ error: 'Aucune modification fournie.' }, { status: 400 })
  }
  const { data, error } = Object.keys(update).length
    ? await supabase.from('properties').update(update).eq('id', id).select(PROPERTY_SELECT).single()
    : await supabase.from('properties').select(PROPERTY_SELECT).eq('id', id).single()
  if (error) return dbError('Impossible de mettre à jour le bien.', error)
  if ('cover_path' in update) void deleteStaleMedia(createAdminClient(), oldCoverPath, update.cover_path as string | null)
  if (data && Array.isArray(body.imagePaths) && body.imagePaths.length) {
    const paths = body.imagePaths.filter((value: unknown): value is string => typeof value === 'string')
    if (paths.length) {
      const { count } = await supabase.from('property_images').select('id', { count: 'exact', head: true }).eq('property_id', id)
      await supabase.from('property_images').insert(paths.map((path: string, index: number) => ({ property_id: id, path, sort_order: (count ?? 0) + index })))
    }
  }
  return NextResponse.json({ property: data })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff()
  if (isStaffError(auth)) return auth.error
  const { supabase } = auth
  const { id } = await params

  const scopeError = await assertScopedProperty(supabase, id, auth)
  if (scopeError) return scopeError

  const { data: existing } = await supabase.from('properties').select('cover_path').eq('id', id).maybeSingle()
  const { data: images } = await supabase.from('property_images').select('path').eq('property_id', id)

  const { error } = await supabase.from('properties').delete().eq('id', id)
  if (error) return dbError('Impossible de supprimer le bien.', error)

  const admin = createAdminClient()
  const paths = [
    extractStoragePath(existing?.cover_path ?? null),
    ...(images ?? []).map((image: { path: string | null }) =>
      extractStoragePath(image.path)
    ),
  ].filter((path): path is string => Boolean(path))
  if (paths.length) void admin.storage.from('public-media').remove(paths).catch(() => {})

  return NextResponse.json({ ok: true })
}

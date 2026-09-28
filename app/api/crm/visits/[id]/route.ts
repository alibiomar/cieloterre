import { NextResponse } from 'next/server'
import { requireStaff, isStaffError, parseJson, agencyMemberIds, dbError } from '@/lib/crm/auth'

const statuses = new Set(['scheduled', 'completed', 'cancelled', 'no_show'])

async function assertAgencyVisit(supabase: any, id: string, auth: { role: string; user: { id: string }; agencyId: string | null }) {
  if (auth.role === 'admin') return null
  const { data: existing, error } = await supabase.from('visits').select('id, owner_id').eq('id', id).maybeSingle()
  if (error || !existing) return NextResponse.json({ error: 'Visite introuvable.' }, { status: 404 })
  const memberIds = await agencyMemberIds(auth.agencyId)
  if (!memberIds.includes(existing.owner_id) && existing.owner_id !== auth.user.id) return NextResponse.json({ error: "Vous n'avez pas accès à cette visite." }, { status: 403 })
  return null
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff()
  if (isStaffError(auth)) return auth.error
  const { supabase } = auth
  const { id } = await params

  const scopeError = await assertAgencyVisit(supabase, id, auth)
  if (scopeError) return scopeError

  const body = await parseJson(request)
  if (!body) return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })

  const update: Record<string, unknown> = {}
  if ('scheduled_at' in body) update.scheduled_at = body.scheduled_at
  if ('notes' in body) update.notes = body.notes || null
  if ('status' in body && statuses.has(body.status)) update.status = body.status
  if (Object.keys(update).length === 0) return NextResponse.json({ error: 'Aucune modification fournie.' }, { status: 400 })
  update.updated_by = auth.user.id

  const { data, error } = await supabase.from('visits').update(update).eq('id', id).select('id, scheduled_at, status, notes, owner_id, created_at, contacts(id, full_name, phone, email), properties(id, title, city, slug)').single()
  if (error) return dbError('Impossible de mettre à jour la visite.', error)
  return NextResponse.json({ visit: data })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff()
  if (isStaffError(auth)) return auth.error
  const { supabase } = auth
  const { id } = await params

  const scopeError = await assertAgencyVisit(supabase, id, auth)
  if (scopeError) return scopeError

  const { error } = await supabase.from('visits').delete().eq('id', id)
  if (error) return dbError('Impossible de supprimer la visite.', error)
  return NextResponse.json({ ok: true })
}

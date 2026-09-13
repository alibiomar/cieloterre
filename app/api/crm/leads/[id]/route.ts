import { NextResponse } from 'next/server'
import { requireStaff, isStaffError, parseJson, agencyMemberIds, dbError } from '@/lib/crm/auth'
import { logActivity } from '@/lib/crm/activity'

const statuses = new Set(['new', 'contacted', 'qualified', 'visit_scheduled', 'won', 'lost'])
const priorities = new Set(['low', 'normal', 'high'])

async function assertAgencyLead(supabase: any, id: string, auth: { role: string; user: { id: string }; agencyId: string | null }) {
  if (auth.role === 'admin') return null
  const { data: existing, error } = await supabase.from('leads').select('id, owner_id').eq('id', id).maybeSingle()
  if (error || !existing) return NextResponse.json({ error: 'Lead introuvable.' }, { status: 404 })
  const memberIds = await agencyMemberIds(auth.agencyId)
  if (!memberIds.includes(existing.owner_id) && existing.owner_id !== auth.user.id) return NextResponse.json({ error: "Vous n'avez pas accès à ce lead." }, { status: 403 })
  return null
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff()
  if (isStaffError(auth)) return auth.error
  const { supabase } = auth
  const { id } = await params
  const body = await parseJson(request)
  if (!body) return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if ('status' in body) {
    if (!statuses.has(body.status)) return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
    update.status = body.status
    if (body.status === 'contacted') update.last_contacted_at = new Date().toISOString()
  }
  if ('priority' in body) {
    if (!priorities.has(body.priority)) return NextResponse.json({ error: 'Priorité invalide' }, { status: 400 })
    update.priority = body.priority
  }
  if ('property_id' in body) {
    update.property_id = body.property_id || null
  }
  if (Object.keys(update).length <= 1) return NextResponse.json({ error: 'Aucune modification fournie.' }, { status: 400 })

  const scopeError = await assertAgencyLead(supabase, id, auth)
  if (scopeError) return scopeError

  const { data, error } = await supabase
    .from('leads')
    .update(update)
    .eq('id', id)
    .select('id, status, priority, created_at, message, contacts(id, full_name, email, phone), properties(id, title, city, price)')
    .single()
  if (error) return dbError('Impossible de mettre à jour le lead.', error)
  if ('status' in update) {
    await logActivity(supabase, { actorId: auth.user.id, activityType: 'status_changed', leadId: id, body: `Statut du lead → ${update.status}` })
  }
  return NextResponse.json({ lead: data })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff()
  if (isStaffError(auth)) return auth.error
  const { supabase } = auth
  const { id } = await params

  const scopeError = await assertAgencyLead(supabase, id, auth)
  if (scopeError) return scopeError

  const { error } = await supabase.from('leads').delete().eq('id', id)
  if (error) return dbError('Impossible de supprimer le lead.', error)
  return NextResponse.json({ ok: true })
}

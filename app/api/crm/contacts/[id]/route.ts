import { NextResponse } from 'next/server'
import { requireStaff, isStaffError, parseJson, agencyMemberIds, dbError } from '@/lib/crm/auth'

const editable = ['full_name', 'email', 'phone', 'contact_type', 'notes'] as const

async function assertAgencyContact(supabase: any, id: string, auth: { role: string; user: { id: string }; agencyId: string | null }) {
  if (auth.role === 'admin') return null
  const { data: existing, error } = await supabase.from('contacts').select('id, owner_id').eq('id', id).maybeSingle()
  if (error || !existing) return NextResponse.json({ error: 'Contact introuvable.' }, { status: 404 })
  const memberIds = await agencyMemberIds(auth.agencyId)
  if (!memberIds.includes(existing.owner_id) && existing.owner_id !== auth.user.id) return NextResponse.json({ error: "Vous n'avez pas accès à ce contact." }, { status: 403 })
  return null
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff()
  if (isStaffError(auth)) return auth.error
  const { supabase } = auth
  const { id } = await params

  const scopeError = await assertAgencyContact(supabase, id, auth)
  if (scopeError) return scopeError

  const body = await parseJson(request)
  if (!body) return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })

  const update: Record<string, unknown> = {}
  for (const key of editable) {
    if (!(key in body)) continue
    if (key === 'contact_type') {
      const allowed = ['lead', 'buyer', 'seller', 'tenant', 'landlord', 'other']
      update.contact_type = allowed.includes(body.contact_type) ? body.contact_type : 'lead'
    } else if (key === 'full_name') {
      const value = typeof body.full_name === 'string' ? body.full_name.trim().slice(0, 120) : ''
      if (!value) return NextResponse.json({ error: 'Le nom complet est requis.' }, { status: 400 })
      update.full_name = value
    } else if (key === 'notes') {
      update.notes = body.notes ? String(body.notes).slice(0, 4000) : null
    } else {
      update[key] = body[key] ? String(body[key]).slice(0, key === 'email' ? 200 : 40) : null
    }
  }
  if (Object.keys(update).length === 0) return NextResponse.json({ error: 'Aucune modification fournie.' }, { status: 400 })

  const { data, error } = await supabase.from('contacts').update(update).eq('id', id).select('id, full_name, email, phone, contact_type, notes, owner_id, created_at, updated_at').single()
  if (error) return dbError('Impossible de mettre à jour le contact.', error)
  return NextResponse.json({ contact: data })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff()
  if (isStaffError(auth)) return auth.error
  const { supabase } = auth
  const { id } = await params

  const scopeError = await assertAgencyContact(supabase, id, auth)
  if (scopeError) return scopeError

  const { error } = await supabase.from('contacts').delete().eq('id', id)
  if (error) return dbError('Impossible de supprimer le contact.', error)
  return NextResponse.json({ ok: true })
}

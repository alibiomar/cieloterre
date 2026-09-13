import { NextResponse } from 'next/server'
import { requireStaff, isStaffError, parseJson, agencyPropertyIds, dbError } from '@/lib/crm/auth'

const statuses = new Set(['requested', 'confirmed', 'completed', 'cancelled'])

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff()
  if (isStaffError(auth)) return auth.error
  const { supabase, user } = auth
  const { id } = await params
  const body = await parseJson(request)
  if (!body) return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })

  if (auth.role !== 'admin') {
    const { data: existing } = await supabase.from('viewing_requests').select('id, property_id').eq('id', id).maybeSingle()
    if (!existing) return NextResponse.json({ error: 'Demande de visite introuvable.' }, { status: 404 })
    const propertyIds = await agencyPropertyIds(auth.agencyId)
    if (!existing.property_id || !propertyIds.includes(existing.property_id)) {
      return NextResponse.json({ error: "Vous n'avez pas accès à cette demande." }, { status: 403 })
    }
  }

  // Convert into a scheduled visit (and optionally a new contact + lead).
  if (body.action === 'convert') {
    if (!body.scheduled_at) return NextResponse.json({ error: 'Date et heure requises.' }, { status: 400 })
    const { data: viewingRequest, error: fetchError } = await supabase.from('viewing_requests').select('id, property_id, name, email, phone, message').eq('id', id).single()
    if (fetchError || !viewingRequest) return NextResponse.json({ error: 'Demande de visite introuvable.' }, { status: 404 })

    let contactId: string | null = null
    if (viewingRequest.email) {
      const { data: existing } = await supabase.from('contacts').select('id').eq('email', viewingRequest.email).maybeSingle()
      contactId = existing?.id ?? null
    }
    if (!contactId) {
      const { data: contact, error: contactError } = await supabase.from('contacts').insert({ owner_id: user.id, full_name: viewingRequest.name, email: viewingRequest.email, phone: viewingRequest.phone, contact_type: 'buyer' }).select('id').single()
      if (contactError) return dbError('Impossible de créer le contact.', contactError)
      contactId = contact.id
    }

    const { data: visit, error: visitError } = await supabase.from('visits').insert({
      owner_id: user.id,
      contact_id: contactId,
      property_id: viewingRequest.property_id,
      viewing_request_id: viewingRequest.id,
      scheduled_at: body.scheduled_at,
      notes: viewingRequest.message,
    }).select('id, scheduled_at, status, notes, created_at, contacts(id, full_name, phone, email), properties(id, title, city, slug)').single()
    if (visitError) return dbError('Impossible de planifier la visite.', visitError)

    await supabase.from('viewing_requests').update({ status: 'confirmed' }).eq('id', id)
    return NextResponse.json({ visit })
  }

  if ('status' in body && statuses.has(body.status)) {
    const { error } = await supabase.from('viewing_requests').update({ status: body.status }).eq('id', id)
    if (error) return dbError('Impossible de mettre à jour la demande.', error)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
}

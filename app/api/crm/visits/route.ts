import { NextResponse } from 'next/server'
import { requireStaff, isStaffError, parseJson, agencyMemberIds, dbError } from '@/lib/crm/auth'
import { logActivity } from '@/lib/crm/activity'

export async function GET() {
  const auth = await requireStaff()
  if (isStaffError(auth)) return auth.error
  const { supabase } = auth

  let query = supabase.from('visits').select('id, scheduled_at, status, notes, owner_id, created_at, contacts(id, full_name, phone, email), properties(id, title, city, slug)').order('scheduled_at', { ascending: true })
  if (auth.role !== 'admin') {
    const memberIds = await agencyMemberIds(auth.agencyId)
    query = query.in('owner_id', memberIds.length ? memberIds : [auth.user.id])
  }

  const { data, error } = await query
  if (error) return dbError('Impossible de charger les visites.', error)
  return NextResponse.json({ visits: data ?? [] })
}

export async function POST(request: Request) {
  const auth = await requireStaff()
  if (isStaffError(auth)) return auth.error
  const { supabase, user } = auth
  const body = await parseJson(request)
  if (!body?.property_id || !body?.scheduled_at) return NextResponse.json({ error: 'Bien et date/heure requis.' }, { status: 400 })

  const { data, error } = await supabase.from('visits').insert({
    owner_id: user.id,
    contact_id: body.contact_id || null,
    lead_id: body.lead_id || null,
    property_id: body.property_id,
    viewing_request_id: body.viewing_request_id || null,
    scheduled_at: body.scheduled_at,
    notes: body.notes ? String(body.notes).slice(0, 2000) : null,
  }).select('id, scheduled_at, status, notes, owner_id, created_at, contacts(id, full_name, phone, email), properties(id, title, city, slug)').single()

  if (error) return dbError('Impossible de planifier la visite.', error)
  await logActivity(supabase, { actorId: user.id, activityType: 'viewing_scheduled', leadId: body.lead_id || null, contactId: body.contact_id || null, body: `Visite planifiée pour le ${body.scheduled_at}` })

  if (body.viewing_request_id) {
    await supabase.from('viewing_requests').update({ status: 'confirmed' }).eq('id', body.viewing_request_id)
  }
  return NextResponse.json({ visit: data })
}

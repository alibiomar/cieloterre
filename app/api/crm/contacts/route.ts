import { NextResponse } from 'next/server'
import { requireStaff, isStaffError, parseJson, escapePostgrestFilterValue, agencyMemberIds, dbError } from '@/lib/crm/auth'
import { logActivity } from '@/lib/crm/activity'

export async function GET(request: Request) {
  const auth = await requireStaff()
  if (isStaffError(auth)) return auth.error
  const { supabase } = auth
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('q')?.trim()

  let query = supabase.from('contacts').select('id, full_name, email, phone, contact_type, notes, owner_id, created_at, updated_at').order('created_at', { ascending: false })
  if (auth.role !== 'admin') {
    const memberIds = await agencyMemberIds(auth.agencyId)
    query = query.in('owner_id', memberIds.length ? memberIds : [auth.user.id])
  }
  if (search) {
    const safe = escapePostgrestFilterValue(search)
    if (safe) query = query.or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%`)
  }

  const { data, error } = await query
  if (error) return dbError('Impossible de charger les contacts.', error)
  return NextResponse.json({ contacts: data ?? [] })
}

export async function POST(request: Request) {
  const auth = await requireStaff()
  if (isStaffError(auth)) return auth.error
  const { supabase, user } = auth
  const body = await parseJson(request)
  if (!body?.full_name || typeof body.full_name !== 'string') {
    return NextResponse.json({ error: 'Le nom complet est requis.' }, { status: 400 })
  }
  const contactType = ['lead', 'buyer', 'seller', 'tenant', 'landlord', 'other'].includes(body.contact_type) ? body.contact_type : 'lead'

  const { data, error } = await supabase.from('contacts').insert({
    owner_id: user.id,
    full_name: String(body.full_name).slice(0, 120),
    email: body.email ? String(body.email).slice(0, 200) : null,
    phone: body.phone ? String(body.phone).slice(0, 40) : null,
    contact_type: contactType,
    notes: body.notes ? String(body.notes).slice(0, 4000) : null,
  }).select('id, full_name, email, phone, contact_type, notes, owner_id, created_at, updated_at').single()

  if (error) return dbError('Impossible de créer le contact.', error)
  await logActivity(supabase, { actorId: user.id, activityType: 'created', contactId: data.id, body: `Contact créé : ${data.full_name}` })
  return NextResponse.json({ contact: data })
}

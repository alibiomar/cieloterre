import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dbError } from '@/lib/crm/auth'
import { logActivity } from '@/lib/crm/activity'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const body = await request.json().catch(() => null)
  if (!body?.name || !body?.email || !body?.message) return NextResponse.json({ error: 'Nom, email et projet requis.' }, { status: 400 })
  const db = supabase as any
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!profile || !['admin', 'agency_admin', 'agent'].includes(profile.role)) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  let contactId = typeof body.contactId === 'string' ? body.contactId : null
  if (!contactId) {
    const { data: contact, error: contactError } = await db.from('contacts').insert({ owner_id: user.id, created_by: user.id, full_name: String(body.name).slice(0, 120), email: String(body.email).slice(0, 200), phone: body.phone ? String(body.phone).slice(0, 40) : null }).select('id').single()
    if (contactError) return dbError('Impossible de créer le contact.', contactError)
    contactId = contact.id
  }
  // Must match the leads.source CHECK constraint in the database exactly.
  const validSources = new Set(['website', 'phone', 'email', 'referral', 'social', 'other'])
  const source = validSources.has(body.source) ? body.source : 'other'
  const priorities = new Set(['low', 'normal', 'high'])
  const priority = priorities.has(body.priority) ? body.priority : undefined
  const { data: lead, error } = await db.from('leads').insert({ contact_id: contactId, property_id: body.propertyId || null, owner_id: user.id, created_by: user.id, message: String(body.message).slice(0, 2000), source, ...(priority ? { priority } : {}) }).select('id, status, priority, created_at, message, contacts(id, full_name, email, phone), properties(id, title, city, price)').single()
  if (error) return dbError('Impossible de créer le lead.', error)
  await logActivity(db, { actorId: user.id, activityType: 'created', leadId: lead.id, contactId, body: `Lead créé (source : ${source})` })
  return NextResponse.json({ lead })
}

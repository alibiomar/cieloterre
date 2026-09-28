import { NextResponse } from 'next/server'
import { requireStaff, isStaffError, parseJson, agencyMemberIds, dbError } from '@/lib/crm/auth'

export async function GET() {
  const auth = await requireStaff()
  if (isStaffError(auth)) return auth.error
  const { supabase } = auth

  let query = supabase.from('crm_tasks').select('id, title, description, due_date, status, priority, owner_id, created_at, contacts(id, full_name), properties(id, title), leads(id)').order('due_date', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false })
  if (auth.role !== 'admin') {
    const memberIds = await agencyMemberIds(auth.agencyId)
    query = query.in('owner_id', memberIds.length ? memberIds : [auth.user.id])
  }

  const { data, error } = await query
  if (error) return dbError('Impossible de charger les tâches.', error)
  return NextResponse.json({ tasks: data ?? [] })
}

export async function POST(request: Request) {
  const auth = await requireStaff()
  if (isStaffError(auth)) return auth.error
  const { supabase, user } = auth
  const body = await parseJson(request)
  if (!body?.title || typeof body.title !== 'string') return NextResponse.json({ error: 'Le titre est requis.' }, { status: 400 })

  const { data, error } = await supabase.from('crm_tasks').insert({
    owner_id: user.id,
    created_by: user.id,
    title: String(body.title).slice(0, 200),
    description: body.description ? String(body.description).slice(0, 4000) : null,
    due_date: body.due_date || null,
    status: 'todo',
    priority: ['low', 'normal', 'high'].includes(body.priority) ? body.priority : 'normal',
    contact_id: body.contact_id || null,
    lead_id: body.lead_id || null,
    property_id: body.property_id || null,
  }).select('id, title, description, due_date, status, priority, owner_id, created_at, contacts(id, full_name), properties(id, title), leads(id)').single()

  if (error) return dbError('Impossible de créer la tâche.', error)
  return NextResponse.json({ task: data })
}

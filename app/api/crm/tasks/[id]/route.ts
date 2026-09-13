import { NextResponse } from 'next/server'
import { requireStaff, isStaffError, parseJson, agencyMemberIds, dbError } from '@/lib/crm/auth'
import { logActivity } from '@/lib/crm/activity'

// Must match the frontend's kanban columns (tasks-view.tsx) and the DB
// check constraint on crm_tasks.status exactly. This used to say
// ['open','in_progress','done','cancelled'] while the UI/insert path both
// use 'todo' — so cycling a task's status silently no-op'd (every update
// got filtered out by `statuses.has(...)` and the route returned "Aucune
// modification fournie.").
const statuses = new Set(['todo', 'in_progress', 'done'])
const priorities = new Set(['low', 'normal', 'high'])

async function assertAgencyTask(supabase: any, id: string, auth: { role: string; user: { id: string }; agencyId: string | null }) {
  if (auth.role === 'admin') return null
  const { data: existing, error } = await supabase.from('crm_tasks').select('id, owner_id').eq('id', id).maybeSingle()
  if (error || !existing) return NextResponse.json({ error: 'Tâche introuvable.' }, { status: 404 })
  const memberIds = await agencyMemberIds(auth.agencyId)
  if (!memberIds.includes(existing.owner_id) && existing.owner_id !== auth.user.id) return NextResponse.json({ error: "Vous n'avez pas accès à cette tâche." }, { status: 403 })
  return null
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff()
  if (isStaffError(auth)) return auth.error
  const { supabase } = auth
  const { id } = await params

  const scopeError = await assertAgencyTask(supabase, id, auth)
  if (scopeError) return scopeError

  const body = await parseJson(request)
  if (!body) return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })

  const update: Record<string, unknown> = {}
  if ('title' in body) update.title = String(body.title).slice(0, 200)
  if ('description' in body) update.description = body.description || null
  if ('due_date' in body) update.due_date = body.due_date || null
  if ('status' in body && statuses.has(body.status)) update.status = body.status
  if ('priority' in body && priorities.has(body.priority)) update.priority = body.priority
  if ('contact_id' in body) update.contact_id = body.contact_id || null
  if ('property_id' in body) update.property_id = body.property_id || null
  if (Object.keys(update).length === 0) return NextResponse.json({ error: 'Aucune modification fournie.' }, { status: 400 })

  const { data, error } = await supabase.from('crm_tasks').update(update).eq('id', id).select('id, title, description, due_date, status, priority, owner_id, created_at, contact_id, contacts(id, full_name), properties(id, title), leads(id)').single()
  if (error) return dbError('Impossible de mettre à jour la tâche.', error)
  if (update.status === 'done') {
    await logActivity(supabase, { actorId: auth.user.id, activityType: 'task_completed', contactId: data.contact_id ?? null, body: `Tâche terminée : ${data.title}` })
  }
  return NextResponse.json({ task: data })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff()
  if (isStaffError(auth)) return auth.error
  const { supabase } = auth
  const { id } = await params

  const scopeError = await assertAgencyTask(supabase, id, auth)
  if (scopeError) return scopeError

  const { error } = await supabase.from('crm_tasks').delete().eq('id', id)
  if (error) return dbError('Impossible de supprimer la tâche.', error)
  return NextResponse.json({ ok: true })
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const STAFF_ROLES = ['admin', 'agency_admin', 'agent'] as const
export type StaffRole = (typeof STAFF_ROLES)[number]

type StaffContext = {
  supabase: any
  user: { id: string; email?: string; user_metadata?: Record<string, any> }
  role: StaffRole
  /** Agency the user belongs to (agent/agency_admin only). Null for admin (sees everything) or if unattached. */
  agencyId: string | null
  /** True only for role === 'admin'. Admins bypass agency/ownership scoping everywhere. */
  isAdmin: boolean
}
type StaffResult = StaffContext | { error: NextResponse }

/**
 * Verifies the current request is made by an authenticated staff member
 * (admin, agency_admin, or agent). Returns either the context needed to run
 * queries, or a pre-built NextResponse to return immediately.
 *
 * Also resolves the caller's agency_id (via the agents table) so route
 * handlers can scope reads/writes to "my agency" / "my own records" instead
 * of exposing every agency's data to every staff member.
 */
export async function requireStaff(): Promise<StaffResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Non autorisé' }, { status: 401 }) }

  const db = supabase as any
  let { data: profile } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!profile) {
    const adminDb = createAdminClient()
    const result = await adminDb.from('profiles').select('role').eq('id', user.id).maybeSingle()
    profile = result.data
  }
  const role = String(profile?.role ?? '').trim().toLowerCase() as StaffRole
  if (!profile || !STAFF_ROLES.includes(role)) {
    return { error: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }) }
  }

  let agencyId: string | null = null
  if (role !== 'admin') {
    let { data: agent } = await db.from('agents').select('agency_id').eq('id', user.id).maybeSingle()
    if (!agent) {
      const adminDb = createAdminClient()
      const result = await adminDb.from('agents').select('agency_id').eq('id', user.id).maybeSingle()
      agent = result.data
    }
    agencyId = agent?.agency_id ?? null
  }

  // Hard block: an admin can suspend an agent's CRM access from Équipe.
  if (role !== 'admin') {
    let { data: agentRow } = await db.from('agents').select('access_blocked').eq('id', user.id).maybeSingle()
    if (!agentRow) {
      const adminDb = createAdminClient()
      const result = await adminDb.from('agents').select('access_blocked').eq('id', user.id).maybeSingle()
      agentRow = result.data
    }
    if (agentRow?.access_blocked === true) {
      return { error: NextResponse.json({ error: 'Accès suspendu. Contactez votre administrateur.' }, { status: 403 }) }
    }
  }

  return { supabase: db, user, role, agencyId, isAdmin: role === 'admin' }
}

/** Escapes characters that have special meaning inside a PostgREST `.or()` filter string. */
export function escapePostgrestFilterValue(value: string) {
  return value.replace(/[,()%*]/g, '')
}

/**
 * IDs of every agent belonging to `agencyId` — the set of `owner_id`s an
 * agency_admin or agent should be scoped to, instead of just their own
 * user id, so a whole agency shares visibility of its leads/contacts/
 * tasks/visits the same way it already shares Notes and Documents.
 */
export async function agencyMemberIds(agencyId: string | null): Promise<string[]> {
  if (!agencyId) return []
  const db = createAdminClient()
  const { data } = await db.from('agents').select('id').eq('agency_id', agencyId)
  return (data ?? []).map((row: { id: string }) => row.id)
}

/** IDs of every property belonging to `agencyId` — used to scope agency-linked but not directly agency_id'd tables (inquiries, viewing_requests). */
export async function agencyPropertyIds(agencyId: string | null): Promise<string[]> {
  if (!agencyId) return []
  const db = createAdminClient()
  const { data } = await db.from('properties').select('id').eq('agency_id', agencyId)
  return (data ?? []).map((row: { id: string }) => row.id)
}

export function isStaffError(result: StaffResult): result is { error: NextResponse } {
  return 'error' in result
}

export async function parseJson(request: Request) {
  return request.json().catch(() => null)
}

/**
 * Every "Impossible de..." 500 in the CRM API routes was swallowing the
 * actual Postgres/PostgREST error, which made it impossible to tell whether
 * a failure was a missing column, a check-constraint violation, an RLS
 * policy rejection, or a bad foreign key. This logs the full error
 * server-side and — since this is an internal staff tool, not public
 * surface — returns the real reason to the caller too, so failures are
 * actually diagnosable from the UI instead of a generic dead-end message.
 */
export function dbError(action: string, error: any) {
  console.error(`[crm] ${action} failed:`, {
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    code: error?.code,
  })
  const reason = error?.message ? ` (${error.message}${error?.hint ? ` — ${error.hint}` : ''})` : ''
  return NextResponse.json({ error: `${action}${reason}`, code: error?.code ?? null }, { status: 500 })
}

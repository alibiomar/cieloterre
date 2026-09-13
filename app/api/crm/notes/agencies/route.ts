import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStaffError, requireStaff } from "@/lib/crm/auth";

export async function GET() {
  const auth = await requireStaff();
  if (isStaffError(auth)) return auth.error;
  if (!auth.isAdmin) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });

  const db = createAdminClient();
  const [{ data: agencies, error: agenciesError }, { data: agents }, { data: notes }] = await Promise.all([
    db.from("agencies").select("id, name").order("name"),
    db.from("agents").select("id, agency_id"),
    db.from("crm_notes").select("author_id, created_at, is_broadcast").eq("is_broadcast", false),
  ]);
  if (agenciesError) {
    console.error("GET /api/crm/notes/agencies", agenciesError);
    return NextResponse.json({ error: `Impossible de charger les agences: ${agenciesError.message}` }, { status: 500 });
  }

  const agencyByAgent = new Map((agents ?? []).map((row: { id: string; agency_id: string | null }) => [row.id, row.agency_id]));
  const memberCounts = new Map<string, number>();
  for (const row of agents ?? []) {
    if (!row.agency_id) continue;
    memberCounts.set(row.agency_id, (memberCounts.get(row.agency_id) ?? 0) + 1);
  }
  const noteCounts = new Map<string, number>();
  const lastActivity = new Map<string, string>();
  for (const note of notes ?? []) {
    const agencyId = agencyByAgent.get(note.author_id);
    if (!agencyId) continue;
    noteCounts.set(agencyId, (noteCounts.get(agencyId) ?? 0) + 1);
    const current = lastActivity.get(agencyId);
    if (!current || note.created_at > current) lastActivity.set(agencyId, note.created_at);
  }

  const summary = (agencies ?? []).map((agency: { id: string; name: string }) => ({
    id: agency.id,
    name: agency.name,
    memberCount: memberCounts.get(agency.id) ?? 0,
    noteCount: noteCounts.get(agency.id) ?? 0,
    lastActivity: lastActivity.get(agency.id) ?? null,
  }));

  return NextResponse.json({ agencies: summary });
}

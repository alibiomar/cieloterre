import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStaffError, requireStaff } from "@/lib/crm/auth";

export async function GET() {
  const auth = await requireStaff();
  if (isStaffError(auth)) return auth.error;
  if (!auth.isAdmin) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });

  const db = createAdminClient();
  const [{ data: agencies, error: agenciesError }, { data: documents }] = await Promise.all([
    db.from("agencies").select("id, name").order("name"),
    db.from("crm_documents").select("agency_id, created_at"),
  ]);
  if (agenciesError) {
    console.error("GET /api/crm/documents/agencies", agenciesError);
    return NextResponse.json({ error: `Impossible de charger les agences: ${agenciesError.message}` }, { status: 500 });
  }

  const docCounts = new Map<string, number>();
  const lastActivity = new Map<string, string>();
  for (const document of documents ?? []) {
    if (!document.agency_id) continue;
    docCounts.set(document.agency_id, (docCounts.get(document.agency_id) ?? 0) + 1);
    const current = lastActivity.get(document.agency_id);
    if (!current || document.created_at > current) lastActivity.set(document.agency_id, document.created_at);
  }

  const summary = (agencies ?? []).map((agency: { id: string; name: string }) => ({
    id: agency.id,
    name: agency.name,
    documentCount: docCounts.get(agency.id) ?? 0,
    lastActivity: lastActivity.get(agency.id) ?? null,
  }));

  return NextResponse.json({ agencies: summary });
}

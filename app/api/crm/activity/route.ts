import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStaffError, requireStaff } from "@/lib/crm/auth";

export async function GET(request: Request) {
  const auth = await requireStaff();
  if (isStaffError(auth)) return auth.error;

  const db = createAdminClient();
  const { searchParams } = new URL(request.url);
  const actorId = searchParams.get("actorId");
  const activityType = searchParams.get("type");
  const agencyId = searchParams.get("agencyId");

  // Agents/agency_admins only see their own agency's journal — same rule
  // as transactions/inquiries. Admins browse one agency's journal at a
  // time (the agency picker screen is what shows the rest), or every
  // agency at once with ?agencyId=all.
  let agents;
  if (auth.isAdmin) {
    let aq = db.from("agents").select("id, email, agency_id, profiles(full_name, role)").order("created_at", { ascending: false });
    if (agencyId && agencyId !== "all") aq = aq.eq("agency_id", agencyId);
    ({ data: agents } = await aq);
  } else {
    ({ data: agents } = await db
      .from("agents")
      .select("id, email, agency_id, profiles(full_name, role)")
      .eq("agency_id", auth.agencyId ?? "00000000-0000-0000-0000-000000000000"));
  }

  const visibleActorIds = (agents ?? []).map((row: { id: string }) => row.id);

  let query = db
    .from("crm_activity")
    .select("id, actor_id, activity_type, body, created_at, profiles(full_name, role), leads(id, contacts(full_name)), contacts(id, full_name)")
    .order("created_at", { ascending: false })
    .limit(300);

  if (!auth.isAdmin || (agencyId && agencyId !== "all")) {
    query = query.in("actor_id", visibleActorIds.length ? visibleActorIds : ["00000000-0000-0000-0000-000000000000"]);
  }
  if (actorId) query = query.eq("actor_id", actorId);
  if (activityType) query = query.eq("activity_type", activityType);

  const { data, error } = await query;
  if (error) {
    console.error("GET /api/crm/activity", error);
    return NextResponse.json({ error: `Impossible de charger l'activité: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ activity: data ?? [], agents: agents ?? [] });
}

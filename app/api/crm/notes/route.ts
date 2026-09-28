import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStaffError, parseJson, requireStaff } from "@/lib/crm/auth";
import { logActivity } from "@/lib/crm/activity";

const SELECT = "id, body, author_id, lead_id, contact_id, is_broadcast, created_at, profiles(full_name), leads(id, contacts(full_name)), contacts(id, full_name)";

async function memberIdsOfAgency(db: ReturnType<typeof createAdminClient>, agencyId: string) {
  const { data } = await db.from("agents").select("id").eq("agency_id", agencyId);
  return (data ?? []).map((row: { id: string }) => row.id);
}

export async function GET(request: Request) {
  const auth = await requireStaff();
  if (isStaffError(auth)) return auth.error;
  // crm_notes has RLS with no policy for the authenticated role, same as the
  // operations tables — always go through the service-role client, with
  // scoping enforced here in application code.
  const db = createAdminClient();

  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get("leadId");
  const contactId = searchParams.get("contactId");
  const agencyId = searchParams.get("agencyId");

  let query = db.from("crm_notes").select(SELECT).order("created_at", { ascending: false }).limit(300);

  if (auth.isAdmin) {
    // Admin browses one agency's thread at a time (plus every broadcast),
    // or — with no agencyId — just the broadcasts, since the agency picker
    // screen is what shows the rest.
    if (agencyId) {
      const memberIds = await memberIdsOfAgency(db, agencyId);
      query = query.or(`is_broadcast.eq.true,author_id.in.(${(memberIds.length ? memberIds : ["00000000-0000-0000-0000-000000000000"]).join(",")})`);
    } else {
      query = query.eq("is_broadcast", true);
    }
  } else {
    // Agents/agency_admins always see their own agency's thread, plus any
    // admin broadcast, regardless of which agency it came from.
    const memberIds = auth.agencyId ? await memberIdsOfAgency(db, auth.agencyId) : [auth.user.id];
    const ids = memberIds.includes(auth.user.id) ? memberIds : [...memberIds, auth.user.id];
    query = query.or(`is_broadcast.eq.true,author_id.in.(${ids.join(",")})`);
  }

  if (leadId) query = query.eq("lead_id", leadId);
  if (contactId) query = query.eq("contact_id", contactId);

  const { data, error } = await query;
  if (error) {
    console.error("GET /api/crm/notes", error);
    return NextResponse.json({ error: `Impossible de charger les notes: ${error.message}` }, { status: 500 });
  }

  // Tag each note with the author's agency so a mixed view (broadcasts, or
  // the admin agency list) can label where it came from.
  let notes = data ?? [];
  if (notes.length) {
    const { data: agentRows } = await db.from("agents").select("id, agencies(name)");
    const agencyByAuthor = new Map((agentRows ?? []).map((row: any) => [row.id, row.agencies?.name ?? null]));
    notes = notes.map((note: any) => ({ ...note, agency_name: note.is_broadcast ? null : agencyByAuthor.get(note.author_id) ?? null }));
  }

  return NextResponse.json({ notes });
}

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (isStaffError(auth)) return auth.error;
  const db = createAdminClient();
  const body = await parseJson(request);
  if (!body?.body || typeof body.body !== "string" || !body.body.trim()) {
    return NextResponse.json({ error: "Le contenu de la note est requis." }, { status: 400 });
  }
  // Only admins can broadcast to every agency at once.
  const isBroadcast = auth.isAdmin && body.broadcast === true;
  const leadId = typeof body.leadId === "string" ? body.leadId : null;
  const contactId = typeof body.contactId === "string" ? body.contactId : null;

  const { data, error } = await db
    .from("crm_notes")
    .insert({
      author_id: auth.user.id,
      created_by: auth.user.id,
      owner_id: auth.user.id,
      lead_id: isBroadcast ? null : leadId,
      contact_id: isBroadcast ? null : contactId,
      is_broadcast: isBroadcast,
      body: body.body.trim().slice(0, 4000),
    })
    .select(SELECT)
    .single();
  if (error) {
    console.error("POST /api/crm/notes", error);
    return NextResponse.json({ error: `Impossible d'enregistrer la note: ${error.message}` }, { status: 500 });
  }

  await logActivity(db, { actorId: auth.user.id, activityType: "note_added", leadId, contactId, body: (isBroadcast ? "[Annonce] " : "") + body.body.trim().slice(0, 190) });
  return NextResponse.json({ note: { ...data, agency_name: null } });
}

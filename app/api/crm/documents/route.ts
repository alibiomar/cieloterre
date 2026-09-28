import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStaffError, parseJson, requireStaff, dbError } from "@/lib/crm/auth";

export const DOCUMENT_CATEGORIES = ["mandat", "contrat", "identite", "financier", "autre"] as const;

const SELECT = "*, crm_document_events(id, event_type, actor_email, created_at)";

export async function GET(request: Request) {
  const auth = await requireStaff();
  if (isStaffError(auth)) return auth.error;
  // Documents are per-agency, like Notes — scoped here in application code
  // with the service-role client rather than through RLS.
  const db = createAdminClient();
  const { searchParams } = new URL(request.url);
  const agencyId = searchParams.get("agencyId");

  let query = db.from("crm_documents").select(SELECT).order("created_at", { ascending: false }).limit(300);

  if (auth.isAdmin) {
    // Admin browses one agency's library at a time (or every agency with
    // ?agencyId=all); the agency picker screen is what shows the rest.
    if (agencyId && agencyId !== "all") query = query.eq("agency_id", agencyId);
  } else {
    query = query.eq("agency_id", auth.agencyId ?? "00000000-0000-0000-0000-000000000000");
  }

  const { data, error } = await query;
  if (error) return dbError("Impossible de charger les documents.", error);
  return NextResponse.json({ documents: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (isStaffError(auth)) return auth.error;
  const db = createAdminClient();
  const body = await parseJson(request);

  if (body?.event) {
    if (typeof body.event.documentId !== "string" || !["viewed", "downloaded", "signature_requested", "signed", "declined"].includes(body.event.type)) {
      return NextResponse.json({ error: "Événement de document invalide." }, { status: 400 });
    }
    const { error } = await db.from("crm_document_events").insert({
      document_id: body.event.documentId,
      event_type: body.event.type,
      actor_email: auth.user.email ?? null,
      metadata: body.event.metadata ?? {},
      created_by: auth.user.id,
    });
    if (error) return dbError("Impossible d'enregistrer l'activité.", error);
    return NextResponse.json({ ok: true });
  }

  if (!body?.name || !body?.fileUrl) {
    return NextResponse.json({ error: "Nom et URL du PDF requis." }, { status: 400 });
  }
  const category = DOCUMENT_CATEGORIES.includes(body.category) ? body.category : "autre";
  // Admins must say which agency a document belongs to; agents/agency_admins
  // can only file into their own agency's library.
  const agencyId = auth.isAdmin
    ? (typeof body.agencyId === "string" && body.agencyId ? body.agencyId : null)
    : auth.agencyId;
  if (!agencyId) {
    return NextResponse.json({ error: "Agence requise pour classer ce document." }, { status: 400 });
  }

  const { data, error } = await db
    .from("crm_documents")
    .insert({
      name: String(body.name).slice(0, 160),
      file_url: String(body.fileUrl),
      document_type: String(body.documentType ?? "other").slice(0, 40),
      category,
      agency_id: agencyId,
      signature_status: ["not_required", "pending"].includes(body.signatureStatus) ? body.signatureStatus : "not_required",
      contact_id: typeof body.contactId === "string" ? body.contactId : null,
      created_by: auth.user.id,
      owner_id: auth.user.id,
    })
    .select("*")
    .single();
  if (error) return dbError("Impossible d'enregistrer le document.", error);
  return NextResponse.json({ document: data });
}

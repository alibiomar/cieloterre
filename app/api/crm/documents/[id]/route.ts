import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStaffError, parseJson, requireStaff, dbError } from "@/lib/crm/auth";
import { DOCUMENT_CATEGORIES } from "../route";

async function assertAgencyDocument(db: ReturnType<typeof createAdminClient>, id: string, auth: { isAdmin: boolean; agencyId: string | null }) {
  if (auth.isAdmin) return null;
  const { data: existing, error } = await db.from("crm_documents").select("id, agency_id").eq("id", id).maybeSingle();
  if (error || !existing) return NextResponse.json({ error: "Document introuvable." }, { status: 404 });
  if (existing.agency_id !== auth.agencyId) return NextResponse.json({ error: "Vous n'avez pas accès à ce document." }, { status: 403 });
  return null;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff();
  if (isStaffError(auth)) return auth.error;
  const db = createAdminClient();
  const { id } = await params;
  const scopeError = await assertAgencyDocument(db, id, auth);
  if (scopeError) return scopeError;

  const body = await parseJson(request);
  if (!body) return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });

  const update: Record<string, unknown> = {};
  // Attaching the final signed PDF later replaces/complements the generated
  // text — e.g. a client prints, signs and re-uploads a scan.
  if ("fileUrl" in body) update.file_url = body.fileUrl || null;
  if ("name" in body) update.name = String(body.name).slice(0, 160);
  if ("category" in body && DOCUMENT_CATEGORIES.includes(body.category)) update.category = body.category;
  if ("signatureStatus" in body && ["not_required", "pending", "signed", "declined"].includes(body.signatureStatus)) {
    update.signature_status = body.signatureStatus;
  }
  if (Object.keys(update).length === 0) return NextResponse.json({ error: "Aucune modification fournie." }, { status: 400 });

  const { data, error } = await db
    .from("crm_documents")
    .update(update)
    .eq("id", id)
    .select("*, crm_document_events(id, event_type, actor_email, created_at)")
    .single();
  if (error) return dbError("Impossible de mettre à jour le document.", error);
  return NextResponse.json({ document: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff();
  if (isStaffError(auth)) return auth.error;
  const db = createAdminClient();
  const { id } = await params;
  const scopeError = await assertAgencyDocument(db, id, auth);
  if (scopeError) return scopeError;

  const { error } = await db.from("crm_documents").delete().eq("id", id);
  if (error) return dbError("Impossible de supprimer le document.", error);
  return NextResponse.json({ ok: true });
}

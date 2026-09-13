import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStaffError, parseJson, requireStaff } from "@/lib/crm/auth";

const SELECT = "id, body, author_id, lead_id, contact_id, is_broadcast, created_at, profiles(full_name), leads(id, contacts(full_name)), contacts(id, full_name)";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff();
  if (isStaffError(auth)) return auth.error;
  const db = createAdminClient();
  const { id } = await params;

  const { data: existing, error: fetchError } = await db.from("crm_notes").select("id, author_id").eq("id", id).maybeSingle();
  if (fetchError || !existing) return NextResponse.json({ error: "Note introuvable." }, { status: 404 });
  if (!auth.isAdmin && existing.author_id !== auth.user.id) {
    return NextResponse.json({ error: "Vous ne pouvez modifier que vos propres notes." }, { status: 403 });
  }

  const body = await parseJson(request);
  const text = typeof body?.body === "string" ? body.body.trim() : "";
  if (!text) return NextResponse.json({ error: "Le contenu de la note est requis." }, { status: 400 });

  const { data, error } = await db.from("crm_notes").update({ body: text.slice(0, 4000) }).eq("id", id).select(SELECT).single();
  if (error) {
    console.error("PATCH /api/crm/notes/[id]", error);
    return NextResponse.json({ error: `Impossible de modifier la note: ${error.message}` }, { status: 500 });
  }
  return NextResponse.json({ note: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff();
  if (isStaffError(auth)) return auth.error;
  const db = createAdminClient();
  const { id } = await params;

  if (!auth.isAdmin) {
    const { data: existing, error } = await db.from("crm_notes").select("id, author_id").eq("id", id).maybeSingle();
    if (error || !existing) return NextResponse.json({ error: "Note introuvable." }, { status: 404 });
    if (existing.author_id !== auth.user.id) {
      return NextResponse.json({ error: "Vous ne pouvez supprimer que vos propres notes." }, { status: 403 });
    }
  }

  const { error } = await db.from("crm_notes").delete().eq("id", id);
  if (error) {
    console.error("DELETE /api/crm/notes/[id]", error);
    return NextResponse.json({ error: `Impossible de supprimer la note: ${error.message}` }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

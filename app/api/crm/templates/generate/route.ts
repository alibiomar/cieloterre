import { NextResponse } from "next/server";
import { isStaffError, parseJson, requireStaff, dbError } from "@/lib/crm/auth";

function fillPlaceholders(text: string, values: Record<string, string>) {
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key: string) => {
    const value = values[key];
    return value !== undefined && value !== "" ? value : match;
  });
}

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (isStaffError(auth)) return auth.error;
  const { supabase, user } = auth;
  const body = await parseJson(request);

  const templateId = typeof body?.templateId === "string" ? body.templateId : "";
  if (!templateId) return NextResponse.json({ error: "Modèle manquant." }, { status: 400 });
  const values: Record<string, string> =
    body?.values && typeof body.values === "object"
      ? Object.fromEntries(Object.entries(body.values).map(([k, v]) => [k, String(v ?? "")]))
      : {};
  const contactId = typeof body?.contactId === "string" && body.contactId ? body.contactId : null;

  // Any staff member can read a template (that's the point — agents use the
  // shared library) even though only admins/agency_admins can edit one.
  const { data: template, error: templateError } = await supabase
    .from("crm_templates")
    .select("id, name, subject, body, variables")
    .eq("id", templateId)
    .maybeSingle();
  if (templateError || !template) {
    return NextResponse.json({ error: "Modèle introuvable." }, { status: 404 });
  }

  const mergedSubject = template.subject ? fillPlaceholders(template.subject, values) : null;
  const mergedBody = fillPlaceholders(template.body ?? "", values);

  // Every template generates a document — the agent can attach a signed
  // scan afterwards from the Documents module (see PATCH /api/crm/documents/[id]).
  const { data, error } = await supabase
    .from("crm_documents")
    .insert({
      name: mergedSubject ?? template.name,
      document_type: "contract",
      generated_body: mergedBody,
      source_template_id: template.id,
      signature_status: "pending",
      contact_id: contactId,
      created_by: user.id,
    })
    .select("*")
    .single();
  if (error) return dbError("Impossible de générer le document à partir du modèle.", error);
  return NextResponse.json({ kind: "crm_documents", record: data });
}

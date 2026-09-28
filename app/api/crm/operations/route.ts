import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStaffError, parseJson, requireStaff, agencyPropertyIds } from "@/lib/crm/auth";
import { operationTableSchema, parseOperationRecord } from "@/lib/crm/schemas";
import { operationScope, scopeIsRestricted } from "@/lib/crm/scope";

type Table = "transactions" | "financial_entries" | "crm_templates" | "crm_messages" | "crm_articles" | "inquiries";

// Who may VIEW / use each module. Agents need to browse the contract &
// template library to generate documents for their own clients, even
// though they can't edit the master templates (see tableWriteRoles below).
const tableReadRoles: Record<Table, string[]> = {
  transactions: ["admin", "agency_admin", "agent"],
  financial_entries: ["admin", "agency_admin"],
  crm_templates: ["admin", "agency_admin", "agent"],
  crm_messages: ["admin", "agency_admin", "agent"],
  crm_articles: ["admin", "agency_admin", "agent"],
  inquiries: ["admin", "agency_admin", "agent"],
};

// Who may CREATE / EDIT / DELETE each module. crm_templates is a shared,
// governed library — only admins/agency_admins manage the master copies.
// Agents use templates through /api/crm/templates/generate instead of
// editing them directly.
const tableWriteRoles: Record<Table, string[]> = {
  ...tableReadRoles,
  crm_templates: ["admin", "agency_admin"],
  crm_articles: ["admin"],
};

function canReadTable(role: string, table: Table) {
  return tableReadRoles[table].includes(role);
}
function canWriteTable(role: string, table: Table) {
  return tableWriteRoles[table].includes(role);
}

export async function GET(request: Request) {
  const auth = await requireStaff();
  if (isStaffError(auth)) return auth.error;
  const db = createAdminClient();
  const parsedTable = operationTableSchema.safeParse(new URL(request.url).searchParams.get("table"));
  if (!parsedTable.success) {
    return NextResponse.json({ error: "Module CRM invalide." }, { status: 400 });
  }
  const table = parsedTable.data as Table;
  if (!canReadTable(auth.role, table)) return NextResponse.json({ error: "Vous n'avez pas accès à ce module." }, { status: 403 });

  let query = db.from(table).select("*").order("created_at", { ascending: false }).limit(200);
  if (scopeIsRestricted(table, auth.role)) {
    if (operationScope[table] === "agency") {
      query = query.eq("agency_id", auth.agencyId);
    } else if (operationScope[table] === "owner") {
      query = query.eq("created_by", auth.user.id);
    }
  }
  // inquiries aren't directly FK'd to an agency — scope them via the
  // property they were sent about, the same way each agency has its own
  // Leads/Contacts/Visites without a literal agency_id column everywhere.
  if (table === "inquiries" && !auth.isAdmin) {
    const propertyIds = await agencyPropertyIds(auth.agencyId);
    query = query.in("property_id", propertyIds.length ? propertyIds : ["00000000-0000-0000-0000-000000000000"]);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: `Impossible de charger les données: ${error.message}` }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (isStaffError(auth)) return auth.error;
  const db = createAdminClient();
  const body = await parseJson(request);
  const parsedTable = operationTableSchema.safeParse(body?.table);
  if (!parsedTable.success || !body?.record || typeof body.record !== "object") {
    return NextResponse.json({ error: "Données CRM invalides." }, { status: 400 });
  }
  const table = parsedTable.data as Table;
  if (!canWriteTable(auth.role, table)) return NextResponse.json({ error: "Vous n'avez pas accès à ce module." }, { status: 403 });

  if (table === "inquiries") {
    return NextResponse.json({ error: "Les demandes clients sont en lecture seule ici." }, { status: 405 });
  }
  let parsedRecord;
  try {
    parsedRecord = parseOperationRecord(table, body.record);
  } catch {
    return NextResponse.json({ error: "Les champs envoyés sont invalides." }, { status: 400 });
  }
  const record: Record<string, unknown> = { ...parsedRecord, created_by: auth.user.id };

  // Non-admin staff can never assign a record to another agency, or forge
  // authorship on shared content — force it to their own scope server-side.
  if (!auth.isAdmin) {
    if (operationScope[table] === "agency" && "agency_id" in record) {
      record.agency_id = auth.agencyId;
    }
    if (table === "transactions" && auth.role === "agent") {
      (record as Record<string, unknown>).agent_id = auth.user.id;
    }
  }

  const { data, error } = await db.from(table).insert(record).select("*").single();
  if (error) return NextResponse.json({ error: `Impossible d'enregistrer cette donnée: ${error.message}` }, { status: 500 });
  return NextResponse.json({ data });
}

/** Loads the row being modified and checks the caller is allowed to touch it. */
async function assertCanMutate(db: ReturnType<typeof createAdminClient>, table: Table, id: string, auth: Extract<Awaited<ReturnType<typeof requireStaff>>, { role: string }>) {
  if (!scopeIsRestricted(table, auth.role)) return null;
  const scopeColumn = operationScope[table] === "agency" ? "agency_id" : "created_by";
  const { data: existing, error } = await db.from(table).select(`id, ${scopeColumn}`).eq("id", id).maybeSingle();
  if (error || !existing) return NextResponse.json({ error: "Élément introuvable." }, { status: 404 });
  const expected = operationScope[table] === "agency" ? auth.agencyId : auth.user.id;
  if (!expected || (existing as Record<string, unknown>)[scopeColumn] !== expected) {
    return NextResponse.json({ error: "Vous n'avez pas accès à cet élément." }, { status: 403 });
  }
  return null;
}

export async function PATCH(request: Request) {
  const auth = await requireStaff();
  if (isStaffError(auth)) return auth.error;
  const db = createAdminClient();
  const body = await parseJson(request);
  const parsedTable = operationTableSchema.safeParse(body?.table);
  const id = typeof body?.id === "string" ? body.id : "";
  if (!parsedTable.success || !id || !body?.record || typeof body.record !== "object") {
    return NextResponse.json({ error: "Données CRM invalides." }, { status: 400 });
  }
  const table = parsedTable.data as Table;
  if (!canWriteTable(auth.role, table)) return NextResponse.json({ error: "Vous n'avez pas accès à ce module." }, { status: 403 });
  if (table === "inquiries") {
    return NextResponse.json({ error: "Les demandes clients sont en lecture seule ici." }, { status: 405 });
  }

  const scopeError = await assertCanMutate(db, table, id, auth);
  if (scopeError) return scopeError;

  let record;
  try {
    record = parseOperationRecord(table, body.record);
  } catch {
    return NextResponse.json({ error: "Les champs envoyés sont invalides." }, { status: 400 });
  }
  if (!auth.isAdmin && operationScope[table] === "agency" && "agency_id" in record) {
    (record as Record<string, unknown>).agency_id = auth.agencyId;
  }

  const { data, error } = await db.from(table).update({ ...record, updated_by: auth.user.id }).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: `Impossible de modifier cette donnée: ${error.message}` }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(request: Request) {
  const auth = await requireStaff();
  if (isStaffError(auth)) return auth.error;
  const db = createAdminClient();
  const body = await parseJson(request);
  const table = body?.table as Table | undefined;
  const id = typeof body?.id === "string" ? body.id : "";
  if (!table || !operationTableSchema.safeParse(table).success || !id) {
    return NextResponse.json({ error: "Données CRM invalides." }, { status: 400 });
  }
  if (!canWriteTable(auth.role, table)) return NextResponse.json({ error: "Vous n'avez pas accès à ce module." }, { status: 403 });

  const scopeError = await assertCanMutate(db, table, id, auth);
  if (scopeError) return scopeError;

  const { error } = await db.from(table).delete().eq("id", id);
  if (error) return NextResponse.json({ error: `Impossible de supprimer cette donnée: ${error.message}` }, { status: 500 });
  return NextResponse.json({ success: true });
}

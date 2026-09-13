import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStaffError, parseJson, requireStaff } from "@/lib/crm/auth";

export async function GET() {
  const auth = await requireStaff();
  if (isStaffError(auth) || auth.role !== "admin") return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  const { data } = await createAdminClient().from("site_settings").select("key, value");
  return NextResponse.json({ settings: Object.fromEntries((data ?? []).map((row: any) => [row.key, row.value])) });
}

export async function PUT(request: Request) {
  const auth = await requireStaff();
  if (isStaffError(auth) || auth.role !== "admin") return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  const body = await parseJson(request);
  if (typeof body?.key !== "string" || body.key.length > 80) return NextResponse.json({ error: "Clé invalide." }, { status: 400 });
  const admin = createAdminClient();
  const { error } = await admin.from("site_settings").upsert({ key: body.key, value: body.value ?? {}, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: "Impossible d'enregistrer." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

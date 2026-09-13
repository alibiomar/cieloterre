import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStaffError, requireStaff } from "@/lib/crm/auth";

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["application/pdf", "pdf"],
]);

function hasImageSignature(bytes: Uint8Array, type: string) {
  if (type === "application/pdf") return String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.slice(0, 8).every((value, index) => value === [137, 80, 78, 71, 13, 10, 26, 10][index]);
  if (type === "image/webp") return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return false;
}

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (isStaffError(auth)) return auth.error;

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Fichier image requis." }, { status: 400 });
  if (file.size <= 0 || file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: "L'image doit faire moins de 8 Mo." }, { status: 400 });
  }

  const extension = ALLOWED_TYPES.get(file.type);
  if (!extension) return NextResponse.json({ error: "Formats acceptés : JPG, PNG, WebP ou PDF." }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasImageSignature(bytes, file.type)) {
    return NextResponse.json({ error: "Le contenu du fichier ne correspond pas à une image valide." }, { status: 400 });
  }

  const bucket = "public-media";
  const path = `crm/${auth.user.id}/${crypto.randomUUID()}.${extension}`;
  const db = createAdminClient();
  const { error } = await db.storage.from(bucket).upload(path, bytes, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) {
    console.error("[crm/uploads] Storage error:", error);
    return NextResponse.json({ error: "Impossible d'enregistrer l'image." }, { status: 500 });
  }

  const { data } = db.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, path });
}

export async function DELETE(request: Request) {
  const auth = await requireStaff();
  if (isStaffError(auth)) return auth.error;
  const body = await request.json().catch(() => null);
  const path = typeof body?.path === "string" ? body.path : "";
  if (!path || !path.startsWith(`crm/${auth.user.id}/`)) {
    return NextResponse.json({ error: "Fichier invalide." }, { status: 400 });
  }
  const { error } = await createAdminClient().storage.from("public-media").remove([path]);
  if (error) return NextResponse.json({ error: "Impossible de supprimer le fichier." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

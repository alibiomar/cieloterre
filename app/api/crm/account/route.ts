import { NextResponse } from "next/server";
import { createAdminClient, deleteStaleMedia } from "@/lib/supabase/admin";
import { isStaffError, parseJson, requireStaff } from "@/lib/crm/auth";

export async function GET() {
  const auth = await requireStaff();
  if (isStaffError(auth)) return auth.error;
  // `profiles` has no avatar_path column — avatars live on `agents` only.
  const { data: profile, error } = await auth.supabase
    .from("profiles")
    .select("full_name, phone, role, preferences")
    .eq("id", auth.user.id)
    .single();
  if (error || !profile) return NextResponse.json({ error: "Impossible de charger votre compte." }, { status: 500 });
  const { data: agent } = await createAdminClient().from("agents").select("avatar_path").eq("id", auth.user.id).maybeSingle();
  return NextResponse.json({
    account: {
      email: auth.user.email ?? "",
      ...profile,
      avatar_path: agent?.avatar_path ?? null,
      preferences: profile.preferences ?? auth.user.user_metadata?.preferences ?? {},
    },
  });
}

export async function PATCH(request: Request) {
  const auth = await requireStaff();
  if (isStaffError(auth)) return auth.error;
  const body = await parseJson(request);
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim().slice(0, 120) : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim().slice(0, 40) : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase().slice(0, 200) : "";
  const preferences = body?.preferences && typeof body.preferences === "object" ? body.preferences : {};
  const hasAvatarPath = typeof body?.avatarPath === "string" || body?.avatarPath === null;
  const avatarPath = typeof body?.avatarPath === "string" ? body.avatarPath : null;
  if (!fullName || !email) return NextResponse.json({ error: "Le nom et l'email sont requis." }, { status: 400 });

  const supabase = auth.supabase;
  if (email !== (auth.user.email ?? "").toLowerCase()) {
    const { error } = await supabase.auth.updateUser({ email });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }
  const admin = createAdminClient();
  const profileResult = await admin.from("profiles").upsert({
    id: auth.user.id,
    full_name: fullName,
    phone: phone || null,
    role: auth.role,
    preferences,
  });
  if (profileResult.error) {
    const fallback = await admin.from("profiles").upsert({
      id: auth.user.id,
      full_name: fullName,
      phone: phone || null,
      role: auth.role,
    });
    if (fallback.error) {
      return NextResponse.json({ error: "Impossible de mettre à jour le profil. Vérifiez que ce compte possède une ligne dans profiles." }, { status: 500 });
    }
  }
  if (hasAvatarPath) {
    const { data: current } = await admin.from("agents").select("avatar_path").eq("id", auth.user.id).maybeSingle();
    const agentResult = await admin.from("agents").update({ avatar_path: avatarPath }).eq("id", auth.user.id);
    if (agentResult.error) {
      return NextResponse.json({ error: "Profil enregistré, mais la photo de l'agent n'a pas pu être sauvegardée." }, { status: 500 });
    }
    void deleteStaleMedia(admin, current?.avatar_path, avatarPath);
  }
  const metadataResult = await admin.auth.admin.updateUserById(auth.user.id, {
    user_metadata: { ...auth.user.user_metadata, full_name: fullName, phone: phone || "", preferences },
  });
  if (metadataResult.error) return NextResponse.json({ error: "Profil enregistré, mais les préférences n'ont pas pu être sauvegardées." }, { status: 500 });
  return NextResponse.json({ message: email !== (auth.user.email ?? "").toLowerCase() ? "Profil enregistré. Confirmez votre nouvel email depuis votre boîte de réception." : "Profil enregistré." });
}

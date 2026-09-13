import { NextResponse } from "next/server";
import { createAdminClient, deleteStaleMedia } from "@/lib/supabase/admin";
import { isStaffError, parseJson, requireStaff } from "@/lib/crm/auth";

export async function GET() {
  const auth = await requireStaff();
  if (isStaffError(auth)) return auth.error;
  if (auth.role !== "admin") {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const [{ data: agencies, error: agenciesError }, { data: agents, error: agentsError }] =
    await Promise.all([
      createAdminClient().from("agencies").select("id, name, slug, description, city, address, phone, email, website, logo_path").order("name"),
      createAdminClient()
        .from("agents")
        .select("id, agency_id, email, slug, bio, phone, avatar_path, languages, is_public, access_blocked, profiles(full_name, role)")
        .order("created_at", { ascending: false }),
    ]);

  if (agenciesError || agentsError) {
    return NextResponse.json({ error: "Impossible de charger l'équipe." }, { status: 500 });
  }
  return NextResponse.json({ agencies: agencies ?? [], agents: agents ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (isStaffError(auth)) return auth.error;
  if (auth.role !== "admin") {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const body = await parseJson(request);
  if (body?.type === "agency") {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "Le nom de l'agence est requis." }, { status: 400 });
    }

    const name = body.name.trim().slice(0, 120);
    const slug = slugify(name);
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("agencies")
      .insert({
        name,
        slug,
        description: typeof body.description === "string" ? body.description.trim().slice(0, 1000) || null : null,
        city: typeof body.city === "string" ? body.city.trim().slice(0, 120) || null : null,
        address: typeof body.address === "string" ? body.address.trim().slice(0, 240) || null : null,
        phone: typeof body.phone === "string" ? body.phone.trim().slice(0, 40) || null : null,
        email: typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 320) || null : null,
        website: typeof body.website === "string" ? body.website.trim().slice(0, 500) || null : null,
        logo_path: typeof body.logoPath === "string" ? body.logoPath : null,
      })
      .select("id, name, slug, description, city, address, phone, email, website, logo_path")
      .single();
    if (error) {
      const message = error.code === "23505"
        ? "Une agence avec ce nom existe déjà."
        : "Impossible de créer l'agence.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
    return NextResponse.json({ agency: data });
  }

  if (body?.type !== "agent" || typeof body.email !== "string" || !body.email.trim()) {
    return NextResponse.json({ error: "Email, nom et agence sont requis." }, { status: 400 });
  }
  if (typeof body.agencyId !== "string" || typeof body.fullName !== "string" || !body.fullName.trim()) {
    return NextResponse.json({ error: "Email, nom et agence sont requis." }, { status: 400 });
  }

  const agencyId = body.agencyId;
  const { data: agency } = await createAdminClient().from("agencies").select("id").eq("id", agencyId).maybeSingle();
  if (!agency) return NextResponse.json({ error: "Agence introuvable." }, { status: 404 });

  const admin = createAdminClient();
  const email = body.email.trim().toLowerCase().slice(0, 200);
  const fullName = body.fullName.trim().slice(0, 120);
  const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 40) : null;
  const bio = typeof body.bio === "string" ? body.bio.trim().slice(0, 2000) : null;
  const languages = Array.isArray(body.languages)
    ? body.languages.filter((value: unknown): value is string => typeof value === "string").map((value: string) => value.trim().slice(0, 40)).filter(Boolean).slice(0, 8)
    : [];
  const { data: invitation, error: invitationError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${new URL(request.url).origin}/auth/accept-invite?next=/crm`,
    data: { full_name: fullName, role: "agent", agency_id: agencyId },
  });
  if (invitationError || !invitation.user) {
    return NextResponse.json({ error: "Impossible d'envoyer l'invitation." }, { status: 500 });
  }

  const userId = invitation.user.id;
  const profileResult = await admin.from("profiles").upsert({
    id: userId,
    full_name: fullName,
    role: "agent",
  });
  if (profileResult.error) {
    return NextResponse.json({ error: "Invitation envoyée, mais le profil n'a pas pu être créé." }, { status: 500 });
  }

  const agentResult = await admin.from("agents").upsert({
    id: userId,
    agency_id: agencyId,
    slug: `${slugify(fullName)}-${userId.slice(0, 8)}`,
    email,
    phone,
    bio,
    languages,
    avatar_path: typeof body.avatarPath === "string" ? body.avatarPath : null,
    ...(Array.isArray(body.languages) ? { languages } : {}),
    is_public: body.isPublic === true,
  });
  if (agentResult.error) {
    return NextResponse.json({ error: "Invitation envoyée, mais l'agent n'a pas pu être rattaché." }, { status: 500 });
  }

  return NextResponse.json({ message: "Invitation envoyée à l'agent." });
}

export async function PATCH(request: Request) {
  const auth = await requireStaff();
  if (isStaffError(auth) || auth.role !== "admin") return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  const body = await parseJson(request);
  const admin = createAdminClient();
  if (body?.type === "agency") {
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
    if (!name || typeof body.id !== "string") return NextResponse.json({ error: "Nom d'agence invalide." }, { status: 400 });
    const { data: oldAgency } = await admin.from("agencies").select("logo_path").eq("id", body.id).maybeSingle();
    const update = {
      name,
      slug: slugify(name),
      description: typeof body.description === "string" ? body.description.trim().slice(0, 1000) : null,
      phone: typeof body.phone === "string" ? body.phone.trim().slice(0, 40) : null,
      email: typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 320) : null,
      website: typeof body.website === "string" ? body.website.trim().slice(0, 500) : null,
      ...(typeof body.city === "string" ? { city: body.city.trim().slice(0, 120) || null } : {}),
      ...(typeof body.address === "string" ? { address: body.address.trim().slice(0, 240) || null } : {}),
      logo_path: typeof body.logoPath === "string" ? body.logoPath : null,
    };
    const { data, error } = await admin.from("agencies").update(update).eq("id", body.id).select("id, name, slug, description, city, address, phone, email, website, logo_path").single();
    if (error) return NextResponse.json({ error: "Impossible de modifier l'agence." }, { status: 500 });
    void deleteStaleMedia(admin, oldAgency?.logo_path, update.logo_path);
    return NextResponse.json({ agency: data });
  }
  if (body?.type === "resend" && typeof body.id === "string") {
    const { data: agent } = await admin.from("agents").select("email").eq("id", body.id).single();
    if (!agent?.email) return NextResponse.json({ error: "Email de l'agent introuvable." }, { status: 404 });
    const { error } = await admin.auth.admin.inviteUserByEmail(agent.email, { redirectTo: `${new URL(request.url).origin}/auth/accept-invite?next=/crm` });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: "Invitation renvoyée." });
  }
  if (body?.type === "visibility" && typeof body.id === "string" && typeof body.isPublic === "boolean") {
    const { data, error } = await admin.from("agents").update({ is_public: body.isPublic }).eq("id", body.id).select("id, is_public").single();
    if (error) return NextResponse.json({ error: "Impossible de modifier la visibilité de l'agent." }, { status: 500 });
    return NextResponse.json({ agent: data });
  }
  if (body?.type === "access" && typeof body.id === "string" && typeof body.blocked === "boolean") {
    const { data: target } = await admin.from("agents").select("id").eq("id", body.id).single();
    if (!target) return NextResponse.json({ error: "Agent introuvable." }, { status: 404 });
    const { data, error } = await admin.from("agents")
      .update({ access_blocked: body.blocked })
      .eq("id", body.id)
      .select("id, access_blocked")
      .single();
    if (error) return NextResponse.json({ error: "Impossible de modifier l'accès." }, { status: 500 });
    return NextResponse.json({ agent: data });
  }
  if (body?.type === "agent" && typeof body.id === "string") {
    const languages = Array.isArray(body.languages)
      ? body.languages.filter((value: unknown): value is string => typeof value === "string").map((value: string) => value.trim().slice(0, 40)).filter(Boolean).slice(0, 8)
      : [];
    const { data: oldAgent } = await admin.from("agents").select("avatar_path").eq("id", body.id).maybeSingle();
    const { data: agent, error } = await admin.from("agents").update({
      bio: typeof body.bio === "string" ? body.bio.trim().slice(0, 2000) : null,
      phone: typeof body.phone === "string" ? body.phone.trim().slice(0, 40) : null,
      ...(typeof body.avatarPath === "string" || body.avatarPath === null ? { avatar_path: body.avatarPath } : {}),
      ...(Array.isArray(body.languages) ? { languages } : {}),
    }).eq("id", body.id).select("id, bio, phone, avatar_path").single();
    if (error) return NextResponse.json({ error: "Impossible de modifier l'agent." }, { status: 500 });
    if (typeof body.avatarPath === "string" || body.avatarPath === null) void deleteStaleMedia(admin, oldAgent?.avatar_path, body.avatarPath);
    if (typeof body.fullName === "string" || typeof body.profilePhone === "string") {
      const profileResult = await admin.from("profiles").update({
        ...(typeof body.fullName === "string" ? { full_name: body.fullName.trim().slice(0, 120) } : {}),
        ...(typeof body.profilePhone === "string" ? { phone: body.profilePhone.trim().slice(0, 40) } : {}),
      }).eq("id", body.id);
      if (profileResult.error) return NextResponse.json({ error: "Agent modifié, mais le profil n'a pas pu être mis à jour." }, { status: 500 });
    }
    return NextResponse.json({ agent });
  }
  return NextResponse.json({ error: "Action invalide." }, { status: 400 });
}

export async function DELETE(request: Request) {
  const auth = await requireStaff();
  if (isStaffError(auth) || auth.role !== "admin") return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  const body = await parseJson(request);
  if (typeof body?.id !== "string") return NextResponse.json({ error: "Élément invalide." }, { status: 400 });
  const admin = createAdminClient();
  if (body.type === "agency") {
    const { error: detachError } = await admin.from("agents").update({ agency_id: null }).eq("agency_id", body.id);
    if (detachError) return NextResponse.json({ error: "Impossible de libérer les agents de cette agence." }, { status: 500 });
    const { error } = await admin.from("agencies").delete().eq("id", body.id);
    if (error) return NextResponse.json({ error: "Impossible de supprimer l'agence. Vérifiez qu'elle n'est pas utilisée par des biens ou transactions." }, { status: 500 });
    return NextResponse.json({ success: true });
  }
  const { error: agentError } = await admin.from("agents").delete().eq("id", body.id);
  if (agentError) return NextResponse.json({ error: "Impossible de retirer l'agent." }, { status: 500 });
  await admin.from("profiles").delete().eq("id", body.id);
  const { error } = await admin.auth.admin.deleteUser(body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

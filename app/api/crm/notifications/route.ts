import { NextResponse } from "next/server";
import { requireStaff, isStaffError } from "@/lib/crm/auth";
import { getCrmNotifications } from "@/lib/crm/notifications";

export async function GET() {
  const auth = await requireStaff();
  if (isStaffError(auth)) return auth.error;
  const { supabase, user, role } = auth;

  const [notifications, { data: profile }] = await Promise.all([
    getCrmNotifications({ supabase, userId: user.id, role }),
    supabase.from("profiles").select("notifications_seen_at").eq("id", user.id).maybeSingle(),
  ]);

  const lastSeenAt = profile?.notifications_seen_at ?? null;
  const unseenCount = lastSeenAt
    ? notifications.filter((n) => new Date(n.createdAt).getTime() > new Date(lastSeenAt).getTime()).length
    : notifications.length;

  return NextResponse.json({ notifications, unseenCount, lastSeenAt });
}

export async function POST() {
  // Marks the current point in time as "seen" — called when the bell is opened.
  const auth = await requireStaff();
  if (isStaffError(auth)) return auth.error;
  const { supabase, user } = auth;
  const now = new Date().toISOString();
  await supabase.from("profiles").update({ notifications_seen_at: now }).eq("id", user.id);
  return NextResponse.json({ ok: true, seenAt: now });
}

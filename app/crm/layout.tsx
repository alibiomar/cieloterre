import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CrmShell } from "@/components/crm/crm-shell";
import { NotifyProvider } from "@/components/crm/notify-provider";

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/crm/dashboard");

  const db = supabase as any;
  let { data: profile } = await db
    .from("profiles")
    .select("id, full_name, phone, role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) {
    const adminDb = createAdminClient();
    const result = await adminDb
      .from("profiles")
      .select("id, full_name, phone, role")
      .eq("id", user.id)
      .maybeSingle();
    profile = result.data;
  }
  if (!profile || !["admin", "agency_admin", "agent"].includes(String(profile.role).trim().toLowerCase())) {
    redirect("/auth/login?error=staff_only");
  }

  const { data: agentRow } = await createAdminClient()
    .from("agents")
    .select("access_blocked")
    .eq("id", user.id)
    .maybeSingle();
  if (agentRow?.access_blocked) redirect("/auth/login?error=access_blocked");

  return (
    <NotifyProvider>
      <CrmShell profile={{ ...profile, email: user.email ?? "" }}>{children}</CrmShell>
    </NotifyProvider>
  );
}

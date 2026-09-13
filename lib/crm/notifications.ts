import type { StaffRole } from "./auth";

export type CrmNotification = {
  id: string;
  type: "lead" | "viewing_request" | "task" | "visit";
  title: string;
  description: string;
  href: string;
  createdAt: string;
};

type Ctx = {
  supabase: any;
  userId: string;
  role: StaffRole;
};

/**
 * Reads the notification feed. Rows are written by DB triggers
 * (see supabase/migrations/2026_add_crm_notifications_triggers.sql) on
 * insert into leads/viewing_requests/crm_tasks/visits, so this is a single
 * cheap, indexed select instead of four fan-out queries.
 */
export async function getCrmNotifications({ supabase, userId, role }: Ctx) {
  const isAgent = role === "agent";

  let query = supabase
    .from("crm_notifications")
    .select("id, type, title, description, href, owner_id, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (isAgent) {
    query = query.or(`owner_id.eq.${userId},owner_id.is.null`);
  }

  const { data } = await query;

  return ((data ?? []) as any[]).map((row) => ({
    id: `${row.type}:${row.id}`,
    type: row.type,
    title: row.title,
    description: row.description,
    href: row.href,
    createdAt: row.created_at,
  })) as CrmNotification[];
}

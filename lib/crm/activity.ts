export type ActivityType =
  | "created"
  | "status_changed"
  | "assigned"
  | "note_added"
  | "called"
  | "emailed"
  | "viewing_scheduled"
  | "task_completed";

/**
 * Records one activity entry. Failures are swallowed on purpose — activity
 * logging must never block or break the primary action (creating a lead,
 * updating a task, etc). The caller passes the already-authenticated
 * supabase client so the write happens as the acting user.
 */
export async function logActivity(
  supabase: any,
  entry: {
    actorId: string;
    activityType: ActivityType;
    leadId?: string | null;
    contactId?: string | null;
    body?: string | null;
  },
) {
  try {
    await supabase.from("crm_activity").insert({
      actor_id: entry.actorId,
      lead_id: entry.leadId ?? null,
      contact_id: entry.contactId ?? null,
      activity_type: entry.activityType,
      body: entry.body ? String(entry.body).slice(0, 2000) : null,
    });
  } catch {
    // Best-effort only — never throw from here.
  }
}

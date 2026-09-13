import type { StaffRole } from "./auth";

/**
 * Column-level scoping rules per operations table. `agency` means the row
 * carries an agency_id column that non-admin staff must be restricted to.
 * `owner` means the row carries a created_by column and only agents (not
 * agency_admin, who can see the whole agency's messaging/content) are
 * restricted to their own records. `none` means the resource is shared
 * org-wide content that any staff member with table access may read/edit
 * (access is already gated by role in tableRoles).
 */
export const operationScope: Record<string, "agency" | "owner" | "none"> = {
  transactions: "agency",
  financial_entries: "agency",
  crm_templates: "none",
  crm_messages: "owner",
  crm_articles: "none",
  inquiries: "agency",
};

export function scopeIsRestricted(table: string, role: StaffRole) {
  const scope = operationScope[table] ?? "none";
  if (role === "admin") return false;
  if (scope === "agency") return true;
  if (scope === "owner") return role === "agent";
  return false;
}

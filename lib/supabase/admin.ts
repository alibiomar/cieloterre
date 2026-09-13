import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

/** Extracts the storage path from a public-media public URL, or returns the
 * value unchanged if it's already a bare path. Returns null for anything
 * that isn't one of ours (external URL, empty, etc.) so callers don't
 * accidentally try to delete something outside our bucket. */
export function extractStoragePath(value: string | null | undefined): string | null {
  if (!value) return null;
  const marker = "/storage/v1/object/public/public-media/";
  const index = value.indexOf(marker);
  if (index !== -1) return value.slice(index + marker.length);
  if (!/^https?:\/\//i.test(value) && value.startsWith("crm/")) return value;
  return null;
}

/** Deletes the old storage object when it's being replaced by a different
 * one — best-effort, never throws (a failed cleanup shouldn't block the
 * save that triggered it). */
export async function deleteStaleMedia(admin: ReturnType<typeof createAdminClient>, oldValue: string | null | undefined, newValue: string | null | undefined) {
  if (!oldValue || oldValue === newValue) return;
  const path = extractStoragePath(oldValue);
  if (!path) return;
  await admin.storage.from("public-media").remove([path]).catch(() => {});
}


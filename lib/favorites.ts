import { createClient } from "@/lib/supabase/client";

const FAVORITES_STORAGE_KEY = "cieloterre_favorites";
const FAVORITES_EVENT = "cieloterre_favorites_changed";

/** Safe check for browser environment */
function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

/** Get list of saved property slugs from localStorage */
export function getLocalFavorites(): string[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

/** Save list of property slugs to localStorage and notify listeners */
function setLocalFavorites(slugs: string[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(slugs));
    window.dispatchEvent(new CustomEvent(FAVORITES_EVENT, { detail: { slugs } }));
  } catch {
    // Ignore storage quota errors
  }
}

/** Check if a slug is currently favorited */
export function isLocalFavorite(slug: string): boolean {
  return getLocalFavorites().includes(slug);
}

/** Toggle favorite status for a property slug and sync with Supabase if authenticated */
export async function toggleFavorite(slug: string, propertyId?: string | null): Promise<boolean> {
  const current = getLocalFavorites();
  const exists = current.includes(slug);
  const next = exists ? current.filter((s) => s !== slug) : [...current, slug];
  setLocalFavorites(next);

  // Sync with Supabase if logged in
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      let dbId = propertyId;
      if (!dbId) {
        const { data: p } = await (supabase.from("properties") as any)
          .select("id")
          .eq("slug", slug)
          .maybeSingle();
        dbId = p?.id;
      }
      if (dbId) {
        if (exists) {
          await (supabase.from("favorites") as any)
            .delete()
            .eq("user_id", user.id)
            .eq("property_id", dbId);
        } else {
          await (supabase.from("favorites") as any).insert({
            user_id: user.id,
            property_id: dbId,
          });
        }
      }
    }
  } catch (err) {
    console.warn("[toggleFavorite] Supabase sync skipped:", err);
  }

  return !exists;
}

/** Subscribe to changes to the favorites list */
export function subscribeFavorites(callback: (slugs: string[]) => void): () => void {
  if (!isBrowser()) return () => {};
  const handler = (e: Event) => {
    const custom = e as CustomEvent<{ slugs: string[] }>;
    callback(custom.detail?.slugs ?? getLocalFavorites());
  };
  const storageHandler = (e: StorageEvent) => {
    if (e.key === FAVORITES_STORAGE_KEY) callback(getLocalFavorites());
  };
  window.addEventListener(FAVORITES_EVENT, handler);
  window.addEventListener("storage", storageHandler);
  return () => {
    window.removeEventListener(FAVORITES_EVENT, handler);
    window.removeEventListener("storage", storageHandler);
  };
}

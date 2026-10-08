"use client";

import { useCallback, useSyncExternalStore } from "react";
import { getLocalFavorites, subscribeFavorites, toggleFavorite } from "@/lib/favorites";

const EMPTY: string[] = [];
let cache: string[] = EMPTY;
let cacheKey = "";

function snapshot(): string[] {
  const next = getLocalFavorites();
  const key = next.join("|");
  if (key !== cacheKey) {
    cacheKey = key;
    cache = next;
  }
  return cache;
}

/** Live list of saved property slugs, synced across tabs and components. */
export function useFavorites() {
  const slugs = useSyncExternalStore(subscribeFavorites, snapshot, () => EMPTY);
  const toggle = useCallback(
    (slug: string, id?: string | null) => toggleFavorite(slug, id),
    [],
  );
  return { slugs, toggle, has: (slug: string) => slugs.includes(slug) };
}

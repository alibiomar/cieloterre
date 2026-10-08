"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toPropertyCard } from "@/lib/supabase/mappers";
import { useFavorites } from "@/lib/use-favorites";
import { plural } from "@/lib/format";
import type { Property } from "@/lib/cieloterre-data";
import { PropertyGrid } from "./property-card";
import { EmptyState } from "./ui";

export function FavoritesView() {
  const { slugs } = useFavorites();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const key = slugs.join("|");

  useEffect(() => {
    let active = true;
    async function load() {
      if (!slugs.length) {
        setProperties([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setFailed(false);
      try {
        const supabase = createClient();
        const { data, error } = await (supabase.from("properties") as any).select("*").in("slug", slugs).eq("status", "published");
        if (!active) return;
        if (error) setFailed(true);
        else setProperties((data ?? []).map(toPropertyCard));
      } catch {
        if (active) setFailed(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (loading) {
    return (
      <div className="grid gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
        {Array.from({ length: Math.min(3, Math.max(1, slugs.length)) }).map((_, i) => (
          <div key={i}><div className="ct-skeleton aspect-[4/3]" /><div className="ct-skeleton mt-4 h-5 w-2/3" /></div>
        ))}
      </div>
    );
  }
  if (failed) return <EmptyState title="Impossible de charger vos favoris." text="Vérifiez votre connexion puis rechargez la page." href="/favoris" action="Réessayer" />;
  if (!properties.length) {
    return <EmptyState title="Votre sélection est vide." text="Touchez le cœur d’un bien pour le retrouver ici à tout moment." action="Parcourir les biens" />;
  }
  return (
    <>
      <p className="mb-8 text-lg"><span className="ct-num font-medium">{properties.length}</span> {plural(properties.length, "bien enregistré", "biens enregistrés")}</p>
      <PropertyGrid items={properties} />
    </>
  );
}

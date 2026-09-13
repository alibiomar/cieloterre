"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/page-sections";
import { PageIntro, PropertyGrid } from "@/components/property-ui";
import { getLocalFavorites, subscribeFavorites } from "@/lib/favorites";
import { createClient } from "@/lib/supabase/client";
import { toPropertyCard } from "@/lib/supabase/mappers";
import type { Property } from "@/lib/cieloterre-data";

export function FavoritesPageContent() {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSlugs(getLocalFavorites());
    return subscribeFavorites((updatedSlugs) => {
      setSlugs(updatedSlugs);
    });
  }, []);

  useEffect(() => {
    let active = true;

    async function loadProperties() {
      if (slugs.length === 0) {
        if (active) {
          setProperties([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await (supabase.from("properties") as any)
          .select("*")
          .in("slug", slugs)
          .eq("status", "published");

        if (!error && data && active) {
          setProperties(data.map(toPropertyCard));
        }
      } catch (err) {
        console.warn("[FavoritesPageContent] Could not load favorites:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProperties();
    return () => {
      active = false;
    };
  }, [slugs]);

  return (
    <>
      <PageIntro
        eyebrow="Votre sélection"
        title={
          <>
            Vos biens <em>favoris.</em>
          </>
        }
      >
        Retrouvez ici les adresses que vous souhaitez garder à l’œil, réunies au même endroit.
      </PageIntro>

      <section className="mt-12">
        {loading ? (
          <div className="py-20 text-center text-sm text-soft-foreground">
            Chargement de votre carnet de favoris...
          </div>
        ) : properties.length > 0 ? (
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              {properties.length} {properties.length === 1 ? "adresse sauvegardée" : "adresses sauvegardées"}
            </p>
            <PropertyGrid items={properties} />
          </div>
        ) : (
          <EmptyState
            title="Votre carnet est encore vide."
            text="Enregistrez une adresse depuis le catalogue en cliquant sur le cœur pour la retrouver ici à tout moment."
            href="/biens"
            action="Parcourir le catalogue"
          />
        )}
      </section>
    </>
  );
}


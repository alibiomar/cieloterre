"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ArrowDownUp, MapPin, SlidersHorizontal } from "lucide-react";
import { PageIntro, PropertyGrid } from "@/components/property-ui";
import { PropertySearch } from "@/components/property-search";
import type { Property } from "@/lib/cieloterre-data";

type PropertyCatalogProps = {
  properties: Property[];
  city?: string;
  type?: string;
  transaction?: "sale" | "rent" | "new";
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  sort?: "pertinence" | "prix-croissant" | "prix-decroissant" | "surface";
};

function formatPrice(value?: number) {
  if (value === undefined) return null;
  return `${value.toLocaleString("fr-FR")} TND`;
}

export function PropertyCatalog({
  properties,
  city,
  type,
  transaction = "sale",
  minPrice,
  maxPrice,
  bedrooms,
  sort = "pertinence",
}: PropertyCatalogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const locationLabel = city || "Toute la Tunisie";
  const priceLabel =
    minPrice !== undefined || maxPrice !== undefined
      ? `${formatPrice(minPrice) || "0 TND"} – ${formatPrice(maxPrice) || "sans limite"}`
      : null;

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newSort && newSort !== "pertinence") {
      params.set("sort", newSort);
    } else {
      params.delete("sort");
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <div className="mx-auto max-w-7xl">
      <section className="grid gap-10 lg:grid-cols-[1fr_0.7fr] lg:items-end">
        <PageIntro
          eyebrow="Le catalogue CieloTerre"
          title={
            <>
              Trouver une adresse qui
              <em> vous ressemble.</em>
            </>
          }
        >
          Des propriétés choisies pour leur emplacement, leur caractère et la
          qualité de vie qu’elles rendent possible.
        </PageIntro>

        <div className="hidden justify-self-end text-right lg:block">
          <p className="font-serif text-6xl leading-none text-foreground">
            {properties.length.toString().padStart(2, "0")}
          </p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-soft-foreground">
            adresses disponibles
          </p>
        </div>
      </section>

      <div id="property-search" className="relative z-10 mt-12 scroll-mt-24">
        <PropertySearch
          mode={transaction === "rent" ? "louer" : transaction === "new" ? "neuf" : "acheter"}
        />
      </div>

      <section className="mt-14">
        <div className="flex flex-col gap-5 border-b border-cool-light pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-soft-foreground">
              <MapPin size={15} className="text-primary" />
              <span>{locationLabel}</span>
              {type && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span>{type}</span>
                </>
              )}
            </div>
            <h2 className="mt-3 font-serif text-3xl text-foreground">
              {properties.length}{" "}
              {properties.length === 1 ? "bien trouvé" : "biens trouvés"}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#property-search"
              className="inline-flex items-center gap-2 rounded-full border border-cool-light bg-background px-4 py-2.5 text-xs font-semibold text-soft-foreground lg:hidden"
            >
              <SlidersHorizontal size={14} />
              Affiner
            </a>
            <label className="inline-flex items-center gap-2 rounded-full border border-cool-light bg-background px-3.5 py-2 text-xs font-semibold text-foreground shadow-xs">
              <ArrowDownUp size={14} className="text-primary shrink-0" />
              <select
                aria-label="Trier les biens"
                value={sort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="bg-transparent text-xs font-semibold text-foreground outline-none cursor-pointer pr-1"
              >
                <option value="pertinence">Sélection éditoriale</option>
                <option value="prix-croissant">Prix croissant</option>
                <option value="prix-decroissant">Prix décroissant</option>
                <option value="surface">Surface</option>
              </select>
            </label>
          </div>
        </div>

        {(priceLabel || bedrooms !== undefined) && (
          <div className="flex flex-wrap gap-2 pt-5">
            {priceLabel && (
              <span className="rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-primary">
                Budget : {priceLabel}
              </span>
            )}
            {bedrooms !== undefined && (
              <span className="rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-accent">
                {bedrooms}+ chambres
              </span>
            )}
            <Link
              href="/biens"
              className="px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:text-foreground"
            >
              Effacer les critères
            </Link>
          </div>
        )}
      </section>

      <div className="mt-8">
        {properties.length > 0 ? (
          <PropertyGrid items={properties} featuredFirst />
        ) : (
          <div className="overflow-hidden rounded-[28px] border border-cool-light bg-background">
            <div className="grid gap-8 p-8 sm:p-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:p-16">
              <div>
                <p className="eyebrow">Recherche à affiner</p>
                <h2 className="mt-4 font-serif text-4xl leading-tight text-foreground">
                  Cette adresse attend encore sa prochaine histoire.
                </h2>
              </div>
              <div>
                <p className="max-w-lg text-sm leading-7 text-soft-foreground">
                  Aucun bien publié ne correspond à ces critères pour le moment.
                  Élargissez la zone ou ajustez votre budget pour découvrir
                  d’autres possibilités.
                </p>
                <Link
                  href="/biens"
                  className="mt-7 inline-flex rounded-full bg-earth px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-earth"
                >
                  Voir toutes les propriétés
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

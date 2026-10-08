import Link from "next/link";
import { getPublishedProperties, toPropertyCard } from "@/lib/supabase/queries";
import { getCatalogFacets } from "@/lib/supabase/facets";
import { parseCatalogParams, type TransactionValue } from "@/lib/catalog-params";
import { CatalogShell } from "./catalog-shell";
import { PropertyGrid } from "./property-card";
import { EmptyState, PageHeader } from "./ui";

const PAGE_SIZE = 12;

type RawParams = Record<string, string | string[] | undefined>;

/**
 * Shared server page behind /biens, /acheter, /louer and /neuf: filters run in
 * the database, the client shell only edits the URL.
 */
export async function CatalogPage({
  searchParams,
  basePath,
  locked,
  title,
  lede,
}: {
  searchParams: RawParams;
  basePath: string;
  locked?: TransactionValue;
  title: string;
  lede: string;
}) {
  const params = parseCatalogParams(searchParams);
  const transaction = locked ?? params.transaction;

  const [facets, rows] = await Promise.all([
    getCatalogFacets(),
    getPublishedProperties({
      city: params.ville,
      type: params.type,
      transaction,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      bedrooms: params.chambres,
      features: params.features,
      limit: 100,
    }),
  ]);

  const all = rows.map(toPropertyCard);
  if (params.sort === "prix-croissant") all.sort((a, b) => a.numericPrice - b.numericPrice);
  else if (params.sort === "prix-decroissant") all.sort((a, b) => b.numericPrice - a.numericPrice);
  else if (params.sort === "surface") all.sort((a, b) => b.area - a.area);

  const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const page = Math.min(params.page, pages);
  const items = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hrefFor = (target: number) => {
    const q = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "page" || value === undefined) continue;
      (Array.isArray(value) ? value : [value]).forEach((item) => q.append(key, item));
    }
    if (target > 1) q.set("page", String(target));
    const qs = q.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <>
      <PageHeader title={title} lede={lede} />
      <CatalogShell facets={facets} total={all.length} activeTransaction={transaction ?? "all"}>
        {items.length > 0 ? (
          <>
            <PropertyGrid items={items} className="lg:grid-cols-2 xl:grid-cols-3" />
            {pages > 1 && (
              <nav aria-label="Pagination" className="mt-16 flex flex-wrap items-center justify-center gap-2">
                {page > 1 && <Link href={hrefFor(page - 1)} className="ct-btn ct-btn--ghost ct-btn--sm">Précédent</Link>}
                {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                  <Link
                    key={n}
                    href={hrefFor(n)}
                    aria-current={n === page ? "page" : undefined}
                    className={`ct-num grid size-10 place-items-center rounded-full text-sm ${n === page ? "bg-nuit text-white" : "hover:bg-ombre"}`}
                  >
                    {n}
                  </Link>
                ))}
                {page < pages && <Link href={hrefFor(page + 1)} className="ct-btn ct-btn--ghost ct-btn--sm">Suivant</Link>}
              </nav>
            )}
          </>
        ) : (
          <EmptyState
            title="Aucun bien ne correspond à ces critères."
            text="Élargissez la zone, relevez le budget ou retirez un équipement. Vous pouvez aussi nous décrire votre recherche : nous vous prévenons dès qu’un bien correspond."
            href="/contact"
            action="Décrire ma recherche"
          />
        )}
      </CatalogShell>
    </>
  );
}

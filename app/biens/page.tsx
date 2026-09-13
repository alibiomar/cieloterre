import { PageShell } from "@/components/site-chrome";
import { PropertyCatalog } from "@/components/biens/property-catalog";
import { getPublishedProperties, toPropertyCard } from "@/lib/supabase/queries";
import { SEARCH_FEATURES } from "@/lib/property-search";

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const city = typeof query.ville === "string" ? query.ville : undefined;
  const type = typeof query.type === "string" ? query.type : undefined;
  const transaction =
    query.transaction === "rent" || query.transaction === "new" || query.transaction === "sale"
      ? query.transaction
      : undefined;
  const rawFeatures = Array.isArray(query.feature)
    ? query.feature
    : typeof query.feature === "string"
      ? [query.feature]
      : [];
  const features = rawFeatures.filter((feature): feature is (typeof SEARCH_FEATURES)[number] =>
    SEARCH_FEATURES.includes(feature as (typeof SEARCH_FEATURES)[number]),
  );
  const minPrice =
    typeof query.minPrice === "string" ? Number(query.minPrice) : undefined;
  const maxPrice =
    typeof query.maxPrice === "string" ? Number(query.maxPrice) : undefined;
  const bedroomsValue =
    typeof query.chambres === "string" ? Number(query.chambres) : undefined;
  const bedrooms =
    bedroomsValue !== undefined && Number.isFinite(bedroomsValue)
      ? bedroomsValue
      : undefined;
  const sortKey = (typeof query.sort === "string" && ["prix-croissant", "prix-decroissant", "surface", "pertinence"].includes(query.sort)
    ? query.sort
    : "pertinence") as "pertinence" | "prix-croissant" | "prix-decroissant" | "surface";

  const rows = await getPublishedProperties({
    city,
    type,
    transaction,
    features,
    minPrice: minPrice || undefined,
    maxPrice: maxPrice || undefined,
    bedrooms,
  });

  const properties = rows.map(toPropertyCard);
  if (sortKey === "prix-croissant") {
    properties.sort((a, b) => a.numericPrice - b.numericPrice);
  } else if (sortKey === "prix-decroissant") {
    properties.sort((a, b) => b.numericPrice - a.numericPrice);
  } else if (sortKey === "surface") {
    properties.sort((a, b) => b.area - a.area);
  }

  return (
    <PageShell>
      <PropertyCatalog
        properties={properties}
        city={city}
        type={type}
        transaction={transaction}
        minPrice={minPrice || undefined}
        maxPrice={maxPrice || undefined}
        bedrooms={bedrooms}
        sort={sortKey}
      />
    </PageShell>
  );
}

export const metadata = {
  title: "Biens immobiliers en Tunisie | CieloTerre",
};

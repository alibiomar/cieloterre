export const SORTS = [
  { value: "recent", label: "Les plus récents" },
  { value: "prix-croissant", label: "Prix croissant" },
  { value: "prix-decroissant", label: "Prix décroissant" },
  { value: "surface", label: "Surface décroissante" },
] as const;

export type SortValue = (typeof SORTS)[number]["value"];
export type TransactionValue = "sale" | "rent" | "new";

export type CatalogParams = {
  ville?: string;
  type?: string;
  transaction?: TransactionValue;
  minPrice?: number;
  maxPrice?: number;
  chambres?: number;
  features: string[];
  sort: SortValue;
  page: number;
};

type RawParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

function positive(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

const text = (value: string | undefined) => {
  const trimmed = value?.trim().slice(0, 80);
  return trimmed ? trimmed : undefined;
};

/** Reads and sanitises the catalog query string. Unknown values are ignored. */
export function parseCatalogParams(raw: RawParams): CatalogParams {
  const transaction = first(raw.transaction);
  const sort = first(raw.sort);
  const features = (Array.isArray(raw.feature) ? raw.feature : raw.feature ? [raw.feature] : [])
    .map((item) => item.trim().slice(0, 60))
    .filter(Boolean)
    .slice(0, 10);

  return {
    ville: text(first(raw.ville)),
    type: text(first(raw.type)),
    transaction: transaction === "sale" || transaction === "rent" || transaction === "new" ? transaction : undefined,
    minPrice: positive(first(raw.minPrice)),
    maxPrice: positive(first(raw.maxPrice)),
    chambres: positive(first(raw.chambres)),
    features: [...new Set(features)],
    sort: SORTS.some((item) => item.value === sort) ? (sort as SortValue) : "recent",
    page: Math.max(1, Math.floor(positive(first(raw.page)) ?? 1)),
  };
}

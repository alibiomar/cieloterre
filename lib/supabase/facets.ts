import { createClient } from "./server";

export type Facet = { name: string; count: number };

export type CatalogFacets = {
  total: number;
  cities: Facet[];
  types: Facet[];
  features: Facet[];
  transactions: Record<"sale" | "rent" | "new", number>;
};

const EMPTY: CatalogFacets = {
  total: 0,
  cities: [],
  types: [],
  features: [],
  transactions: { sale: 0, rent: 0, new: 0 },
};

function tally(values: string[]): Facet[] {
  const map = new Map<string, number>();
  for (const value of values) {
    const key = value.trim();
    if (key) map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "fr"));
}

/**
 * Filter options derived from what is actually published, so the catalog never
 * offers a city or feature that leads to an empty result.
 */
export async function getCatalogFacets(): Promise<CatalogFacets> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("properties")
      .select("city, property_type, transaction_type, features")
      .eq("status", "published")
      .limit(1000);
    if (error || !data) return EMPTY;

    const rows = data as Array<{
      city: string;
      property_type: string;
      transaction_type: string;
      features: string[] | null;
    }>;
    const transactions = { sale: 0, rent: 0, new: 0 };
    for (const row of rows) {
      if (row.transaction_type in transactions) {
        transactions[row.transaction_type as keyof typeof transactions] += 1;
      }
    }
    return {
      total: rows.length,
      cities: tally(rows.map((row) => row.city)),
      types: tally(rows.map((row) => row.property_type)),
      features: tally(rows.flatMap((row) => row.features ?? [])),
      transactions,
    };
  } catch (error) {
    console.warn("[getCatalogFacets] unavailable:", error);
    return EMPTY;
  }
}

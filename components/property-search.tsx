"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  SEARCH_LOCATIONS,
  SEARCH_TYPES,
  SEARCH_FEATURES,
  parsePropertyQuery,
  serializePropertyQuery,
  type SearchFeature,
  type SearchLocation,
  type SearchType,
  type SearchTransaction,
} from "@/lib/property-search";

const MODES = ["acheter", "louer", "neuf"] as const;
type Mode = (typeof MODES)[number];

const MODE_LABELS: Record<Mode, string> = {
  acheter: "Acheter",
  louer: "Louer",
  neuf: "Neuf",
};

const MODE_TRANSACTIONS: Record<Mode, SearchTransaction> = {
  acheter: "sale",
  louer: "rent",
  neuf: "new",
};

const BEDROOM_OPTIONS = [
  { label: "1", value: "1" },
  { label: "2", value: "2" },
  { label: "3", value: "3" },
  { label: "4", value: "4" },
  { label: "5+", value: "5" },
];

// Desktop bar only has room for a handful of quick-toggle chips.
const QUICK_FEATURE_COUNT = 5;

export function PropertySearch({ mode = "acheter" }: { mode?: Mode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialQuery = useMemo(
    () => parsePropertyQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [place, setPlace] = useState<SearchLocation | "">(initialQuery.ville);
  const [type, setType] = useState<SearchType | "">(initialQuery.type);
  const [minPrice, setMinPrice] = useState(
    initialQuery.minPrice === undefined ? "" : String(initialQuery.minPrice),
  );
  const [maxPrice, setMaxPrice] = useState(
    initialQuery.maxPrice === undefined ? "" : String(initialQuery.maxPrice),
  );
  const [bedrooms, setBedrooms] = useState(
    initialQuery.chambres === undefined ? "" : String(initialQuery.chambres),
  );
  const [selectedFeatures, setSelectedFeatures] = useState<SearchFeature[]>(
    initialQuery.features,
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [priceError, setPriceError] = useState("");

  const toggleFeature = (feature: SearchFeature) => {
    setSelectedFeatures((current) =>
      current.includes(feature)
        ? current.filter((item) => item !== feature)
        : [...current, feature],
    );
  };

  const apply = (event?: React.FormEvent) => {
    event?.preventDefault();

    const min = minPrice ? Number(minPrice) : undefined;
    const max = maxPrice ? Number(maxPrice) : undefined;
    if (min !== undefined && max !== undefined && min > max) {
      setPriceError("Le prix minimum doit être inférieur au prix maximum.");
      return;
    }
    setPriceError("");

    // Preserve sort/view/page from whatever's currently in the URL —
    // this form only owns the filter fields, not display state.
    const nextQuery = {
      ...initialQuery,
      transaction: MODE_TRANSACTIONS[mode],
      ville: place,
      type,
      minPrice: min,
      maxPrice: max,
      chambres: bedrooms ? Number(bedrooms) : undefined,
      features: selectedFeatures,
      page: 1, // any filter change resets pagination
    };

    const targetPath = pathname === "/" ? "/biens" : pathname;
    const qs = serializePropertyQuery(nextQuery).toString();
    router.push(qs ? `${targetPath}?${qs}` : targetPath);
    setFiltersOpen(false);
  };

  const selectMode = (nextMode: Mode) => {
    if (pathname === "/acheter" || pathname === "/louer" || pathname === "/neuf") {
      router.push(`/${nextMode}`);
      return;
    }

    const nextQuery = {
      ...initialQuery,
      transaction: MODE_TRANSACTIONS[nextMode],
      page: 1,
    };
    const targetPath = pathname === "/" ? "/biens" : pathname;
    const qs = serializePropertyQuery(nextQuery).toString();
    router.push(qs ? `${targetPath}?${qs}` : targetPath);
  };

  const reset = () => {
    setPlace("");
    setType("");
    setMinPrice("");
    setMaxPrice("");
    setBedrooms("");
    setSelectedFeatures([]);
    setPriceError("");
    router.push(pathname);
  };

  return (
    <div className="rounded-2xl border border-cool-light bg-background p-2 shadow-sm">
      <div className="flex items-center gap-1 border-b border-cool-light px-2">
        {MODES.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => selectMode(value)}
            className={`px-4 py-3 text-sm font-semibold ${
              mode === value
                ? "border-b-2 border-primary text-foreground"
                : "text-soft-foreground"
            }`}
          >
            {MODE_LABELS[value]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
          className="ml-auto flex items-center gap-2 px-3 py-3 text-xs font-semibold text-soft-foreground lg:hidden"
        >
          <SlidersHorizontal size={15} /> Filtres
        </button>
      </div>

      <form
        onSubmit={apply}
        className="grid gap-2 p-2 lg:grid-cols-[1.1fr_0.9fr_0.7fr_0.7fr_0.7fr_auto] lg:items-end"
      >
        <label className="field-label">
          <span>Où ?</span>
          <select
            value={place}
            onChange={(e) => setPlace(e.target.value as SearchLocation | "")}
          >
            <option value="">Toute la Tunisie</option>
            {SEARCH_LOCATIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          <span>Type de bien</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as SearchType | "")}
          >
            <option value="">Tous les types</option>
            {SEARCH_TYPES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          <span>{mode === "louer" ? "Loyer min" : "Budget min"}</span>
          <input
            value={minPrice}
            onChange={(e) => {
              setMinPrice(e.target.value.replace(/\D/g, ""));
              setPriceError("");
            }}
            inputMode="numeric"
            placeholder="0"
          />
        </label>
        <label className="field-label">
          <span>{mode === "louer" ? "Loyer max" : "Budget max"}</span>
          <input
            value={maxPrice}
            onChange={(e) => {
              setMaxPrice(e.target.value.replace(/\D/g, ""));
              setPriceError("");
            }}
            inputMode="numeric"
            placeholder="Sans limite"
          />
        </label>
        <label className="field-label">
          <span>Chambres</span>
          <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)}>
            <option value="">Indifférent</option>
            {BEDROOM_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-earth px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-earth"
        >
          <Search size={16} /> Rechercher
        </button>
        {priceError && (
          <p role="alert" className="col-span-full text-xs font-medium text-red-600">
            {priceError}
          </p>
        )}
      </form>

      {filtersOpen && (
        <div className="border-t border-cool-light p-4 lg:hidden">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Affiner votre recherche</p>
            <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Fermer les filtres">
              <X size={18} />
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {SEARCH_FEATURES.map((feature) => (
              <FeatureChip
                key={feature}
                feature={feature}
                active={selectedFeatures.includes(feature)}
                onToggle={toggleFeature}
                size="md"
              />
            ))}
          </div>
          <div className="mt-4 flex items-center gap-4">
            <button
              type="button"
              onClick={() => apply()}
              className="rounded-xl bg-earth px-4 py-2 text-xs font-bold text-primary-foreground"
            >
              Appliquer
            </button>
            <button type="button" onClick={reset} className="text-xs font-semibold text-primary">
              Réinitialiser
            </button>
          </div>
        </div>
      )}

      <div className="hidden items-center gap-2 border-t border-cool-light px-3 pt-3 lg:flex">
        <span className="text-xs text-soft-foreground">Recherche avancée</span>
        {SEARCH_FEATURES.slice(0, QUICK_FEATURE_COUNT).map((feature) => (
          <FeatureChip
            key={feature}
            feature={feature}
            active={selectedFeatures.includes(feature)}
            onToggle={toggleFeature}
            size="sm"
          />
        ))}
        <button type="button" onClick={() => apply()} className="text-[11px] font-semibold text-foreground underline">
          Appliquer
        </button>
        <button type="button" onClick={reset} className="ml-auto text-[11px] font-semibold text-primary">
          Réinitialiser
        </button>
      </div>
    </div>
  );
}

function FeatureChip({
  feature,
  active,
  onToggle,
  size,
}: {
  feature: SearchFeature;
  active: boolean;
  onToggle: (feature: SearchFeature) => void;
  size: "sm" | "md";
}) {
  const sizeClasses = size === "md" ? "px-3 py-2 text-xs" : "px-3 py-1.5 text-[11px]";
  return (
    <button
      type="button"
      onClick={() => onToggle(feature)}
      aria-pressed={active}
      className={`rounded-full border ${sizeClasses} ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-cool-light text-soft-foreground"
      }`}
    >
      {feature}
    </button>
  );
}
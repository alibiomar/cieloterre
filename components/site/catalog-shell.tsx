"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { CatalogFacets } from "@/lib/supabase/facets";
import { SORTS, type TransactionValue } from "@/lib/catalog-params";
import { formatNumber, plural } from "@/lib/format";

const TABS: Array<{ key: "all" | TransactionValue; label: string; href: string }> = [
  { key: "all", label: "Tous", href: "/biens" },
  { key: "sale", label: "Acheter", href: "/acheter" },
  { key: "rent", label: "Louer", href: "/louer" },
  { key: "new", label: "Neuf", href: "/neuf" },
];

const BEDROOMS = [1, 2, 3, 4, 5];

export function CatalogShell({
  facets,
  total,
  activeTransaction,
  children,
}: {
  facets: CatalogFacets;
  total: number;
  activeTransaction: "all" | TransactionValue;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [sheet, setSheet] = useState(false);

  const get = (key: string) => search.get(key) ?? "";
  const features = search.getAll("feature");

  const [min, setMin] = useState(get("minPrice"));
  const [max, setMax] = useState(get("maxPrice"));
  const [budgetError, setBudgetError] = useState("");
  useEffect(() => {
    setMin(search.get("minPrice") ?? "");
    setMax(search.get("maxPrice") ?? "");
  }, [search]);

  useEffect(() => {
    if (!sheet) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setSheet(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [sheet]);

  function push(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(search.toString());
    mutate(params);
    params.delete("page");
    const qs = params.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  const setOrClear = (key: string, value: string) =>
    push((p) => (value && p.get(key) !== value ? p.set(key, value) : p.delete(key)));

  function applyBudget() {
    const lo = Number(min || 0);
    const hi = Number(max || 0);
    if (lo && hi && lo > hi) {
      setBudgetError("Le minimum doit être inférieur au maximum.");
      return;
    }
    setBudgetError("");
    push((p) => {
      if (lo) p.set("minPrice", String(lo)); else p.delete("minPrice");
      if (hi) p.set("maxPrice", String(hi)); else p.delete("maxPrice");
    });
  }

  function toggleFeature(name: string) {
    push((p) => {
      const current = p.getAll("feature");
      p.delete("feature");
      (current.includes(name) ? current.filter((item) => item !== name) : [...current, name]).forEach((item) => p.append("feature", item));
    });
  }

  const reset = () => push((p) => {
    for (const key of ["ville", "type", "minPrice", "maxPrice", "chambres", "feature"]) p.delete(key);
  });

  // Active filters, shown as removable chips above the results.
  const chips: Array<{ label: string; remove: () => void }> = [];
  if (get("ville")) chips.push({ label: get("ville"), remove: () => setOrClear("ville", "") });
  if (get("type")) chips.push({ label: get("type"), remove: () => setOrClear("type", "") });
  if (get("minPrice")) chips.push({ label: `Dès ${formatNumber(Number(get("minPrice")))} TND`, remove: () => push((p) => p.delete("minPrice")) });
  if (get("maxPrice")) chips.push({ label: `Jusqu’à ${formatNumber(Number(get("maxPrice")))} TND`, remove: () => push((p) => p.delete("maxPrice")) });
  if (get("chambres")) chips.push({ label: `${get("chambres")} chambres et plus`, remove: () => setOrClear("chambres", "") });
  for (const f of features) chips.push({ label: f, remove: () => toggleFeature(f) });

  const tabHref = (base: string) => {
    const params = new URLSearchParams(search.toString());
    params.delete("page");
    params.delete("transaction");
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  };

  const panel = (
    <div className="space-y-9">
      {facets.cities.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-base font-medium">Ville</legend>
          <div className="flex flex-wrap gap-2">
            {facets.cities.slice(0, 14).map((city) => (
              <button key={city.name} type="button" className="ct-chip" aria-pressed={get("ville").toLowerCase() === city.name.toLowerCase()} onClick={() => setOrClear("ville", city.name)}>
                {city.name} <small>{city.count}</small>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {facets.types.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-base font-medium">Type de bien</legend>
          <div className="flex flex-wrap gap-2">
            {facets.types.map((type) => (
              <button key={type.name} type="button" className="ct-chip" aria-pressed={get("type").toLowerCase() === type.name.toLowerCase()} onClick={() => setOrClear("type", type.name)}>
                {type.name} <small>{type.count}</small>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-3 text-base font-medium">Budget en TND</legend>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="f-min" className="sr-only">Budget minimum</label>
            <input id="f-min" inputMode="numeric" placeholder="Minimum" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} onBlur={applyBudget} onKeyDown={(e) => e.key === "Enter" && applyBudget()} className="ct-field ct-num" />
          </div>
          <div>
            <label htmlFor="f-max" className="sr-only">Budget maximum</label>
            <input id="f-max" inputMode="numeric" placeholder="Maximum" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} onBlur={applyBudget} onKeyDown={(e) => e.key === "Enter" && applyBudget()} className="ct-field ct-num" />
          </div>
        </div>
        {budgetError && <p role="alert" className="mt-2 text-sm text-error">{budgetError}</p>}
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-base font-medium">Chambres</legend>
        <div className="flex flex-wrap gap-2">
          {BEDROOMS.map((n) => (
            <button key={n} type="button" className="ct-chip min-w-11 justify-center" aria-pressed={get("chambres") === String(n)} onClick={() => setOrClear("chambres", String(n))}>
              {n}+
            </button>
          ))}
        </div>
      </fieldset>

      {facets.features.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-base font-medium">Équipements</legend>
          <div className="flex flex-wrap gap-2">
            {facets.features.slice(0, 12).map((feature) => (
              <button key={feature.name} type="button" className="ct-chip" aria-pressed={features.includes(feature.name)} onClick={() => toggleFeature(feature.name)}>
                {feature.name}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {chips.length > 0 && (
        <button type="button" onClick={reset} className="ct-link text-sm font-medium text-porte">Effacer tous les critères</button>
      )}
    </div>
  );

  return (
    <div className="ct-wrap pb-24">
      {/* Transaction tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-trait">
        <nav aria-label="Type d’annonce" className="ct-rail -mb-px flex gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const count = tab.key === "all" ? facets.total : facets.transactions[tab.key];
            const active = activeTransaction === tab.key;
            return (
              <Link
                key={tab.key}
                href={tabHref(tab.href)}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap border-b-2 px-4 py-4 text-base transition-colors ${active ? "border-porte font-medium text-porte" : "border-transparent text-muted hover:text-encre"}`}
              >
                {tab.label} <span className="ct-num text-sm opacity-60">{count}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[19rem_1fr] lg:gap-14">
        <aside className="hidden lg:block" aria-label="Filtres">
          <div className="sticky top-24 max-h-[calc(100svh-7rem)] overflow-y-auto pb-6 pr-1">{panel}</div>
        </aside>

        <div>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-lg" aria-live="polite">
              <span className="ct-num font-medium">{total}</span> {plural(total, "bien", "biens")}
            </p>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setSheet(true)} className="ct-btn ct-btn--ghost ct-btn--sm lg:hidden">
                <SlidersHorizontal size={16} aria-hidden /> Filtres{chips.length ? ` (${chips.length})` : ""}
              </button>
              <label className="flex items-center gap-2 text-sm text-muted">
                <span className="hidden sm:inline">Trier par</span>
                <select
                  aria-label="Trier les biens"
                  value={get("sort") || "recent"}
                  onChange={(e) => push((p) => (e.target.value === "recent" ? p.delete("sort") : p.set("sort", e.target.value)))}
                  className="ct-field !min-h-10 !w-auto !py-1.5 text-sm text-encre"
                >
                  {SORTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
            </div>
          </div>

          {chips.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Critères actifs">
              {chips.map((chip) => (
                <li key={chip.label}>
                  <button type="button" onClick={chip.remove} className="ct-chip !min-h-9 bg-ciel-pale !border-ciel-pale hover:!border-porte" aria-label={`Retirer le critère ${chip.label}`}>
                    {chip.label} <X size={14} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className={`mt-8 transition-opacity duration-200 ${pending ? "pointer-events-none opacity-50" : ""}`} aria-busy={pending}>
            {children}
          </div>
        </div>
      </div>

      {/* Mobile filter sheet */}
      {sheet && (
        <div role="dialog" aria-modal="true" aria-label="Filtres" className="fixed inset-0 z-[60] flex items-end lg:hidden">
          <button type="button" aria-label="Fermer les filtres" tabIndex={-1} onClick={() => setSheet(false)} className="absolute inset-0 bg-nuit/60" />
          <div className="relative flex max-h-[88svh] w-full flex-col rounded-t-2xl bg-chaux">
            <div className="flex items-center justify-between border-b border-trait px-6 py-4">
              <h2 className="text-lg font-medium">Filtres</h2>
              <button type="button" onClick={() => setSheet(false)} aria-label="Fermer" className="grid size-10 place-items-center rounded-full hover:bg-ombre"><X size={20} aria-hidden /></button>
            </div>
            <div className="overflow-y-auto px-6 py-6">{panel}</div>
            <div className="border-t border-trait p-4">
              <button type="button" onClick={() => setSheet(false)} className="ct-btn ct-btn--primary w-full">
                Voir {total} {plural(total, "bien", "biens")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

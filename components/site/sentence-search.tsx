"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatNumber } from "@/lib/format";

const FEMININE = ["villa", "maison", "ferme", "résidence", "propriété", "boutique", "parcelle", "suite", "terrasse", "dar"];

/** "Villa" -> "une villa", "Appartement" -> "un appartement". */
export function withArticle(type: string): string {
  const lower = type.trim().toLowerCase();
  if (!lower) return "un bien";
  const article = FEMININE.some((word) => lower.startsWith(word)) ? "une" : "un";
  return `${article} ${lower}`;
}

const DEALS = [
  { value: "sale", label: "à vendre" },
  { value: "rent", label: "à louer" },
  { value: "new", label: "dans le neuf" },
] as const;

function Slot({
  label,
  display,
  children,
}: {
  label: string;
  display: string;
  children: React.ReactNode;
}) {
  return (
    <label className="ct-slot">
      <span>{display}</span>
      <ChevronDown aria-hidden strokeWidth={2.4} />
      <span className="sr-only">{label}</span>
      {children}
    </label>
  );
}

/**
 * The homepage search, written as a sentence. It is a plain GET form, so it
 * works before hydration and produces the same URLs the catalog reads.
 */
export function SentenceSearch({ cities, types }: { cities: string[]; types: string[] }) {
  const [type, setType] = useState("");
  const [deal, setDeal] = useState<(typeof DEALS)[number]["value"]>("sale");
  const [city, setCity] = useState("");
  const [budget, setBudget] = useState("");
  const router = useRouter();

  // Keep URLs tidy: only send the criteria the visitor actually set.
  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (deal !== "sale") params.set("transaction", deal);
    if (city) params.set("ville", city);
    if (budget) params.set("maxPrice", budget);
    const qs = params.toString();
    router.push(qs ? `/biens?${qs}` : "/biens");
  };

  const dealLabel = DEALS.find((item) => item.value === deal)!.label;

  return (
    <form action="/biens" method="get" onSubmit={onSubmit} className="mt-10 max-w-[46rem]">
      <p className="text-[clamp(1.45rem,2.9vw,2.15rem)] font-light leading-[1.85] tracking-[-0.02em] text-encre">
        Je cherche{" "}
        <Slot label="Type de bien" display={type ? withArticle(type) : "un bien"}>
          <select name="type" value={type} onChange={(e) => setType(e.target.value)} aria-label="Type de bien">
            <option value="">un bien</option>
            {types.map((item) => (
              <option key={item} value={item}>{withArticle(item)}</option>
            ))}
          </select>
        </Slot>{" "}
        <Slot label="Type d’annonce" display={dealLabel}>
          <select name="transaction" value={deal} onChange={(e) => setDeal(e.target.value as typeof deal)} aria-label="Type d’annonce">
            {DEALS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </Slot>{" "}
        <Slot label="Lieu" display={city ? `à ${city}` : "partout en Tunisie"}>
          <select name="ville" value={city} onChange={(e) => setCity(e.target.value)} aria-label="Lieu">
            <option value="">partout en Tunisie</option>
            {cities.map((item) => (
              <option key={item} value={item}>à {item}</option>
            ))}
          </select>
        </Slot>
        , avec un budget maximum de{" "}
        <span className="ct-slot">
          <input
            inputMode="numeric"
            aria-label="Budget maximum en dinars"
            placeholder="sans limite"
            value={budget ? formatNumber(Number(budget)) : ""}
            onChange={(e) => setBudget(e.target.value.replace(/\D/g, "").slice(0, 9))}
            autoComplete="off"
          />
        </span>
        {budget ? (deal === "rent" ? " TND par mois." : " TND.") : "."}
        <input type="hidden" name="maxPrice" value={budget} />
      </p>
      <button type="submit" className="ct-btn ct-btn--primary mt-8 min-h-[3.25rem] px-8 text-base">
        Voir les biens
      </button>
    </form>
  );
}

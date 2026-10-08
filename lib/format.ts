import type { Property } from "@/lib/cieloterre-data";

const nf = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

export const formatNumber = (value: number) => nf.format(Math.round(value));

export const formatTND = (value: number) => `${formatNumber(value)} TND`;

/** Rentals are quoted per month; sales and new-build programmes are totals. */
export function priceLabel(property: Pick<Property, "numericPrice" | "transaction">): string {
  const base = formatTND(property.numericPrice);
  return property.transaction === "À louer" ? `${base} / mois` : base;
}

export function pricePerSqm(property: Pick<Property, "numericPrice" | "area" | "transaction">): string | null {
  if (property.transaction === "À louer" || !property.area) return null;
  return `${formatNumber(property.numericPrice / property.area)} TND / m²`;
}

export const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/**
 * Builds a wa.me link from a Tunisian (or international) phone number.
 * 8-digit national numbers get the +216 prefix.
 */
export function whatsappHref(phone: string | null | undefined, text?: string): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 8) digits = `216${digits}`;
  if (digits.length < 10) return null;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function mapsHref(...parts: Array<string | null | undefined>): string {
  const query = [...parts, "Tunisie"].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export const slugifyCity = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

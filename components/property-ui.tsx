"use client";

import Link from "next/link";
import { ArrowRight, Check, Heart, Mail, Phone, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import type { Property } from "@/lib/cieloterre-data";
import { SafeImage as Image } from "@/components/safe-image";
import { createClient } from "@/lib/supabase/client";
import { propertyHref } from "@/lib/supabase/mappers";

import { isLocalFavorite, toggleFavorite, subscribeFavorites } from "@/lib/favorites";

export function PropertyCard({
  property,
  featured = false,
}: {
  property: Property;
  featured?: boolean;
}) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSaved(isLocalFavorite(property.slug));
    const unsubscribe = subscribeFavorites((slugs) => {
      setSaved(slugs.includes(property.slug));
    });
    return unsubscribe;
  }, [property.slug]);

  const toggle = async () => {
    if (saving) return;
    setSaving(true);
    const newState = await toggleFavorite(property.slug, property.id);
    setSaved(newState);
    setSaving(false);
  };
  return (
    <article
      className={`group overflow-hidden rounded-2xl border border-cool-light bg-background shadow-sm transition-shadow hover:shadow-xl ${featured ? "md:col-span-2" : ""}`}
    >
      <Link href={propertyHref(property.slug)} className="block">
        <div
          className={`relative overflow-hidden ${featured ? "aspect-[1.8]" : "aspect-[1.2]"}`}
        >
          <Image
            src={property.image}
            alt={property.title}
            width={1200}
            height={900}
            className="h-full w-full object-cover transition-transform duration-700 motion-reduce:transition-none group-hover:scale-105"
          />
          <span className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground">
            {property.transaction}
          </span>
          <span className="absolute bottom-4 right-4 translate-y-2 text-primary-foreground opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
            <ArrowRight size={20} />
          </span>
        </div>
      </Link>
      <div className="relative p-5">
        <button
          type="button"
          onClick={() => void toggle()}
          disabled={saving}
          className="absolute right-5 top-5 rounded-full bg-secondary p-2.5 text-accent transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-primary"
          aria-label={
            saved
              ? `Retirer ${property.title} des favoris`
              : `Ajouter ${property.title} aux favoris`
          }
        >
          <Heart
            size={16}
            fill={saved ? "var(--primary)" : "none"}
            color={saved ? "var(--primary)" : "currentColor"}
          />
        </button>
        <Link href={propertyHref(property.slug)}>
          <p className="text-xs text-soft-foreground">
            {property.location}, {property.city}
          </p>
          <h3 className="mt-1 pr-10 font-serif text-2xl text-foreground">
            {property.title}
          </h3>
          <p className="mt-3 text-lg font-semibold text-primary">
            {property.price}
          </p>
          <div className="mt-4 flex items-center justify-between border-t border-cool-light pt-4 text-xs text-soft-foreground">
            <span>
              {property.area} m² · {property.bedrooms} ch. ·{" "}
              {property.bathrooms} sdb.
            </span>
            <span className="font-mono text-[10px]">{property.ref}</span>
          </div>
        </Link>
      </div>
    </article>
  );
}
export function PropertyGrid({
  items,
  featuredFirst = false,
}: {
  items: Property[];
  featuredFirst?: boolean;
}) {
  return items.length ? (
    <div className="grid gap-6 md:grid-cols-3">
      {items.map((property, index) => (
        <PropertyCard
          key={property.slug}
          property={property}
          featured={featuredFirst && index === 0}
        />
      ))}
    </div>
  ) : (
    <div className="rounded-2xl border border-dashed border-cool-light bg-background p-12 text-center">
      <RotateCcw className="mx-auto text-primary" />
      <h3 className="mt-4 font-serif text-2xl">Aucun bien ne correspond</h3>
      <p className="mt-2 text-sm text-soft-foreground">
        Essayez d'élargir votre recherche ou de retirer un filtre.
      </p>
    </div>
  );
}
export function PageIntro({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="max-w-3xl">
      <div className="mb-7 flex items-center gap-3">
        <span className="h-px w-10 bg-secondary" />
        <p className="eyebrow">{eyebrow}</p>
      </div>
      <h1 className="section-title text-5xl sm:text-7xl">{title}</h1>
      {children && (
        <p className="mt-6 max-w-xl text-base leading-7 text-soft-foreground">
          {children}
        </p>
      )}
    </div>
  );
}
export function LeadForm({
  title = "Parlons de votre projet.",
  propertyId,
}: {
  title?: string;
  propertyId?: string;
}) {
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const submitLead = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");
    const form = new FormData(event.currentTarget);
    if (form.get("website")) { setStatus("success"); return; } // honeypot tripped
    const response = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone"),
        message: form.get("message"),
        propertyId,
        _hp: form.get("website"),
      }),
    });
    setStatus(response.ok ? "success" : "error");
  };
  return (
    <div className="rounded-2xl bg-background p-6 shadow-sm sm:p-8">
      {status === "success" ? (
        <div className="py-12 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-surface text-primary">
            <Check />
          </span>
          <h3 className="mt-5 font-serif text-3xl">
            Votre demande est enregistrée.
          </h3>
          <p className="mt-3 text-sm text-soft-foreground">
            Merci. Notre équipe vous recontactera après lecture de votre
            message.
          </p>
        </div>
      ) : (
        <form onSubmit={submitLead}>
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
          />
          <h2 className="font-serif text-3xl">{title}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="sr-only" htmlFor="lead-name">
              Prénom et nom
            </label>
            <input
              id="lead-name"
              name="name"
              required
              placeholder="Prénom et nom"
              className="field"
            />
            <label className="sr-only" htmlFor="lead-email">
              Votre email
            </label>
            <input
              id="lead-email"
              name="email"
              required
              type="email"
              placeholder="Votre email"
              className="field"
            />
          </div>
          <label className="sr-only" htmlFor="lead-phone">
            Téléphone
          </label>
          <input
            id="lead-phone"
            name="phone"
            required
            placeholder="Téléphone"
            className="field mt-4 w-full"
          />
          <label className="sr-only" htmlFor="lead-message">
            Votre projet
          </label>
          <textarea
            id="lead-message"
            name="message"
            required
            placeholder="Parlez-nous de votre projet"
            className="field mt-4 min-h-28 w-full"
          />
          <button
            disabled={status === "sending"}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {status === "sending" ? "Envoi en cours…" : "Prendre contact"}
          </button>
          <p className="mt-4 text-center text-[11px] text-soft-foreground">
            Aucune donnée n'est envoyée sans votre action.
          </p>
        </form>
      )}
    </div>
  );
}
export function ContactActions({
  phone,
  email = "contact@cieloterre.tn",
}: {
  phone: string;
  email?: string;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <a
        href={`tel:${phone.replace(/\s/g, "")}`}
        className="inline-flex items-center gap-2 rounded-full bg-earth px-4 py-2.5 text-sm font-semibold text-primary-foreground"
      >
        <Phone size={15} /> Appeler
      </a>
      <a
        href={`mailto:${email}`}
        className="inline-flex items-center gap-2 rounded-full border border-cool-light px-4 py-2.5 text-sm font-semibold text-foreground"
      >
        <Mail size={15} /> Écrire
      </a>
    </div>
  );
}
export function Breadcrumbs({ items }: { items: string[] }) {
  return (
    <nav aria-label="Fil d’Ariane" className="mb-8 text-xs text-soft-foreground">
      {items.map((item, index) => (
        <span key={`${item}-${index}`}>
          {index > 0 && <span className="mx-2 text-primary">/</span>}
          {item}
        </span>
      ))}
    </nav>
  );
}

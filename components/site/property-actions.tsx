"use client";

import { useState } from "react";
import { Calendar, MessageCircle, Phone, Share2 } from "lucide-react";
import type { Property } from "@/lib/cieloterre-data";
import { priceLabel, whatsappHref } from "@/lib/format";
import { ViewingModal } from "./viewing-modal";
import { FavoriteButton } from "./favorite-button";

type Agent = { name: string; phone?: string | null; email?: string | null; href?: string | null; agency?: string | null };

export function PropertyActions({
  property,
  agent,
  fallbackPhone,
}: {
  property: Property;
  agent: Agent;
  fallbackPhone: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const phone = agent.phone || fallbackPhone;
  const wa = whatsappHref(agent.phone, `Bonjour, je suis intéressé(e) par « ${property.title} » (${property.ref}) sur CieloTerre.`);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: property.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* user dismissed the share sheet */
    }
  }

  return (
    <>
      <div className="rounded-lg border border-trait bg-surface p-6 shadow-[0_18px_50px_-30px_rgba(38,52,50,.35)] sm:p-7">
        <p className="ct-num text-[2rem] font-light leading-none tracking-tight">{priceLabel(property)}</p>
        <p className="mt-2 text-sm text-muted">Référence {property.ref}</p>

        <button type="button" onClick={() => setOpen(true)} className="ct-btn ct-btn--primary mt-6 w-full">
          <Calendar size={17} aria-hidden /> Demander une visite
        </button>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <a href={`tel:${phone.replace(/\s/g, "")}`} className="ct-btn ct-btn--ghost ct-btn--sm"><Phone size={16} aria-hidden /> Appeler</a>
          {wa ? (
            <a href={wa} target="_blank" rel="noreferrer" className="ct-btn ct-btn--ghost ct-btn--sm"><MessageCircle size={16} aria-hidden /> WhatsApp</a>
          ) : (
            <a href="#contact" className="ct-btn ct-btn--ghost ct-btn--sm"><MessageCircle size={16} aria-hidden /> Écrire</a>
          )}
        </div>

        <div className="mt-6 flex items-center gap-3 border-t border-trait pt-5">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ciel-pale text-lg font-light text-porte" aria-hidden>
            {agent.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-medium">{agent.name}</p>
            <p className="truncate text-sm text-muted">{agent.agency || "Conseiller CieloTerre"}</p>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <FavoriteButton variant="inline" slug={property.slug} id={property.id} title={property.title} />
          <button type="button" onClick={share} className="ct-btn ct-btn--ghost ct-btn--sm">
            <Share2 size={16} aria-hidden /> {copied ? "Lien copié" : "Partager"}
          </button>
        </div>
      </div>

      {/* Mobile bar: price and the two fastest actions stay in reach */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-trait bg-chaux/95 px-4 py-3 backdrop-blur lg:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        <p className="ct-num min-w-0 flex-1 truncate text-lg font-medium">{priceLabel(property)}</p>
        <a href={`tel:${phone.replace(/\s/g, "")}`} aria-label="Appeler" className="grid size-12 shrink-0 place-items-center rounded-full border border-trait"><Phone size={18} aria-hidden /></a>
        <button type="button" onClick={() => setOpen(true)} className="ct-btn ct-btn--primary shrink-0">Visiter</button>
      </div>

      <ViewingModal property={property} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

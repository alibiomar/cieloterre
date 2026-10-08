"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, Check, X } from "lucide-react";
import type { Property } from "@/lib/cieloterre-data";
import { priceLabel } from "@/lib/format";

const SLOTS = ["Matin", "Après-midi", "Fin de journée"] as const;

export function ViewingModal({
  property,
  open,
  onClose,
}: {
  property: Property;
  open: boolean;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [slot, setSlot] = useState<string>("");
  const [name, setName] = useState("");
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const timer = window.setTimeout(() => firstField.current?.focus(), 30);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
    };
  }, [open, onClose]);

  if (!open) return null;

  const today = new Date().toISOString().split("T")[0];

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (form.get("website")) {
      setStatus("success");
      return;
    }
    if (!property.id) {
      setError("Ce bien ne peut pas recevoir de demande en ligne. Appelez-nous pour organiser la visite.");
      setStatus("error");
      return;
    }
    setStatus("sending");
    setError("");
    const note = String(form.get("message") ?? "").trim();
    const message = [slot && `Créneau souhaité : ${slot}`, note].filter(Boolean).join("\n") || null;
    try {
      const response = await fetch("/api/viewing-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property.id,
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone") || null,
          date: form.get("date") || null,
          message,
          _hp: form.get("website"),
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (response.ok) setStatus("success");
      else {
        setError(json.error || "Impossible d’enregistrer votre demande. Réessayez dans un instant.");
        setStatus("error");
      }
    } catch {
      setError("Connexion impossible. Vérifiez votre réseau et réessayez.");
      setStatus("error");
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="visit-title" className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
      <button type="button" aria-label="Fermer" tabIndex={-1} onClick={onClose} className="absolute inset-0 cursor-default bg-nuit/60 backdrop-blur-[2px]" />
      <div className="relative max-h-[94svh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-chaux p-6 shadow-2xl sm:rounded-2xl sm:p-9">
        <button type="button" onClick={onClose} aria-label="Fermer" className="absolute right-4 top-4 grid size-10 place-items-center rounded-full hover:bg-ombre">
          <X size={20} aria-hidden />
        </button>

        {status === "success" ? (
          <div className="py-10 text-center" role="status">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-olive text-white"><Check size={26} aria-hidden /></span>
            <h2 id="visit-title" className="ct-h3 mt-5">Demande de visite envoyée.</h2>
            <p className="mx-auto mt-3 max-w-sm text-muted">
              {name ? `Merci ${name.split(" ")[0]}. ` : ""}Le conseiller pour « {property.title} » vous contacte pour confirmer le créneau.
            </p>
            <button type="button" onClick={onClose} className="ct-btn ct-btn--dark mt-8">Fermer</button>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-px w-px opacity-0" />
            <p className="flex items-center gap-2 text-sm text-muted"><CalendarDays size={16} aria-hidden /> Visite sur rendez-vous</p>
            <h2 id="visit-title" className="ct-h3 mt-2 pr-10">Visiter {property.title}</h2>
            <p className="ct-num mt-1 text-muted">{property.location}, {property.city} — {priceLabel(property)}</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="vr-name" className="ct-fieldlabel">Nom et prénom</label>
                <input ref={firstField} id="vr-name" name="name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="ct-field" />
              </div>
              <div>
                <label htmlFor="vr-phone" className="ct-fieldlabel">Téléphone</label>
                <input id="vr-phone" name="phone" required type="tel" inputMode="tel" autoComplete="tel" placeholder="+216 …" className="ct-field" />
              </div>
              <div>
                <label htmlFor="vr-email" className="ct-fieldlabel">Email</label>
                <input id="vr-email" name="email" required type="email" autoComplete="email" className="ct-field" />
              </div>
              <div>
                <label htmlFor="vr-date" className="ct-fieldlabel">Jour souhaité</label>
                <input id="vr-date" name="date" type="date" min={today} className="ct-field" />
              </div>
            </div>

            <fieldset className="mt-5">
              <legend className="ct-fieldlabel">Moment de la journée</legend>
              <div className="flex flex-wrap gap-2">
                {SLOTS.map((item) => (
                  <button key={item} type="button" className="ct-chip" aria-pressed={slot === item} onClick={() => setSlot(slot === item ? "" : item)}>
                    {item}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="mt-5">
              <label htmlFor="vr-message" className="ct-fieldlabel">Une question ? (facultatif)</label>
              <textarea id="vr-message" name="message" rows={3} className="ct-field" />
            </div>

            {status === "error" && <p role="alert" className="mt-4 rounded-md bg-error-surface px-4 py-3 text-sm text-error">{error}</p>}

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} className="ct-btn ct-btn--ghost">Annuler</button>
              <button type="submit" disabled={status === "sending"} className="ct-btn ct-btn--primary">
                {status === "sending" ? "Envoi…" : "Demander cette visite"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

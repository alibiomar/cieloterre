"use client";

import { useState, useEffect } from "react";
import { CalendarDays, Check, X } from "lucide-react";
import type { Property } from "@/lib/cieloterre-data";

interface ViewingRequestModalProps {
  property: Property;
  open: boolean;
  onClose: () => void;
}

export function ViewingRequestModal({
  property,
  open,
  onClose,
}: ViewingRequestModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Lock body scroll on open & allow escape key to close
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const todayStr = new Date().toISOString().split("T")[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property.id) {
      setErrorMessage("Identifiant du bien indisponible.");
      setStatus("error");
      return;
    }

    if (website) {
      setStatus("success");
      return;
    }

    setStatus("sending");
    setErrorMessage("");

    try {
      const res = await fetch("/api/viewing-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property.id,
          name,
          email,
          phone: phone || null,
          date: date || null,
          message: message || null,
          _hp: website,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus("success");
      } else {
        setErrorMessage(json.error || "Impossible d'enregistrer votre demande.");
        setStatus("error");
      }
    } catch {
      setErrorMessage("Erreur réseau. Veuillez réessayer.");
      setStatus("error");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="viewing-request-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-earth/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg rounded-3xl border border-cool-light bg-background p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-5 top-5 rounded-full border border-cool-light p-2 text-soft-foreground transition-colors hover:border-primary hover:text-foreground"
        >
          <X size={16} />
        </button>

        {status === "success" ? (
          <div className="py-8 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-surface text-accent">
              <Check size={28} />
            </span>
            <h3 className="mt-5 font-serif text-3xl text-foreground">
              Demande enregistrée
            </h3>
            <p className="mt-3 text-sm leading-6 text-soft-foreground">
              Merci {name}. Notre conseiller pour <strong>{property.title}</strong> prendra contact avec vous afin de convenir du créneau définitif.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-8 inline-flex rounded-full bg-earth px-7 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-accent"
            >
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
            />
            <div className="border-b border-cool-light pb-4">
              <p className="eyebrow flex items-center gap-2">
                <CalendarDays size={14} /> Visite sur rendez-vous
              </p>
              <h2 id="viewing-request-title" className="mt-2 font-serif text-2xl sm:text-3xl text-foreground">
                Découvrir ce bien
              </h2>
              <p className="mt-1 text-xs text-soft-foreground">
                {property.title} · {property.location}, {property.city} · <span className="font-semibold text-primary">{property.price}</span>
              </p>
            </div>

            <div className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="vr-name" className="block text-xs font-semibold text-foreground">
                    Nom & prénom *
                  </label>
                  <input
                    id="vr-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Votre nom"
                    className="field mt-1.5 w-full"
                  />
                </div>
                <div>
                  <label htmlFor="vr-email" className="block text-xs font-semibold text-foreground">
                    Adresse email *
                  </label>
                  <input
                    id="vr-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nom@exemple.com"
                    className="field mt-1.5 w-full"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="vr-phone" className="block text-xs font-semibold text-foreground">
                    Téléphone
                  </label>
                  <input
                    id="vr-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+216 -- --- ---"
                    className="field mt-1.5 w-full"
                  />
                </div>
                <div>
                  <label htmlFor="vr-date" className="block text-xs font-semibold text-foreground">
                    Date souhaitée
                  </label>
                  <input
                    id="vr-date"
                    type="date"
                    min={todayStr}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="field mt-1.5 w-full"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="vr-message" className="block text-xs font-semibold text-foreground">
                  Créneau préféré ou questions (optionnel)
                </label>
                <textarea
                  id="vr-message"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="En matinée, en fin d'après-midi, remarques particulières..."
                  className="field mt-1.5 w-full"
                />
              </div>

              {errorMessage && (
                <p className="text-xs font-medium text-red-600">
                  {errorMessage}
                </p>
              )}
            </div>

            <div className="mt-7 flex items-center justify-end gap-3 border-t border-cool-light pt-5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-cool-light px-5 py-2.5 text-xs font-semibold text-soft-foreground transition-colors hover:text-foreground"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={status === "sending"}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-earth disabled:opacity-60"
              >
                {status === "sending" ? "Envoi en cours..." : "Confirmer ma demande"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

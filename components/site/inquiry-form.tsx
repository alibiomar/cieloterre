"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Check } from "lucide-react";

export type ExtraField = {
  name: string;
  label: string;
  type?: "text" | "number" | "select";
  options?: string[];
  placeholder?: string;
  required?: boolean;
};

type Status = "idle" | "sending" | "success" | "error";

/**
 * Posts to /api/inquiries (rate-limited + honeypot protected server-side).
 * Extra fields are folded into the message so the CRM receives one readable
 * lead without any schema change.
 */
export function InquiryForm({
  title,
  description,
  propertyId,
  topic,
  extraFields = [],
  messageLabel = "Votre projet",
  messagePlaceholder = "Parlez-nous de votre projet en quelques mots",
  submitLabel = "Envoyer ma demande",
  successTitle = "Message envoyé.",
  successText = "Un conseiller vous répond sous un jour ouvré.",
  tone = "card",
  messageRequired = true,
}: {
  title?: string;
  description?: string;
  propertyId?: string;
  topic?: string;
  extraFields?: ExtraField[];
  messageLabel?: string;
  messagePlaceholder?: string;
  submitLabel?: string;
  successTitle?: string;
  successText?: string;
  tone?: "card" | "plain";
  messageRequired?: boolean;
}) {
  const uid = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (form.get("website")) {
      setStatus("success"); // honeypot tripped: pretend success, send nothing
      return;
    }
    setStatus("sending");
    setError("");

    const lines: string[] = [];
    if (topic) lines.push(`Sujet : ${topic}`);
    for (const field of extraFields) {
      const value = String(form.get(field.name) ?? "").trim();
      if (value) lines.push(`${field.label} : ${value}`);
    }
    const free = String(form.get("message") ?? "").trim();
    const message = [...lines, free && (lines.length ? `\n${free}` : free)].filter(Boolean).join("\n") || "Demande de contact";

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          message,
          propertyId: propertyId ?? null,
          _hp: form.get("website"),
        }),
      });
      if (response.ok) {
        setStatus("success");
      } else {
        const json = await response.json().catch(() => ({}));
        setError(json.error || "Impossible d’envoyer votre demande. Vérifiez les champs et réessayez.");
        setStatus("error");
      }
    } catch {
      setError("Connexion impossible. Vérifiez votre réseau et réessayez.");
      setStatus("error");
    }
  }

  const shell = tone === "card" ? "rounded-lg border border-trait bg-chaux p-6 sm:p-8" : "";

  if (status === "success") {
    return (
      <div className={`${shell} py-12 text-center`} role="status">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-olive text-white">
          <Check size={22} aria-hidden />
        </span>
        <h3 className="ct-h3 mt-5">{successTitle}</h3>
        <p className="mx-auto mt-2 max-w-sm text-muted">{successText}</p>
        <Link href="/biens" className="ct-btn ct-btn--ghost ct-btn--sm mt-7">Continuer à explorer</Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={shell} noValidate={false}>
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-px w-px overflow-hidden opacity-0"
      />
      {title && <h2 className="ct-h3">{title}</h2>}
      {description && <p className="mt-2 text-muted">{description}</p>}

      <div className={`${title || description ? "mt-6" : ""} grid gap-4 sm:grid-cols-2`}>
        <div>
          <label className="ct-fieldlabel" htmlFor={`${uid}-name`}>Nom et prénom</label>
          <input id={`${uid}-name`} name="name" required autoComplete="name" className="ct-field" />
        </div>
        <div>
          <label className="ct-fieldlabel" htmlFor={`${uid}-phone`}>Téléphone</label>
          <input id={`${uid}-phone`} name="phone" required type="tel" inputMode="tel" autoComplete="tel" placeholder="+216 …" className="ct-field" />
        </div>
        <div className="sm:col-span-2">
          <label className="ct-fieldlabel" htmlFor={`${uid}-email`}>Email</label>
          <input id={`${uid}-email`} name="email" required type="email" autoComplete="email" className="ct-field" />
        </div>

        {extraFields.map((field) => (
          <div key={field.name}>
            <label className="ct-fieldlabel" htmlFor={`${uid}-${field.name}`}>{field.label}</label>
            {field.type === "select" ? (
              <select id={`${uid}-${field.name}`} name={field.name} required={field.required} defaultValue="" className="ct-field">
                <option value="" disabled={field.required}>Choisir</option>
                {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            ) : (
              <input
                id={`${uid}-${field.name}`}
                name={field.name}
                type={field.type === "number" ? "text" : "text"}
                inputMode={field.type === "number" ? "numeric" : undefined}
                required={field.required}
                placeholder={field.placeholder}
                className="ct-field"
              />
            )}
          </div>
        ))}

        <div className="sm:col-span-2">
          <label className="ct-fieldlabel" htmlFor={`${uid}-message`}>{messageLabel}</label>
          <textarea id={`${uid}-message`} name="message" required={messageRequired} placeholder={messagePlaceholder} className="ct-field" />
        </div>
      </div>

      {status === "error" && (
        <p role="alert" className="mt-4 rounded-md bg-error-surface px-4 py-3 text-sm text-error">{error}</p>
      )}

      <button type="submit" disabled={status === "sending"} className="ct-btn ct-btn--primary mt-6 w-full sm:w-auto">
        {status === "sending" ? "Envoi en cours…" : submitLabel}
      </button>
      <p className="mt-4 text-sm text-muted">
        Vos informations servent uniquement à répondre à votre demande.{" "}
        <Link href="/politique-confidentialite" className="ct-link text-encre">Confidentialité</Link>
      </p>
    </form>
  );
}

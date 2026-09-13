"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function formatPrice(value: number) {
  return (
    new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 0 }).format(value) +
    " DT"
  );
}

export function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-earth/45 p-5"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className={`w-full ${wide ? "max-w-2xl" : "max-w-lg"} rounded-2xl bg-background p-6 shadow-2xl`}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl sm:text-3xl">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-full p-1 text-soft-foreground hover:bg-background"
          >
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmButton({
  label,
  confirmLabel = "Confirmer ?",
  onConfirm,
  className,
}: {
  label: React.ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  className?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (confirming) {
          onConfirm();
          setConfirming(false);
          return;
        }
        setConfirming(true);
        setTimeout(() => setConfirming(false), 2500);
      }}
    >
      {confirming ? confirmLabel : label}
    </button>
  );
}

export const fieldClass =
  "w-full rounded-xl border border-cool-light bg-background px-4 py-2.5 text-sm outline-none focus:border-primary";
export const labelClass =
  "text-xs font-semibold uppercase tracking-wide text-soft-foreground";

const tunisDay = (value?: Date | string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Tunis" }).format(
    typeof value === "string" ? new Date(value) : (value ?? new Date()),
  );

export function crmPageHref(pathname: string, page: number, agencyId?: string | null) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (agencyId) params.set("agencyId", agencyId);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function isOverdueDate(value: string | null, status?: string) {
  if (!value || status === "done" || status === "cancelled" || status === "completed") return false;
  return value.slice(0, 10) < tunisDay();
}

export function isSameTunisDay(value: string | null) {
  if (!value) return false;
  return tunisDay(value) === tunisDay();
}

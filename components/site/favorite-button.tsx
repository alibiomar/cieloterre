"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { useFavorites } from "@/lib/use-favorites";

export function FavoriteButton({
  slug,
  id,
  title,
  variant = "overlay",
}: {
  slug: string;
  id?: string | null;
  title: string;
  variant?: "overlay" | "inline";
}) {
  const { has, toggle } = useFavorites();
  const [busy, setBusy] = useState(false);
  const saved = has(slug);

  const onClick = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (busy) return;
    setBusy(true);
    await toggle(slug, id);
    setBusy(false);
  };

  const label = saved ? `Retirer ${title} des favoris` : `Ajouter ${title} aux favoris`;

  if (variant === "inline") {
    return (
      <button type="button" onClick={onClick} aria-pressed={saved} aria-label={label} className="ct-btn ct-btn--ghost ct-btn--sm">
        <Heart size={16} aria-hidden fill={saved ? "currentColor" : "none"} className={saved ? "text-porte" : ""} />
        {saved ? "Enregistré" : "Enregistrer"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={label}
      className="grid size-11 place-items-center rounded-full bg-surface/95 text-encre shadow-sm backdrop-blur transition-transform hover:scale-105 active:scale-95"
    >
      <Heart size={19} aria-hidden fill={saved ? "var(--c-porte)" : "none"} stroke={saved ? "var(--c-porte)" : "currentColor"} />
    </button>
  );
}

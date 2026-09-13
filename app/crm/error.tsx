"use client";

import { useEffect } from "react";

export default function CrmError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[crm error]", error);
  }, [error]);

  return (
    <div className="rounded-2xl border border-cool-light bg-background p-10 text-center">
      <p className="eyebrow">CRM CieloTerre</p>
      <h2 className="mt-3 font-serif text-2xl">Une erreur est survenue.</h2>
      <p className="mt-2 text-sm text-soft-foreground">
        Cette section n'a pas pu se charger. Réessayez, ou changez de section
        depuis le menu.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
      >
        Réessayer
      </button>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect } from "react";
import { PageShell } from "@/components/site-chrome";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <PageShell innerClassName="grid min-h-[60vh] place-items-center text-center">
      <div>
        <h1 className="ct-display text-[clamp(2.2rem,5vw,4rem)]">Un imprévu est survenu.</h1>
        <p className="mx-auto mt-5 max-w-md text-lg text-muted">Le chargement a échoué. Réessayez, ou revenez à l’accueil.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => reset()} className="ct-btn ct-btn--dark">Réessayer</button>
          <Link href="/" className="ct-btn ct-btn--ghost">Revenir à l’accueil</Link>
        </div>
      </div>
    </PageShell>
  );
}

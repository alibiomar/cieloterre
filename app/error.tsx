"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Header, Footer } from "@/components/site-chrome";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <>
      <Header dark />
      <main className="grid min-h-[60vh] place-items-center bg-background px-6 text-center">
        <div>
          <p className="eyebrow">CieloTerre</p>
          <h1 className="mt-4 font-serif text-5xl text-foreground">
            Un imprévu est survenu.
          </h1>
          <p className="mt-4 text-soft-foreground">
            Notre équipe a été notifiée. Vous pouvez réessayer ou revenir à
            l’accueil.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-full bg-earth px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-accent"
            >
              Réessayer
            </button>
            <Link
              href="/"
              className="rounded-full border border-cool-light px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary"
            >
              Revenir à l’accueil
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

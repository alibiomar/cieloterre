import Link from "next/link";
import { PageShell } from "@/components/site-chrome";

export default function NotFound() {
  return (
    <PageShell innerClassName="grid min-h-[60vh] place-items-center text-center">
      <div>
        <div className="ct-arch mx-auto mb-8 h-28 w-20 border-2 border-b-0 border-ciel bg-ciel-pale" aria-hidden />
        <h1 className="ct-display text-[clamp(2.4rem,6vw,4.5rem)]">Cette porte ne mène nulle part.</h1>
        <p className="mx-auto mt-5 max-w-md text-lg text-muted">La page demandée n’existe plus ou son adresse a changé.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="ct-btn ct-btn--dark">Revenir à l’accueil</Link>
          <Link href="/biens" className="ct-btn ct-btn--ghost">Voir les biens</Link>
        </div>
      </div>
    </PageShell>
  );
}

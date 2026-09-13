import Link from "next/link";
import { Header, Footer } from "@/components/site-chrome";
export default function NotFound() {
  return (
    <>
      <Header dark />
      <main className="grid min-h-[60vh] place-items-center bg-background px-6 text-center">
        <div>
          <p className="eyebrow">CieloTerre</p>
          <h1 className="mt-4 font-serif text-7xl text-foreground">404</h1>
          <p className="mt-4 text-soft-foreground">
            Cette adresse semble avoir changé d’horizon.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex rounded-full bg-earth px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            Revenir à l’accueil
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}

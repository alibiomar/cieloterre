import Link from "next/link";
import { EmptyState } from "@/components/page-sections";
import { PageIntro } from "@/components/property-ui";
import type { Agency } from "@/lib/cieloterre-data";
import { SafeImage as Image } from "@/components/safe-image";

export function AgenciesPageContent({ agencies }: { agencies: Agency[] }) {
  return (
    <div className="mx-auto max-w-[1320px]">
      <PageIntro
        eyebrow="Le réseau CieloTerre"
        title={
          <>
            Des agences <em>ancrées.</em>
          </>
        }
      >
        Retrouvez-nous dans les quartiers et destinations qui dessinent la
        Tunisie d’aujourd’hui.
      </PageIntro>
      {agencies.length ? (
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {agencies.map((agency) => (
            <Link
              href={`/agences/${agency.slug}`}
              key={agency.slug}
              className="luxury-card group overflow-hidden"
            >
              <div className="relative aspect-[1.25] overflow-hidden bg-surface">
                <Image
                  src={agency.image}
                  alt={agency.name}
                  width={900}
                  height={720}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-earth/75 to-transparent p-5 pt-16 text-primary-foreground">
                  <span className="text-xs uppercase tracking-[0.2em]">{agency.city}</span>
                </div>
              </div>
              <div className="p-6">
                <h2 className="mt-2 font-serif text-2xl">{agency.name}</h2>
                <p className="mt-3 text-sm text-soft-foreground">{agency.address}</p>
                {agency.phone && <p className="mt-2 text-sm text-soft-foreground">{agency.phone}</p>}
                <p className="mt-5 text-sm font-semibold text-accent">
                  Découvrir l’agence →
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-12">
          <EmptyState
            title="Notre réseau se prépare."
            text="Les informations de nos agences seront bientôt disponibles."
            href="/contact"
            action="Nous contacter"
          />
        </div>
      )}
    </div>
  );
}

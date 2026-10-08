import Link from "next/link";
import { getPublicAgencies } from "@/lib/supabase/queries";
import { SafeImage } from "@/components/safe-image";
import { ContactBand, EmptyState, PageHeader } from "@/components/site/ui";

export const metadata = { title: "Nos agences en Tunisie" };

export default async function AgenciesPage() {
  const agencies = await getPublicAgencies().catch(() => []);
  return (
    <>
      <PageHeader title="Des agences ancrées dans leur quartier." lede="Retrouvez-nous dans les villes et les quartiers qui dessinent la Tunisie d’aujourd’hui." />
      <section className="ct-wrap pb-24">
        {agencies.length ? (
          <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {agencies.map((agency) => (
              <Link key={agency.slug} href={`/agences/${agency.slug}`} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-ombre">
                  <SafeImage src={agency.image} alt="" fill sizes="(max-width: 640px) 92vw, 30vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:transition-none" />
                </div>
                <p className="mt-5 text-sm text-muted">{agency.city || "Tunisie"}</p>
                <h2 className="mt-1 text-[1.65rem] font-light leading-tight tracking-[-0.025em] group-hover:text-porte">{agency.name}</h2>
                {agency.address && <p className="mt-2 text-muted">{agency.address}</p>}
                <p className="ct-num mt-1 text-muted">{agency.phone}</p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="Notre réseau se prépare." text="Les coordonnées de nos agences seront bientôt disponibles ici. En attendant, écrivez-nous." href="/contact" action="Nous contacter" />
        )}
      </section>
      <ContactBand />
    </>
  );
}

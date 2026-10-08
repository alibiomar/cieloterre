import Link from "next/link";
import { getPublishedProperties, toPropertyCard } from "@/lib/supabase/queries";
import { getCatalogFacets } from "@/lib/supabase/facets";
import { plural, slugifyCity } from "@/lib/format";
import { PropertyGrid } from "@/components/site/property-card";
import { ContactBand, EmptyState, PageHeader } from "@/components/site/ui";

type Params = { city: string };

const fromSlug = (value: string) => value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

async function resolveCity(slug: string): Promise<string> {
  const facets = await getCatalogFacets();
  return facets.cities.find((city) => slugifyCity(city.name) === slug)?.name ?? fromSlug(slug);
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const city = await resolveCity((await params).city);
  const description = `Appartements, villas et programmes neufs à ${city} : la sélection CieloTerre, présentée par des conseillers qui connaissent le quartier.`;
  return {
    title: `Immobilier à ${city} : appartements, villas, neuf`,
    description,
    openGraph: { title: `Immobilier à ${city} | CieloTerre`, description },
  };
}

export default async function CityPage({ params }: { params: Promise<Params> }) {
  const city = await resolveCity((await params).city);
  const properties = (await getPublishedProperties({ city, limit: 60 }).catch(() => [])).map(toPropertyCard);

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Biens", href: "/biens" }, { label: city }]}
        title={`Vivre à ${city}.`}
        lede={properties.length ? `${properties.length} ${plural(properties.length, "bien disponible", "biens disponibles")} à ${city}, avec les conseils de nos agents sur le quartier.` : `Aucun bien publié à ${city} pour le moment.`}
      />
      <section className="ct-wrap pb-24">
        {properties.length ? (
          <>
            <PropertyGrid items={properties} />
            <p className="mt-14 text-center">
              <Link href={`/biens?ville=${encodeURIComponent(city)}`} className="ct-link text-base font-medium text-porte">Affiner par budget, type ou équipements</Link>
            </p>
          </>
        ) : (
          <EmptyState title={`Bientôt à ${city}.`} text="Nos conseillers peuvent vous prévenir dès qu’une adresse se libère dans ce quartier." href="/contact" action="Être prévenu" />
        )}
      </section>
      <ContactBand title={`Un projet à ${city} ?`} />
    </>
  );
}

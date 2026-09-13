import { PageShell } from "@/components/site-chrome";
import { CityPageContent } from "@/components/immobilier/city-page-content";
import { getPublishedProperties, toPropertyCard } from "@/lib/supabase/queries";

const titleForCity = (value: string) =>
  value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const city = titleForCity((await params).city);
  return {
    title: `Immobilier à ${city} : Biens d'exception & Propriétés de luxe | CieloTerre`,
    description: `Découvrez notre sélection de biens immobiliers à ${city} (appartements, villas, programmes neufs). Des adresses attentives sélectionnées par CieloTerre.`,
    openGraph: {
      title: `Immobilier à ${city} | CieloTerre`,
      description: `Découvrez notre sélection de biens immobiliers à ${city} avec CieloTerre.`,
    },
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const city = titleForCity((await params).city);
  const properties = (await getPublishedProperties({ city })).map(
    toPropertyCard,
  );

  return (
    <PageShell>
      <CityPageContent city={city} properties={properties} />
    </PageShell>
  );
}

import { PageIntro, PropertyGrid } from "@/components/property-ui";
import type { Property } from "@/lib/cieloterre-data";

export function CityPageContent({
  city,
  properties,
}: {
  city: string;
  properties: Property[];
}) {
  return (
    <div className="mx-auto max-w-[1320px]">
      <PageIntro
        eyebrow="Immobilier en Tunisie"
        title={
          <>
            Vivre à <em>{city}.</em>
          </>
        }
      >
        Découvrez nos biens disponibles et les quartiers qui composent cette
        destination.
      </PageIntro>
      <section className="mt-12">
        {properties.length ? (
          <PropertyGrid items={properties} />
        ) : (
          <div className="luxury-card p-12">
            <h2 className="font-serif text-3xl">Bientôt à {city}.</h2>
            <p className="mt-3 text-soft-foreground">
              Nos conseillers peuvent vous alerter dès qu’une adresse se libère.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

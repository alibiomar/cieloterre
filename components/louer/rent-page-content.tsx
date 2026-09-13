import { PageIntro, PropertyGrid } from "@/components/property-ui";
import type { Property } from "@/lib/cieloterre-data";

export function RentPageContent({ properties }: { properties: Property[] }) {
  return (
    <>
      <PageIntro
        eyebrow="Louer en Tunisie"
        title={
          <>
            Une adresse à <em>habiter.</em>
          </>
        }
      >
        Des appartements, maisons et villas à louer, visités et présentés avec
        transparence.
      </PageIntro>
      <section className="mt-12">
        <PropertyGrid items={properties} />
      </section>
    </>
  );
}

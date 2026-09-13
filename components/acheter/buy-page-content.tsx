import { LeadForm, PageIntro, PropertyGrid } from "@/components/property-ui";
import { ContactBanner } from "@/components/page-sections";
import type { Property } from "@/lib/cieloterre-data";

export function BuyPageContent({ properties }: { properties: Property[] }) {
  return (
    <>
      <PageIntro
        eyebrow="Acheter en Tunisie"
        title={
          <>
            Votre prochain <em>horizon.</em>
          </>
        }
      >
        Notre équipe vous accompagne de la première visite à la remise des clés,
        avec une sélection qui privilégie la justesse plutôt que le volume.
      </PageIntro>

      <section className="mt-12">
        <PropertyGrid items={properties} featuredFirst />
      </section>

      <section className="mt-20 grid gap-10 lg:grid-cols-2">
        <ContactBanner
          title="Parlons de ce qui vous ressemble."
          text="Dites-nous où vous souhaitez vivre et nous reviendrons vers vous avec les premières pistes."
        />
        <LeadForm title="Être accompagné" />
      </section>
    </>
  );
}

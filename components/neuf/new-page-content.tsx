import { PageIntro, PropertyGrid } from "@/components/property-ui";
import type { Property } from "@/lib/cieloterre-data";

export function NewPageContent({ properties }: { properties: Property[] }) {
  return (
    <>
      <PageIntro
        eyebrow="Programmes neufs"
        title={
          <>
            Les adresses de <em>demain.</em>
          </>
        }
      >
        Des résidences pensées pour les nouveaux usages, les nouvelles mobilités
        et une autre idée du confort.
      </PageIntro>
      <section className="mt-12">
        <PropertyGrid items={properties} />
      </section>
    </>
  );
}

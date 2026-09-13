import { FeatureGrid } from "@/components/page-sections";
import { LeadForm, PageIntro } from "@/components/property-ui";

const steps = [
  {
    title: "Évaluer",
    text: "Un regard juste sur votre bien et son marché.",
  },
  {
    title: "Raconter",
    text: "Des images et mots qui donnent envie de venir.",
  },
  {
    title: "Négocier",
    text: "Une présence attentive jusqu’à la signature.",
  },
];

export function SellPageContent() {
  return (
    <div className="grid gap-14 lg:grid-cols-[1fr_.8fr] lg:items-center">
      <div>
        <PageIntro
          eyebrow="Vendre avec CieloTerre"
          title={
            <>
              Votre propriété mérite plus qu’une <em>annonce.</em>
            </>
          }
        >
          Une stratégie, une présentation soignée et un accompagnement
          professionnel pour vendre dans les meilleures conditions.
        </PageIntro>
        <div className="mt-10">
          <FeatureGrid items={steps} />
        </div>
      </div>
      <LeadForm title="Estimer mon bien" />
    </div>
  );
}

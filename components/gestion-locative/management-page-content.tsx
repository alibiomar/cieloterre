import { FeatureGrid } from "@/components/page-sections";
import { LeadForm, PageIntro } from "@/components/property-ui";

const services = [
  {
    title: "Louer",
    text: "Trouver le bon locataire grâce à une présentation précise et une diffusion ciblée.",
  },
  {
    title: "Gérer",
    text: "Coordonner les interventions et garder un œil attentif sur chaque détail.",
  },
  {
    title: "Valoriser",
    text: "Vous conseiller dans la durée pour faire grandir la valeur de votre bien.",
  },
];

export function ManagementPageContent() {
  return (
    <>
      <PageIntro
        eyebrow="Gestion locative"
        title={
          <>
            Votre bien, entre de <em>bonnes mains.</em>
          </>
        }
      >
        De la recherche du locataire au suivi quotidien, nous prenons soin de
        votre patrimoine comme d’un lieu de vie.
      </PageIntro>
      <section className="mt-14">
        <FeatureGrid items={services} />
      </section>
      <section className="mx-auto mt-20 max-w-xl">
        <LeadForm title="Confier mon bien" />
      </section>
    </>
  );
}

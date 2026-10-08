import { PageHeader } from "@/components/site/ui";

export const metadata = { title: "Conditions d’utilisation" };

export default function ConditionsPage() {
  return (
    <>
      <PageHeader title="Conditions d’utilisation." lede="Les règles qui encadrent l’usage du site CieloTerre." />
      <div className="ct-wrap pb-24">
        <div className="max-w-2xl space-y-10 border-t border-trait pt-10">
          <section>
            <h2 className="ct-h3">Usage du site</h2>
            <p className="ct-read mt-3 text-encre/85">L’utilisation de CieloTerre implique l’acceptation de ces conditions. Le site est destiné à la recherche d’informations immobilières et à la prise de contact avec nos conseillers.</p>
          </section>
          <section>
            <h2 className="ct-h3">Annonces et disponibilités</h2>
            <p className="ct-read mt-3 text-encre/85">Les annonces sont publiées par nos agences et conseillers. Prix, surfaces et disponibilités sont susceptibles d’évoluer ; ils doivent être vérifiés auprès de nos équipes.</p>
          </section>
          <section>
            <h2 className="ct-h3">Demandes envoyées</h2>
            <p className="ct-read mt-3 text-encre/85">Les formulaires de contact et de visite ne constituent pas un engagement. Un conseiller vous recontacte pour confirmer les informations et les créneaux.</p>
          </section>
        </div>
      </div>
    </>
  );
}

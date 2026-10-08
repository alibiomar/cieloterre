import { PageHeader } from "@/components/site/ui";

export const metadata = { title: "Politique de confidentialité" };

export default function PolitiqueConfidentialitePage() {
  return (
    <>
      <PageHeader title="Politique de confidentialité." lede="Ce que nous faisons de vos informations, et ce que nous ne faisons pas." />
      <div className="ct-wrap pb-24">
        <div className="max-w-2xl space-y-10 border-t border-trait pt-10">
          <section>
            <h2 className="ct-h3">Les informations que nous collectons</h2>
            <p className="ct-read mt-3 text-encre/85">Lorsque vous remplissez un formulaire (contact, question sur un bien, demande de visite, estimation), nous recevons votre nom, votre email, votre téléphone et votre message.</p>
          </section>
          <section>
            <h2 className="ct-h3">Pourquoi nous les utilisons</h2>
            <p className="ct-read mt-3 text-encre/85">Uniquement pour répondre à votre demande et vous accompagner dans votre projet. Aucune donnée n’est vendue ni partagée à des fins publicitaires.</p>
          </section>
          <section>
            <h2 className="ct-h3">Vos favoris</h2>
            <p className="ct-read mt-3 text-encre/85">La liste de vos biens favoris est enregistrée sur votre appareil. Elle n’est associée à un compte que si vous êtes connecté.</p>
          </section>
          <section>
            <h2 className="ct-h3">Mesure d’audience</h2>
            <p className="ct-read mt-3 text-encre/85">Nous mesurons la fréquentation du site de façon agrégée pour améliorer son fonctionnement.</p>
          </section>
          <section>
            <h2 className="ct-h3">Vos droits</h2>
            <p className="ct-read mt-3 text-encre/85">Vous pouvez demander l’accès, la rectification ou la suppression de vos données en écrivant à contact@cieloterre.tn.</p>
          </section>
        </div>
      </div>
    </>
  );
}

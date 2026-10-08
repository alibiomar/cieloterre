import { PageHeader } from "@/components/site/ui";

export const metadata = { title: "Mentions légales" };

export default function MentionsLegalesPage() {
  return (
    <>
      <PageHeader title="Mentions légales." lede="Les informations éditoriales et légales du site CieloTerre." />
      <div className="ct-wrap pb-24">
        <div className="max-w-2xl space-y-10 border-t border-trait pt-10">
          <section>
            <h2 className="ct-h3">Éditeur du site</h2>
            <p className="ct-read mt-3 text-encre/85">CieloTerre, plateforme immobilière en Tunisie. Contact : contact@cieloterre.tn, +216 71 740 100.</p>
          </section>
          <section>
            <h2 className="ct-h3">Responsabilité</h2>
            <p className="ct-read mt-3 text-encre/85">Les informations présentées (prix, surfaces, disponibilités) sont indicatives et peuvent évoluer. Elles doivent être confirmées auprès d’un conseiller CieloTerre avant toute décision.</p>
          </section>
          <section>
            <h2 className="ct-h3">Propriété intellectuelle</h2>
            <p className="ct-read mt-3 text-encre/85">Les textes, photographies, logos et éléments graphiques de ce site sont la propriété de CieloTerre ou de leurs auteurs. Toute reproduction sans autorisation est interdite.</p>
          </section>
          <section>
            <h2 className="ct-h3">Données personnelles</h2>
            <p className="ct-read mt-3 text-encre/85">Le traitement de vos données est décrit dans notre politique de confidentialité.</p>
          </section>
        </div>
      </div>
    </>
  );
}

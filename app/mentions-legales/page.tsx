import { PageShell } from "@/components/site-chrome";
import { PageIntro } from "@/components/property-ui";
export const metadata = {
  title: "Mentions légales | CieloTerre",
  description: "Informations légales de CieloTerre.",
};
export default function LegalPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-[900px]">
        <PageIntro
          eyebrow="CieloTerre"
          title={
            <>
              Mentions <em>légales.</em>
            </>
          }
        >
          Les informations éditoriales et légales de la plateforme CieloTerre.
        </PageIntro>
        <div className="mt-12 space-y-8 rounded-2xl bg-background p-6 text-sm leading-7 text-soft-foreground shadow-sm sm:p-10">
          <section>
            <h2 className="font-serif text-2xl text-foreground">
              Éditeur du site
            </h2>
            <p className="mt-3">
              CieloTerre — plateforme immobilière en Tunisie. Contact :
              contact@cieloterre.tn.
            </p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-foreground">
              Responsabilité
            </h2>
            <p className="mt-3">
              Les informations présentées sont indicatives et doivent être
              confirmées auprès de notre équipe avant toute décision.
            </p>
          </section>
        </div>
      </div>
    </PageShell>
  );
}

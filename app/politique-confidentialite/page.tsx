import { PageShell } from "@/components/site-chrome";
export const metadata = { title: "Politique de confidentialité | CieloTerre" };
export default function PrivacyPage() {
  return (
    <PageShell>
      <article className="mx-auto max-w-[850px] rounded-2xl bg-background p-6 shadow-sm sm:p-10">
        <p className="eyebrow">CieloTerre</p>
        <h1 className="section-title mt-3">
          Politique de <em>confidentialité.</em>
        </h1>
        <p className="mt-8 text-sm leading-7 text-soft-foreground">
          Nous utilisons les informations transmises via nos formulaires
          uniquement pour répondre à votre demande. Aucune donnée n'est vendue
          ni partagée à des fins publicitaires.
        </p>
      </article>
    </PageShell>
  );
}

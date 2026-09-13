import { PageShell } from "@/components/site-chrome";
export const metadata = { title: "Conditions d’utilisation | CieloTerre" };
export default function TermsPage() {
  return (
    <PageShell>
      <article className="mx-auto max-w-[850px] rounded-2xl bg-background p-6 shadow-sm sm:p-10">
        <p className="eyebrow">CieloTerre</p>
        <h1 className="section-title mt-3">
          Conditions <em>d’utilisation.</em>
        </h1>
        <p className="mt-8 text-sm leading-7 text-soft-foreground">
          L'utilisation de CieloTerre implique l'acceptation de ces conditions.
          Les annonces et disponibilités sont susceptibles d'évoluer et doivent
          être vérifiées auprès de nos conseillers.
        </p>
      </article>
    </PageShell>
  );
}

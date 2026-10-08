import { InquiryForm } from "@/components/site/inquiry-form";
import { PageHeader } from "@/components/site/ui";

export const metadata = { title: "Vendre votre bien en Tunisie", description: "Estimation, mise en valeur et négociation : CieloTerre vous accompagne pour vendre votre bien dans les meilleures conditions." };

const STEPS = [
  { title: "Évaluer", text: "Nous visitons le bien, étudions les ventes récentes du quartier et vous proposons un prix argumenté." },
  { title: "Raconter", text: "Photographies soignées, description précise, diffusion ciblée : votre bien est présenté pour ce qu’il est." },
  { title: "Négocier", text: "Nous organisons les visites, filtrons les acquéreurs et restons à vos côtés jusqu’à la signature." },
];

export default function SellPage() {
  return (
    <>
      <PageHeader title="Votre bien mérite plus qu’une annonce." lede="Une stratégie de prix, une présentation soignée et un conseiller dédié pour vendre dans de bonnes conditions." />
      <div className="ct-wrap grid gap-14 pb-24 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
        <ol className="border-t border-trait">
          {STEPS.map((step, index) => (
            <li key={step.title} className="grid gap-4 border-b border-trait py-9 sm:grid-cols-[4.5rem_1fr] sm:py-11">
              <span className="ct-num text-[2.6rem] font-light leading-none text-ciel">{index + 1}</span>
              <div>
                <h2 className="text-[clamp(1.6rem,2.6vw,2.2rem)] font-light tracking-[-0.025em]">{step.title}</h2>
                <p className="mt-3 max-w-lg text-lg leading-relaxed text-muted">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <div id="estimation" className="scroll-mt-28 lg:sticky lg:top-28 lg:self-start">
          <InquiryForm
            title="Estimer mon bien"
            description="Quelques informations suffisent pour que nous vous rappelions avec une première estimation."
            topic="Estimation d’un bien à vendre"
            extraFields={[
              { name: "type", label: "Type de bien", type: "select", required: true, options: ["Appartement", "Villa", "Maison", "Terrain", "Local commercial", "Autre"] },
              { name: "ville", label: "Ville ou quartier", required: true, placeholder: "La Marsa, Lac 2…" },
              { name: "surface", label: "Surface en m²", type: "number", placeholder: "120" },
              { name: "prix", label: "Prix souhaité en TND", type: "number", placeholder: "Facultatif" },
            ]}
            messageLabel="Précisions"
            messagePlaceholder="Étage, état général, année de construction, situation juridique…"
            messageRequired={false}
            submitLabel="Demander une estimation"
            successTitle="Demande d’estimation envoyée."
            successText="Un conseiller vous rappelle pour fixer un rendez-vous sur place."
          />
        </div>
      </div>
    </>
  );
}

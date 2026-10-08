import { InquiryForm } from "@/components/site/inquiry-form";
import { PageHeader } from "@/components/site/ui";

export const metadata = { title: "Gestion locative en Tunisie", description: "Confiez la location de votre bien à CieloTerre : recherche du locataire, suivi quotidien et conseils pour valoriser votre patrimoine." };

const SERVICES = [
  { title: "Louer", text: "Nous trouvons le bon locataire grâce à une présentation précise du bien et une diffusion ciblée." },
  { title: "Gérer", text: "Nous coordonnons les interventions, suivons les loyers et gardons un œil attentif sur chaque détail." },
  { title: "Valoriser", text: "Nous vous conseillons dans la durée pour préserver et faire grandir la valeur de votre bien." },
];

export default function ManagementPage() {
  return (
    <>
      <PageHeader title="Votre bien, entre de bonnes mains." lede="De la recherche du locataire au suivi quotidien, nous prenons soin de votre patrimoine comme d’un lieu de vie." />
      <div className="ct-wrap grid gap-14 pb-24 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
        <div className="border-t border-trait">
          {SERVICES.map((service) => (
            <section key={service.title} className="border-b border-trait py-9 sm:py-11">
              <h2 className="text-[clamp(1.6rem,2.6vw,2.2rem)] font-light tracking-[-0.025em]">{service.title}</h2>
              <p className="mt-3 max-w-lg text-lg leading-relaxed text-muted">{service.text}</p>
            </section>
          ))}
        </div>
        <div className="lg:sticky lg:top-28 lg:self-start">
          <InquiryForm
            title="Confier mon bien"
            topic="Gestion locative"
            extraFields={[
              { name: "type", label: "Type de bien", type: "select", required: true, options: ["Appartement", "Villa", "Maison", "Local commercial", "Autre"] },
              { name: "ville", label: "Ville ou quartier", required: true },
              { name: "loyer", label: "Loyer visé en TND / mois", type: "number", placeholder: "Facultatif" },
            ]}
            messageLabel="Précisions"
            messagePlaceholder="Meublé ou non, disponibilité, attentes particulières…"
            messageRequired={false}
            submitLabel="Être rappelé"
          />
        </div>
      </div>
    </>
  );
}

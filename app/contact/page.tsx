import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { SITE } from "@/lib/site-config";
import { InquiryForm } from "@/components/site/inquiry-form";
import { PageHeader } from "@/components/site/ui";

export const metadata = { title: "Contacter CieloTerre", description: "Écrivez ou appelez un conseiller CieloTerre pour acheter, louer, vendre ou confier un bien en Tunisie." };

export default function ContactPage() {
  return (
    <>
      <PageHeader title="Parlons de votre prochaine adresse." lede="Que vous cherchiez, vendiez ou confiez un bien, un conseiller vous répond avec discernement et discrétion." />
      <div className="ct-wrap grid gap-14 pb-24 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
        <div>
          <ul className="space-y-6">
            <li className="flex gap-4">
              <Phone aria-hidden className="mt-1 shrink-0 text-porte" />
              <div>
                <p className="text-sm text-muted">Téléphone</p>
                <a href={SITE.phoneHref} className="ct-link ct-num text-2xl font-light tracking-tight">{SITE.phone}</a>
              </div>
            </li>
            <li className="flex gap-4">
              <Mail aria-hidden className="mt-1 shrink-0 text-porte" />
              <div>
                <p className="text-sm text-muted">Email</p>
                <a href={`mailto:${SITE.email}`} className="ct-link text-2xl font-light tracking-tight">{SITE.email}</a>
              </div>
            </li>
            <li className="flex gap-4">
              <Clock aria-hidden className="mt-1 shrink-0 text-porte" />
              <div>
                <p className="text-sm text-muted">Horaires</p>
                <p className="text-lg">{SITE.hours}</p>
              </div>
            </li>
          </ul>

          <h2 className="ct-h3 mt-16">Nos bureaux</h2>
          <ul className="mt-6 divide-y divide-trait border-y border-trait">
            {SITE.offices.map((office) => (
              <li key={office.city} className="flex gap-4 py-5">
                <MapPin size={20} aria-hidden className="mt-1 shrink-0 text-muted" />
                <div>
                  <p className="text-lg font-medium">{office.city}</p>
                  <p className="mt-1 text-muted">{office.address}</p>
                  <a href={`tel:${office.phone.replace(/\s/g, "")}`} className="ct-link ct-num mt-1 inline-block text-muted hover:text-encre">{office.phone}</a>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:sticky lg:top-28 lg:self-start">
          <InquiryForm
            title="Écrire à notre équipe"
            description="Dites-nous ce que vous cherchez, nous vous répondons sous un jour ouvré."
            extraFields={[
              { name: "sujet", label: "Votre demande", type: "select", required: true, options: ["Acheter un bien", "Louer un bien", "Vendre un bien", "Confier un bien en gestion", "Autre question"] },
            ]}
            messagePlaceholder="Ville, budget, type de bien, délais…"
          />
        </div>
      </div>
    </>
  );
}

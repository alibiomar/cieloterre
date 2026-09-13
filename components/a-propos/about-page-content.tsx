import { ContactBanner } from "@/components/page-sections";
import { LeadForm, PageIntro } from "@/components/property-ui";
import Image from "next/image";

export function AboutPageContent() {
  return (
    <div className="mx-auto max-w-330">
      <PageIntro
        eyebrow="CieloTerre"
        title={
          <>
            L’immobilier, <em>autrement.</em>
          </>
        }
      >
        Nous croyons qu’un bien est d’abord une adresse à vivre, une lumière,
        une histoire qui commence.
      </PageIntro>
      <section className="mt-16 grid gap-8 lg:grid-cols-2 lg:items-center">
        <Image
          src="/cieloterre-hero.png"
          alt="Architecture méditerranéenne"
          width={1200}
          height={1000}
          className="aspect-[1.2] w-full rounded-2xl object-cover shadow-[0_24px_60px_rgba(18,59,58,.12)]"
        />
        <div className="rounded-2xl bg-earth p-8 text-primary-foreground lg:p-12">
          <p className="eyebrow text-accent">Notre manière de faire</p>
          <h2 className="mt-4 font-serif text-4xl">
            Plus claire. Plus humaine. Plus attentive.
          </h2>
          <p className="mt-6 leading-8 text-primary-foreground/65">
            CieloTerre rassemble des experts du marché tunisien autour d’une
            idée simple : prendre le temps de bien faire les choses.
            Sélectionner moins, raconter mieux, accompagner vraiment.
          </p>
        </div>
      </section>
      <section className="mx-auto mt-20 max-w-xl">
        <LeadForm title="Parlons de votre projet" />
      </section>
      <section className="mt-20">
        <ContactBanner title="Une adresse à imaginer ensemble." />
      </section>
    </div>
  );
}

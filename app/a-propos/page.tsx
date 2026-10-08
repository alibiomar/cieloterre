import Link from "next/link";
import { SafeImage } from "@/components/safe-image";
import { ContactBand, PageHeader } from "@/components/site/ui";

export const metadata = { title: "À propos de CieloTerre", description: "CieloTerre rassemble des experts du marché tunisien autour d’une idée simple : prendre le temps de bien faire les choses." };

const PRINCIPLES = [
  { title: "Sélectionner moins", text: "Nous publions peu de biens, mais chacun a été vu, compris et situé. Un catalogue court est un catalogue fiable." },
  { title: "Raconter mieux", text: "La lumière, l’orientation, la vie du quartier : ce qu’une fiche technique ne dit pas, nous le mettons en mots et en images." },
  { title: "Accompagner vraiment", text: "Un seul interlocuteur, des réponses claires, une présence réelle jusqu’à la remise des clés ou la signature du bail." },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader title="L’immobilier, autrement." lede="Nous croyons qu’un bien est d’abord une adresse à vivre : une lumière, un quartier, une histoire qui commence." />

      <section className="ct-wrap grid gap-12 pb-24 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-20">
        <div className="ct-arch relative mx-auto aspect-[4/5] w-full max-w-md bg-ciel-pale lg:mx-0">
          <SafeImage src="/cieloterre-hero.png" alt="Terrasse blanche et porte bleue donnant sur la mer en Tunisie" fill sizes="(max-width: 1024px) 90vw, 34vw" className="object-cover" />
        </div>
        <div>
          <h2 className="ct-h2 max-w-xl">Prendre le temps de bien faire les choses.</h2>
          <p className="ct-lede mt-6 max-w-xl">
            CieloTerre rassemble des experts du marché tunisien autour d’une idée simple. Le nom dit la méthode : regarder le ciel, la lumière et l’horizon autant que la terre, les murs et le prix.
          </p>
          <p className="mt-8">
            <Link href="/agents" className="ct-link text-base font-medium text-porte">Rencontrer l’équipe</Link>
          </p>
        </div>
      </section>

      <section className="on-dark bg-nuit text-white">
        <div className="ct-wrap grid gap-12 py-20 md:grid-cols-3 md:gap-10 md:py-28">
          {PRINCIPLES.map((item) => (
            <div key={item.title}>
              <h3 className="text-[clamp(1.7rem,2.6vw,2.3rem)] font-light tracking-[-0.025em]">{item.title}</h3>
              <p className="mt-4 text-lg leading-relaxed text-white/75">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <ContactBand title="Une adresse à imaginer ensemble." />
    </>
  );
}

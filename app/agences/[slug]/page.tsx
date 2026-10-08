import { notFound } from "next/navigation";
import { Globe, Mail, MapPin, Phone } from "lucide-react";
import { getPublicAgencyBySlug } from "@/lib/supabase/queries";
import { SafeImage } from "@/components/safe-image";
import { InquiryForm } from "@/components/site/inquiry-form";
import { Breadcrumbs } from "@/components/site/ui";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const agency = await getPublicAgencyBySlug((await params).slug);
  if (!agency) return { title: "Agence immobilière" };
  const description = agency.description || `Découvrez l’agence ${agency.name}${agency.city ? ` à ${agency.city}` : ""}.`;
  return {
    title: `${agency.name}, agence immobilière${agency.city ? ` à ${agency.city}` : ""}`,
    description,
    openGraph: { title: `${agency.name} | CieloTerre`, description, images: agency.image ? [{ url: agency.image }] : [] },
  };
}

export default async function AgencyPage({ params }: { params: Promise<Params> }) {
  const agency = await getPublicAgencyBySlug((await params).slug);
  if (!agency) notFound();

  return (
    <div className="ct-wrap pb-24 pt-28 md:pt-36">
      <Breadcrumbs items={[{ label: "Agences", href: "/agences" }, { label: agency.name }]} />
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-20">
        <div className="ct-arch relative mx-auto aspect-[4/5] w-full max-w-md bg-ombre lg:mx-0">
          <SafeImage src={agency.image} alt={agency.name} fill preload sizes="(max-width: 1024px) 90vw, 36vw" className="object-cover" />
        </div>
        <div>
          <p className="ct-label">{agency.city || "Notre agence"}</p>
          <h1 className="ct-display mt-3 text-[clamp(2.4rem,5.5vw,4.6rem)]">{agency.name}</h1>
          <p className="ct-lede mt-6 max-w-xl">
            {agency.description && agency.description !== agency.city ? agency.description : `Une équipe de conseillers vous accueille${agency.city ? ` au cœur de ${agency.city}` : ""}.`}
          </p>
          <ul className="mt-9 space-y-3 border-y border-trait py-6 text-lg">
            {agency.address && <li className="flex gap-3"><MapPin size={20} aria-hidden className="mt-1 shrink-0 text-muted" />{agency.address}</li>}
            {agency.phone && <li className="flex gap-3"><Phone size={20} aria-hidden className="mt-1 shrink-0 text-muted" /><a href={`tel:${agency.phone.replace(/\s/g, "")}`} className="ct-link ct-num">{agency.phone}</a></li>}
            {agency.email && <li className="flex gap-3"><Mail size={20} aria-hidden className="mt-1 shrink-0 text-muted" /><a href={`mailto:${agency.email}`} className="ct-link">{agency.email}</a></li>}
            {agency.website && <li className="flex gap-3"><Globe size={20} aria-hidden className="mt-1 shrink-0 text-muted" /><a href={agency.website} target="_blank" rel="noreferrer" className="ct-link">{agency.website.replace(/^https?:\/\//, "")}</a></li>}
          </ul>
          <a href="#contact" className="ct-btn ct-btn--primary mt-8">Écrire à l’agence</a>
        </div>
      </div>
      <div id="contact" className="mx-auto mt-24 max-w-2xl scroll-mt-28">
        <InquiryForm title={`Écrire à ${agency.name}`} topic={`Agence ${agency.name}`} />
      </div>
    </div>
  );
}

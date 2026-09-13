import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/site-chrome";
import { Breadcrumbs, LeadForm } from "@/components/property-ui";
import { getPublicAgencies, getPublicAgencyBySlug } from "@/lib/supabase/queries";
import Image from "next/image";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const agency = await getPublicAgencyBySlug((await params).slug);
  if (!agency) {
    return { title: "Agence immobilière | CieloTerre" };
  }
  return {
    title: `${agency.name} – Agence immobilière ${agency.city} | CieloTerre`,
    description: agency.description || `Découvrez l'agence ${agency.name} à ${agency.city}. ${agency.agents} conseillers à votre service.`,
    openGraph: {
      title: `${agency.name} | CieloTerre`,
      description: agency.description || `Agence immobilière à ${agency.city}`,
      images: agency.image ? [{ url: agency.image }] : [],
    },
  };
}

export default async function AgencyDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const agency = await getPublicAgencyBySlug((await params).slug);
  if (!agency) notFound();
  return (
    <>
      <Header dark />
      <main className="bg-background px-6 pb-24 pt-32 lg:px-10">
        <div className="mx-auto max-w-[1100px]">
          <Breadcrumbs items={["Agences", agency.city, agency.name]} />
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <Image
              src={agency.image}
              alt={agency.name}
              width={900}
              height={820}
              className="aspect-[1.1] w-full rounded-2xl object-cover"
            />
            <div>
              <p className="eyebrow">Notre agence</p>
              <h1 className="section-title">{agency.name}</h1>
              <p className="mt-6 leading-7 text-soft-foreground">
                {agency.description || `Une équipe de ${agency.agents} conseillers vous accueille au cœur de ${agency.city}.`}
              </p>
              <div className="mt-8 border-y border-cool-light py-5 text-sm leading-7 text-soft-foreground">
                <p>{agency.address}</p>
                {agency.phone && <a href={`tel:${agency.phone}`} className="block hover:text-primary">{agency.phone}</a>}
                {agency.email && <a href={`mailto:${agency.email}`} className="block hover:text-primary">{agency.email}</a>}
                {agency.website && <a href={agency.website} target="_blank" rel="noreferrer" className="block hover:text-primary">{agency.website}</a>}
              </div>
              <a
                href="#contact"
                className="mt-8 inline-flex rounded-full bg-earth px-6 py-3 text-sm font-semibold text-primary-foreground"
              >
                Contacter l’agence
              </a>
            </div>
          </div>
          <div id="contact" className="mx-auto mt-20 max-w-xl">
            <LeadForm title="Écrire à l’agence" />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, MapPin } from "lucide-react";
import { getPropertyBySlug, getPublishedProperties, toPropertyCard } from "@/lib/supabase/queries";
import { formatNumber, mapsHref, pricePerSqm, priceLabel } from "@/lib/format";
import { SITE } from "@/lib/site-config";
import { serializeJsonLd } from "@/lib/security/json-ld";
import { Gallery } from "@/components/site/gallery";
import { InquiryForm } from "@/components/site/inquiry-form";
import { MortgageEstimate } from "@/components/site/mortgage";
import { PropertyActions } from "@/components/site/property-actions";
import { PropertyGrid, TransactionTag } from "@/components/site/property-card";
import { Breadcrumbs, Fact } from "@/components/site/ui";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const row = await getPropertyBySlug(slug);
  if (!row) return { title: "Bien immobilier" };
  const property = toPropertyCard(row);
  const description =
    property.description?.slice(0, 160) ||
    `${property.type} ${property.transaction.toLowerCase()} à ${property.location}, ${property.city}. ${priceLabel(property)}.`;
  return {
    title: `${property.title}, ${property.city}`,
    description,
    alternates: { canonical: `/biens/${encodeURIComponent(property.slug)}` },
    openGraph: {
      title: `${property.title} – ${priceLabel(property)}`,
      description,
      images: property.image ? [{ url: property.image }] : [],
    },
  };
}

function guessAgentName(agent: Record<string, unknown> | null): string {
  if (!agent) return "Votre conseiller CieloTerre";
  const named = typeof agent.name === "string" ? agent.name.trim() : "";
  if (named) return named;
  const fromSlug = String(agent.slug ?? "")
    .replace(/-[a-z0-9]{1,8}$/i, "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  return fromSlug || "Votre conseiller CieloTerre";
}

const SECTION_BY_TRANSACTION = {
  "À vendre": { label: "Acheter", href: "/acheter" },
  "À louer": { label: "Louer", href: "/louer" },
  Neuf: { label: "Neuf", href: "/neuf" },
} as const;

export default async function PropertyPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const row = await getPropertyBySlug(slug);
  if (!row) notFound();

  const property = toPropertyCard(row);
  const images = property.images?.length ? property.images : [property.image];
  const agentRow = (row.agents ?? null) as Record<string, unknown> | null;
  const agent = {
    name: guessAgentName(agentRow),
    phone: (agentRow?.phone as string | null) ?? null,
    email: (agentRow?.email as string | null) ?? null,
    agency: row.agencies?.name ?? null,
  };

  const sameCity = (await getPublishedProperties({ city: property.city, limit: 12 }).catch(() => []))
    .map(toPropertyCard)
    .filter((item) => item.slug !== property.slug);
  const sameDeal = sameCity.filter((item) => item.transaction === property.transaction);
  const related = [...sameDeal, ...sameCity.filter((item) => !sameDeal.includes(item))].slice(0, 3);

  const section = SECTION_BY_TRANSACTION[property.transaction];
  const perSqm = pricePerSqm(property);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description || undefined,
    url: `${SITE.url}/biens/${encodeURIComponent(property.slug)}`,
    image: images,
    datePosted: row.created_at,
    address: { "@type": "PostalAddress", addressLocality: property.city, addressRegion: property.location, addressCountry: "TN" },
    offers: { "@type": "Offer", price: property.numericPrice, priceCurrency: "TND", availability: "https://schema.org/InStock" },
    numberOfRooms: property.bedrooms,
    numberOfBathroomsTotal: property.bathrooms,
    floorSize: { "@type": "QuantitativeValue", value: property.area, unitCode: "MTK" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      <div className="ct-wrap pb-28 pt-24 lg:pb-24 lg:pt-28">
        <Breadcrumbs
          items={[
            { label: section.label, href: section.href },
            { label: property.city, href: `/biens?ville=${encodeURIComponent(property.city)}` },
            { label: property.title },
          ]}
        />

        <Gallery images={images} title={property.title} />

        <div className="mt-10 grid gap-12 lg:mt-14 lg:grid-cols-[1fr_24rem] lg:gap-16">
          <div className="min-w-0">
            <TransactionTag transaction={property.transaction} />
            <h1 className="ct-display mt-5 text-[clamp(2.3rem,5vw,4.4rem)]">{property.title}</h1>
            <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-lg text-muted">
              <span className="flex items-center gap-1.5"><MapPin size={17} aria-hidden /> {property.location}, {property.city}</span>
              <a href={mapsHref(property.location, property.city)} target="_blank" rel="noreferrer" className="ct-link text-base text-porte">Voir sur la carte</a>
            </p>

            <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 border-y border-trait py-8 sm:grid-cols-4">
              {property.area > 0 && <Fact label="Surface" value={`${formatNumber(property.area)} m²`} />}
              <Fact label="Chambres" value={property.bedrooms || "—"} />
              <Fact label="Salles de bain" value={property.bathrooms || "—"} />
              <Fact label="Type" value={property.type} />
              {perSqm && <Fact label="Prix au m²" value={perSqm.replace(" / m²", "")} />}
              <Fact label="Référence" value={<span className="text-base">{property.ref}</span>} />
            </dl>

            {property.description && (
              <section className="mt-12" aria-labelledby="desc">
                <h2 id="desc" className="ct-h3">Le bien</h2>
                <p className="ct-read mt-5 max-w-2xl whitespace-pre-line text-[1.125rem] text-encre/90">{property.description}</p>
              </section>
            )}

            {property.features.length > 0 && (
              <section className="mt-12" aria-labelledby="feat">
                <h2 id="feat" className="ct-h3">Équipements et atouts</h2>
                <ul className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {property.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 border-b border-trait pb-3">
                      <Check size={18} aria-hidden className="shrink-0 text-olive" /> {feature}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {property.transaction !== "À louer" && property.numericPrice > 0 && (
              <section className="mt-12"><MortgageEstimate price={property.numericPrice} /></section>
            )}

            <section id="contact" className="mt-12 scroll-mt-28">
              <InquiryForm
                title="Poser une question"
                description={`Un conseiller vous répond au sujet de « ${property.title} ».`}
                propertyId={property.id}
                topic={`${property.title} (${property.ref})`}
                messageLabel="Votre message"
                messagePlaceholder="Disponibilité, charges, modalités de visite…"
                submitLabel="Envoyer ma question"
              />
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Contacter le conseiller">
            <PropertyActions property={property} agent={agent} fallbackPhone={SITE.phone} />
            {row.agents && agentRow?.slug ? (
              <Link href={`/agents/${agentRow.slug as string}`} className="ct-link mt-4 hidden w-fit text-sm text-muted hover:text-encre lg:block">Voir le profil du conseiller</Link>
            ) : null}
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-24 border-t border-trait pt-16" aria-labelledby="related">
            <h2 id="related" className="ct-h2">Dans le même quartier d’esprit</h2>
            <PropertyGrid items={related} className="mt-12" />
          </section>
        )}
      </div>
    </>
  );
}

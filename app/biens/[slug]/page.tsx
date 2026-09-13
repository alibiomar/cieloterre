import { notFound } from "next/navigation";
import { Footer, Header } from "@/components/site-chrome";
import { PropertyDetailContent } from "@/components/biens/property-detail-content";
import {
  getPropertyBySlug,
  getPublishedProperties,
  toPropertyCard,
} from "@/lib/supabase/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const row = await getPropertyBySlug(slug);
  if (!row) {
    return { title: "Bien immobilier | CieloTerre" };
  }
  const property = toPropertyCard(row);
  return {
    title: `${property.title} – ${property.city} | CieloTerre`,
    description: property.description || `${property.type} ${property.transaction.toLowerCase()} à ${property.location}, ${property.city}. ${property.price}.`,
    openGraph: {
      title: `${property.title} – ${property.price} | CieloTerre`,
      description: property.description || `${property.location}, ${property.city}`,
      images: property.image ? [{ url: property.image }] : [],
    },
  };
}

export default async function PropertyDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const row = await getPropertyBySlug(slug);
  if (!row) notFound();

  const property = toPropertyCard(row);
  const related = (await getPublishedProperties({ city: property.city }))
    .map(toPropertyCard)
    .filter((item) => item.slug !== property.slug)
    .slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description || undefined,
    url: `https://cieloterre.tn/biens/${property.slug}`,
    image: property.images && property.images.length ? property.images : [property.image],
    datePosted: row.created_at,
    address: {
      "@type": "PostalAddress",
      addressLocality: property.city,
      addressRegion: property.location,
      addressCountry: "TN",
    },
    offers: {
      "@type": "Offer",
      price: property.numericPrice,
      priceCurrency: "TND",
      availability: "https://schema.org/InStock",
    },
    numberOfRooms: property.bedrooms,
    numberOfBathroomsTotal: property.bathrooms,
    floorSize: {
      "@type": "QuantitativeValue",
      value: property.area,
      unitCode: "MTK",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header dark />
      <PropertyDetailContent property={property} related={related} />
      <Footer />
    </>
  );
}

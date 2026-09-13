"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Breadcrumbs, LeadForm, PropertyGrid } from "@/components/property-ui";
import { ViewingRequestModal } from "@/components/biens/viewing-request-modal";
import type { Property } from "@/lib/cieloterre-data";
import { SafeImage as Image } from "@/components/safe-image";

export function PropertyDetailContent({
  property,
  related,
}: {
  property: Property;
  related: Property[];
}) {
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const images = property.images && property.images.length > 0 ? property.images : [property.image];
  const [activeImage, setActiveImage] = useState(0);
  const showPrev = () => setActiveImage((current) => (current - 1 + images.length) % images.length);
  const showNext = () => setActiveImage((current) => (current + 1) % images.length);

  return (
    <main className="bg-background px-6 pb-24 pt-32 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Breadcrumbs items={["Biens", property.city, property.title]} />
        <div className="grid gap-8 lg:grid-cols-[1.25fr_.75fr]">
          <div>
            <div className="relative aspect-[1.2] w-full overflow-hidden rounded-2xl">
              <Image
                src={images[activeImage]}
                alt={`${property.title} — photo ${activeImage + 1}`}
                fill
                className="h-full w-full object-cover"
                priority
              />
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPrev}
                    aria-label="Photo précédente"
                    className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-background/90 text-foreground shadow-md transition hover:bg-background"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={showNext}
                    aria-label="Photo suivante"
                    className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-background/90 text-foreground shadow-md transition hover:bg-background"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <span className="absolute bottom-3 right-3 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground shadow-md">
                    {activeImage + 1} / {images.length}
                  </span>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {images.map((src, index) => (
                  <button
                    key={`${src}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`Voir la photo ${index + 1}`}
                    aria-current={index === activeImage}
                    className={`relative aspect-[1.3] h-16 shrink-0 overflow-hidden rounded-lg ring-2 transition ${
                      index === activeImage ? "ring-primary" : "ring-transparent"
                    }`}
                  >
                    <Image src={src} alt="" fill className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center">
            <span className="eyebrow">
              {property.transaction} · {property.ref}
            </span>
            <h1 className="mt-4 font-serif text-5xl leading-tight text-foreground sm:text-6xl">
              {property.title}
            </h1>
            <p className="mt-3 text-sm text-soft-foreground">
              {property.location}, {property.city}
            </p>
            <p className="mt-8 text-2xl font-semibold text-primary">
              {property.price}
            </p>
            <div className="mt-6 flex gap-5 border-y border-cool-light py-5 text-sm text-soft-foreground">
              <span>{property.area} m²</span>
              <span>{property.bedrooms} chambres</span>
              <span>{property.bathrooms} salles de bain</span>
            </div>
            <p className="mt-6 leading-7 text-soft-foreground">
              {property.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => setVisitModalOpen(true)}
                className="inline-flex w-fit rounded-full bg-earth px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-accent"
              >
                Demander une visite
              </button>
              <a
                href="#contact"
                className="inline-flex w-fit rounded-full border border-cool-light px-6 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
              >
                Poser une question
              </a>
            </div>
          </div>
        </div>
        <div id="contact" className="mt-20 grid gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow">L’adresse en détail</p>
            <h2 className="section-title">
              Un lieu à <em>imaginer.</em>
            </h2>
            <p className="mt-5 max-w-lg leading-7 text-soft-foreground">
              Notre conseiller vous donnera toutes les informations utiles et
              organisera une visite selon vos disponibilités.
            </p>
          </div>
          <LeadForm title="Recevoir les détails" propertyId={property.id} />
        </div>
        {related.length > 0 && (
          <div className="mt-20">
            <h2 className="section-title">
              Dans le même <em>univers.</em>
            </h2>
            <div className="mt-8">
              <PropertyGrid items={related} />
            </div>
          </div>
        )}
      </div>

      <ViewingRequestModal
        property={property}
        open={visitModalOpen}
        onClose={() => setVisitModalOpen(false)}
      />
    </main>
  );
}


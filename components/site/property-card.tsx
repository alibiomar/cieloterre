import Link from "next/link";
import { BedDouble, Bath, Ruler } from "lucide-react";
import type { Property } from "@/lib/cieloterre-data";
import { propertyHref } from "@/lib/supabase/mappers";
import { priceLabel } from "@/lib/format";
import { SafeImage } from "@/components/safe-image";
import { FavoriteButton } from "./favorite-button";

const TAG_STYLES: Record<Property["transaction"], string> = {
  "À vendre": "bg-surface text-encre",
  "À louer": "bg-ciel text-nuit",
  Neuf: "bg-olive text-white",
};

export function TransactionTag({ transaction }: { transaction: Property["transaction"] }) {
  return (
    <span className={`rounded-full px-3 py-1 text-[0.8125rem] font-medium ${TAG_STYLES[transaction]}`}>
      {transaction}
    </span>
  );
}

function Specs({ property }: { property: Property }) {
  return (
    <ul className="ct-num flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
      {property.area > 0 && (
        <li className="flex items-center gap-1.5"><Ruler size={15} aria-hidden />{property.area} m²</li>
      )}
      {property.bedrooms > 0 && (
        <li className="flex items-center gap-1.5"><BedDouble size={15} aria-hidden />{property.bedrooms} ch.</li>
      )}
      {property.bathrooms > 0 && (
        <li className="flex items-center gap-1.5"><Bath size={15} aria-hidden />{property.bathrooms} sdb</li>
      )}
    </ul>
  );
}

/**
 * Listing card. `grid` is the everyday card, `feature` has an arched photo and
 * is reserved for the homepage selection and the first catalog result.
 */
export function PropertyCard({
  property,
  variant = "grid",
  priority = false,
}: {
  property: Property;
  variant?: "grid" | "feature";
  priority?: boolean;
}) {
  const href = propertyHref(property.slug);

  if (variant === "feature") {
    return (
      <article className="group relative">
        <Link href={href} className="block" aria-label={`${property.title}, ${priceLabel(property)}`}>
          <div className="ct-arch relative aspect-[4/5] w-full bg-ombre">
            <SafeImage
              src={property.image}
              alt={property.title}
              fill
              sizes="(max-width: 1024px) 92vw, 46vw"
              preload={priority}
              className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-nuit/60 via-transparent to-transparent" aria-hidden />
            <div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-9">
              <TransactionTag transaction={property.transaction} />
              <h3 className="mt-4 text-[clamp(1.75rem,3vw,2.6rem)] font-light leading-[1.05] tracking-[-0.03em]">
                {property.title}
              </h3>
              <p className="mt-2 text-white/85">{property.location}, {property.city}</p>
              <p className="ct-num mt-4 text-xl font-normal">{priceLabel(property)}</p>
            </div>
          </div>
        </Link>
        <div className="absolute right-5 top-[4.5rem] z-10 sm:right-8">
          <FavoriteButton slug={property.slug} id={property.id} title={property.title} />
        </div>
      </article>
    );
  }

  return (
    <article className="group relative">
      <Link href={href} className="block">
        <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-ombre">
          <SafeImage
            src={property.image}
            alt={property.title}
            fill
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
            preload={priority}
            className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
          />
          <div className="absolute left-3 top-3"><TransactionTag transaction={property.transaction} /></div>
        </div>
        <div className="pt-4">
          <p className="text-sm text-muted">{property.location}, {property.city}</p>
          <h3 className="mt-1 text-[1.35rem] font-normal leading-snug tracking-[-0.015em] text-encre group-hover:text-porte">
            {property.title}
          </h3>
          <p className="ct-num mt-2 text-lg font-medium text-encre">{priceLabel(property)}</p>
          <div className="mt-3 border-t border-trait pt-3"><Specs property={property} /></div>
        </div>
      </Link>
      <div className="absolute right-3 top-3 z-10">
        <FavoriteButton slug={property.slug} id={property.id} title={property.title} />
      </div>
    </article>
  );
}

export function PropertyGrid({
  items,
  className = "",
}: {
  items: Property[];
  className?: string;
}) {
  return (
    <div className={`grid gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {items.map((property, index) => (
        <PropertyCard key={property.slug} property={property} priority={index < 3} />
      ))}
    </div>
  );
}

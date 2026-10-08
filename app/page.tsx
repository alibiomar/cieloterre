import Link from "next/link";
import { MapPin } from "lucide-react";
import {
  getPublicArticles,
  getPublishedProperties,
  getPublishedPropertyById,
  getSiteSetting,
  toPropertyCard,
} from "@/lib/supabase/queries";
import { publicMediaUrl, propertyHref } from "@/lib/supabase/mappers";
import type { Article, Property } from "@/lib/cieloterre-data";
import { POPULAR_CITIES } from "@/lib/site-config";
import { plural, priceLabel, slugifyCity } from "@/lib/format";
import { SafeImage } from "@/components/safe-image";
import { SentenceSearch } from "@/components/site/sentence-search";
import { PropertyCard } from "@/components/site/property-card";
import { CityIndex, type CityEntry } from "@/components/site/city-index";
import { HorizonVideo } from "@/components/site/horizon-video";
import { ContactBand, EmptyState, SectionTitle } from "@/components/site/ui";

type HeroSetting = { mode?: string; imagePath?: string | null; propertyId?: string | null };

async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    console.error("[home] data unavailable:", error);
    return fallback;
  }
}

const DOORS = [
  { title: "Acheter", text: "Une sélection resserrée et des visites accompagnées, jusqu’à la remise des clés.", href: "/acheter", tone: "bg-ciel text-nuit" },
  { title: "Louer", text: "Des logements présentés avec transparence, du premier contact à l’état des lieux.", href: "/louer", tone: "bg-sable text-nuit" },
  { title: "Vendre", text: "Estimation, mise en valeur, négociation : une stratégie pour votre bien.", href: "/vendre", tone: "bg-olive text-white" },
  { title: "Confier", text: "Nous trouvons le locataire et suivons votre bien au quotidien.", href: "/gestion-locative", tone: "bg-argile text-nuit" },
] as const;

const GAZE = [
  { title: "Observer", text: "Comprendre un quartier avant de présenter une adresse : ses rues, sa lumière, ses habitudes." },
  { title: "Raconter", text: "Donner à voir les usages et le potentiel d’un lieu, avec des photos et des mots justes." },
  { title: "Accompagner", text: "Rester présent lorsque le choix devient un projet : visites, négociation, signature." },
] as const;

export default async function HomePage() {
  const [rows, heroSetting, articles] = await Promise.all([
    safe(getPublishedProperties({ limit: 100 }), []),
    safe(getSiteSetting<HeroSetting>("hero"), null),
    safe(getPublicArticles(), [] as Article[]),
  ]);
  const properties = rows.map(toPropertyCard);
  const featured = properties.slice(0, 5);

  // Hero image: respects the CRM "hero" setting (a property or a free image).
  let heroProperty: Property | undefined = featured[0];
  let heroImage = heroProperty?.image || "/cieloterre-hero.png";
  if (heroSetting?.mode === "property" && heroSetting.propertyId) {
    const chosen = await safe(getPublishedPropertyById(heroSetting.propertyId), null);
    if (chosen) {
      heroProperty = toPropertyCard(chosen);
      heroImage = heroProperty.image;
    }
  }
  const imageOnly = heroSetting?.mode === "image" && !!heroSetting.imagePath?.trim();
  if (imageOnly) heroImage = publicMediaUrl(heroSetting?.imagePath, "/cieloterre-hero.png");

  // Facets for the sentence search and the city index, from published data.
  const byCity = new Map<string, { count: number; image: string }>();
  for (const property of properties) {
    const entry = byCity.get(property.city);
    if (entry) entry.count += 1;
    else byCity.set(property.city, { count: 1, image: property.image });
  }
  const cityNames = [...byCity.keys()].sort((a, b) => (byCity.get(b)!.count - byCity.get(a)!.count) || a.localeCompare(b, "fr"));
  const types = [...new Set(properties.map((property) => property.type))].sort((a, b) => a.localeCompare(b, "fr"));

  const cityEntries: CityEntry[] = cityNames.slice(0, 6).map((name) => {
    const slug = slugifyCity(name);
    const known = POPULAR_CITIES.some((popular) => slugifyCity(popular) === slug);
    return {
      name,
      count: byCity.get(name)!.count,
      image: byCity.get(name)!.image,
      href: known ? `/immobilier/${slug}` : `/biens?ville=${encodeURIComponent(name)}`,
    };
  });

  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden">
        <div className="ct-wrap grid gap-12 pb-16 pt-28 lg:min-h-[min(60rem,100svh)] lg:grid-cols-[1.18fr_0.82fr] lg:items-end lg:gap-14 lg:pb-20 lg:pt-32">
          <div className="ct-hero-in">
            <p className="ct-label">Agence immobilière en Tunisie</p>
            <h1 className="ct-display mt-5 text-[clamp(2.7rem,6.3vw,5.7rem)]">
              Votre prochaine adresse en Tunisie.
            </h1>
            <SentenceSearch cities={cityNames} types={types} />
            <p className="mt-9 max-w-md text-[0.95rem] text-muted">
              {properties.length > 0
                ? `${properties.length} ${plural(properties.length, "bien publié", "biens publiés")} dans ${cityNames.length} ${plural(cityNames.length, "ville", "villes")}, présentés par des conseillers qui connaissent chaque quartier.`
                : "Appartements, villas et programmes neufs présentés par des conseillers qui connaissent chaque quartier."}
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-[34rem] lg:mx-0 lg:max-w-none">
            <div className="ct-arch ct-hero-arch relative aspect-[4/5] w-full bg-ciel-pale lg:aspect-auto lg:h-[min(46rem,78svh)]">
              <SafeImage
                src={heroImage}
                alt={imageOnly ? "Architecture méditerranéenne en Tunisie" : heroProperty?.title ?? "Architecture méditerranéenne en Tunisie"}
                fill
                preload
                sizes="(max-width: 1024px) 92vw, 42vw"
                className="object-cover"
              />
              {!imageOnly && heroProperty && (
                <Link
                  href={propertyHref(heroProperty.slug)}
                  className="group absolute inset-x-4 bottom-4 flex items-end justify-between gap-4 rounded-md bg-chaux/95 p-5 backdrop-blur transition-colors hover:bg-surface sm:inset-x-6 sm:bottom-6"
                >
                  <span className="min-w-0">
                    <span className="block text-sm text-muted">À la une</span>
                    <span className="mt-0.5 block truncate text-xl font-normal tracking-tight">{heroProperty.title}</span>
                    <span className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                      <MapPin size={14} aria-hidden /> {heroProperty.location}, {heroProperty.city}
                    </span>
                  </span>
                  <span className="ct-num shrink-0 text-base font-medium text-porte group-hover:underline">
                    {priceLabel(heroProperty)}
                  </span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- Sélection */}
      <section className="ct-section bg-ombre/60" aria-labelledby="selection-title">
        <div className="ct-wrap">
          <div id="selection-title">
            <SectionTitle
              title="Les biens du moment"
              action={properties.length > 0 ? { label: "Parcourir le catalogue", href: "/biens" } : undefined}
            />
          </div>
          {featured.length > 0 ? (
            <div className="mt-14 grid gap-12 lg:grid-cols-12 lg:gap-x-10">
              <div className="lg:col-span-6">
                <PropertyCard property={featured[0]} variant="feature" priority />
              </div>
              {featured.length > 1 && (
                <div className="grid gap-x-7 gap-y-12 sm:grid-cols-2 lg:col-span-6 lg:content-start">
                  {featured.slice(1).map((property, index) => (
                    <div key={property.slug} className={index % 2 === 1 ? "sm:mt-16" : ""}>
                      <PropertyCard property={property} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-14">
              <EmptyState
                title="Une sélection en préparation."
                text="Nos conseillers publient régulièrement de nouveaux biens. Laissez-nous vos critères, nous vous prévenons dès qu’une adresse correspond."
                href="/contact"
                action="Décrire ma recherche"
              />
            </div>
          )}
        </div>
      </section>

      {/* ---------------------------------------------------------------- Villes */}
      {cityEntries.length >= 2 && (
        <section className="ct-section" aria-labelledby="cities-title">
          <div className="ct-wrap">
            <div id="cities-title" className="mb-14">
              <SectionTitle title="Où chercher" />
            </div>
            <CityIndex cities={cityEntries} />
          </div>
        </section>
      )}

      {/* ----------------------------------------------------------------- Film */}
      <HorizonVideo
        src="/videos/givingKey.mp4"
        poster={heroProperty?.image}
        title="Une autre façon d’habiter"
        text="Des lieux, des gestes et des histoires qui donnent du sens à chaque adresse."
      />

      {/* ---------------------------------------------------------------- Portes */}
      <section className="on-dark bg-nuit pb-0 pt-8 text-white md:pt-16" aria-labelledby="doors-title">
        <div className="ct-wrap">
          <h2 id="doors-title" className="ct-h2 max-w-2xl">Que souhaitez-vous faire ?</h2>
          <div className="mt-14 grid grid-cols-2 items-end gap-3 sm:gap-5 lg:grid-cols-4">
            {DOORS.map((door, index) => (
              <Link
                key={door.title}
                href={door.href}
                className={`ct-arch group flex flex-col justify-end p-5 pt-24 transition-[padding] duration-300 hover:pt-32 sm:p-8 sm:pt-32 sm:hover:pt-40 ${door.tone} ${index % 2 ? "min-h-[22rem] sm:min-h-[28rem]" : "min-h-[25rem] sm:min-h-[32rem]"}`}
              >
                <span className="text-[clamp(1.6rem,2.6vw,2.4rem)] font-light leading-none tracking-[-0.03em]">{door.title}</span>
                <span className="mt-3 text-[0.9375rem] leading-snug opacity-80 sm:mt-4">{door.text}</span>
                <span className="ct-link mt-5 w-fit text-sm font-medium">Découvrir</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Regard */}
      <section className="ct-section" aria-labelledby="gaze-title">
        <div className="ct-wrap grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <h2 id="gaze-title" className="ct-h2 max-w-md">Le bon bien, au bon endroit.</h2>
            <p className="ct-lede mt-6 max-w-md">
              Nous sélectionnons moins, racontons mieux et restons présents jusqu’à la signature.
            </p>
            <Link href="/a-propos" className="ct-link mt-8 inline-block text-base font-medium text-porte">Notre manière de travailler</Link>
          </div>
          <ol className="border-t border-trait">
            {GAZE.map((step, index) => (
              <li key={step.title} className="grid gap-4 border-b border-trait py-9 sm:grid-cols-[4.5rem_1fr] sm:py-12">
                <span className="ct-num text-[2.6rem] font-light leading-none tracking-tight text-ciel">{index + 1}</span>
                <div>
                  <h3 className="text-[clamp(1.6rem,2.6vw,2.2rem)] font-light tracking-[-0.025em]">{step.title}</h3>
                  <p className="mt-3 max-w-lg text-lg leading-relaxed text-muted">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* --------------------------------------------------------------- Conseils */}
      {articles.length > 0 && (
        <section className="ct-section border-t border-trait bg-ombre/60" aria-labelledby="advice-title">
          <div className="ct-wrap">
            <div id="advice-title">
              <SectionTitle title="Pour préparer votre projet" action={{ label: "Tous les conseils", href: "/conseils" }} />
            </div>
            <div className="mt-14 grid gap-x-8 gap-y-12 md:grid-cols-3">
              {articles.slice(0, 3).map((article) => (
                <Link key={article.slug} href={`/conseils/${article.slug}`} className="group block">
                  <div className="relative aspect-[3/2] overflow-hidden rounded-md bg-ombre">
                    <SafeImage src={article.image} alt="" fill sizes="(max-width: 768px) 92vw, 30vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:transition-none" />
                  </div>
                  <p className="mt-5 text-sm text-muted">{article.category}, {article.readTime} de lecture</p>
                  <h3 className="mt-2 text-[1.5rem] font-normal leading-tight tracking-[-0.02em] group-hover:text-porte">{article.title}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <ContactBand title="Dites-nous où vous voulez vivre." text="Un conseiller revient vers vous avec les premières pistes, sans engagement." />
    </>
  );
}

import Link from "next/link";
import { ArrowRight, ArrowUpRight, MapPin } from "lucide-react";
import { Footer, Header } from "@/components/site-chrome";
import { getPublishedProperties, getPublishedPropertyById, getSiteSetting, toPropertyCard } from "@/lib/supabase/queries";
import { propertyHref } from "@/lib/supabase/mappers";
import ScrollExpand from "@/components/ScrollExpand";
import TextLoop from "@/components/TextLoop";
import Image from "next/image";
export default async function Page() {
  const properties = (await getPublishedProperties()).map(toPropertyCard);
  const featured = properties.slice(0, 3);
  const cities = [...new Set(properties.map((property) => property.city))];
  const types = [...new Set(properties.map((property) => property.type))];
    const heroSetting = await getSiteSetting<{ mode?: string; imagePath?: string | null; propertyId?: string | null }>("hero");
  let heroProperty = featured[0];
  let heroImage = heroProperty?.image || "/cieloterre-hero.png";
  if (heroSetting?.mode === "property" && heroSetting.propertyId) {
    const chosen = await getPublishedPropertyById(heroSetting.propertyId);
    if (chosen) heroProperty = toPropertyCard(chosen);
  }
 if (heroSetting?.mode === "image" && heroSetting.imagePath) {
  const imagePath = heroSetting.imagePath.trim();

  heroImage =
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://") ||
    imagePath.startsWith("/")
      ? imagePath
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-media/${imagePath.replace(/^\/+/, "")}`;
}
  const citySummary = cities.slice(0, 4).join(", ");

  return (
    <main className="site-noise min-h-screen bg-background text-foreground">
      <Header dark />

      <section className="relative overflow-hidden bg-background text-foreground">
        <div className="mx-auto grid min-h-190 max-w-360 gap-10 px-6 pb-12 pt-32 lg:grid-cols-[0.78fr_1.22fr] lg:items-end lg:px-12 lg:pb-16">
          <div className="relative z-10 max-w-xl">
            <p className="mb-7 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.28em] text-accent">
              <span className="h-px w-10 bg-accent" />
              CieloTerre / immobilier choisi
            </p>
            <h1 className="font-serif text-6xl leading-[0.9] tracking-[-0.045em] sm:text-8xl">
              Habiter avec intention.
            </h1>
            <p className="mt-8 max-w-md text-base leading-7 text-soft-foreground">
              Des adresses singulières en Tunisie, présentées avec le contexte
              et le regard qui permettent de choisir juste.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <Link
                href="/biens"
                className="inline-flex items-center gap-3 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground transition hover:bg-accent"
              >
                Voir les biens <ArrowUpRight size={16} />
              </Link>
              <a
                href="#selection"
                className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-primary"
              >
                La sélection du moment <ArrowRight size={15} />
              </a>
            </div>
          </div>

          <div className="relative min-h-102.5 lg:min-h-150">
            <div className="absolute inset-0 overflow-hidden rounded-4xl lg:rounded-[2.5rem]">
              <Image
                src={heroImage}
                alt={heroProperty?.title || "Sélection CieloTerre"}
                className="h-full w-full object-cover"
                fill
                priority
              />
              <div className="absolute inset-0 bg-linear-to-t from-earth/65 via-transparent to-transparent" />
            </div>
<div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 text-primary-foreground lg:bottom-8 lg:left-8 lg:right-8">
  {heroSetting?.mode !== "image" && (
    <>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
          À la une
        </p>

        <p className="mt-2 font-serif text-3xl">
          {heroProperty?.title || "Votre prochaine adresse"}
        </p>

        {heroProperty && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-primary-foreground/75">
            <MapPin size={13} /> {heroProperty.location}, {heroProperty.city}
          </p>
        )}
      </div>

      {heroProperty && (
        <Link
          href={propertyHref(heroProperty.slug)}
          aria-label={`Voir ${heroProperty.title}`}
          className="rounded-full bg-background p-3 text-earth transition hover:bg-secondary"
        >
          <ArrowUpRight size={20} />
        </Link>
      )}
    </>
  )}
</div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-8 max-w-295 px-6 lg:-mt-10">
        <form
          action="/biens"
          className="grid gap-1 rounded-2xl border border-cool-light bg-surface p-2 shadow-[0_20px_60px_rgba(64,59,53,0.12)] sm:grid-cols-[1fr_1fr_auto]"
        >
          <label className="rounded-xl px-4 py-3">
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Localisation</span>
            <select name="ville" className="mt-2 w-full bg-transparent text-sm font-semibold outline-none">
              <option value="">Toutes les villes</option>
              {cities.map((city) => <option key={city} value={city}>{city}</option>)}
            </select>
          </label>
          <label className="rounded-xl px-4 py-3">
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Type de bien</span>
            <select name="type" className="mt-2 w-full bg-transparent text-sm font-semibold outline-none">
              <option value="">Tous les types</option>
              {types.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <button className="rounded-xl bg-primary px-7 py-4 text-sm font-bold text-primary-foreground transition hover:bg-secondary hover:text-accent">
            Rechercher
          </button>
        </form>
      </section>

      <section id="selection" className="mx-auto max-w-360 px-6 pb-28 pt-28 lg:px-12">
        <div className="flex flex-col justify-between gap-8 border-b border-cool-light pb-7 md:flex-row md:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-accent">
              La sélection CieloTerre
            </p>
            <h2 className="mt-3 max-w-2xl font-serif text-5xl leading-[0.95] tracking-[-0.035em] sm:text-7xl">
              {featured.length
                ? "Des biens qui ont quelque chose."
                : "Une sélection en préparation."}
            </h2>
          </div>
          <Link href="/biens" className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-primary hover:text-secondary">
            Parcourir le catalogue <ArrowUpRight size={15} />
          </Link>
        </div>

        {featured.length > 0 ? (
          <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <PropertyFeature property={featured[0]} large />
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-1">
              {featured.slice(1).map((property) => (
                <PropertyFeature key={property.slug} property={property} />
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed border-cool-light bg-surface p-16 text-center">
            <p className="font-serif text-3xl">Aucun bien publié pour le moment.</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-soft-foreground">
              Revenez bientôt pour découvrir les nouvelles adresses CieloTerre.
            </p>
          </div>
        )}
      </section>
      <div className="relative top-0 z-10 flex h-0 items-center justify-center">
        <TextLoop
          text="cieloterre"
          separator="•"
          speed={90}
          curviness={38}  
          pauseOnHover={false}
          ribbon={false}
          ribbonColor="var(--secondary)"
          fontWeight={600}
          fontSize={48}
          ribbonWidth={12}
          letterSpacing={2}
          uppercase={false}
          color="var(--primary)"
          shape="wave"
        />
      </div>
      <section
        aria-labelledby="discovery-title"
        className="border-y border-cool-light bg-surface px-6 py-24 text-foreground lg:px-12"
      >
        <div className="mx-auto max-w-360">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-accent">
              Agence immobilière en Tunisie
            </p>
            <h2
              id="discovery-title"
              className="mx-auto mt-5 max-w-2xl font-serif text-5xl leading-[0.95] tracking-[-0.035em] sm:text-7xl"
            >
              Trouver le bien qui vous ressemble.
            </h2>
            <p className="mx-auto mt-7 max-w-2xl text-sm leading-7 text-soft-foreground">
              CieloTerre vous accompagne dans votre recherche immobilière en
              Tunisie, pour acheter, louer ou découvrir un programme neuf avec
              une sélection claire et un regard attentif sur chaque adresse.
            </p>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-soft-foreground">
              Explorez des appartements, maisons et propriétés sélectionnées
              selon leur emplacement, leur qualité de vie et leur potentiel.
              {citySummary
                ? ` Nos annonces sont actuellement à découvrir à ${citySummary}.`
                : ""}
            </p>
          </div>
          <div className="relative mx-auto -mt-32 max-w-6xl h-[254.99999999999997svh] min-h-275">
            <ScrollExpand
              src="/videos/givingKey.mp4"
              mediaType="video"
              poster={heroProperty?.image}
              alt="Une adresse CieloTerre en mouvement"
              title="Une autre façon d'habiter"
              scrollHint="Faites défiler pour découvrir"
              useWindowScroll
              startWidth={42}
              startHeight={58}
              startRadius={24}
              endRadius={0}
              mediaZoom={1.35}
              scrollDistance={1.2}
              holdDistance={0.35}
              smoothing={0.1}
              overlayScrim={0.45}
              enabled
            >
              <h2 className="font-serif text-4xl sm:text-6xl text-surface">
                Chaque détail compte
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-6 text-primary-foreground/75">
                Des lieux, des gestes et des histoires qui donnent du sens à
                chaque adresse.
              </p>
            </ScrollExpand>
          </div>
        </div>
      </section>

      <section className="border-y border-cool-light bg-background">
        <div className="mx-auto grid max-w-360 gap-12 px-6 py-24 lg:grid-cols-[0.8fr_1.2fr] lg:px-12">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-accent">Notre regard</p>
            <h2 className="mt-4 max-w-md font-serif text-5xl leading-[0.95] tracking-[-0.035em] sm:text-7xl">
              Le bon bien, au bon endroit.
            </h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            <Principle number="01" title="Observer" text="Comprendre un quartier avant de présenter une adresse." />
            <Principle number="02" title="Raconter" text="Donner à voir la lumière, les usages et le potentiel d'un lieu." />
            <Principle number="03" title="Accompagner" text="Rester présent lorsque le choix devient un projet." />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-360 px-6 py-28 lg:px-12">
        <div className="flex flex-col justify-between gap-8 rounded-4xl bg-accent px-8 py-14 text-primary-foreground sm:px-14 lg:flex-row lg:items-end lg:py-20">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-secondary">Un projet en tête ?</p>
            <h2 className="mt-4 max-w-2xl font-serif text-5xl leading-[0.95] sm:text-7xl">
              Parlons de l&apos;endroit où vous voulez vivre.
            </h2>
          </div>
          <Link href="/contact" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-6 py-4 text-sm font-bold text-primary-foreground transition hover:bg-surface hover:text-foreground">
            Prendre contact <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function PropertyFeature({
  property,
  large = false,
}: {
  property: ReturnType<typeof toPropertyCard>;
  large?: boolean;
}) {
  return (
    <Link href={propertyHref(property.slug)} className="group block">
      <article className="overflow-hidden rounded-2xl border border-cool-light bg-surface">
        <div className={`relative overflow-hidden ${large ? "aspect-[1.25]" : "aspect-[1.5]"}`}>
          <Image
            src={property.image || "/placeholder.jpg"}
            alt={property.title}
            fill
            sizes={large ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 100vw, 33vw"}
            className="object-cover transition duration-700 group-hover:scale-105"
          />
          <span className="absolute left-4 top-4 rounded-full bg-background/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground">
            {property.transaction}
          </span>
        </div>
        <div className="flex items-end justify-between gap-4 p-5">
          <div>
            <p className="flex items-center gap-1.5 text-xs text-soft-foreground">
              <MapPin size={13} /> {property.location}, {property.city}
            </p>
            <h3 className={`mt-2 font-serif text-foreground ${large ? "text-4xl" : "text-2xl"}`}>
              {property.title}
            </h3>
          </div>
          <p className="text-right text-sm font-bold text-primary">{property.price}</p>
        </div>
      </article>
    </Link>
  );
}

function Principle({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <article className="border-t-2 border-secondary pt-5">
      <p className="font-mono text-xs text-primary">{number}</p>
      <h3 className="mt-8 font-serif text-3xl">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-soft-foreground">{text}</p>
    </article>
  );
}

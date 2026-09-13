import Link from "next/link";
import { ArrowUpRight, Compass, MapPin } from "lucide-react";

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <span className="h-px w-10 bg-accent" />
        <p className="eyebrow">{eyebrow}</p>
      </div>
      <h2 className="section-title">{title}</h2>
      {description && (
        <p className="mt-5 max-w-2xl text-base leading-7 text-soft-foreground">
          {description}
        </p>
      )}
    </div>
  );
}

export function FeatureGrid({
  items,
}: {
  items: Array<{ number?: string; title: string; text: string }>;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {items.map((item, index) => (
        <article
          key={item.title}
          className="luxury-card relative overflow-hidden p-7"
        >
          <span className="font-mono text-xs text-accent">
            {item.number ?? `0${index + 1}`}
          </span>
          <h3 className="mt-8 font-serif text-3xl text-foreground">
            {item.title}
          </h3>
          <p className="mt-4 text-sm leading-7 text-soft-foreground">{item.text}</p>
        </article>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  text,
  href = "/biens",
  action = "Explorer les biens",
}: {
  title: string;
  text: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="luxury-card p-12 text-center sm:p-16">
      <Compass className="mx-auto text-accent" size={28} />
      <h2 className="mt-5 font-serif text-3xl text-foreground">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-soft-foreground">
        {text}
      </p>
      <Link
        href={href}
        className="mt-7 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-bold text-primary-foreground transition hover:bg-earth"
      >
        {action}
        <ArrowUpRight size={15} />
      </Link>
    </div>
  );
}

export function ContactBanner({
  title = "Un projet en tête ? Parlons-en.",
  text = "Vous cherchez, vous vendez, vous investissez ? Notre équipe est à votre écoute.",
}) {
  return (
    <section className="rounded-2xl bg-earth p-8 text-primary-foreground sm:p-12">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-accent">
        CieloTerre
      </p>
      <div className="mt-4 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="max-w-xl font-serif text-4xl leading-tight sm:text-5xl">
            {title}
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-7 text-primary-foreground/65">
            {text}
          </p>
        </div>
        <Link
          href="/contact"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-bold text-foreground"
        >
          Prendre contact <ArrowUpRight size={15} />
        </Link>
      </div>
    </section>
  );
}

export function LocationPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-soft-foreground">
      <MapPin size={13} className="text-accent" />
      {children}
    </span>
  );
}

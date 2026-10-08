import Link from "next/link";
import type { ReactNode } from "react";

/** Page opener used by every inner page: big light headline, one calm sentence. */
export function PageHeader({
  title,
  lede,
  crumbs,
  children,
}: {
  title: ReactNode;
  lede?: ReactNode;
  crumbs?: Array<{ label: string; href?: string }>;
  children?: ReactNode;
}) {
  return (
    <header className="ct-wrap pb-12 pt-32 md:pb-16 md:pt-40">
      {crumbs && <Breadcrumbs items={crumbs} />}
      <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-end">
        <h1 className="ct-display text-[clamp(2.5rem,6.4vw,5.5rem)]">{title}</h1>
        {(lede || children) && (
          <div className="lg:pb-3">
            {lede && <p className="ct-lede max-w-xl">{lede}</p>}
            {children}
          </div>
        )}
      </div>
    </header>
  );
}

export function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav aria-label="Fil d’Ariane" className="mb-8 text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <li>
          <Link href="/" className="ct-link">Accueil</Link>
        </li>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-2">
            <span aria-hidden className="text-trait">/</span>
            {item.href ? (
              <Link href={item.href} className="ct-link">{item.label}</Link>
            ) : (
              <span aria-current="page" className="text-encre">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function EmptyState({
  title,
  text,
  href = "/biens",
  action = "Voir tous les biens",
}: {
  title: string;
  text: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-trait bg-surface/60 px-6 py-16 text-center sm:py-20">
      <div className="ct-arch mx-auto mb-7 h-16 w-11 border-2 border-b-0 border-ciel bg-ciel-pale" aria-hidden />
      <h2 className="ct-h3">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-muted">{text}</p>
      <Link href={href} className="ct-btn ct-btn--dark mt-8">{action}</Link>
    </div>
  );
}

/** Closing call to action shared by inner pages. */
export function ContactBand({
  title = "Parlons de votre projet.",
  text = "Achat, location, vente ou gestion : un conseiller vous répond sous un jour ouvré.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section className="on-dark bg-porte text-white">
      <div className="ct-wrap grid gap-8 py-16 md:py-20 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div>
          <h2 className="ct-h2 max-w-2xl">{title}</h2>
          <p className="mt-5 max-w-lg text-lg text-white/80">{text}</p>
        </div>
        <div className="flex flex-wrap gap-3 lg:justify-end">
          <Link href="/contact" className="ct-btn ct-btn--light">Écrire à un conseiller</Link>
          <a href="tel:+21671740100" className="ct-btn ct-btn--outline-light">+216 71 740 100</a>
        </div>
      </div>
    </section>
  );
}

export function SectionTitle({
  title,
  action,
}: {
  title: ReactNode;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <h2 className="ct-h2 max-w-3xl">{title}</h2>
      {action && (
        <Link href={action.href} className="ct-link w-fit shrink-0 pb-1 text-base font-medium text-porte">
          {action.label}
        </Link>
      )}
    </div>
  );
}

/** Key/value line used in fact sheets. */
export function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="ct-num mt-1 text-xl font-normal tracking-tight">{value}</dd>
    </div>
  );
}

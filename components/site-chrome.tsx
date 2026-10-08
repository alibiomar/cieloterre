"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, Menu, Phone, X } from "lucide-react";
import { FOOTER_GROUPS, NAV, SITE } from "@/lib/site-config";
import { useFavorites } from "@/lib/use-favorites";

/* ------------------------------------------------------------------ */
/* Logo                                                                */
/* ------------------------------------------------------------------ */

export function Logo({ className = "" }: { tone?: "light" | "dark"; className?: string }) {
  return (
    <Link
      href="/"
      aria-label="CieloTerre, accueil"
      className={`inline-flex items-center gap-2.5 ${className}`}
    >
      <Image src="/logo.svg" alt="cieloterre"   width={1503}
        height={368} className="h-12 w-auto shrink-0" />

    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

export function Header(_props: { dark?: boolean }) {
  const pathname = usePathname();
  const { slugs } = useFavorites();
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setSolid(window.scrollY > 12);
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header
        data-solid={solid}
        className="ct-header fixed inset-x-0 top-0 z-40 transition-[background-color,backdrop-filter] duration-300 data-[solid=true]:bg-chaux/90 data-[solid=true]:backdrop-blur-md"
        style={{ ["--p" as string]: progress }}
      >
        <div className="ct-wrap flex h-[4.5rem] items-center justify-between gap-6">
          <Logo />

          <nav aria-label="Navigation principale" className="hidden items-center gap-8 lg:flex">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`ct-link ct-link--nav text-[0.95rem] font-normal ${active ? "text-porte" : "text-encre"}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={SITE.phoneHref}
              className="hidden items-center gap-2 text-[0.95rem] text-encre xl:inline-flex"
            >
              <Phone size={15} aria-hidden /> <span className="ct-num">{SITE.phone}</span>
            </a>
            <Link
              href="/favoris"
              aria-label={slugs.length ? `Mes favoris (${slugs.length})` : "Mes favoris"}
              className="relative grid size-11 place-items-center rounded-full text-encre transition-colors hover:bg-ombre"
            >
              <Heart size={20} aria-hidden fill={slugs.length ? "currentColor" : "none"} />
              {slugs.length > 0 && (
                <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-porte px-1 text-[10px] font-medium leading-4 text-white">
                  {slugs.length}
                </span>
              )}
            </Link>
            <Link href="/contact" className="ct-btn ct-btn--dark ct-btn--sm hidden md:inline-flex">
              Nous contacter
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Ouvrir le menu"
              aria-expanded={open}
              className="grid size-11 place-items-center rounded-full text-encre transition-colors hover:bg-ombre lg:hidden"
            >
              <Menu size={22} aria-hidden />
            </button>
          </div>
        </div>
        <div className="ct-horizon" aria-hidden />
      </header>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="on-dark fixed inset-0 z-50 flex flex-col bg-nuit text-white lg:hidden"
        >
          <div className="ct-wrap flex h-[4.5rem] items-center justify-between">
            <Logo tone="dark" />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer le menu"
              className="grid size-11 place-items-center rounded-full hover:bg-white/10"
            >
              <X size={22} aria-hidden />
            </button>
          </div>
          <nav aria-label="Menu mobile" className="ct-wrap flex flex-1 flex-col justify-center gap-1 overflow-y-auto py-6">
            {[...NAV, { label: "À propos", href: "/a-propos" }].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="py-2 text-[clamp(2rem,9vw,3rem)] font-light leading-tight tracking-[-0.03em] text-white/95 active:text-ciel"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ct-wrap grid gap-3 pb-8 sm:grid-cols-2">
            <a href={SITE.phoneHref} className="ct-btn ct-btn--light">
              <Phone size={16} aria-hidden /> {SITE.phone}
            </a>
            <Link href="/contact" className="ct-btn ct-btn--outline-light">
              Nous écrire
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

export function SiteChrome() {
  const pathname = usePathname();
  const isCrmRoute = pathname === "/crm" || pathname.startsWith("/crm/");

  if (isCrmRoute) return null;

  return <Header />;
}

export function SiteFooter() {
  const pathname = usePathname();
  const isCrmRoute = pathname === "/crm" || pathname.startsWith("/crm/");

  if (isCrmRoute) return null;

  return <Footer />;
}

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */

export function Footer() {
  return (
    <footer className="on-dark bg-nuit text-white/70">
      <div className="ct-wrap pb-8 pt-16 md:pt-24">
        <div className="grid gap-14 border-b border-white/15 pb-16 lg:grid-cols-[1.35fr_2fr] lg:gap-24">
          <div>
            <Logo tone="dark" />
            <p className="mt-9 max-w-md text-[clamp(2rem,4vw,3.5rem)] font-light leading-[0.98] tracking-[-0.045em] text-white">
              Des lieux qui restent avec vous.
            </p>
            <div className="mt-9 space-y-2 text-[0.95rem]">
              <a href={SITE.phoneHref} className="ct-link ct-num block w-fit text-white">
                {SITE.phone}
              </a>
              <a href={`mailto:${SITE.email}`} className="ct-link block w-fit text-white">
                {SITE.email}
              </a>
              <p className="pt-2 text-white/50">{SITE.hours}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3">
            {FOOTER_GROUPS.map((group) => (
              <div key={group.title}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ciel">{group.title}</p>
                <ul className="mt-5 space-y-3 text-[0.95rem]">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="ct-link text-white/70 hover:text-white">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="grid divide-y divide-white/15 border-b border-white/15 md:grid-cols-3 md:divide-x md:divide-y-0">
          {SITE.offices.map((office) => (
            <div key={office.city} className="py-7 first:md:pr-8 md:px-8 md:first:pl-0 md:last:pr-0">
              <p className="text-base font-normal text-white">{office.city}</p>
              <p className="mt-2 max-w-xs text-sm leading-6 text-white/50">{office.address}</p>
              <a href={`tel:${office.phone.replace(/\s/g, "")}`} className="ct-link ct-num mt-3 inline-block text-sm text-ciel">
                {office.phone}
              </a>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 pt-6 text-sm text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} CieloTerre. Tous droits réservés.</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/mentions-legales" className="ct-link hover:text-white">Mentions légales</Link>
            <Link href="/politique-confidentialite" className="ct-link hover:text-white">Confidentialité</Link>
            <Link href="/conditions" className="ct-link hover:text-white">Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* PageShell — still used by the /auth pages                           */
/* ------------------------------------------------------------------ */

export function PageShell({
  children,
  className = "",
  innerClassName = "",
}: {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <div className="ct">
      <main className={`min-h-[70vh] bg-chaux ${className}`}>
        <div className={`ct-wrap pb-24 pt-32 ${innerClassName}`}>{children}</div>
      </main>
    </div>
  );
}

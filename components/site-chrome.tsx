"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Menu, Search, X } from "lucide-react";
import { useEffect, useState } from "react";

const links = [
  ["Acheter", "/acheter"],
  ["Louer", "/louer"],
  ["Vendre", "/vendre"],
  ["Neuf", "/neuf"],
  ["Agences", "/agences"],
  ["Agents", "/agents"],
  ["Conseils", "/conseils"],
  ["À propos", "/a-propos"],
];

export function Logo({
  dark = false,
  iconOnly = false,
}: {
  dark?: boolean;
  iconOnly?: boolean;
}) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-3 ${dark ? "text-foreground" : "text-background"}`}
      aria-label="cieloterre, accueil"
    >
      <Image
        src={iconOnly ? "/icon.svg" : "/logo.svg"}
        alt="cieloterre"
        width={iconOnly ? 453 : 1503}
        height={iconOnly ? 451 : 368}
        className={iconOnly ? "h-32 w-32 shrink-0" : "h-12 w-auto shrink-0"}
        priority={!iconOnly}
      />
    </Link>
  );
}

export function Header({ dark = false }: { dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll + allow Escape to close the mobile drawer
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const solid = dark || scrolled;

  return (
    <>
      <header
        className={`fixed mx-4 md:mx-32 mt-4 rounded-3xl inset-x-0 top-0 z-40 border-b backdrop-blur-xs transition-all duration-300 motion-reduce:transition-none ${
          solid
            ? "border-surface/10 bg-black/5 text-accent shadow-[0_10px_30px_rgba(116,116,90,0.08)]"
            : "border-transparent bg-transparent text-background"
        }`}
      >
        <div
          className={`mx-auto flex max-w-330 items-center justify-between px-6 transition-all duration-300 motion-reduce:transition-none lg:px-10 ${
            scrolled ? "py-3" : "py-5"
          }`}
        >
          <Logo dark={solid} />

          <nav
            className="hidden items-center gap-8 text-[13px] font-medium tracking-[0.01em] lg:flex"
            aria-label="Navigation principale"
          >
            {links.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="group relative py-1 text-inherit"
              >
                {label}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 -bottom-0.5 h-px origin-center scale-x-0 bg-current transition-transform duration-300 ease-out group-hover:scale-x-100 motion-reduce:transition-none"
                />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/contact"
              className="hidden items-center gap-1.5 rounded-full bg-secondary px-4 py-2.5 text-xs font-bold text-foreground transition-colors hover:bg-earth hover:text-primary-foreground md:inline-flex"
            >
              Parlons de votre projet <ArrowUpRight size={14} />
            </Link>
            <Link
              href="/biens"
              aria-label="Rechercher"
              className="rounded-full border p-2 transition-colors hover:border-primary hover:text-primary"
              style={{ borderColor: "currentColor" }}
            >
              <Search size={17} />
            </Link>
            <button
              className="rounded-full border p-2 lg:hidden"
              style={{ borderColor: "currentColor" }}
              onClick={() => setOpen(true)}
              aria-label="Ouvrir le menu"
              aria-expanded={open}
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-50 flex flex-col bg-surface p-6 text-accent lg:hidden"
        >
          <div className="flex items-center justify-between">
            <Logo />
            <button onClick={() => setOpen(false)} aria-label="Fermer le menu">
              <X />
            </button>
          </div>

          <nav
            className="mt-32 flex flex-col justify-center items-center gap-5 text-4xl leading-tight"

          >
            {links.map(([label, href]) => (
              <Link onClick={() => setOpen(false)} href={href} key={href}>
                {label}
              </Link>
            ))}
                      <div className="mt-auto pt-10">
            <Link
              onClick={() => setOpen(false)}
              href="/contact"
              className="inline-flex items-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              Confier mon bien <ArrowUpRight size={16} className="ml-2" />
            </Link>
          </div>
          </nav>


        </div>
      )}
    </>
  );
}
export function SiteChrome() {
  return <Header />;
}

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
    <>
      <Header dark />
      <main
        className={`relative min-h-screen overflow-hidden bg-background text-accent ${className}`}
      >
        <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-secondary/20 blur-3xl" />
        <div
          className={`relative mx-auto max-w-330 px-6 pb-24 pt-32 lg:px-10 ${innerClassName}`}
        >
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}

export function Footer() {
  return (
    <footer
      className="border-t border-surface bg-background px-6 pb-12 pt-20 text-accent lg:px-10"
    >
      <div className="mx-auto grid max-w-330 gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Logo dark iconOnly />
          <p
            className="mt-5 max-w-xs text-sm leading-6 text-accent"
          >

            Des adresses qui vous ressemblent.
          </p>
        </div>
        {[
          [
            "Découvrir",
            ["Acheter", "/acheter"],
            ["Louer", "/louer"],
            ["Neuf", "/neuf"],
          ],
          [
            "cieloterre",
            ["Nos agences", "/agences"],
            ["Nos agents", "/agents"],
            ["À propos", "/a-propos"],
          ],
          [
            "Nous trouver",
            ["Nous contacter", "/contact"],
          ],
        ].map(([title, ...items]) => (
          <div key={title as string}>
            <p
              className="text-xs font-semibold uppercase tracking-widest text-primary"
            >
              {title as string}
            </p>
            <div
              className="mt-5 flex flex-col gap-3 text-sm text-accent"
            >
              {(items as string[][]).map(([label, href]) => (
                <Link key={label} href={href}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>  
      <div
        className="mx-auto mt-14 flex max-w-330 justify-between border-t border-surface pt-5 text-[11px] text-primary"
      >

        <span>
          © {new Date().getFullYear()} cieloterre. Tous droits réservés.
        </span>
        <div className="flex gap-4">
          <Link href="/mentions-legales">Mentions légales</Link>
          <Link href="/politique-confidentialite">Confidentialité</Link>
          <Link href="/conditions">Conditions</Link>
        </div>
      </div>

    </footer>
  );
}

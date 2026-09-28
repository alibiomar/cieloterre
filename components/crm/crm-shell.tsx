"use client";

import { createElement, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Users,
  UserRoundCog,
  WalletCards,
  FileText,
  Mail,
  Settings,
  BookOpen,
  Menu,
  X,
  NotebookPen,
  Activity as ActivityIcon,
  Globe,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SidebarWeather } from "./sidebar-weather";
import { NotificationBell } from "./notification-bell";
import type { Profile } from "./types";
import Image from "next/image";
const tabs = [
  "Vue d’ensemble",
  "Leads",
  "Contacts",
  "Biens",
  "Visites",
  "Tâches",
  "Notes d'équipe",
  "Équipe",
  "Transactions",
  "Finances",
  "Documents",
  "Conseils",
  "Demandes clients",
  "Activité agents",
  "Mon compte",
  "Site",
] as const;
export type CrmTab = (typeof tabs)[number];

const tabPaths: Record<CrmTab, string> = {
  "Vue d’ensemble": "/crm/dashboard",
  Leads: "/crm/leads",
  Contacts: "/crm/contacts",
  Biens: "/crm/biens",
  Visites: "/crm/visites",
  Tâches: "/crm/taches",
  "Notes d'équipe": "/crm/notes",
  Équipe: "/crm/equipe",
  Transactions: "/crm/transactions",
  Finances: "/crm/finances",
  Documents: "/crm/documents",
  Conseils: "/crm/conseils",
  "Demandes clients": "/crm/demandes",
  "Activité agents": "/crm/activite",
  "Mon compte": "/crm/compte",
  Site: "/crm/site",
};

// Tabs restricted to admins only.
const adminOnlyTabs: CrmTab[] = ["Équipe", "Finances", "Site"];
const navGroups: { label: string; items: CrmTab[] }[] = [
  { label: "Pilotage", items: ["Vue d’ensemble"] },
  { label: "Activité", items: ["Leads", "Contacts", "Biens", "Visites", "Tâches", "Notes d'équipe"] },
  { label: "Administration", items: ["Équipe", "Transactions", "Finances", "Documents", "Conseils", "Demandes clients", "Activité agents", "Mon compte", "Site"] },
];
const tabIconMap: Record<CrmTab, typeof Users> = {
  "Vue d’ensemble": LayoutDashboard,
  Leads: Users,
  Contacts: Users,
  Biens: Building2,
  Visites: CalendarDays,
  Tâches: ClipboardList,
  "Notes d'équipe": NotebookPen,
  Équipe: UserRoundCog,
  Transactions: WalletCards,
  Finances: WalletCards,
  Documents: FileText,
  Conseils: BookOpen,
  "Demandes clients": Mail,
  "Activité agents": ActivityIcon,
  "Mon compte": Settings,
  Site: Globe,
};

const tabDescriptions: Partial<Record<CrmTab, string>> = {
  "Vue d’ensemble": "Les indicateurs de votre activité",
  Leads: "Suivez vos opportunités",
  Contacts: "Votre carnet de contacts",
  Biens: "Gérez votre catalogue",
  Visites: "Votre agenda commercial",
  Tâches: "Les prochaines actions",
  "Notes d'équipe": "Partagez l'essentiel",
  Équipe: "Agents et agences",
  Transactions: "Suivez vos opérations",
  Finances: "Pilotage financier",
  Documents: "Vos fichiers métier",
  Conseils: "Contenus éditoriaux",
  "Demandes clients": "Demandes reçues",
  "Activité agents": "Journal d'activité",
  "Mon compte": "Préférences personnelles",
  Site: "Présence publique",
};

function tabForPath(pathname: string): CrmTab {
  const entry = Object.entries(tabPaths).find(([, path]) => pathname.startsWith(path));
  return (entry?.[0] as CrmTab) ?? "Vue d’ensemble";
}

export function CrmShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = tabForPath(pathname);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [greeting, setGreeting] = useState("Bonjour");

  useEffect(() => {
    const timeBasedGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) return "Bonjour";
      if (hour >= 12 && hour < 18) return "Bon après-midi";
      if (hour >= 18 && hour < 22) return "Bonsoir";
      return "Bonne nuit";
    };
    setGreeting(timeBasedGreeting());
    const interval = setInterval(() => setGreeting(timeBasedGreeting()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileMenuOpen]);

  const signOut = async () => {
    await createClient().auth.signOut();
    window.location.href = "/";
  };
  const goTo = (tab: CrmTab) => {
    setMobileMenuOpen(false);
    router.push(tabPaths[tab]);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-40 bg-earth/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      {/* This sidebar lives in the persistent layout, not in a per-page
          component, so switching sections never remounts or re-fetches it. */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-earth px-5 py-6 text-primary-foreground transition-transform duration-300 lg:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <a href="/" className="flex items-center gap-3">
      <Image
        src={ "/logo.svg"}
        alt="cieloterre"
        width={1503}
        height={368}
        className={"h-12 w-auto shrink-0"}
      />
        </a>
        <button
          type="button"
          aria-label="Fermer le menu"
          className="absolute right-5 top-7 rounded-full p-2 text-primary-foreground/70 hover:bg-background/10 hover:text-primary-foreground lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <X size={20} />
        </button>
        <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">{greeting},</p>
          <p className="mt-1 truncate font-serif text-lg leading-tight">{profile.full_name ?? "Membre de l'équipe"}</p>
          <p className="mt-1 text-[11px] capitalize text-primary-foreground/50">
            {profile.role === "admin" ? "Administrateur" : profile.role === "agency_admin" ? "Responsable d'agence" : "Agent immobilier"}
          </p>
        </div>
        <div className="mt-5">
          <SidebarWeather />
        </div>
        <nav className="mt-7 flex flex-col gap-6" aria-label="Navigation CRM">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter((item) => !adminOnlyTabs.includes(item) || profile.role === "admin");
            if (!visibleItems.length) return null;
            return (
              <div key={group.label}>
                <p className="mb-2 px-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-foreground/40">{group.label}</p>
                <div className="flex flex-col gap-1">
                  {visibleItems.map((item) => (
                    <button
                      key={item}
                      onClick={() => goTo(item)}
                      aria-current={activeTab === item ? "page" : undefined}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] transition-all duration-200 ${activeTab === item ? "bg-primary font-semibold text-foreground shadow-[0_8px_20px_rgba(185,143,114,0.16)]" : "text-primary-foreground/60 hover:bg-white/[0.07] hover:text-primary-foreground"}`}
                    >
                      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${activeTab === item ? "bg-white/20" : "bg-white/[0.05] group-hover:bg-white/10"}`}>
                        {createElement(tabIconMap[item], { size: 15, strokeWidth: activeTab === item ? 2.4 : 1.8 })}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{item}</span>
                      {activeTab === item && <ChevronRight size={14} className="opacity-60" />}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-white/10 pt-4">
        <button
          onClick={() => void signOut()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-primary-foreground/55 transition hover:bg-white/[0.07] hover:text-primary-foreground"
        >
          <LogOut size={17} />
          Se déconnecter
        </button>
        </div>
      </aside>

      <div className="min-w-0 lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-cool-light/80 bg-background/90 px-5 py-4 backdrop-blur-xl sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <button
                type="button"
                aria-label="Ouvrir le menu CRM"
                aria-expanded={mobileMenuOpen}
                className="rounded-xl border border-cool-light p-2 text-foreground lg:hidden"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu size={20} />
              </button>
              <div className="min-w-0">
                <p className="hidden text-[10px] font-bold uppercase tracking-[0.22em] text-accent sm:block">Espace de travail</p>
                <div className="flex min-w-0 items-baseline gap-2">
                  <h1 className="truncate font-serif text-xl sm:text-2xl">{activeTab}</h1>
                  {tabDescriptions[activeTab] && <span className="hidden truncate text-xs text-soft-foreground md:block">· {tabDescriptions[activeTab]}</span>}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <NotificationBell />
              <a
                href="/"
                className="hidden rounded-full border border-cool-light px-4 py-2 text-sm font-semibold text-soft-foreground hover:bg-surface sm:block"
              >
                Voir le site
              </a>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1600px] px-5 py-7 sm:px-8 sm:py-9">{children}</div>
      </div>
    </main>
  );
}

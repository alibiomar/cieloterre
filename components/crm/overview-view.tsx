"use client";

import Link from "next/link";
import { AlertTriangle, CalendarDays, ClipboardList, TrendingUp, Users } from "lucide-react";
import { formatDate, formatDateTime, isOverdueDate } from "./ui";

type StatusCount = { status: string; count: number };
type DayCount = { date: string; count: number };

const statusLabels: Record<string, string> = {
  new: "Nouveaux",
  contacted: "Contactés",
  qualified: "Qualifiés",
  visit_scheduled: "Visites",
  won: "Gagnés",
  lost: "Perdus",
};

function Metric({
  label,
  value,
  icon: Icon,
  href,
  alert,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  href: string;
  alert?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-2xl border bg-background p-5 transition hover:border-earth/40 hover:shadow-sm ${alert && value > 0 ? "border-primary/40" : "border-cool-light"}`}
    >
      <div className={`grid h-10 w-10 place-items-center rounded-xl ${alert && value > 0 ? "bg-primary/10 text-primary" : "bg-surface text-muted-foreground"}`}>
        <Icon size={19} />
      </div>
      <p className="mt-5 text-sm text-soft-foreground">{label}</p>
      <p className="mt-1 font-serif text-3xl">
        {value}
        {label.startsWith("Conversion") ? <span className="ml-1 text-lg">%</span> : null}
      </p>
    </Link>
  );
}

function LeadsByStatusChart({ data }: { data: StatusCount[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex items-end gap-3 pt-4" style={{ height: 160 }}>
      {data.map((entry) => (
        <div key={entry.status} className="flex flex-1 flex-col items-center gap-2">
          <span className="text-xs font-semibold">{entry.count}</span>
          <div
            className={`w-full rounded-t-lg ${entry.status === "won" ? "bg-accent/80" : entry.status === "lost" ? "bg-primary/50" : "bg-earth/80"}`}
            style={{ height: `${Math.max((entry.count / max) * 110, entry.count > 0 ? 6 : 2)}px` }}
          />
          <span className="text-center text-[10px] uppercase tracking-wide text-soft-foreground">
            {statusLabels[entry.status] ?? entry.status}
          </span>
        </div>
      ))}
    </div>
  );
}

function VisitsTrendChart({ data }: { data: DayCount[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const width = 560;
  const height = 120;
  const stepX = data.length > 1 ? width / (data.length - 1) : width;
  const points = data.map((d, i) => {
    const x = i * stepX;
    const y = height - (d.count / max) * (height - 12) - 4;
    return `${x},${y}`;
  });
  const areaPoints = `0,${height} ${points.join(" ")} ${width},${height}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 w-full" preserveAspectRatio="none">
      <polyline points={areaPoints} fill="var(--surface, #f0ece6)" stroke="none" />
      <polyline points={points.join(" ")} fill="none" stroke="var(--earth, #6b5a4a)" strokeWidth={2.5} />
      {data.map((d, i) => (
        <circle key={d.date} cx={i * stepX} cy={height - (d.count / max) * (height - 12) - 4} r={d.count > 0 ? 3 : 0} fill="var(--earth, #6b5a4a)" />
      ))}
    </svg>
  );
}

export function OverviewView({
  stats,
  leadsByStatus,
  visitsTrend,
  recentLeads,
  openTasks,
  nextVisits,
  todayVisits,
}: {
  stats: {
    activeLeads: number;
    contacts: number;
    openTasks: number;
    upcomingVisits: number;
    publishedProperties: number;
    totalProperties: number;
    pendingRequests: number;
    overdueTasks: number;
    todayVisits: number;
    wonLeads: number;
    lostLeads: number;
  };
  leadsByStatus: StatusCount[];
  visitsTrend: DayCount[];
  recentLeads: any[];
  openTasks: any[];
  nextVisits: any[];
  todayVisits: any[];
}) {
  const closed = stats.wonLeads + stats.lostLeads;
  const winRate = closed > 0 ? Math.round((stats.wonLeads / closed) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Leads actifs" value={stats.activeLeads} icon={Users} href="/crm/leads" />
        <Metric label="Tâches en retard" value={stats.overdueTasks} icon={AlertTriangle} href="/crm/taches" alert />
        <Metric label="Visites aujourd'hui" value={stats.todayVisits} icon={CalendarDays} href="/crm/visites" />
        <Metric label="Conversion (gagnés / clos)" value={winRate} icon={TrendingUp} href="/crm/leads" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Contacts" value={stats.contacts} icon={Users} href="/crm/contacts" />
        <Metric label="Tâches ouvertes" value={stats.openTasks} icon={ClipboardList} href="/crm/taches" />
        <Metric label="Visites à venir (7j)" value={stats.upcomingVisits} icon={CalendarDays} href="/crm/visites" />
        <Metric label="Demandes de visite" value={stats.pendingRequests} icon={CalendarDays} href="/crm/visites" alert={stats.pendingRequests > 0} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="rounded-2xl border border-cool-light bg-background p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">À traiter aujourd'hui</p>
              <h3 className="mt-1 font-serif text-xl">Agenda du jour</h3>
            </div>
            <Link href="/crm/visites" className="text-xs font-semibold text-primary">
              Planning →
            </Link>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {todayVisits.map((visit) => (
              <Link
                key={visit.id}
                href="/crm/visites"
                className="flex items-center justify-between rounded-xl border border-cool-light bg-background px-4 py-3 text-sm hover:bg-surface"
              >
                <div>
                  <p className="font-semibold">{visit.properties?.title ?? "Bien supprimé"}</p>
                  <p className="text-xs text-soft-foreground">{visit.contacts?.full_name ?? "Contact non renseigné"}</p>
                </div>
                <span className="text-xs font-semibold text-accent">{formatDateTime(visit.scheduled_at)}</span>
              </Link>
            ))}
            {todayVisits.length === 0 && (
              <p className="py-6 text-center text-sm text-soft-foreground">Aucune visite prévue aujourd'hui.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-cool-light bg-background p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl">Catalogue</h3>
            <Link href="/crm/biens" className="text-xs font-semibold text-primary">
              Gérer →
            </Link>
          </div>
          <p className="mt-4 font-serif text-4xl">
            {stats.publishedProperties}
            <span className="ml-2 text-base font-sans text-soft-foreground">/ {stats.totalProperties} publiés</span>
          </p>
          <p className="mt-3 text-sm text-soft-foreground">
            {stats.wonLeads} affaire{stats.wonLeads > 1 ? "s" : ""} gagnée{stats.wonLeads > 1 ? "s" : ""} · {stats.lostLeads} perdue{stats.lostLeads > 1 ? "s" : ""}
          </p>
          {stats.pendingRequests > 0 && (
            <Link href="/crm/visites" className="mt-4 block w-full rounded-xl bg-surface px-4 py-3 text-left text-sm font-semibold text-accent">
              {stats.pendingRequests} demande{stats.pendingRequests > 1 ? "s" : ""} de visite à traiter →
            </Link>
          )}
        </section>

        <section className="rounded-2xl border border-cool-light bg-background p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Analytique</p>
              <h3 className="mt-1 font-serif text-xl">Pipeline commercial</h3>
            </div>
            <Link href="/crm/leads" className="text-xs font-semibold text-primary">
              Voir le pipeline →
            </Link>
          </div>
          <LeadsByStatusChart data={leadsByStatus} />
        </section>

        <section className="rounded-2xl border border-cool-light bg-background p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl">Tâches ouvertes</h3>
            <Link href="/crm/taches" className="text-xs font-semibold text-primary">
              Voir tout →
            </Link>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {openTasks.map((task) => {
              const overdue = isOverdueDate(task.due_date, task.status);
              return (
                <Link
                  key={task.id}
                  href="/crm/taches"
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold hover:bg-surface ${overdue ? "border-primary/40 text-primary" : "border-cool-light"}`}
                >
                  <span className="block">{task.title}</span>
                  {task.due_date && (
                    <span className={`mt-1 block text-xs font-normal ${overdue ? "text-primary" : "text-soft-foreground"}`}>
                      {overdue ? "En retard · " : "Échéance · "}
                      {formatDate(task.due_date)}
                    </span>
                  )}
                </Link>
              );
            })}
            {openTasks.length === 0 && (
              <p className="py-6 text-center text-sm text-soft-foreground">Rien à faire, bravo !</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-cool-light bg-background p-5 lg:col-span-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Analytique</p>
              <h3 className="mt-1 font-serif text-xl">Visites planifiées — 14 derniers jours</h3>
            </div>
          </div>
          <VisitsTrendChart data={visitsTrend} />
        </section>

        <section className="rounded-2xl border border-cool-light bg-background p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl">Derniers leads</h3>
            <Link href="/crm/leads" className="text-xs font-semibold text-primary">
              Voir le pipeline →
            </Link>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {recentLeads.map((lead) => (
              <Link
                key={lead.id}
                href="/crm/leads"
                className="flex items-center justify-between rounded-xl border border-cool-light bg-background px-4 py-3 text-sm hover:bg-surface"
              >
                <div>
                  <p className="font-semibold">{lead.contacts?.full_name ?? "Sans nom"}</p>
                  <p className="text-xs text-soft-foreground">{lead.properties?.title ?? "Projet immobilier"}</p>
                </div>
                <span className="rounded-full bg-background px-2.5 py-1 text-[10px] font-bold uppercase text-soft-foreground">
                  {statusLabels[lead.status] ?? lead.status}
                </span>
              </Link>
            ))}
            {recentLeads.length === 0 && (
              <p className="py-6 text-center text-sm text-soft-foreground">Aucun lead pour le moment.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-cool-light bg-background p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl">Prochaines visites</h3>
            <Link href="/crm/visites" className="text-xs font-semibold text-primary">
              Voir →
            </Link>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {nextVisits.map((visit) => (
              <Link
                key={visit.id}
                href="/crm/visites"
                className="rounded-xl border border-cool-light bg-background px-4 py-3 text-sm hover:bg-surface"
              >
                <p className="font-semibold">{visit.properties?.title ?? "Bien supprimé"}</p>
                <p className="text-xs text-soft-foreground">
                  {visit.contacts?.full_name ?? "Contact non renseigné"} · {formatDateTime(visit.scheduled_at)}
                </p>
              </Link>
            ))}
            {nextVisits.length === 0 && (
              <p className="py-6 text-center text-sm text-soft-foreground">Aucune visite planifiée.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

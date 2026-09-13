"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, CheckCircle2, FilePlus2, MessageSquare, Phone, StickyNote, Users, CalendarClock } from "lucide-react";
import { fieldClass, formatDateTime } from "./ui";
import { AgencyPickerScreen, AgencyScopeBar, type AgencyScopeSummary } from "./agency-picker";
import type { CrmActivity } from "./types";

const activityMeta: Record<string, { label: string; icon: typeof Activity }> = {
  created: { label: "Création", icon: FilePlus2 },
  status_changed: { label: "Changement de statut", icon: Activity },
  assigned: { label: "Attribution", icon: Users },
  note_added: { label: "Note ajoutée", icon: StickyNote },
  called: { label: "Appel", icon: Phone },
  emailed: { label: "Email", icon: MessageSquare },
  viewing_scheduled: { label: "Visite planifiée", icon: CalendarClock },
  task_completed: { label: "Tâche terminée", icon: CheckCircle2 },
};

type AgentOption = { id: string; email: string | null; profiles: { full_name: string | null; role: string } | null };

export function ActivityView({ notify, currentUserId, isAdmin }: { notify: (message: string) => void; currentUserId?: string; isAdmin?: boolean }) {
  const [agencySummaries, setAgencySummaries] = useState<AgencyScopeSummary[] | null>(null);
  const [loadingAgencies, setLoadingAgencies] = useState(Boolean(isAdmin));
  const [selectedAgency, setSelectedAgency] = useState<AgencyScopeSummary | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoadingAgencies(true);
      const response = await fetch("/api/crm/activity/agencies");
      const result = await response.json();
      if (!response.ok) notify(result.error ?? "Impossible de charger les agences.");
      setAgencySummaries(response.ok ? result.agencies : []);
      setLoadingAgencies(false);
    })();
  }, [isAdmin]);

  if (isAdmin && !selectedAgency) {
    if (loadingAgencies) return <p className="text-sm text-soft-foreground">Chargement des agences...</p>;
    return (
      <AgencyPickerScreen
        title="Activité des agents"
        subtitle="Choisissez une agence pour consulter le journal d'activité de ses agents."
        agencies={agencySummaries ?? []}
        countLabel={(n) => `${n} évènement${n > 1 ? "s" : ""}`}
        onSelect={setSelectedAgency}
      />
    );
  }

  return (
    <ActivityLog
      notify={notify}
      currentUserId={currentUserId}
      isAdmin={isAdmin}
      agencyId={selectedAgency?.id}
      agencyName={selectedAgency?.name}
      onBack={isAdmin ? () => setSelectedAgency(null) : undefined}
    />
  );
}

function ActivityLog({
  notify,
  isAdmin,
  agencyId,
  agencyName,
  onBack,
}: {
  notify: (message: string) => void;
  currentUserId?: string;
  isAdmin?: boolean;
  agencyId?: string;
  agencyName?: string;
  onBack?: () => void;
}) {
  const [activity, setActivity] = useState<CrmActivity[]>([]);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [actorFilter, setActorFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  async function load(actorId: string, type: string) {
    setLoading(true);
    const params = new URLSearchParams();
    if (actorId) params.set("actorId", actorId);
    if (type) params.set("type", type);
    if (agencyId) params.set("agencyId", agencyId);
    const response = await fetch(`/api/crm/activity?${params.toString()}`);
    const result = await response.json();
    if (!response.ok) notify(result.error ?? "Impossible de charger l'activité.");
    setActivity(response.ok ? result.activity : []);
    if (response.ok) setAgents(result.agents ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load(actorFilter, typeFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actorFilter, typeFilter, agencyId]);

  const counts = useMemo(() => {
    const byType: Record<string, number> = {};
    for (const entry of activity) byType[entry.activity_type] = (byType[entry.activity_type] ?? 0) + 1;
    return byType;
  }, [activity]);

  return (
    <div className="space-y-6">
      {onBack && agencyName && <AgencyScopeBar agencyName={agencyName} onBack={onBack} />}
      <div className="border-b border-cool-light pb-6">
        <p className="eyebrow">Supervision</p>
        <h2 className="mt-2 font-serif text-4xl tracking-tight">{agencyName ? `Activité · ${agencyName}` : "Activité des agents"}</h2>
        <p className="mt-2 max-w-2xl text-sm text-soft-foreground">
          Journal en lecture seule des actions effectuées par l'équipe — créations, changements de statut, visites planifiées, notes, tâches.
          {isAdmin ? "" : " Limité à votre agence."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-soft-foreground">Agent</label>
          <select className={fieldClass} value={actorFilter} onChange={(event) => setActorFilter(event.target.value)}>
            <option value="">Tous les agents</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {(Array.isArray(agent.profiles) ? agent.profiles[0]?.full_name : agent.profiles?.full_name) ?? agent.email ?? agent.id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-soft-foreground">Type d'action</label>
          <select className={fieldClass} value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="">Tous les types</option>
            {Object.entries(activityMeta).map(([key, meta]) => (
              <option key={key} value={key}>{meta.label}{counts[key] ? ` (${counts[key]})` : ""}</option>
            ))}
          </select>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-cool-light bg-background">
        <div className="border-b border-cool-light px-5 py-4">
          <h3 className="font-semibold">Journal d'activité</h3>
          <p className="mt-1 text-xs text-soft-foreground">{activity.length} évènement{activity.length > 1 ? "s" : ""}</p>
        </div>
        {loading ? (
          <p className="px-5 py-10 text-sm text-soft-foreground">Chargement de l'activité...</p>
        ) : activity.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Activity className="mx-auto text-soft-foreground" size={28} />
            <p className="mt-3 font-serif text-2xl">Aucune activité enregistrée</p>
            <p className="mt-2 text-sm text-soft-foreground">Les actions des agents apparaîtront ici automatiquement.</p>
          </div>
        ) : (
          <div className="divide-y divide-cool-light">
            {activity.map((entry) => {
              const meta = activityMeta[entry.activity_type] ?? { label: entry.activity_type, icon: Activity };
              const Icon = meta.icon;
              const subject = entry.leads?.contacts?.full_name ?? entry.contacts?.full_name ?? null;
              return (
                <div key={entry.id} className="flex items-start gap-4 px-5 py-4">
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface text-primary"><Icon size={16} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{entry.profiles?.full_name ?? "Agent"}</p>
                      <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] capitalize text-soft-foreground">{entry.profiles?.role ?? ""}</span>
                      <span className="text-xs text-soft-foreground">· {meta.label}</span>
                      {subject && <span className="text-xs text-soft-foreground">· {subject}</span>}
                    </div>
                    {entry.body && <p className="mt-1 truncate text-sm text-soft-foreground">{entry.body}</p>}
                  </div>
                  <time className="shrink-0 text-xs text-soft-foreground">{formatDateTime(entry.created_at)}</time>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}


"use client";

import { Building2, ChevronLeft } from "lucide-react";
import { formatDateTime } from "./ui";

export type AgencyScopeSummary = {
  id: string;
  name: string;
  memberCount: number;
  count: number;
  lastActivity: string | null;
};

/**
 * Full-screen "pick an agency" step shown to admins before they enter a
 * per-agency list (leads, contacts, biens, tâches, visites, activité...).
 * Agents/agency_admins never see this — they're routed straight into their
 * own agency's data.
 */
export function AgencyPickerScreen({
  title,
  subtitle,
  agencies,
  onSelect,
  countLabel,
  emptyLabel = "Aucune agence",
  extra,
}: {
  title: string;
  subtitle: string;
  agencies: AgencyScopeSummary[];
  onSelect: (agency: AgencyScopeSummary) => void;
  countLabel: (count: number) => string;
  emptyLabel?: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-cool-light pb-6 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Choisir une agence</p>
          <h2 className="mt-2 font-serif text-4xl tracking-tight">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm text-soft-foreground">{subtitle}</p>
        </div>
        {extra}
      </div>

      {agencies.length === 0 ? (
        <div className="rounded-2xl border border-cool-light bg-background px-5 py-12 text-center">
          <Building2 className="mx-auto text-soft-foreground" size={28} />
          <p className="mt-3 font-serif text-2xl">{emptyLabel}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agencies.map((agency) => (
            <button
              key={agency.id}
              type="button"
              onClick={() => onSelect(agency)}
              className="rounded-2xl border border-cool-light bg-background p-5 text-left transition hover:border-primary hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="grid size-9 place-items-center rounded-lg bg-surface text-primary">
                  <Building2 size={17} />
                </div>
                {agency.count > 0 && (
                  <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-soft-foreground">
                    {countLabel(agency.count)}
                  </span>
                )}
              </div>
              <p className="mt-4 font-serif text-xl">{agency.name}</p>
              <p className="mt-1 text-xs text-soft-foreground">
                {agency.memberCount} membre{agency.memberCount !== 1 ? "s" : ""}
                {agency.lastActivity ? ` · dernière activité ${formatDateTime(agency.lastActivity)}` : " · aucune activité"}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Small "‹ Agences · Agency Name" bar shown atop a list once an admin has picked an agency. */
export function AgencyScopeBar({ agencyName, onBack }: { agencyName: string; onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-cool-light bg-background px-3 py-1.5 text-xs font-semibold text-soft-foreground transition hover:border-primary hover:text-primary"
    >
      <ChevronLeft size={14} /> Agences <span className="text-foreground">· {agencyName}</span>
    </button>
  );
}

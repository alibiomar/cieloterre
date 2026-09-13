"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Search, X } from "lucide-react";
import type { CrmProperty, Lead } from "./types";
import { crmPageHref, formatPrice, Modal, fieldClass, labelClass } from "./ui";
import { Pagination } from "./pagination";
import type { PaginationMeta } from "./contacts-view";
import { AgencyScopeBar } from "./agency-picker";

const stages = [
  ["new", "Nouveaux"],
  ["contacted", "Contactés"],
  ["qualified", "Qualifiés"],
  ["visit_scheduled", "Visites"],
  ["won", "Gagnés"],
  ["lost", "Perdus"],
] as const;
const stageColors: Record<string, string> = {
  new: "bg-surface text-muted-foreground",
  contacted: "bg-surface text-primary",
  qualified: "bg-surface text-muted-foreground",
  visit_scheduled: "bg-surface text-accent",
  won: "bg-surface text-accent",
  lost: "bg-surface text-primary",
};

export function LeadsView({
  leads,
  properties,
  onLeadsChange,
  notify,
  pagination,
  isAdmin,
  agencyName,
  agencyId,
  onBackToAgencies,
}: {
  leads: Lead[];
  properties: CrmProperty[];
  onLeadsChange: (leads: Lead[]) => void;
  notify: (message: string) => void;
  pagination?: PaginationMeta;
  isAdmin?: boolean;
  agencyName?: string | null;
  agencyId?: string | null;
  onBackToAgencies?: () => void;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [busy, setBusy] = useState(false);
  const [groupByAgency, setGroupByAgency] = useState(false);
  const filtered = useMemo(() => {
    const bySearch = leads.filter((lead) =>
      `${lead.contacts?.full_name ?? ""} ${lead.contacts?.email ?? ""} ${lead.properties?.title ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
    if (!isAdmin || !groupByAgency) return bySearch;
    return [...bySearch].sort((a, b) =>
      (a.agency_name ?? "\uffff").localeCompare(b.agency_name ?? "\uffff"),
    );
  }, [leads, search, isAdmin, groupByAgency]);

  const updateStatus = async (id: string, status: string) => {
    setBusy(true);
    const response = await fetch(`/api/crm/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await response.json().catch(() => null);
    if (response.ok && data?.lead)
      onLeadsChange(leads.map((lead) => (lead.id === id ? data.lead : lead)));
    else notify(data?.error ?? "Le statut du lead n'a pas pu être mis à jour.");
    setBusy(false);
  };
  const deleteLead = async (id: string) => {
    const response = await fetch(`/api/crm/leads/${id}`, { method: "DELETE" });
    if (response.ok) {
      onLeadsChange(leads.filter((lead) => lead.id !== id));
      notify("Lead supprimé");
    } else notify("Le lead n'a pas pu être supprimé.");
  };

  return (
    <section className="rounded-2xl border border-cool-light bg-background p-5 sm:p-6">
      {onBackToAgencies && agencyName && <AgencyScopeBar agencyName={agencyName} onBack={onBackToAgencies} />}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="eyebrow">Pipeline commercial</p>
          <h2 className="mt-2 font-serif text-2xl">
            {agencyName ? `Leads · ${agencyName}` : "Vos opportunités récentes"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setGroupByAgency((v) => !v)}
              aria-pressed={groupByAgency}
              className={`whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold ${groupByAgency ? "border-earth bg-earth text-primary-foreground" : "border-cool-light text-soft-foreground"}`}
            >
              Trier par agence
            </button>
          )}
          <label className="flex items-center gap-2 rounded-full border border-cool-light bg-background px-3 py-2 text-sm text-soft-foreground">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher"
              className="w-32 bg-transparent outline-none placeholder:text-muted-foreground sm:w-44"
            />
          </label>
          <button
            onClick={() => setShowModal(true)}
            className="whitespace-nowrap rounded-full bg-earth px-4 py-2.5 text-xs font-semibold text-primary-foreground"
          >
            + Nouveau lead
          </button>
        </div>
      </div>
      <p className="mt-4 text-xs text-soft-foreground">Glissez une carte d'une colonne à l'autre pour changer le statut.</p>
      <div className="mt-3 flex gap-4 overflow-x-auto pb-2">
        {stages.map(([status, label]) => (
          <div
            key={status}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const id = event.dataTransfer.getData("text/plain");
              const lead = leads.find((item) => item.id === id);
              if (lead && lead.status !== status) void updateStatus(id, status);
            }}
            className="min-h-48 min-w-[220px] flex-1 rounded-xl bg-surface/40 p-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-soft-foreground">
                {label}
              </p>
              <span className="grid h-6 w-6 place-items-center rounded-full bg-background text-xs font-bold">
                {filtered.filter((lead) => lead.status === status).length}
              </span>
            </div>
            <div className="mt-3 flex flex-col gap-3">
              {filtered
                .filter((lead) => lead.status === status)
                .map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    busy={busy}
                    isAdmin={isAdmin}
                    onStatus={updateStatus}
                    onDelete={deleteLead}
                    onEdit={() => setEditing(lead)}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
      {pagination && !search && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          pageSize={pagination.pageSize}
          onPageChange={(page) => router.push(crmPageHref("/crm/leads", page, agencyId))}
        />
      )}
      {showModal && (
        <NewLeadModal
          properties={properties}
          onClose={() => setShowModal(false)}
          onCreated={(lead) => {
            onLeadsChange([lead, ...leads]);
            setShowModal(false);
            notify("Lead créé");
          }}
        />
      )}
      {editing && (
        <EditLeadModal
          lead={editing}
          properties={properties}
          onClose={() => setEditing(null)}
          onSaved={(lead) => {
            onLeadsChange(leads.map((item) => (item.id === lead.id ? lead : item)));
            setEditing(null);
            notify("Lead mis à jour");
          }}
        />
      )}
    </section>
  );
}

function LeadCard({
  lead,
  busy,
  isAdmin,
  onStatus,
  onDelete,
  onEdit,
}: {
  lead: Lead;
  busy: boolean;
  isAdmin?: boolean;
  onStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onEdit: () => void;
}) {
  return (
    <article
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", lead.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      className="cursor-grab rounded-xl border border-cool-light bg-background p-3 shadow-sm active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">
            {lead.contacts?.full_name ?? "Contact sans nom"}
          </p>
          <p className="mt-1 line-clamp-1 text-xs text-soft-foreground">
            {lead.properties?.title ?? "Projet immobilier"}
            {lead.properties ? ` · ${formatPrice(lead.properties.price)}` : ""}
          </p>
          {isAdmin && (
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-primary">
              {lead.agency_name ?? "Sans agence"}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span
            className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${stageColors[lead.priority] ?? "bg-gray-100"}`}
          >
            {lead.priority}
          </span>
          <button
            onClick={onEdit}
            aria-label="Modifier"
            className="rounded-full p-1 text-muted-foreground/70 hover:bg-surface hover:text-primary"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(lead.id)}
            aria-label="Supprimer"
            className="rounded-full p-1 text-muted-foreground/70 hover:bg-surface hover:text-primary"
          >
            <X size={13} />
          </button>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-xs leading-5 text-soft-foreground">
        {lead.message ?? "Aucun message renseigné."}
      </p>
      <select
        disabled={busy}
        value={lead.status}
        onChange={(event) => onStatus(lead.id, event.target.value)}
        className="mt-3 w-full rounded-lg border border-cool-light bg-background px-2 py-2 text-xs"
      >
        <option value="new">Nouveau</option>
        <option value="contacted">Contacté</option>
        <option value="qualified">Qualifié</option>
        <option value="visit_scheduled">Visite</option>
        <option value="won">Gagné</option>
        <option value="lost">Perdu</option>
      </select>
    </article>
  );
}

function NewLeadModal({
  properties,
  onClose,
  onCreated,
}: {
  properties: CrmProperty[];
  onClose: () => void;
  onCreated: (lead: Lead) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    propertyId: "",
    priority: "normal",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const response = await fetch("/api/crm/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    if (!response.ok) setError(data.error ?? "Impossible de créer le lead");
    else onCreated(data.lead);
    setSaving(false);
  };
  return (
    <Modal title="Créer un lead" onClose={onClose}>
      <form onSubmit={submit} className="mt-6 grid gap-4">
        <input
          required
          placeholder="Nom complet"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          className={fieldClass}
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          className={fieldClass}
        />
        <input
          placeholder="Téléphone"
          value={form.phone}
          onChange={(event) => setForm({ ...form, phone: event.target.value })}
          className={fieldClass}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <label className={labelClass}>Bien concerné</label>
            <select
              value={form.propertyId}
              onChange={(event) => setForm({ ...form, propertyId: event.target.value })}
              className={fieldClass}
            >
              <option value="">— Aucun —</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.title}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <label className={labelClass}>Priorité</label>
            <select
              value={form.priority}
              onChange={(event) => setForm({ ...form, priority: event.target.value })}
              className={fieldClass}
            >
              <option value="low">Basse</option>
              <option value="normal">Normale</option>
              <option value="high">Haute</option>
            </select>
          </div>
        </div>
        <textarea
          required
          placeholder="Projet et besoin"
          rows={4}
          value={form.message}
          onChange={(event) =>
            setForm({ ...form, message: event.target.value })
          }
          className={fieldClass}
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          disabled={saving}
          className="rounded-full bg-earth px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {saving ? "Création..." : "Créer le lead"}
        </button>
      </form>
    </Modal>
  );
}

function EditLeadModal({
  lead,
  properties,
  onClose,
  onSaved,
}: {
  lead: Lead;
  properties: CrmProperty[];
  onClose: () => void;
  onSaved: (lead: Lead) => void;
}) {
  const [form, setForm] = useState({
    status: lead.status,
    priority: lead.priority,
    propertyId: lead.properties?.id ?? "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const response = await fetch(`/api/crm/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: form.status,
        priority: form.priority,
        property_id: form.propertyId || null,
      }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) setError(data?.error ?? "Impossible d'enregistrer le lead");
    else onSaved(data.lead);
    setSaving(false);
  };

  return (
    <Modal title={`Modifier — ${lead.contacts?.full_name ?? "Lead"}`} onClose={onClose}>
      <form onSubmit={submit} className="mt-6 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <label className={labelClass}>Statut</label>
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className={fieldClass}>
              <option value="new">Nouveau</option>
              <option value="contacted">Contacté</option>
              <option value="qualified">Qualifié</option>
              <option value="visit_scheduled">Visite</option>
              <option value="won">Gagné</option>
              <option value="lost">Perdu</option>
            </select>
          </div>
          <div className="grid gap-1.5">
            <label className={labelClass}>Priorité</label>
            <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })} className={fieldClass}>
              <option value="low">Basse</option>
              <option value="normal">Normale</option>
              <option value="high">Haute</option>
            </select>
          </div>
        </div>
        <div className="grid gap-1.5">
          <label className={labelClass}>Bien concerné</label>
          <select value={form.propertyId} onChange={(event) => setForm({ ...form, propertyId: event.target.value })} className={fieldClass}>
            <option value="">— Aucun —</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.title}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button disabled={saving} className="rounded-full bg-earth px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>
    </Modal>
  );
}

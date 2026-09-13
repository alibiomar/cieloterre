"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Mail, Pencil, Phone, Plus } from "lucide-react";
import type { Contact, CrmProperty, Visit, ViewingRequest } from "./types";
import {
  ConfirmButton,
  Modal,
  crmPageHref,
  fieldClass,
  formatDateTime,
  isOverdueDate,
  isSameTunisDay,
  labelClass,
  toDatetimeLocal,
} from "./ui";
import { Pagination } from "./pagination";
import type { PaginationMeta } from "./contacts-view";
import { AgencyScopeBar } from "./agency-picker";

const statusLabels: Record<string, string> = {
  scheduled: "Planifiée",
  completed: "Terminée",
  cancelled: "Annulée",
  no_show: "Absence",
};
const statusColors: Record<string, string> = {
  scheduled: "bg-surface text-accent",
  completed: "bg-surface text-muted-foreground",
  cancelled: "bg-surface text-primary",
  no_show: "bg-background text-soft-foreground",
};

export function VisitsView({
  visits,
  onVisitsChange,
  viewingRequests,
  onViewingRequestsChange,
  contacts,
  properties,
  notify,
  pagination,
  isAdmin,
  agencyName,
  agencyId,
  onBackToAgencies,
}: {
  visits: Visit[];
  onVisitsChange: (visits: Visit[]) => void;
  viewingRequests: ViewingRequest[];
  onViewingRequestsChange: (requests: ViewingRequest[]) => void;
  contacts: Contact[];
  properties: CrmProperty[];
  notify: (message: string) => void;
  pagination?: PaginationMeta;
  isAdmin?: boolean;
  agencyName?: string | null;
  agencyId?: string | null;
  onBackToAgencies?: () => void;
}) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [converting, setConverting] = useState<ViewingRequest | null>(null);
  const [editing, setEditing] = useState<Visit | null>(null);

  const setStatus = async (visit: Visit, status: string) => {
    const response = await fetch(`/api/crm/visits/${visit.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (response.ok)
      onVisitsChange(
        visits.map((item) =>
          item.id === visit.id ? { ...item, status } : item,
        ),
      );
    else notify("Le statut de la visite n'a pas pu être mis à jour.");
  };
  const deleteVisit = async (id: string) => {
    const response = await fetch(`/api/crm/visits/${id}`, { method: "DELETE" });
    if (response.ok) {
      onVisitsChange(visits.filter((visit) => visit.id !== id));
      notify("Visite supprimée");
    } else notify("La visite n'a pas pu être supprimée.");
  };
  const declineRequest = async (id: string) => {
    const response = await fetch(`/api/crm/viewing-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    if (response.ok) {
      onViewingRequestsChange(
        viewingRequests.filter((request) => request.id !== id),
      );
      notify("Demande déclinée");
    }
  };

  return (
    <div className="grid gap-6">
      {onBackToAgencies && agencyName && <AgencyScopeBar agencyName={agencyName} onBack={onBackToAgencies} />}
      {viewingRequests.length > 0 && (
        <section className="rounded-2xl border border-cool-light bg-background p-5 sm:p-6">
          <p className="eyebrow">Depuis le site</p>
          <h2 className="mt-2 font-serif text-2xl">
            Demandes de visite à traiter
          </h2>
          <div className="mt-5 grid gap-3">
            {viewingRequests.map((request) => (
              <article
                key={request.id}
                className="flex flex-col justify-between gap-3 rounded-xl border border-cool-light bg-background p-4 sm:flex-row sm:items-center"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {request.name}{" "}
                    <span className="font-normal text-soft-foreground">
                      — {request.properties?.title ?? "Bien supprimé"}
                    </span>
                  </p>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-soft-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Mail size={12} />
                      {request.email}
                    </span>
                    {request.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone size={12} />
                        {request.phone}
                      </span>
                    )}
                  </div>
                  {request.message && (
                    <p className="mt-2 max-w-xl text-xs text-soft-foreground">
                      {request.message}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2 text-xs font-semibold">
                  <button
                    onClick={() => setConverting(request)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-earth px-3 py-1.5 text-primary-foreground"
                  >
                    <CalendarPlus size={13} />
                    Planifier
                  </button>
                  <ConfirmButton
                    label="Décliner"
                    confirmLabel="Confirmer"
                    onConfirm={() => declineRequest(request.id)}
                    className="rounded-full border border-cool-light px-3 py-1.5 hover:bg-background"
                  />
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-cool-light bg-background p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="eyebrow">Planning</p>
            <h2 className="mt-2 font-serif text-2xl">{agencyName ? `Visites · ${agencyName}` : "Visites"}</h2>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-earth px-4 py-2.5 text-xs font-semibold text-primary-foreground"
          >
            <Plus size={14} />
            Visite
          </button>
        </div>
        <div className="mt-6 grid gap-3">
          {visits.map((visit) => {
            const today = visit.status === "scheduled" && isSameTunisDay(visit.scheduled_at);
            const overdue = visit.status === "scheduled" && isOverdueDate(visit.scheduled_at);
            return (
            <article
              key={visit.id}
              className={`flex flex-col justify-between gap-3 rounded-xl border bg-background p-4 sm:flex-row sm:items-center ${overdue ? "border-primary/40" : today ? "border-accent/40" : "border-cool-light"}`}
            >
              <div>
                <p className="text-sm font-semibold">
                  {formatDateTime(visit.scheduled_at)} ·{" "}
                  {visit.properties?.title ?? "Bien supprimé"}
                  {today && <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-accent">Aujourd'hui</span>}
                  {overdue && <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-primary">En retard</span>}
                </p>
                <p className="mt-1 text-xs text-soft-foreground">
                  {visit.contacts?.full_name ?? "Contact non renseigné"}
                  {visit.contacts?.phone ? ` · ${visit.contacts.phone}` : ""}
                </p>
                {visit.notes && (
                  <p className="mt-2 max-w-xl text-xs text-soft-foreground">
                    {visit.notes}
                  </p>
                )}
                {isAdmin && (
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                    {visit.agency_name ?? "Sans agence"}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2 text-xs font-semibold">
                <select
                  value={visit.status}
                  onChange={(event) => setStatus(visit, event.target.value)}
                  className={`rounded-full px-3 py-1.5 ${statusColors[visit.status] ?? statusColors.scheduled}`}
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setEditing(visit)}
                  title="Modifier"
                  aria-label="Modifier"
                  className="rounded-full border border-cool-light p-1.5 hover:bg-surface"
                >
                  <Pencil size={14} />
                </button>
                <ConfirmButton
                  label="Supprimer"
                  confirmLabel="Confirmer"
                  onConfirm={() => deleteVisit(visit.id)}
                  className="rounded-full border border-cool-light px-3 py-1.5 text-primary hover:bg-surface"
                />
              </div>
            </article>
            );
          })}
          {visits.length === 0 && (
            <p className="py-10 text-center text-sm text-soft-foreground">
              Aucune visite planifiée.
            </p>
          )}
        </div>
      </section>

      {pagination && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          pageSize={pagination.pageSize}
          onPageChange={(page) => router.push(crmPageHref("/crm/visites", page, agencyId))}
        />
      )}

      {showModal && (
        <VisitModal
          contacts={contacts}
          properties={properties}
          onClose={() => setShowModal(false)}
          onCreated={(visit) => {
            onVisitsChange(
              [...visits, visit].sort((a, b) =>
                a.scheduled_at.localeCompare(b.scheduled_at),
              ),
            );
            setShowModal(false);
            notify("Visite planifiée");
          }}
        />
      )}
      {converting && (
        <VisitModal
          request={converting}
          contacts={contacts}
          properties={properties}
          onClose={() => setConverting(null)}
          onCreated={(visit) => {
            onVisitsChange(
              [...visits, visit].sort((a, b) =>
                a.scheduled_at.localeCompare(b.scheduled_at),
              ),
            );
            onViewingRequestsChange(
              viewingRequests.filter((request) => request.id !== converting.id),
            );
            setConverting(null);
            notify("Visite planifiée");
          }}
        />
      )}
      {editing && (
        <VisitModal
          visit={editing}
          contacts={contacts}
          properties={properties}
          onClose={() => setEditing(null)}
          onCreated={(visit) => {
            onVisitsChange(
              visits
                .map((item) => (item.id === visit.id ? visit : item))
                .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)),
            );
            setEditing(null);
            notify("Visite modifiée");
          }}
        />
      )}
    </div>
  );
}

function VisitModal({
  request,
  visit,
  contacts,
  properties,
  onClose,
  onCreated,
}: {
  request?: ViewingRequest;
  visit?: Visit;
  contacts: Contact[];
  properties: CrmProperty[];
  onClose: () => void;
  onCreated: (visit: Visit) => void;
}) {
  const [form, setForm] = useState({
    property_id: visit?.properties?.id ?? request?.properties?.id ?? properties[0]?.id ?? "",
    contact_id: "",
    scheduled_at: visit ? toDatetimeLocal(visit.scheduled_at) : toDatetimeLocal(request?.requested_date ?? null),
    notes: visit?.notes ?? request?.message ?? "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.scheduled_at) {
      setError("Choisissez une date et une heure.");
      return;
    }
    setSaving(true);
    const scheduledAt = new Date(form.scheduled_at).toISOString();
    let response: Response;
    if (visit) {
      response = await fetch(`/api/crm/visits/${visit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduled_at: scheduledAt, notes: form.notes }),
      });
    } else if (request) {
      response = await fetch(`/api/crm/viewing-requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "convert", scheduled_at: scheduledAt }),
      });
    } else {
      response = await fetch("/api/crm/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: form.property_id,
          contact_id: form.contact_id || null,
          scheduled_at: scheduledAt,
          notes: form.notes,
        }),
      });
    }
    const data = await response.json();
    if (!response.ok)
      setError(data.error ?? "Impossible de planifier la visite");
    else onCreated(data.visit);
    setSaving(false);
  };

  return (
    <Modal
      title={
        visit
          ? "Modifier la visite"
          : request
          ? `Planifier la visite de ${request.name}`
          : "Nouvelle visite"
      }
      onClose={onClose}
    >
      <form onSubmit={submit} className="mt-6 grid gap-4">
        {!request && !visit && (
          <div className="grid gap-1.5">
            <label className={labelClass}>Bien</label>
            <select
              required
              value={form.property_id}
              onChange={(event) =>
                setForm({ ...form, property_id: event.target.value })
              }
              className={fieldClass}
            >
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.title} — {property.city}
                </option>
              ))}
            </select>
          </div>
        )}
        {!request && !visit && (
          <div className="grid gap-1.5">
            <label className={labelClass}>Contact</label>
            <select
              value={form.contact_id}
              onChange={(event) =>
                setForm({ ...form, contact_id: event.target.value })
              }
              className={fieldClass}
            >
              <option value="">Aucun</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.full_name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="grid gap-1.5">
          <label className={labelClass}>Date et heure</label>
          <input
            required
            type="datetime-local"
            value={form.scheduled_at}
            onChange={(event) =>
              setForm({ ...form, scheduled_at: event.target.value })
            }
            className={fieldClass}
          />
        </div>
        {!request && (
          <div className="grid gap-1.5">
            <label className={labelClass}>Notes</label>
            {/* shown for both new visits and edits */}
            <textarea
              rows={3}
              value={form.notes}
              onChange={(event) =>
                setForm({ ...form, notes: event.target.value })
              }
              className={fieldClass}
            />
          </div>
        )}
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          disabled={saving}
          className="rounded-full bg-earth px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {saving ? "Enregistrement..." : visit ? "Enregistrer" : "Planifier"}
        </button>
      </form>
    </Modal>
  );
}

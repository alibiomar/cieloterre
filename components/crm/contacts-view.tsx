"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Phone, Plus, Search } from "lucide-react";
import type { Contact } from "./types";
import { ConfirmButton, Modal, crmPageHref, fieldClass, formatDate, labelClass } from "./ui";
import { AgencyScopeBar } from "./agency-picker";
import { Pagination } from "./pagination";

export type PaginationMeta = { page: number; totalPages: number; total: number; pageSize: number };

const typeLabels: Record<string, string> = {
  lead: "Prospect",
  buyer: "Acheteur",
  seller: "Vendeur",
  tenant: "Locataire",
  landlord: "Propriétaire",
  other: "Autre",
};
const typeColors: Record<string, string> = {
  lead: "bg-surface text-muted-foreground",
  buyer: "bg-surface text-muted-foreground",
  seller: "bg-surface text-primary",
  tenant: "bg-surface text-accent",
  landlord: "bg-surface text-accent",
  other: "bg-background text-soft-foreground",
};

export function ContactsView({
  contacts,
  onContactsChange,
  notify,
  pagination,
  isAdmin,
  agencyName,
  agencyId,
  onBackToAgencies,
}: {
  contacts: Contact[];
  onContactsChange: (contacts: Contact[]) => void;
  notify: (message: string) => void;
  pagination?: PaginationMeta;
  isAdmin?: boolean;
  agencyName?: string | null;
  agencyId?: string | null;
  onBackToAgencies?: () => void;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const filtered = useMemo(() => {
    const bySearch = contacts.filter((contact) => {
      const matchesSearch = `${contact.full_name} ${contact.email ?? ""} ${contact.phone ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || contact.contact_type === typeFilter;
      return matchesSearch && matchesType;
    });
    return bySearch;
  }, [contacts, search, typeFilter]);

  const deleteContact = async (id: string) => {
    const response = await fetch(`/api/crm/contacts/${id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      onContactsChange(contacts.filter((contact) => contact.id !== id));
      notify("Contact supprimé");
    } else notify("Le contact n'a pas pu être supprimé.");
  };

  return (
    <section className="rounded-2xl border border-cool-light bg-background p-5 sm:p-6">
      {onBackToAgencies && agencyName && <AgencyScopeBar agencyName={agencyName} onBack={onBackToAgencies} />}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="eyebrow">Carnet d'adresses</p>
          <h2 className="mt-2 font-serif text-2xl">{agencyName ? `Contacts · ${agencyName}` : "Contacts"}</h2>
        </div>
        <div className="flex items-center gap-2">
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
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-earth px-4 py-2.5 text-xs font-semibold text-primary-foreground"
          >
            <Plus size={14} />
            Contact
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {[["all", "Tous"], ...Object.entries(typeLabels)].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTypeFilter(value)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${typeFilter === value ? "bg-earth text-primary-foreground" : "border border-cool-light text-soft-foreground"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-cool-light text-left text-xs font-bold uppercase tracking-wider text-soft-foreground">
              <th className="pb-3">Nom</th>
              <th className="pb-3">Coordonnées</th>
              <th className="pb-3">Type</th>
              {isAdmin && <th className="pb-3">Agence</th>}
              <th className="pb-3">Ajouté</th>
              <th className="pb-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((contact) => (
              <tr
                key={contact.id}
                className="border-b border-cool-light last:border-0"
              >
                <td className="py-3 pr-4 font-semibold">{contact.full_name}</td>
                <td className="py-3 pr-4 text-soft-foreground">
                  <div className="flex flex-col gap-1">
                    {contact.email && (
                      <span className="inline-flex items-center gap-1.5">
                        <Mail size={13} className="text-muted-foreground" />
                        {contact.email}
                      </span>
                    )}
                    {contact.phone && (
                      <span className="inline-flex items-center gap-1.5">
                        <Phone size={13} className="text-muted-foreground" />
                        {contact.phone}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${typeColors[contact.contact_type] ?? typeColors.other}`}
                  >
                    {typeLabels[contact.contact_type] ?? contact.contact_type}
                  </span>
                </td>
                {isAdmin && (
                  <td className="py-3 pr-4 text-xs text-soft-foreground">
                    {contact.agency_name ?? <span className="italic text-muted-foreground">Sans agence</span>}
                  </td>
                )}
                <td className="py-3 pr-4 text-xs text-soft-foreground">
                  {formatDate(contact.created_at)}
                </td>
                <td className="py-3 text-right">
                  <div className="flex justify-end gap-2 text-xs font-semibold">
                    <button
                      onClick={() => setEditing(contact)}
                      className="rounded-full border border-cool-light px-3 py-1.5 hover:bg-background"
                    >
                      Modifier
                    </button>
                    <ConfirmButton
                      label="Supprimer"
                      confirmLabel="Confirmer"
                      onConfirm={() => deleteContact(contact.id)}
                      className="rounded-full border border-cool-light px-3 py-1.5 text-primary hover:bg-surface"
                    />
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={isAdmin ? 6 : 5}
                  className="py-10 text-center text-sm text-soft-foreground"
                >
                  Aucun contact pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && !search && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          pageSize={pagination.pageSize}
          onPageChange={(page) => router.push(crmPageHref("/crm/contacts", page, agencyId))}
        />
      )}

      {showModal && (
        <ContactModal
          title="Nouveau contact"
          onClose={() => setShowModal(false)}
          onSaved={(contact) => {
            onContactsChange([contact, ...contacts]);
            setShowModal(false);
            notify("Contact créé");
          }}
        />
      )}
      {editing && (
        <ContactModal
          title="Modifier le contact"
          contact={editing}
          onClose={() => setEditing(null)}
          onSaved={(contact) => {
            onContactsChange(
              contacts.map((item) => (item.id === contact.id ? contact : item)),
            );
            setEditing(null);
            notify("Contact mis à jour");
          }}
        />
      )}
    </section>
  );
}

function ContactModal({
  title,
  contact,
  onClose,
  onSaved,
}: {
  title: string;
  contact?: Contact;
  onClose: () => void;
  onSaved: (contact: Contact) => void;
}) {
  const [form, setForm] = useState({
    full_name: contact?.full_name ?? "",
    email: contact?.email ?? "",
    phone: contact?.phone ?? "",
    contact_type: contact?.contact_type ?? "lead",
    notes: contact?.notes ?? "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const url = contact
      ? `/api/crm/contacts/${contact.id}`
      : "/api/crm/contacts";
    const response = await fetch(url, {
      method: contact ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    if (!response.ok)
      setError(data.error ?? "Impossible d’enregistrer le contact");
    else onSaved(data.contact);
    setSaving(false);
  };

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit} className="mt-6 grid gap-4">
        <div className="grid gap-1.5">
          <label className={labelClass}>Nom complet</label>
          <input
            required
            value={form.full_name}
            onChange={(event) =>
              setForm({ ...form, full_name: event.target.value })
            }
            className={fieldClass}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
              className={fieldClass}
            />
          </div>
          <div className="grid gap-1.5">
            <label className={labelClass}>Téléphone</label>
            <input
              value={form.phone}
              onChange={(event) =>
                setForm({ ...form, phone: event.target.value })
              }
              className={fieldClass}
            />
          </div>
        </div>
        <div className="grid gap-1.5">
          <label className={labelClass}>Type de contact</label>
          <select
            value={form.contact_type}
            onChange={(event) =>
              setForm({ ...form, contact_type: event.target.value })
            }
            className={fieldClass}
          >
            {Object.entries(typeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <label className={labelClass}>Notes</label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(event) =>
              setForm({ ...form, notes: event.target.value })
            }
            className={fieldClass}
          />
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          disabled={saving}
          className="rounded-full bg-earth px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>
    </Modal>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, FileText, Pencil, Plus, Trash2, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmButton, Modal, fieldClass, formatPrice, labelClass } from "./ui";
import { SecureUpload } from "./secure-upload";

type Module = "transactions" | "financial_entries" | "crm_articles" | "inquiries";
type Row = Record<string, unknown>;
type Fields = Record<string, string>;

const moduleMeta: Record<Module, { title: string; eyebrow: string; description: string }> = {
  transactions: { title: "Transactions", eyebrow: "Activité commerciale", description: "Suivez chaque vente, location et mandat jusqu'à sa clôture." },
  financial_entries: { title: "Finances", eyebrow: "Pilotage financier", description: "Visualisez les revenus, commissions, dépenses et paiements à venir." },
  crm_articles: { title: "Conseils", eyebrow: "Contenu public", description: "Rédigez et publiez les conseils affichés sur le site." },
  inquiries: { title: "Demandes clients", eyebrow: "Entrants du site", description: "Retrouvez les messages envoyés depuis les formulaires publics." },
};

// Fields only an admin may see/edit — cross-agency assignment.
const adminOnlyFields: Partial<Record<Module, string[]>> = {
  transactions: ["agency_id", "agent_id"],
  financial_entries: ["agency_id"],
};

// Default values for each module's editable fields. Every DB column that isn't
// auto-generated (id, created_at/updated_at, created_by, closed_at, sent_at, published_at)
// is represented here so the modal can capture the full record.
const defaultFields: Record<Module, Fields> = {
  transactions: {
    transaction_type: "",
    stage: "prospect",
    amount: "",
    commission_rate: "",
    commission_amount: "",
    currency: "TND",
    expected_close_date: "",
    agency_id: "",
    agent_id: "",
    property_id: "",
    contact_id: "",
    notes: "",
  },
  financial_entries: {
    entry_type: "income",
    category: "",
    description: "",
    amount: "",
    currency: "TND",
    status: "pending",
    due_date: "",
    transaction_id: "",
    agency_id: "",
  },
  crm_articles: {
    slug: "",
    category: "Immobilier",
    title: "",
    excerpt: "",
    body: "",
    image_url: "",
    read_time: "5 min",
    published: "true",
  },
  inquiries: {},
};

// Deterministic per-module title, so a record is never shown as untitled.
function rowTitle(module: Module, row: Row): string {
  switch (module) {
    case "transactions":
      return `${String(row.transaction_type ?? "Transaction")} · ${String(row.stage ?? "prospect")}`;
    case "financial_entries":
      return String(row.description ?? row.category ?? "Écriture financière");
    case "crm_articles":
      return String(row.title ?? row.slug ?? "Article");
    case "inquiries":
      return String(row.name ?? row.email ?? "Demande client");
    default:
      return "Élément";
  }
}

function rowToFields(module: Module, row: Row): Fields {
  const base = defaultFields[module];
  const fields: Fields = { ...base };
  for (const key of Object.keys(base)) {
    const value = row[key];
    if (value === null || value === undefined) continue;
    if (key === "variables" && Array.isArray(value)) {
      fields[key] = value.join(", ");
      continue;
    }
    if (key === "published") {
      fields[key] = String(Boolean(value));
      continue;
    }
    fields[key] = String(value);
  }
  return fields;
}

export function OperationsView({
  notify,
  initialModule = "transactions",
  role = "agent",
  agencies = [],
  agents = [],
  contacts = [],
  properties = [],
}: {
  notify: (message: string) => void;
  initialModule?: Module;
  role?: "admin" | "agency_admin" | "agent";
  agencies?: { id: string; name: string }[];
  agents?: { id: string; agency_id: string | null; email: string | null; profiles: { full_name: string | null; role: string } | null }[];
  contacts?: { id: string; full_name: string }[];
  properties?: { id: string; title: string }[];
}) {
  const [module, setModule] = useState<Module>(initialModule);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRow, setEditingRow] = useState<Row | null>(null);
  const [viewingRow, setViewingRow] = useState<Row | null>(null);
  // Reference lists for cross-linking records in the form (financial entries
  // → transaction, messages → transaction/template). Loaded once, lazily.
  const [transactionsRef, setTransactionsRef] = useState<Row[] | null>(null);
  const meta = moduleMeta[module];

  async function loadReferenceLists() {
    if (transactionsRef === null) {
      const response = await fetch("/api/crm/operations?table=transactions");
      const result = await response.json();
      setTransactionsRef(response.ok ? result.data : []);
    }
  }


  async function load(selected: Module) {
    setLoading(true);
    const response = await fetch(`/api/crm/operations?table=${selected}`);
    const result = await response.json();
    if (!response.ok) notify(result.error ?? "Impossible de charger le module.");
    setRows(response.ok ? result.data : []);
    setLoading(false);
  }

  useEffect(() => {
    setModule(initialModule);
  }, [initialModule]);

  useEffect(() => {
    void load(module);
  }, [module]);

  const total = useMemo(
    () => rows.reduce((sum, row) => sum + (typeof row.amount === "number" ? row.amount : 0), 0),
    [rows],
  );
  const pending = rows.filter((row) => ["pending", "queued", "prospect"].includes(String(row.status ?? row.stage))).length;

  async function remove(row: Row) {
    const response = await fetch("/api/crm/operations", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ table: module, id: row.id }) });
    if (response.ok) { notify("Entrée supprimée."); await load(module); } else {
      const result = await response.json().catch(() => null);
      notify(result?.error ?? "Impossible de supprimer cette entrée.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-cool-light pb-6 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">{meta.eyebrow}</p>
          <h2 className="mt-2 font-serif text-4xl tracking-tight">{meta.title}</h2>
          <p className="mt-2 max-w-2xl text-sm text-soft-foreground">{meta.description}</p>
        </div>
        {module !== "inquiries" && (
          <Button onClick={() => { setEditingRow(null); void loadReferenceLists(); setShowModal(true); }}>
            <Plus size={16} /> Nouveau
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label={module === "financial_entries" ? "Volume enregistré" : "Éléments suivis"} value={module === "financial_entries" ? formatPrice(total) : String(rows.length)} icon={WalletCards} />
        <SummaryCard label="À traiter" value={String(pending)} icon={ArrowUpRight} />
        <SummaryCard label="Statut" value={rows.length ? "Actif" : "À configurer"} icon={FileText} />
      </div>

      <section className="overflow-hidden rounded-2xl border border-cool-light bg-background">
        <div className="flex items-center justify-between border-b border-cool-light px-5 py-4">
          <div>
            <h3 className="font-semibold">Registre récent</h3>
            <p className="mt-1 text-xs text-soft-foreground">Les dernières entrées de votre espace professionnel</p>
          </div>
        </div>
        {loading ? <p className="px-5 py-10 text-sm text-soft-foreground">Chargement du registre...</p> : rows.length === 0 ? (
          <div className="px-5 py-12 text-center"><p className="font-serif text-2xl">Votre registre est vide</p><p className="mt-2 text-sm text-soft-foreground">Créez votre première entrée pour commencer à suivre cette activité.</p></div>
        ) : (
          <div className="divide-y divide-cool-light">
            {rows.map((row) => (
              <RecordRow
                key={String(row.id)}
                module={module}
                row={row}
                canEdit={module !== "inquiries"}
                onEdit={() => { setEditingRow(row); void loadReferenceLists(); setShowModal(true); }}
                onDelete={() => remove(row)}
                onOpen={module === "inquiries" ? () => setViewingRow(row) : undefined}
              />
            ))}
          </div>
        )}
      </section>
      {viewingRow && (
        <Modal title={rowTitle(module, viewingRow)} onClose={() => setViewingRow(null)}>
          <div className="mt-4 grid gap-3 text-sm">
            {String(viewingRow.email ?? "") && <p><span className="font-semibold">Email :</span> {String(viewingRow.email)}</p>}
            {String(viewingRow.phone ?? "") && <p><span className="font-semibold">Téléphone :</span> {String(viewingRow.phone)}</p>}
            {String(viewingRow.created_at ?? "") && <p><span className="font-semibold">Reçu le :</span> {String(viewingRow.created_at).slice(0, 10)}</p>}
            {String(viewingRow.message ?? "") && (
              <div>
                <p className="font-semibold">Message :</p>
                <p className="mt-1 whitespace-pre-wrap text-soft-foreground">{String(viewingRow.message)}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
      {showModal && (
        <OperationModal
          module={module}
          role={role}
          notify={notify}
          editingRow={editingRow}
          agencies={agencies}
          agents={agents}
          contacts={contacts}
          properties={properties}
          transactionsRef={transactionsRef ?? []}
          onClose={() => { setShowModal(false); setEditingRow(null); }}
          onSaved={() => { setShowModal(false); setEditingRow(null); notify(editingRow ? "Modifié avec succès." : "Enregistré avec succès."); void load(module); }}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof WalletCards }) {
  return <div className="rounded-2xl border border-cool-light bg-background p-5"><div className="grid size-9 place-items-center rounded-lg bg-surface text-primary"><Icon size={17} /></div><p className="mt-4 text-xs uppercase tracking-wider text-soft-foreground">{label}</p><p className="mt-1 font-serif text-2xl">{value}</p></div>;
}

function RecordRow({ module, row, canEdit, onEdit, onDelete, onOpen }: { module: Module; row: Row; canEdit: boolean; onEdit: () => void; onDelete: () => void; onOpen?: () => void }) {
  const title = rowTitle(module, row);
  const secondary = module === "transactions" ? `${String(row.stage ?? "prospect")} · ${formatPrice(Number(row.amount ?? 0))}` : module === "financial_entries" ? `${String(row.entry_type ?? "écriture")} · ${formatPrice(Number(row.amount ?? 0))}` : String(row.status ?? row.category ?? "Brouillon");
  const Icon = module === "financial_entries" ? WalletCards : ArrowDownLeft;
  return (
    <div
      className={`flex items-center gap-4 px-5 py-4 ${onOpen ? "cursor-pointer hover:bg-surface" : ""}`}
      onClick={onOpen}
    >
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface text-primary"><Icon size={17} /></div>
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{title}</p><p className="mt-1 text-xs capitalize text-soft-foreground">{secondary}</p></div>
      <time className="hidden text-xs text-soft-foreground sm:block">{String(row.created_at ?? "").slice(0, 10)}</time>
      {canEdit && (
        <button type="button" title="Modifier" aria-label="Modifier" onClick={onEdit} className="rounded-lg p-2 text-soft-foreground hover:bg-surface hover:text-primary"><Pencil size={16} /></button>
      )}
      {canEdit && (
        <ConfirmButton
          label={<Trash2 size={16} />}
          confirmLabel="Confirmer ?"
          onConfirm={onDelete}
          className="rounded-lg p-2 text-soft-foreground hover:bg-surface hover:text-red-600"
        />
      )}
    </div>
  );
}

function OperationModal({
  module,
  role,
  notify,
  editingRow,
  agencies,
  agents,
  contacts,
  properties,
  transactionsRef,
  onClose,
  onSaved,
}: {
  module: Module;
  role: "admin" | "agency_admin" | "agent";
  notify: (message: string) => void;
  editingRow: Row | null;
  agencies: { id: string; name: string }[];
  agents: { id: string; agency_id: string | null; email: string | null; profiles: { full_name: string | null; role: string } | null }[];
  contacts: { id: string; full_name: string }[];
  properties: { id: string; title: string }[];
  transactionsRef: Row[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [fields, setFields] = useState<Fields>(editingRow ? rowToFields(module, editingRow) : defaultFields[module]);
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = Boolean(editingRow);
  const hiddenAdminFields = new Set(role === "admin" ? [] : adminOnlyFields[module] ?? []);

  function set(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function buildRecord(): Record<string, unknown> {
    switch (module) {
      case "transactions":
        return {
          transaction_type: fields.transaction_type,
          stage: fields.stage || "prospect",
          amount: Number(fields.amount || 0),
          commission_rate: Number(fields.commission_rate || 0),
          commission_amount: Number(fields.commission_amount || 0),
          currency: fields.currency || "TND",
          expected_close_date: fields.expected_close_date || null,
          agency_id: hiddenAdminFields.has("agency_id") ? undefined : fields.agency_id || null,
          agent_id: hiddenAdminFields.has("agent_id") ? undefined : fields.agent_id || null,
          property_id: fields.property_id || null,
          contact_id: fields.contact_id || null,
          notes: fields.notes || null,
        };
      case "financial_entries":
        return {
          entry_type: fields.entry_type || "income",
          category: fields.category || "other",
          description: fields.description,
          amount: Number(fields.amount || 0),
          currency: fields.currency || "TND",
          status: fields.status || "pending",
          due_date: fields.due_date || null,
          transaction_id: fields.transaction_id || null,
          agency_id: hiddenAdminFields.has("agency_id") ? undefined : fields.agency_id || null,
        };
      case "crm_articles":
      default:
        return {
          slug: fields.slug,
          category: fields.category || "Immobilier",
          title: fields.title,
          excerpt: fields.excerpt,
          body: fields.body,
          image_url: fields.image_url || null,
          read_time: fields.read_time || "5 min",
          published: fields.published === "true",
        };
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    try {
      const record = buildRecord();
      const payload = isEditing ? { table: module, id: String(editingRow?.id ?? ""), record } : { table: module, record };
      const response = await fetch("/api/crm/operations", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        notify(result.error ?? "Impossible d'enregistrer cette entrée.");
        return;
      }
      onSaved();
    } catch {
      notify("Le serveur est indisponible. Réessayez dans un instant.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal title={`${isEditing ? "Modifier" : "Nouvelle entrée"} — ${moduleMeta[module].title}`} onClose={onClose} wide>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {module === "transactions" && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type de transaction">
                <select value={fields.transaction_type} onChange={(event) => set("transaction_type", event.target.value)} className={fieldClass} required>
                  <option value="">Choisir un type</option>
                  <option value="sale">Vente</option>
                  <option value="rent">Location</option>
                  <option value="management">Gestion</option>
                </select>
              </Field>
              <Field label="Étape">
                <select value={fields.stage} onChange={(event) => set("stage", event.target.value)} className={fieldClass}>
                  <option value="prospect">Prospect</option>
                  <option value="negotiation">Négociation</option>
                  <option value="offer">Offre acceptée</option>
                  <option value="contract">Sous contrat</option>
                  <option value="closed">Clôturé</option>
                </select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Montant"><Input className={fieldClass} type="number" min="0" step="0.01" value={fields.amount} onChange={(event) => set("amount", event.target.value)} placeholder="0.00" required /></Field>
              <Field label="Taux de commission (%)"><Input className={fieldClass} type="number" min="0" step="0.01" value={fields.commission_rate} onChange={(event) => set("commission_rate", event.target.value)} placeholder="0.00" /></Field>
              <Field label="Commission (montant)"><Input className={fieldClass} type="number" min="0" step="0.01" value={fields.commission_amount} onChange={(event) => set("commission_amount", event.target.value)} placeholder="0.00" /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Devise"><Input className={fieldClass} value={fields.currency} onChange={(event) => set("currency", event.target.value)} placeholder="TND" /></Field>
              <Field label="Date de clôture prévue"><Input className={fieldClass} type="date" value={fields.expected_close_date} onChange={(event) => set("expected_close_date", event.target.value)} /></Field>
            </div>
            {!hiddenAdminFields.has("agency_id") && !hiddenAdminFields.has("agent_id") && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Agence">
                  <select value={fields.agency_id} onChange={(event) => set("agency_id", event.target.value)} className={fieldClass}>
                    <option value="">— Non assignée —</option>
                    {agencies.map((agency) => <option key={agency.id} value={agency.id}>{agency.name}</option>)}
                  </select>
                </Field>
                <Field label="Agent">
                  <select value={fields.agent_id} onChange={(event) => set("agent_id", event.target.value)} className={fieldClass}>
                    <option value="">— Non assigné —</option>
                    {agents.map((agent) => <option key={agent.id} value={agent.id}>{(Array.isArray(agent.profiles) ? agent.profiles[0]?.full_name : agent.profiles?.full_name) ?? agent.email ?? agent.id}</option>)}
                  </select>
                </Field>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Bien concerné (optionnel)">
                <select value={fields.property_id} onChange={(event) => set("property_id", event.target.value)} className={fieldClass}>
                  <option value="">— Aucun —</option>
                  {properties.map((property) => <option key={property.id} value={property.id}>{property.title}</option>)}
                </select>
              </Field>
              <Field label="Contact concerné (optionnel)">
                <select value={fields.contact_id} onChange={(event) => set("contact_id", event.target.value)} className={fieldClass}>
                  <option value="">— Aucun —</option>
                  {contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.full_name}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Notes"><textarea value={fields.notes} onChange={(event) => set("notes", event.target.value)} className={fieldClass} rows={3} placeholder="Notes internes..." /></Field>
          </>
        )}

        {module === "financial_entries" && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type d'écriture">
                <select value={fields.entry_type} onChange={(event) => set("entry_type", event.target.value)} className={fieldClass}>
                  <option value="income">Revenu</option>
                  <option value="expense">Dépense</option>
                  <option value="commission">Commission</option>
                  <option value="payment">Paiement</option>
                  <option value="refund">Remboursement</option>
                </select>
              </Field>
              <Field label="Catégorie"><Input className={fieldClass} value={fields.category} onChange={(event) => set("category", event.target.value)} placeholder="Ex. mandat de vente" /></Field>
            </div>
            <Field label="Description"><Input className={fieldClass} value={fields.description} onChange={(event) => set("description", event.target.value)} placeholder="Description de l'écriture" required /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Montant"><Input className={fieldClass} type="number" min="0" step="0.01" value={fields.amount} onChange={(event) => set("amount", event.target.value)} placeholder="0.00" required /></Field>
              <Field label="Devise"><Input className={fieldClass} value={fields.currency} onChange={(event) => set("currency", event.target.value)} placeholder="TND" /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Statut">
                <select value={fields.status} onChange={(event) => set("status", event.target.value)} className={fieldClass}>
                  <option value="pending">En attente</option>
                  <option value="paid">Payé</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </Field>
              <Field label="Date d'échéance"><Input className={fieldClass} type="date" value={fields.due_date} onChange={(event) => set("due_date", event.target.value)} /></Field>
            </div>
            {!hiddenAdminFields.has("agency_id") && (
              <Field label="Agence">
                <select value={fields.agency_id} onChange={(event) => set("agency_id", event.target.value)} className={fieldClass}>
                  <option value="">— Non assignée —</option>
                  {agencies.map((agency) => <option key={agency.id} value={agency.id}>{agency.name}</option>)}
                </select>
              </Field>
            )}
            <Field label="Transaction liée (optionnel)">
              <select value={fields.transaction_id} onChange={(event) => set("transaction_id", event.target.value)} className={fieldClass}>
                <option value="">— Aucune —</option>
                {transactionsRef.map((transaction) => (
                  <option key={String(transaction.id)} value={String(transaction.id)}>
                    {String(transaction.transaction_type ?? "Transaction")} · {formatPrice(Number(transaction.amount ?? 0))}
                  </option>
                ))}
              </select>
            </Field>
          </>
        )}

        {module === "crm_articles" && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Slug"><Input className={fieldClass} value={fields.slug} onChange={(event) => set("slug", event.target.value)} placeholder="acheter-en-tunisie" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required disabled={isEditing} /></Field>
              <Field label="Catégorie"><Input className={fieldClass} value={fields.category} onChange={(event) => set("category", event.target.value)} placeholder="Immobilier" required /></Field>
            </div>
            <Field label="Titre"><Input className={fieldClass} value={fields.title} onChange={(event) => set("title", event.target.value)} placeholder="Titre du conseil" required /></Field>
            <Field label="Extrait"><textarea value={fields.excerpt} onChange={(event) => set("excerpt", event.target.value)} className={fieldClass} rows={2} placeholder="Résumé affiché dans les listes (240 caractères max recommandé)" required /></Field>
            <Field label="Contenu"><textarea value={fields.body} onChange={(event) => set("body", event.target.value)} className={fieldClass} rows={6} placeholder="Contenu complet de l'article..." required /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Temps de lecture"><Input className={fieldClass} value={fields.read_time} onChange={(event) => set("read_time", event.target.value)} placeholder="5 min" /></Field>
              <Field label="Publication">
                <select value={fields.published} onChange={(event) => set("published", event.target.value)} className={fieldClass}>
                  <option value="true">Publié</option>
                  <option value="false">Brouillon</option>
                </select>
              </Field>
            </div>
            <SecureUpload accept="image/jpeg,image/png,image/webp" label="Image du conseil" onUploaded={(url) => set("image_url", url)} notify={notify} />
          </>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          <Button type="submit" disabled={isLoading}>{isLoading ? "Enregistrement..." : isEditing ? "Mettre à jour" : "Enregistrer"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label className={labelClass}>{label}</Label>{children}</div>;
}


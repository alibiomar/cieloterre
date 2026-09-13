"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Plus, Search } from "lucide-react";
import type { CrmProperty } from "./types";
import { SEARCH_FEATURES } from "@/lib/property-search";
import {
  ConfirmButton,
  Modal,
  crmPageHref,
  fieldClass,
  formatPrice,
  labelClass,
} from "./ui";
import { SecureUpload } from "./secure-upload";
import { Pagination } from "./pagination";
import type { PaginationMeta } from "./contacts-view";
import { AgencyScopeBar } from "./agency-picker";

const statusLabels: Record<string, string> = {
  draft: "Brouillon",
  published: "Publié",
  archived: "Archivé",
};
const statusColors: Record<string, string> = {
  draft: "bg-background text-soft-foreground",
  published: "bg-surface text-muted-foreground",
  archived: "bg-surface text-primary",
};
const propertyTypes = [
  "appartement",
  "villa",
  "maison",
  "terrain",
  "bureau",
  "local commercial",
];

export function PropertiesView({
  properties,
  onPropertiesChange,
  notify,
  pagination,
  isAdmin,
  agencyName,
  agencyId,
  onBackToAgencies,
}: {
  properties: CrmProperty[];
  onPropertiesChange: (properties: CrmProperty[]) => void;
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
  const [editing, setEditing] = useState<CrmProperty | null>(null);
  const [groupByAgency, setGroupByAgency] = useState(false);
  const filtered = useMemo(() => {
    const bySearch = properties.filter((property) =>
      `${property.title} ${property.city}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
    if (!isAdmin || !groupByAgency) return bySearch;
    return [...bySearch].sort((a, b) =>
      (a.agencies?.name ?? "\uffff").localeCompare(b.agencies?.name ?? "\uffff"),
    );
  }, [properties, search, isAdmin, groupByAgency]);

  const setStatus = async (property: CrmProperty, status: string) => {
    const response = await fetch(`/api/crm/properties/${property.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (response.ok)
      onPropertiesChange(
        properties.map((item) =>
          item.id === property.id ? { ...item, status } : item,
        ),
      );
    else notify("Le statut du bien n'a pas pu être mis à jour.");
  };
  const deleteProperty = async (id: string) => {
    const response = await fetch(`/api/crm/properties/${id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      onPropertiesChange(properties.filter((item) => item.id !== id));
      notify("Bien supprimé");
    } else notify("Le bien n'a pas pu être supprimé.");
  };

  return (
    <section className="rounded-2xl border border-cool-light bg-background p-5 sm:p-6">
      {onBackToAgencies && agencyName && <AgencyScopeBar agencyName={agencyName} onBack={onBackToAgencies} />}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="eyebrow">Catalogue</p>
          <h2 className="mt-2 font-serif text-2xl">{agencyName ? `Biens · ${agencyName}` : "Biens"}</h2>
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
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-earth px-4 py-2.5 text-xs font-semibold text-primary-foreground"
          >
            <Plus size={14} />
            Bien
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((property) => (
          <article
            key={property.id}
            className="rounded-xl border border-cool-light bg-background p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{property.title}</p>
                <p className="mt-1 text-xs text-soft-foreground">
                  {property.city}
                  {property.neighborhood ? ` · ${property.neighborhood}` : ""}
                </p>
                {isAdmin && (
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                    {property.agencies?.name ?? "Sans agence"}
                  </p>
                )}
              </div>
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${statusColors[property.status] ?? statusColors.draft}`}
              >
                {statusLabels[property.status] ?? property.status}
              </span>
            </div>
            <p className="mt-3 font-serif text-xl text-primary">
              {formatPrice(property.price)}
            </p>
            <p className="mt-1 text-xs text-soft-foreground">
              {property.area_m2} m² · {property.bedrooms} ch. ·{" "}
              {property.bathrooms} sdb. · {property.property_type} ·{" "}
              {property.transaction_type === "rent" ? "Location" : "Vente"}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
              <select
                value={property.status}
                onChange={(event) => setStatus(property, event.target.value)}
                className="rounded-lg border border-cool-light bg-background px-2 py-1.5 text-xs"
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setEditing(property)}
                className="rounded-full border border-cool-light px-3 py-1.5 hover:bg-background"
              >
                Modifier
              </button>
              {property.status === "published" && (
                <a
                  href={`/biens/${property.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-cool-light px-3 py-1.5 hover:bg-background"
                >
                  <ExternalLink size={12} />
                  Voir
                </a>
              )}
              <ConfirmButton
                label="Supprimer"
                confirmLabel="Confirmer"
                onConfirm={() => deleteProperty(property.id)}
                className="rounded-full border border-cool-light px-3 py-1.5 text-primary hover:bg-surface"
              />
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-soft-foreground">
            Aucun bien pour le moment.
          </p>
        )}
      </div>

      {pagination && !search && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          pageSize={pagination.pageSize}
          onPageChange={(page) => router.push(crmPageHref("/crm/biens", page, agencyId))}
        />
      )}

      {showModal && (
        <PropertyModal
          title="Nouveau bien"
          onClose={() => setShowModal(false)}
          onSaved={(property) => {
            onPropertiesChange([property, ...properties]);
            setShowModal(false);
            notify("Bien créé");
          }}
        />
      )}
      {editing && (
        <PropertyModal
          title="Modifier le bien"
          property={editing}
          onClose={() => setEditing(null)}
          onSaved={(property) => {
            onPropertiesChange(
              properties.map((item) =>
                item.id === property.id ? property : item,
              ),
            );
            setEditing(null);
            notify("Bien mis à jour");
          }}
        />
      )}
    </section>
  );
}

function PropertyModal({
  title,
  property,
  onClose,
  onSaved,
}: {
  title: string;
  property?: CrmProperty;
  onClose: () => void;
  onSaved: (property: CrmProperty) => void;
}) {
  const [form, setForm] = useState({
    title: property?.title ?? "",
    city: property?.city ?? "",
    neighborhood: property?.neighborhood ?? "",
    property_type: property?.property_type ?? propertyTypes[0],
    transaction_type: property?.transaction_type ?? "sale",
    price: property?.price?.toString() ?? "",
    bedrooms: property?.bedrooms?.toString() ?? "0",
    bathrooms: property?.bathrooms?.toString() ?? "0",
    area_m2: property?.area_m2?.toString() ?? "0",
    description: property?.description ?? "",
    status: property?.status ?? "draft",
    cover_path: property?.cover_path ?? "",
    image_paths: [] as string[],
    features: property?.features ?? ([] as string[]),
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleFeature = (feature: string) => {
    setForm((current) => ({
      ...current,
      features: current.features.includes(feature)
        ? current.features.filter((item) => item !== feature)
        : [...current.features, feature],
    }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const url = property
      ? `/api/crm/properties/${property.id}`
      : "/api/crm/properties";
    const response = await fetch(url, {
      method: property ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, imagePaths: form.image_paths }),
    });
    const data = await response.json();
    if (!response.ok)
      setError(data.error ?? "Impossible d’enregistrer le bien");
    else onSaved(data.property);
    setSaving(false);
  };

  return (
    <Modal title={title} onClose={onClose} wide>
      <form onSubmit={submit} className="mt-6 grid gap-4">
        <div className="grid gap-1.5">
          <label className={labelClass}>Titre</label>
          <input
            required
            value={form.title}
            onChange={(event) =>
              setForm({ ...form, title: event.target.value })
            }
            className={fieldClass}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <label className={labelClass}>Ville</label>
            <input
              required
              value={form.city}
              onChange={(event) =>
                setForm({ ...form, city: event.target.value })
              }
              className={fieldClass}
            />
          </div>
          <div className="grid gap-1.5">
            <label className={labelClass}>Quartier</label>
            <input
              value={form.neighborhood}
              onChange={(event) =>
                setForm({ ...form, neighborhood: event.target.value })
              }
              className={fieldClass}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-1.5">
            <label className={labelClass}>Type de bien</label>
            <select
              value={form.property_type}
              onChange={(event) =>
                setForm({ ...form, property_type: event.target.value })
              }
              className={fieldClass}
            >
              {propertyTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <label className={labelClass}>Transaction</label>
            <select
              value={form.transaction_type}
              onChange={(event) =>
                setForm({ ...form, transaction_type: event.target.value })
              }
              className={fieldClass}
            >
              <option value="sale">Vente</option>
              <option value="rent">Location</option>
            </select>
          </div>
          <div className="grid gap-1.5">
            <label className={labelClass}>Prix (DT)</label>
            <input
              required
              type="number"
              min="0"
              value={form.price}
              onChange={(event) =>
                setForm({ ...form, price: event.target.value })
              }
              className={fieldClass}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-1.5">
            <label className={labelClass}>Chambres</label>
            <input
              type="number"
              min="0"
              value={form.bedrooms}
              onChange={(event) =>
                setForm({ ...form, bedrooms: event.target.value })
              }
              className={fieldClass}
            />
          </div>
          <div className="grid gap-1.5">
            <label className={labelClass}>Salles de bain</label>
            <input
              type="number"
              min="0"
              value={form.bathrooms}
              onChange={(event) =>
                setForm({ ...form, bathrooms: event.target.value })
              }
              className={fieldClass}
            />
          </div>
          <div className="grid gap-1.5">
            <label className={labelClass}>Surface (m²)</label>
            <input
              type="number"
              min="0"
              value={form.area_m2}
              onChange={(event) =>
                setForm({ ...form, area_m2: event.target.value })
              }
              className={fieldClass}
            />
          </div>
        </div>
        <div className="grid gap-1.5">
          <label className={labelClass}>Description</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
            className={fieldClass}
          />
        </div>
        <div className="grid gap-1.5">
          <label className={labelClass}>Caractéristiques (recherche avancée)</label>
          <div className="flex flex-wrap gap-2">
            {SEARCH_FEATURES.map((feature) => {
              const active = form.features.includes(feature);
              return (
                <button
                  key={feature}
                  type="button"
                  onClick={() => toggleFeature(feature)}
                  aria-pressed={active}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-cool-light text-soft-foreground"
                  }`}
                >
                  {feature}
                </button>
              );
            })}
          </div>
        </div>
        <SecureUpload
          accept="image/jpeg,image/png,image/webp"
          label="Images du bien"
          multiple
          existingUrl={form.cover_path || null}
          onUploaded={(url) => setForm((current) => ({ ...current, cover_path: current.cover_path || url }))}
          onUploadedPath={(_, path) => setForm((current) => ({ ...current, image_paths: [...current.image_paths, path] }))}
          onRemoved={() => setForm((current) => ({ ...current, cover_path: "" }))}
          notify={setError}
        />
        {form.image_paths.length > 0 && <p className="text-xs text-soft-foreground">{form.image_paths.length} image(s) prête(s).</p>}
        <div className="grid gap-1.5">
          <label className={labelClass}>Statut</label>
          <select
            value={form.status}
            onChange={(event) =>
              setForm({ ...form, status: event.target.value })
            }
            className={fieldClass}
          >
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
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

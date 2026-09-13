"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Check, ChevronLeft, Megaphone, NotebookPen, Pencil, Send, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmButton, fieldClass, formatDateTime } from "./ui";
import type { CrmNote } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_NAMES = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * Buckets notes the way a chat/inbox would: today, yesterday, a rolling
 * "this week", then one bucket per calendar month for anything older
 * (newest month first). Notes are assumed already sorted newest-first.
 */
function groupNotesByDate(notes: CrmNote[]) {
  const today = startOfDay(new Date());
  const groups: { key: string; label: string; notes: CrmNote[] }[] = [];
  const indexByKey = new Map<string, number>();

  for (const note of notes) {
    const created = new Date(note.created_at);
    const createdDay = startOfDay(created);
    const daysAgo = Math.round((today - createdDay) / DAY_MS);

    let key: string;
    let label: string;
    if (daysAgo <= 0) {
      key = "today";
      label = "Aujourd'hui";
    } else if (daysAgo === 1) {
      key = "yesterday";
      label = "Hier";
    } else if (daysAgo <= 7) {
      key = "this-week";
      label = "Cette semaine";
    } else {
      key = `${created.getFullYear()}-${created.getMonth()}`;
      const sameYear = created.getFullYear() === new Date().getFullYear();
      label = sameYear ? MONTH_NAMES[created.getMonth()] : `${MONTH_NAMES[created.getMonth()]} ${created.getFullYear()}`;
      label = label.charAt(0).toUpperCase() + label.slice(1);
    }

    if (!indexByKey.has(key)) {
      indexByKey.set(key, groups.length);
      groups.push({ key, label, notes: [] });
    }
    groups[indexByKey.get(key)!].notes.push(note);
  }

  return groups;
}

type AgencySummary = { id: string; name: string; memberCount: number; noteCount: number; lastActivity: string | null };

export function NotesView({
  notify,
  currentUserId,
  isAdmin,
}: {
  notify: (message: string) => void;
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [agencySummaries, setAgencySummaries] = useState<AgencySummary[] | null>(null);
  const [loadingAgencies, setLoadingAgencies] = useState(isAdmin);
  const [selectedAgency, setSelectedAgency] = useState<AgencySummary | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoadingAgencies(true);
      const response = await fetch("/api/crm/notes/agencies");
      const result = await response.json();
      if (!response.ok) notify(result.error ?? "Impossible de charger les agences.");
      setAgencySummaries(response.ok ? result.agencies : []);
      setLoadingAgencies(false);
    })();
  }, [isAdmin]);

  if (isAdmin && !selectedAgency) {
    return (
      <AgencyPicker
        loading={loadingAgencies}
        agencies={agencySummaries ?? []}
        onSelect={setSelectedAgency}
        notify={notify}
        currentUserId={currentUserId}
      />
    );
  }

  return (
    <NotesThread
      notify={notify}
      currentUserId={currentUserId}
      isAdmin={isAdmin}
      agencyId={selectedAgency?.id}
      agencyName={selectedAgency?.name}
      onBack={isAdmin ? () => setSelectedAgency(null) : undefined}
    />
  );
}

function AgencyPicker({
  loading,
  agencies,
  onSelect,
  notify,
  currentUserId,
}: {
  loading: boolean;
  agencies: AgencySummary[];
  onSelect: (agency: AgencySummary) => void;
  notify: (message: string) => void;
  currentUserId: string;
}) {
  const [showBroadcastComposer, setShowBroadcastComposer] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-cool-light pb-6 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Collaboration</p>
          <h2 className="mt-2 font-serif text-4xl tracking-tight">Notes d'équipe</h2>
          <p className="mt-2 max-w-2xl text-sm text-soft-foreground">
            Choisissez une agence pour consulter son fil de discussion, ou diffusez une annonce visible par toutes les agences à la fois.
          </p>
        </div>
        <Button onClick={() => setShowBroadcastComposer(true)}>
          <Megaphone size={16} /> Diffuser une annonce
        </Button>
      </div>

      {showBroadcastComposer && (
        <BroadcastComposer notify={notify} onClose={() => setShowBroadcastComposer(false)} />
      )}

      {loading ? (
        <p className="text-sm text-soft-foreground">Chargement des agences...</p>
      ) : agencies.length === 0 ? (
        <div className="rounded-2xl border border-cool-light bg-background px-5 py-12 text-center">
          <Building2 className="mx-auto text-soft-foreground" size={28} />
          <p className="mt-3 font-serif text-2xl">Aucune agence</p>
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
                <div className="grid size-9 place-items-center rounded-lg bg-surface text-primary"><Building2 size={17} /></div>
                {agency.noteCount > 0 && (
                  <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-soft-foreground">{agency.noteCount} note{agency.noteCount > 1 ? "s" : ""}</span>
                )}
              </div>
              <p className="mt-4 font-serif text-xl">{agency.name}</p>
              <p className="mt-1 text-xs text-soft-foreground">
                {agency.memberCount} membre{agency.memberCount !== 1 ? "s" : ""}
                {agency.lastActivity ? ` · dernière note ${formatDateTime(agency.lastActivity)}` : " · aucune activité"}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BroadcastComposer({ notify, onClose }: { notify: (message: string) => void; onClose: () => void }) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/crm/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, broadcast: true }),
      });
      const result = await response.json();
      if (!response.ok) {
        notify(result.error ?? "Impossible de diffuser l'annonce.");
        return;
      }
      notify("Annonce diffusée à toutes les agences.");
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
        <Megaphone size={16} /> Annonce à toutes les agences
      </div>
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        className={fieldClass}
        rows={3}
        placeholder="Ce message sera épinglé en haut du fil de chaque agence..."
        maxLength={4000}
        autoFocus
      />
      <div className="mt-3 flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
        <Button type="submit" disabled={submitting || !body.trim()}>
          <Send size={15} /> {submitting ? "Diffusion..." : "Diffuser"}
        </Button>
      </div>
    </form>
  );
}

function NotesThread({
  notify,
  currentUserId,
  isAdmin,
  agencyId,
  agencyName,
  onBack,
}: {
  notify: (message: string) => void;
  currentUserId: string;
  isAdmin: boolean;
  agencyId?: string;
  agencyName?: string;
  onBack?: () => void;
}) {
  const [notes, setNotes] = useState<CrmNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [broadcast, setBroadcast] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (agencyId) params.set("agencyId", agencyId);
    const response = await fetch(`/api/crm/notes?${params.toString()}`);
    const result = await response.json();
    if (!response.ok) notify(result.error ?? "Impossible de charger les notes.");
    setNotes(response.ok ? result.notes : []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agencyId]);

  const announcements = useMemo(() => notes.filter((note) => note.is_broadcast), [notes]);
  const groups = useMemo(() => groupNotesByDate(notes.filter((note) => !note.is_broadcast)), [notes]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/crm/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, broadcast: isAdmin && broadcast }),
      });
      const result = await response.json();
      if (!response.ok) {
        notify(result.error ?? "Impossible d'enregistrer la note.");
        return;
      }
      setNotes((current) => [result.note, ...current]);
      setBody("");
      setBroadcast(false);
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(note: CrmNote) {
    setEditingId(note.id);
    setEditingBody(note.body);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingBody("");
  }

  async function saveEdit(id: string) {
    if (!editingBody.trim()) return;
    setSavingEdit(true);
    try {
      const response = await fetch(`/api/crm/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: editingBody }),
      });
      const result = await response.json();
      if (!response.ok) {
        notify(result.error ?? "Impossible de modifier la note.");
        return;
      }
      setNotes((current) => current.map((note) => (note.id === id ? { ...result.note, agency_name: note.agency_name } : note)));
      cancelEdit();
      notify("Note modifiée.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function remove(id: string) {
    const response = await fetch(`/api/crm/notes/${id}`, { method: "DELETE" });
    if (response.ok) {
      setNotes((current) => current.filter((note) => note.id !== id));
      notify("Note supprimée.");
    } else {
      const result = await response.json().catch(() => null);
      notify(result?.error ?? "Impossible de supprimer la note.");
    }
  }

  function renderNote(note: CrmNote) {
    const isOwn = note.author_id === currentUserId;
    const isEditing = editingId === note.id;
    return (
      <div key={note.id} className={`flex items-start gap-4 px-5 py-4 ${note.is_broadcast ? "bg-primary/5" : ""}`}>
        <div className={`grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold uppercase ${note.is_broadcast ? "bg-primary text-primary-foreground" : "bg-surface text-primary"}`}>
          {note.is_broadcast ? <Megaphone size={15} /> : (note.profiles?.full_name ?? "?").slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{note.profiles?.full_name ?? "Membre de l'équipe"}</p>
            <time className="text-xs text-soft-foreground">{formatDateTime(note.created_at)}</time>
            {isOwn && !isEditing && <span className="text-xs text-soft-foreground">(vous)</span>}
            {note.is_broadcast && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground">Annonce · toutes les agences</span>
            )}
            {isAdmin && !note.is_broadcast && note.agency_name && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{note.agency_name}</span>
            )}
            {note.leads?.contacts?.full_name && (
              <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-soft-foreground">Lead · {note.leads.contacts.full_name}</span>
            )}
            {note.contacts?.full_name && (
              <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-soft-foreground">Contact · {note.contacts.full_name}</span>
            )}
          </div>
          {isEditing ? (
            <div className="mt-2">
              <textarea value={editingBody} onChange={(event) => setEditingBody(event.target.value)} className={fieldClass} rows={3} maxLength={4000} autoFocus />
              <div className="mt-2 flex justify-end gap-2">
                <button type="button" onClick={cancelEdit} className="rounded-lg p-2 text-soft-foreground hover:bg-surface"><X size={15} /></button>
                <button type="button" onClick={() => saveEdit(note.id)} disabled={savingEdit || !editingBody.trim()} className="rounded-lg p-2 text-primary hover:bg-surface disabled:opacity-50"><Check size={15} /></button>
              </div>
            </div>
          ) : (
            <p className={`mt-1 whitespace-pre-wrap text-sm ${note.is_broadcast ? "font-medium text-foreground" : "text-soft-foreground"}`}>{note.body}</p>
          )}
        </div>
        {!isEditing && (isAdmin || isOwn) && (
          <div className="flex shrink-0 items-center gap-1">
            {isOwn && (
              <button type="button" title="Modifier" aria-label="Modifier" onClick={() => startEdit(note)} className="rounded-lg p-2 text-soft-foreground hover:bg-surface hover:text-primary">
                <Pencil size={15} />
              </button>
            )}
            <ConfirmButton label={<Trash2 size={15} />} confirmLabel="Confirmer ?" onConfirm={() => remove(note.id)} className="rounded-lg p-2 text-soft-foreground hover:bg-surface hover:text-red-600" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-cool-light pb-6">
        {onBack && (
          <button type="button" onClick={onBack} className="mb-3 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-soft-foreground hover:text-primary">
            <ChevronLeft size={14} /> Toutes les agences
          </button>
        )}
        <p className="eyebrow">Collaboration</p>
        <h2 className="mt-2 font-serif text-4xl tracking-tight">{agencyName ? `Notes — ${agencyName}` : "Notes d'équipe"}</h2>
        <p className="mt-2 max-w-2xl text-sm text-soft-foreground">
          Un fil partagé avec les collègues de votre agence — utile pour se transmettre le contexte d'un client, une relance à faire, ou une information utile sans passer par un lead ou un contact précis.
        </p>
      </div>

      <form onSubmit={submit} className="rounded-2xl border border-cool-light bg-background p-5">
        <textarea value={body} onChange={(event) => setBody(event.target.value)} className={fieldClass} rows={3} placeholder="Écrire une note visible par votre équipe..." maxLength={4000} />
        <div className="mt-3 flex items-center justify-between">
          {isAdmin ? (
            <label className="flex items-center gap-2 text-xs text-soft-foreground">
              <input type="checkbox" checked={broadcast} onChange={(event) => setBroadcast(event.target.checked)} className="size-4 accent-primary" />
              Diffuser comme annonce à toutes les agences
            </label>
          ) : <span />}
          <Button type="submit" disabled={submitting || !body.trim()}>
            {broadcast ? <Megaphone size={15} /> : <Send size={15} />} {submitting ? "Publication..." : broadcast ? "Diffuser" : "Publier"}
          </Button>
        </div>
      </form>

      {announcements.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-primary/30 bg-background">
          <div className="border-b border-primary/20 bg-primary/5 px-5 py-3">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary"><Megaphone size={14} /> Annonces épinglées</p>
          </div>
          <div className="divide-y divide-cool-light">{announcements.map(renderNote)}</div>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-cool-light bg-background">
        <div className="border-b border-cool-light px-5 py-4">
          <h3 className="font-semibold">Fil de discussion</h3>
          <p className="mt-1 text-xs text-soft-foreground">{agencyName ? `Visible par les membres de ${agencyName}.` : "Visible par les membres de votre agence."}</p>
        </div>
        {loading ? (
          <p className="px-5 py-10 text-sm text-soft-foreground">Chargement des notes...</p>
        ) : groups.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <NotebookPen className="mx-auto text-soft-foreground" size={28} />
            <p className="mt-3 font-serif text-2xl">Aucune note pour le moment</p>
            <p className="mt-2 text-sm text-soft-foreground">Soyez le premier à partager une information avec l'équipe.</p>
          </div>
        ) : (
          <div>
            {groups.map((group) => (
              <div key={group.key}>
                <div className="sticky top-0 z-10 border-b border-cool-light bg-surface/95 px-5 py-2 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-soft-foreground">
                    {group.label} <span className="font-normal text-soft-foreground/70">· {group.notes.length}</span>
                  </p>
                </div>
                <div className="divide-y divide-cool-light">{group.notes.map(renderNote)}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

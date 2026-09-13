"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Plus } from "lucide-react";
import type { Contact, CrmProperty, Task } from "./types";
import { ConfirmButton, Modal, crmPageHref, fieldClass, formatDate, isOverdueDate, labelClass } from "./ui";
import { AgencyScopeBar } from "./agency-picker";
import { Pagination } from "./pagination";
import type { PaginationMeta } from "./contacts-view";

const priorityColors: Record<string, string> = {
  low: "bg-surface text-muted-foreground",
  normal: "bg-background text-soft-foreground",
  high: "bg-surface text-primary",
};
const columns = [
  ["todo", "À faire"],
  ["in_progress", "En cours"],
  ["done", "Terminées"],
] as const;

export function TasksView({
  tasks,
  contacts,
  properties,
  onTasksChange,
  notify,
  pagination,
  isAdmin,
  agencyName,
  agencyId,
  onBackToAgencies,
}: {
  tasks: Task[];
  contacts: Contact[];
  properties: CrmProperty[];
  onTasksChange: (tasks: Task[]) => void;
  notify: (message: string) => void;
  pagination?: PaginationMeta;
  isAdmin?: boolean;
  agencyName?: string | null;
  agencyId?: string | null;
  onBackToAgencies?: () => void;
}) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const grouped = useMemo(() => {
    const groups: Record<string, Task[]> = {
      todo: [],
      in_progress: [],
      done: [],
    };
    for (const task of tasks) (groups[task.status] ??= []).push(task);
    return groups;
  }, [tasks]);

  const cycleStatus = async (task: Task) => {
    const next =
      task.status === "todo"
        ? "in_progress"
        : task.status === "in_progress"
          ? "done"
          : "todo";
    const response = await fetch(`/api/crm/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (response.ok)
      onTasksChange(
        tasks.map((item) =>
          item.id === task.id ? { ...item, status: next } : item,
        ),
      );
    else notify("Le statut de la tâche n'a pas pu être mis à jour.");
  };
  const deleteTask = async (id: string) => {
    const response = await fetch(`/api/crm/tasks/${id}`, { method: "DELETE" });
    if (response.ok) {
      onTasksChange(tasks.filter((task) => task.id !== id));
      notify("Tâche supprimée");
    } else notify("La tâche n'a pas pu être supprimée.");
  };

  return (
    <section className="rounded-2xl border border-cool-light bg-background p-5 sm:p-6">
      {onBackToAgencies && agencyName && <AgencyScopeBar agencyName={agencyName} onBack={onBackToAgencies} />}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="eyebrow">Suivi opérationnel</p>
          <h2 className="mt-2 font-serif text-2xl">{agencyName ? `Tâches · ${agencyName}` : "Tâches"}</h2>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-earth px-4 py-2.5 text-xs font-semibold text-primary-foreground"
        >
          <Plus size={14} />
          Tâche
        </button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {columns.map(([status, label]) => (
          <div key={status} className="min-h-40 rounded-xl bg-background p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-soft-foreground">
                {label}
              </p>
              <span className="grid h-6 w-6 place-items-center rounded-full bg-background text-xs font-bold">
                {grouped[status]?.length ?? 0}
              </span>
            </div>
            <div className="mt-3 flex flex-col gap-3">
              {(grouped[status] ?? []).map((task) => {
                const overdue = isOverdueDate(task.due_date, task.status);
                return (
                <article
                  key={task.id}
                  className={`rounded-xl border bg-background p-3 shadow-sm ${overdue ? "border-primary/40" : "border-cool-light"}`}
                >
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => cycleStatus(task)}
                      aria-label="Changer le statut"
                      className="mt-0.5 text-foreground"
                    >
                      {task.status === "done" ? (
                        <CheckCircle2 size={16} className="text-muted-foreground" />
                      ) : (
                        <Circle size={16} />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <button type="button" onClick={() => setEditing(task)} className="block w-full text-left">
                        <p
                          className={`text-sm font-semibold ${task.status === "done" ? "text-muted-foreground line-through" : ""}`}
                        >
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="mt-1 line-clamp-2 text-xs text-soft-foreground">
                            {task.description}
                          </p>
                        )}
                      </button>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span
                          className={`rounded-full px-2 py-0.5 font-bold uppercase ${priorityColors[task.priority] ?? priorityColors.normal}`}
                        >
                          {task.priority}
                        </span>
                        {task.due_date && (
                          <span className={`rounded-full px-2 py-0.5 font-semibold ${overdue ? "bg-primary/10 text-primary" : "bg-background text-soft-foreground"}`}>
                            {overdue ? "En retard · " : ""}
                            {formatDate(task.due_date)}
                          </span>
                        )}
                        {task.contacts && (
                          <span className="rounded-full bg-surface px-2 py-0.5 font-semibold text-muted-foreground">
                            {task.contacts.full_name}
                          </span>
                        )}
                        {task.properties && (
                          <span className="rounded-full bg-surface px-2 py-0.5 font-semibold text-accent">
                            {task.properties.title}
                          </span>
                        )}
                        {isAdmin && (
                          <span className="rounded-full bg-background px-2 py-0.5 font-bold uppercase text-primary">
                            {task.agency_name ?? "Sans agence"}
                          </span>
                        )}
                      </div>
                    </div>
                    <ConfirmButton
                      label="✕"
                      confirmLabel="?"
                      onConfirm={() => deleteTask(task.id)}
                      className="rounded-full px-1.5 py-0.5 text-xs text-muted-foreground/70 hover:bg-surface hover:text-primary"
                    />
                  </div>
                </article>
                );
              })}
              {(grouped[status] ?? []).length === 0 && (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  Aucune tâche.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {pagination && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          pageSize={pagination.pageSize}
          onPageChange={(page) => router.push(crmPageHref("/crm/taches", page, agencyId))}
        />
      )}

      {showModal && (
        <TaskModal
          contacts={contacts}
          properties={properties}
          onClose={() => setShowModal(false)}
          onSaved={(task) => {
            onTasksChange([task, ...tasks]);
            setShowModal(false);
            notify("Tâche créée");
          }}
        />
      )}
      {editing && (
        <TaskModal
          task={editing}
          contacts={contacts}
          properties={properties}
          onClose={() => setEditing(null)}
          onSaved={(task) => {
            onTasksChange(tasks.map((item) => (item.id === task.id ? task : item)));
            setEditing(null);
            notify("Tâche mise à jour");
          }}
        />
      )}
    </section>
  );
}

function TaskModal({
  task,
  contacts,
  properties,
  onClose,
  onSaved,
}: {
  task?: Task;
  contacts: Contact[];
  properties: CrmProperty[];
  onClose: () => void;
  onSaved: (task: Task) => void;
}) {
  const [form, setForm] = useState({
    title: task?.title ?? "",
    description: task?.description ?? "",
    due_date: task?.due_date?.slice(0, 10) ?? "",
    priority: task?.priority ?? "normal",
    contact_id: task?.contacts?.id ?? "",
    property_id: task?.properties?.id ?? "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const response = await fetch(task ? `/api/crm/tasks/${task.id}` : "/api/crm/tasks", {
      method: task ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    if (!response.ok) setError(data.error ?? "Impossible d'enregistrer la tâche");
    else onSaved(data.task);
    setSaving(false);
  };

  return (
    <Modal title={task ? "Modifier la tâche" : "Nouvelle tâche"} onClose={onClose}>
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
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <label className={labelClass}>Échéance</label>
            <input
              type="date"
              value={form.due_date}
              onChange={(event) =>
                setForm({ ...form, due_date: event.target.value })
              }
              className={fieldClass}
            />
          </div>
          <div className="grid gap-1.5">
            <label className={labelClass}>Priorité</label>
            <select
              value={form.priority}
              onChange={(event) =>
                setForm({ ...form, priority: event.target.value })
              }
              className={fieldClass}
            >
              <option value="low">Basse</option>
              <option value="normal">Normale</option>
              <option value="high">Haute</option>
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <label className={labelClass}>Contact lié</label>
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
          <div className="grid gap-1.5">
            <label className={labelClass}>Bien lié</label>
            <select
              value={form.property_id}
              onChange={(event) =>
                setForm({ ...form, property_id: event.target.value })
              }
              className={fieldClass}
            >
              <option value="">Aucun</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          disabled={saving}
          className="rounded-full bg-earth px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {saving ? (task ? "Enregistrement..." : "Création...") : task ? "Enregistrer" : "Créer la tâche"}
        </button>
      </form>
    </Modal>
  );
}

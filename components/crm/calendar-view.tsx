"use client";

import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3 } from "lucide-react";
import type { CalendarTask, CalendarVisit } from "./types";
import { AgencyScopeBar } from "./agency-picker";

const monthNames = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function dayKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function displayTime(value: string) {
  return new Intl.DateTimeFormat("fr-TN", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function CalendarView({
  tasks,
  visits,
  isAdmin,
  agencyName,
  onBackToAgencies,
}: {
  tasks: CalendarTask[];
  visits: CalendarVisit[];
  isAdmin?: boolean;
  agencyName?: string | null;
  onBackToAgencies?: () => void;
}) {
  const now = new Date();
  const [cursor, setCursor] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const today = dayKey(now.toISOString());
  const days = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const count = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const offset = (first.getDay() + 6) % 7;
    return Array.from({ length: offset + count }, (_, index) => index < offset ? null : new Date(cursor.getFullYear(), cursor.getMonth(), index - offset + 1));
  }, [cursor]);
  const tasksByDay = useMemo(() => {
    const grouped = new Map<string, CalendarTask[]>();
    for (const task of tasks) {
      const key = dayKey(task.due_date!);
      grouped.set(key, [...(grouped.get(key) ?? []), task]);
    }
    return grouped;
  }, [tasks]);
  const visitsByDay = useMemo(() => {
    const grouped = new Map<string, CalendarVisit[]>();
    for (const visit of visits) {
      const key = dayKey(visit.scheduled_at);
      grouped.set(key, [...(grouped.get(key) ?? []), visit]);
    }
    return grouped;
  }, [visits]);

  return (
    <section className="rounded-2xl border border-cool-light bg-background p-5 sm:p-6">
      {onBackToAgencies && agencyName && <AgencyScopeBar agencyName={agencyName} onBack={onBackToAgencies} />}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Planning partagé</p>
          <h2 className="mt-2 font-serif text-2xl">{agencyName ? `Agenda · ${agencyName}` : "Agenda"}</h2>
          <p className="mt-1 text-sm text-soft-foreground">Tâches et visites réunies par journée.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="rounded-full border border-cool-light px-3 py-2 text-xs">Précédent</button>
          <button type="button" onClick={() => setCursor(new Date(now.getFullYear(), now.getMonth(), 1))} className="rounded-full bg-earth px-3 py-2 text-xs font-semibold text-primary-foreground">Aujourd’hui</button>
          <button type="button" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="rounded-full border border-cool-light px-3 py-2 text-xs">Suivant</button>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-4">
        <h3 className="font-serif text-xl capitalize">{monthNames[cursor.getMonth()]} {cursor.getFullYear()}</h3>
        <div className="flex items-center gap-4 text-xs text-soft-foreground">
          <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} className="text-primary" /> Tâche</span>
          <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} className="text-accent" /> Visite</span>
        </div>
      </div>
      <div className="mt-3 overflow-hidden rounded-xl border border-cool-light">
        <div className="grid grid-cols-7 border-b border-cool-light bg-surface">
          {weekDays.map((day) => <div key={day} className="px-2 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-soft-foreground">{day}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map((date, index) => {
            if (!date) return <div key={`empty-${index}`} className="min-h-28 border-b border-r border-cool-light bg-surface/40 sm:min-h-36" />;
            const key = dayKey(date.toISOString());
            const dayTasks = tasksByDay.get(key) ?? [];
            const dayVisits = visitsByDay.get(key) ?? [];
            return (
              <div key={key} className={`min-h-28 border-b border-r border-cool-light p-2 sm:min-h-36 ${key === today ? "bg-primary/5" : "bg-background"}`}>
                <p className={`text-xs font-semibold ${key === today ? "text-primary" : "text-soft-foreground"}`}>{date.getDate()}</p>
                <div className="mt-2 space-y-1.5">
                  {dayVisits.map((visit) => <div key={`visit-${visit.id}`} className="rounded-md border-l-2 border-accent bg-accent/10 px-1.5 py-1 text-[10px] leading-tight"><span className="font-semibold">{displayTime(visit.scheduled_at)}</span> · {visit.properties?.title ?? "Visite"} </div>)}
                  {dayTasks.map((task) => <div key={`task-${task.id}`} className={`rounded-md border-l-2 border-primary bg-primary/10 px-1.5 py-1 text-[10px] leading-tight ${task.status === "done" ? "opacity-50 line-through" : ""}`}><span className="font-semibold">Tâche</span> · {task.title}</div>)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1.5 text-xs text-soft-foreground"><Clock3 size={14} /> Les visites affichent leur heure de rendez-vous.</div>
    </section>
  );
}

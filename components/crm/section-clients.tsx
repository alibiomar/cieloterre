"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useNotify } from "./notify-provider";
import { AgencyPickerScreen, type AgencyScopeSummary } from "./agency-picker";
import { OverviewView } from "./overview-view";
import { LeadsView } from "./leads-view";
import { ContactsView } from "./contacts-view";
import { PropertiesView } from "./properties-view";
import { TasksView } from "./tasks-view";
import { VisitsView } from "./visits-view";
import { TeamView } from "./team-view";
import { OperationsView } from "./operations-view";
import { DocumentsView } from "./documents-view";
import { AccountView } from "./account-view";
import { NotesView } from "./notes-view";
import { ActivityView } from "./activity-view";
import { SiteSettingsView } from "./site-settings-view";
import { CalendarView } from "./calendar-view";
import type {
  Contact,
  CrmProperty,
  Lead,
  Task,
  Visit,
  ViewingRequest,
  CalendarTask,
  CalendarVisit,
} from "./types";
import type { PaginationMeta } from "./contacts-view";

export function OverviewSection(props: React.ComponentProps<typeof OverviewView>) {
  return <OverviewView {...props} />;
}

/**
 * Shared "pick an agency" gate for the server-rendered sections (leads,
 * contacts, biens, tâches, visites). Shown only when the loader reports
 * `needsAgencyPick` — i.e. an admin hasn't chosen an agency yet via the
 * `?agencyId=` query param. Selecting one just navigates to the same
 * section with that param set; the server loader does the actual scoping.
 */
export function AgencyPickerRedirect({
  basePath,
  title,
  subtitle,
  agencies,
  itemLabel,
}: {
  basePath: string;
  title: string;
  subtitle: string;
  agencies: AgencyScopeSummary[];
  /** Singular noun, e.g. "lead" or "tâche" — pluralized internally as "1 lead" / "2 leads". */
  itemLabel: string;
}) {
  const router = useRouter();
  return (
    <AgencyPickerScreen
      title={title}
      subtitle={subtitle}
      agencies={agencies}
      countLabel={(n) => `${n} ${itemLabel}${n > 1 ? "s" : ""}`}
      onSelect={(agency) => router.push(`${basePath}?agencyId=${agency.id}`)}
    />
  );
}

export function LeadsSection({ leads, properties, pagination, isAdmin, agencyName, agencyId }: { leads: Lead[]; properties: CrmProperty[]; pagination: PaginationMeta; isAdmin?: boolean; agencyName?: string | null; agencyId?: string | null }) {
  const notify = useNotify();
  const router = useRouter();
  const [state, setState] = useState(leads);
  return (
    <LeadsView
      leads={state}
      properties={properties}
      onLeadsChange={setState}
      notify={notify}
      pagination={pagination}
      isAdmin={isAdmin}
      agencyName={agencyName}
      agencyId={agencyId}
      onBackToAgencies={isAdmin && agencyName ? () => router.push("/crm/leads") : undefined}
    />
  );
}

export function ContactsSection({ contacts, pagination, isAdmin, agencyName, agencyId }: { contacts: Contact[]; pagination: PaginationMeta; isAdmin?: boolean; agencyName?: string | null; agencyId?: string | null }) {
  const notify = useNotify();
  const router = useRouter();
  const [state, setState] = useState(contacts);
  return (
    <ContactsView
      contacts={state}
      onContactsChange={setState}
      notify={notify}
      pagination={pagination}
      isAdmin={isAdmin}
      agencyName={agencyName}
      agencyId={agencyId}
      onBackToAgencies={isAdmin && agencyName ? () => router.push("/crm/contacts") : undefined}
    />
  );
}

export function PropertiesSection({ properties, pagination, isAdmin, agencyName, agencyId }: { properties: CrmProperty[]; pagination: PaginationMeta; isAdmin?: boolean; agencyName?: string | null; agencyId?: string | null }) {
  const notify = useNotify();
  const router = useRouter();
  const [state, setState] = useState(properties);
  return (
    <PropertiesView
      properties={state}
      onPropertiesChange={setState}
      notify={notify}
      pagination={pagination}
      isAdmin={isAdmin}
      agencyName={agencyName}
      agencyId={agencyId}
      onBackToAgencies={isAdmin && agencyName ? () => router.push("/crm/biens") : undefined}
    />
  );
}

export function TasksSection({
  tasks,
  contacts,
  properties,
  pagination,
  isAdmin,
  agencyName,
  agencyId,
}: {
  tasks: Task[];
  contacts: Contact[];
  properties: CrmProperty[];
  pagination: PaginationMeta;
  isAdmin?: boolean;
  agencyName?: string | null;
  agencyId?: string | null;
}) {
  const notify = useNotify();
  const router = useRouter();
  const [state, setState] = useState(tasks);
  return (
    <TasksView
      tasks={state}
      contacts={contacts}
      properties={properties}
      onTasksChange={setState}
      notify={notify}
      pagination={pagination}
      isAdmin={isAdmin}
      agencyName={agencyName}
      agencyId={agencyId}
      onBackToAgencies={isAdmin && agencyName ? () => router.push("/crm/taches") : undefined}
    />
  );
}

export function VisitsSection({
  visits,
  viewingRequests,
  contacts,
  properties,
  pagination,
  isAdmin,
  agencyName,
  agencyId,
}: {
  visits: Visit[];
  viewingRequests: ViewingRequest[];
  contacts: Contact[];
  properties: CrmProperty[];
  pagination: PaginationMeta;
  isAdmin?: boolean;
  agencyName?: string | null;
  agencyId?: string | null;
}) {
  const notify = useNotify();
  const router = useRouter();
  const [visitState, setVisitState] = useState(visits);
  const [requestState, setRequestState] = useState(viewingRequests);
  return (
    <VisitsView
      visits={visitState}
      onVisitsChange={setVisitState}
      viewingRequests={requestState}
      onViewingRequestsChange={setRequestState}
      contacts={contacts}
      properties={properties}
      notify={notify}
      pagination={pagination}
      isAdmin={isAdmin}
      agencyName={agencyName}
      agencyId={agencyId}
      onBackToAgencies={isAdmin && agencyName ? () => router.push("/crm/visites") : undefined}
    />
  );
}

export function CalendarSection({
  tasks,
  visits,
  isAdmin,
  agencyName,
}: {
  tasks: CalendarTask[];
  visits: CalendarVisit[];
  isAdmin?: boolean;
  agencyName?: string | null;
}) {
  const router = useRouter();
  return (
    <CalendarView
      tasks={tasks}
      visits={visits}
      isAdmin={isAdmin}
      agencyName={agencyName}
      onBackToAgencies={isAdmin && agencyName ? () => router.push("/crm/agenda") : undefined}
    />
  );
}

export function TeamSection({
  agencies,
  agents,
}: {
  agencies: React.ComponentProps<typeof TeamView>["initialAgencies"];
  agents: React.ComponentProps<typeof TeamView>["initialAgents"];
}) {
  const notify = useNotify();
  return <TeamView initialAgencies={agencies} initialAgents={agents} notify={notify} />;
}

export function OperationsSection(props: Omit<React.ComponentProps<typeof OperationsView>, "notify">) {
  const notify = useNotify();
  return <OperationsView {...props} notify={notify} />;
}

export function DocumentsSection({ currentUserId, isAdmin }: { currentUserId: string; isAdmin: boolean }) {
  const notify = useNotify();
  return <DocumentsView notify={notify} currentUserId={currentUserId} isAdmin={isAdmin} />;
}

export function AccountSection() {
  const notify = useNotify();
  return <AccountView notify={notify} />;
}

export function NotesSection({ currentUserId, isAdmin }: { currentUserId: string; isAdmin: boolean }) {
  const notify = useNotify();
  return <NotesView notify={notify} currentUserId={currentUserId} isAdmin={isAdmin} />;
}

export function ActivitySection({ currentUserId, isAdmin }: { currentUserId: string; isAdmin: boolean }) {
  const notify = useNotify();
  return <ActivityView notify={notify} currentUserId={currentUserId} isAdmin={isAdmin} />;
}

export function SiteSection(props: Omit<React.ComponentProps<typeof SiteSettingsView>, "notify">) {
  const notify = useNotify();
  return <SiteSettingsView {...props} notify={notify} />;
}

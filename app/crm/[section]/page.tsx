import { notFound } from "next/navigation";
import {
  CRM_SECTIONS,
  loadOverview,
  loadLeads,
  loadContacts,
  loadProperties,
  loadTasks,
  loadVisits,
  loadTeam,
  loadOperationsLookups,
  loadRole,
  loadSiteSettings,
  type SearchParams,
} from "@/lib/crm/load-dashboard";
import {
  OverviewSection,
  LeadsSection,
  ContactsSection,
  PropertiesSection,
  TasksSection,
  VisitsSection,
  TeamSection,
  OperationsSection,
  DocumentsSection,
  AccountSection,
  NotesSection,
  ActivitySection,
  AgencyPickerRedirect,
  SiteSection,
} from "@/components/crm/section-clients";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(CRM_SECTIONS).map((section) => ({ section }));
}

const operationsModules: Record<string, "transactions" | "financial_entries" | "crm_articles" | "inquiries"> = {
  transactions: "transactions",
  finances: "financial_entries",
  conseils: "crm_articles",
  demandes: "inquiries",
};

export default async function CrmSectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { section } = await params;
  if (!(section in CRM_SECTIONS)) notFound();
  const sp = await searchParams;

  switch (section) {
    case "dashboard": {
      const data = await loadOverview(section);
      return (
        <OverviewSection
          stats={data.stats}
          leadsByStatus={data.leadsByStatus}
          visitsTrend={data.visitsTrend}
          recentLeads={data.recentLeads}
          openTasks={data.openTasks}
          nextVisits={data.nextVisits}
          todayVisits={data.todayVisits}
        />
      );
    }
    case "leads": {
      const data = await loadLeads(section, sp);
      if (data.needsAgencyPick) {
        return (
          <AgencyPickerRedirect
            basePath="/crm/leads"
            title="Leads"
            subtitle="Choisissez une agence pour consulter et suivre ses leads."
            agencies={data.agencies}
            itemLabel="lead"
          />
        );
      }
      return <LeadsSection leads={data.leads} properties={data.properties} pagination={data.pagination} isAdmin={data.isAdmin} agencyName={data.agencyName} agencyId={data.agencyId} />;
    }
    case "contacts": {
      const data = await loadContacts(section, sp);
      if (data.needsAgencyPick) {
        return (
          <AgencyPickerRedirect
            basePath="/crm/contacts"
            title="Contacts"
            subtitle="Choisissez une agence pour consulter ses contacts."
            agencies={data.agencies}
            itemLabel="contact"
          />
        );
      }
      return <ContactsSection contacts={data.contacts} pagination={data.pagination} isAdmin={data.isAdmin} agencyName={data.agencyName} agencyId={data.agencyId} />;
    }
    case "biens": {
      const data = await loadProperties(section, sp);
      if (data.needsAgencyPick) {
        return (
          <AgencyPickerRedirect
            basePath="/crm/biens"
            title="Biens"
            subtitle="Choisissez une agence pour consulter et gérer ses biens."
            agencies={data.agencies}
            itemLabel="bien"
          />
        );
      }
      return <PropertiesSection properties={data.properties} pagination={data.pagination} isAdmin={data.isAdmin} agencyName={data.agencyName} agencyId={data.agencyId} />;
    }
    case "taches": {
      const data = await loadTasks(section, sp);
      if (data.needsAgencyPick) {
        return (
          <AgencyPickerRedirect
            basePath="/crm/taches"
            title="Tâches"
            subtitle="Choisissez une agence pour consulter et gérer ses tâches."
            agencies={data.agencies}
            itemLabel="tâche"
          />
        );
      }
      return (
        <TasksSection
          tasks={data.tasks}
          contacts={data.contacts}
          properties={data.properties}
          pagination={data.pagination}
          isAdmin={data.isAdmin}
          agencyName={data.agencyName}
          agencyId={data.agencyId}
        />
      );
    }
    case "visites": {
      const data = await loadVisits(section, sp);
      if (data.needsAgencyPick) {
        return (
          <AgencyPickerRedirect
            basePath="/crm/visites"
            title="Visites"
            subtitle="Choisissez une agence pour consulter et planifier ses visites."
            agencies={data.agencies}
            itemLabel="visite"
          />
        );
      }
      return (
        <VisitsSection
          visits={data.visits}
          viewingRequests={data.viewingRequests}
          contacts={data.contacts}
          properties={data.properties}
          pagination={data.pagination}
          isAdmin={data.isAdmin}
          agencyName={data.agencyName}
          agencyId={data.agencyId}
        />
      );
    }
    case "equipe": {
      const data = await loadTeam(section);
      return <TeamSection agencies={data.agencies} agents={data.agents} />;
    }
    case "notes": {
      const data = await loadRole(section);
      return <NotesSection currentUserId={data.userId} isAdmin={data.role === "admin"} />;
    }
    case "activite": {
      const data = await loadRole(section);
      return <ActivitySection currentUserId={data.userId} isAdmin={data.role === "admin"} />;
    }
    case "documents": {
      const data = await loadRole(section);
      return <DocumentsSection currentUserId={data.userId} isAdmin={data.role === "admin"} />;
    }
    case "compte": {
      return <AccountSection />;
    }
    case "site": {
      const data = await loadSiteSettings(section);
      return <SiteSection initialSettings={data.settings} properties={data.properties} />;
    }
    case "transactions":
    case "finances":
    case "conseils":
    case "demandes": {
      const data = await loadOperationsLookups(section);
      return (
        <OperationsSection
          role={data.role}
          agencies={data.agencies}
          agents={data.agents}
          contacts={data.contacts}
          properties={data.properties}
          initialModule={operationsModules[section]}
        />
      );
    }
    default:
      notFound();
  }
}

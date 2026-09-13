import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { agencyPropertyIds, agencyMemberIds } from "@/lib/crm/auth";
import { redirect } from "next/navigation";
import type { AgencyScopeSummary } from "@/components/crm/agency-picker";

export const CRM_SECTIONS = {
  dashboard: "Vue d’ensemble",
  leads: "Leads",
  contacts: "Contacts",
  biens: "Biens",
  visites: "Visites",
  taches: "Tâches",
  equipe: "Équipe",
  transactions: "Transactions",
  finances: "Finances",
  documents: "Documents",
  conseils: "Conseils",
  demandes: "Demandes clients",
  notes: "Notes d'équipe",
  activite: "Activité agents",
  compte: "Mon compte",
  site: "Paramètres du site",
} as const;

export type CrmSection = keyof typeof CRM_SECTIONS;

export const PAGE_SIZE = 20;

type StaffCtx = {
  db: any;
  userId: string;
  role: "admin" | "agency_admin" | "agent";
  isAgent: boolean;
  isAdmin: boolean;
  agencyId: string | null;
  /** owner_ids this user is scoped to (their whole agency), or null for admin (unrestricted). */
  memberIds: string[] | null;
};

/**
 * Resolves the current staff member once. Every section loader below reuses
 * this instead of re-deriving the profile, and — critically — each loader
 * only queries the table(s) that section actually renders, instead of the
 * old behaviour of loading leads+contacts+properties+tasks+visits+... on
 * every single tab switch.
 */
async function getStaffContext(section: string): Promise<StaffCtx> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/crm/dashboard");

  const db = supabase as any;
  let { data: profile } = await db.from("profiles").select("id, role").eq("id", user.id).maybeSingle();
  if (!profile) {
    const adminDb = createAdminClient();
    const result = await adminDb.from("profiles").select("id, role").eq("id", user.id).maybeSingle();
    profile = result.data;
  }
  const role = String(profile?.role ?? "").trim().toLowerCase();
  if (!profile || !["admin", "agency_admin", "agent"].includes(role)) {
    redirect("/auth/login?error=staff_only");
  }

  let agencyId: string | null = null;
  let memberIds: string[] | null = null;
  if (role !== "admin") {
    let { data: agent } = await db.from("agents").select("agency_id").eq("id", user.id).maybeSingle();
    if (!agent) {
      const adminDb = createAdminClient();
      const result = await adminDb.from("agents").select("agency_id").eq("id", user.id).maybeSingle();
      agent = result.data;
    }
    agencyId = agent?.agency_id ?? null;
    // Everyone at the agency (agent or agency_admin) shares visibility of
    // the agency's leads/contacts/tasks/visits — same rule as Notes and
    // Documents. Falls back to "just me" if unattached to any agency.
    const adminDb = createAdminClient();
    const { data: agents } = agencyId ? await adminDb.from("agents").select("id").eq("agency_id", agencyId) : { data: null };
    memberIds = agents?.length ? agents.map((row: { id: string }) => row.id) : [user.id];
  }

  return { db, userId: user.id, role: role as StaffCtx["role"], isAgent: role === "agent", isAdmin: role === "admin", agencyId, memberIds };
}

function parsePage(searchParams: Record<string, string | string[] | undefined> | undefined) {
  const raw = searchParams?.page;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function paginate(total: number, page: number, pageSize = PAGE_SIZE) {
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const safePage = Math.min(page, totalPages);
  return { page: safePage, totalPages, total, pageSize };
}

export type SearchParams = Record<string, string | string[] | undefined> | undefined;

function pickedAgencyId(searchParams: SearchParams): string | undefined {
  const raw = searchParams?.agencyId;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value && value !== "all" ? value : undefined;
}

/**
 * Per-agency counts for a table scoped by `owner_id` (leads, contacts,
 * crm_tasks, visits) — powers the admin "pick an agency" screen, the same
 * way /api/crm/notes/agencies and /api/crm/documents/agencies already do
 * for Notes and Documents.
 */
async function agencySummaryByOwner(db: any, table: string): Promise<AgencyScopeSummary[]> {
  const [{ data: agencies, error }, { data: agents }, { data: rows }] = await Promise.all([
    db.from("agencies").select("id, name").order("name"),
    db.from("agents").select("id, agency_id"),
    db.from(table).select("owner_id, created_at"),
  ]);
  if (error) throw error;

  const agencyByOwner = new Map<string, string | null>((agents ?? []).map((row: { id: string; agency_id: string | null }) => [row.id, row.agency_id]));
  const memberCounts = new Map<string, number>();
  for (const row of agents ?? []) {
    if (!row.agency_id) continue;
    memberCounts.set(row.agency_id, (memberCounts.get(row.agency_id) ?? 0) + 1);
  }
  const counts = new Map<string, number>();
  const lastActivity = new Map<string, string>();
  for (const row of (rows as Array<{ owner_id?: string; created_at?: string }> ?? [])) {
    if (!row.owner_id) continue;
    const agencyId = agencyByOwner.get(row.owner_id);
    if (!agencyId) continue;
    counts.set(agencyId, (counts.get(agencyId) ?? 0) + 1);
    const current = lastActivity.get(agencyId);
    if (row.created_at && (!current || row.created_at > current)) lastActivity.set(agencyId, row.created_at);
  }

  return (agencies ?? []).map((agency: { id: string; name: string }) => ({
    id: agency.id,
    name: agency.name,
    memberCount: memberCounts.get(agency.id) ?? 0,
    count: counts.get(agency.id) ?? 0,
    lastActivity: lastActivity.get(agency.id) ?? null,
  }));
}

/** Same as agencySummaryByOwner, but for tables that carry `agency_id` directly (properties). */
async function agencySummaryByAgencyColumn(db: any, table: string): Promise<AgencyScopeSummary[]> {
  const [{ data: agencies, error }, { data: agents }, { data: rows }] = await Promise.all([
    db.from("agencies").select("id, name").order("name"),
    db.from("agents").select("id, agency_id"),
    db.from(table).select("agency_id, created_at"),
  ]);
  if (error) throw error;

  const memberCounts = new Map<string, number>();
  for (const row of agents ?? []) {
    if (!row.agency_id) continue;
    memberCounts.set(row.agency_id, (memberCounts.get(row.agency_id) ?? 0) + 1);
  }
  const counts = new Map<string, number>();
  const lastActivity = new Map<string, string>();
  for (const row of rows ?? []) {
    if (!row.agency_id) continue;
    counts.set(row.agency_id, (counts.get(row.agency_id) ?? 0) + 1);
    const current = lastActivity.get(row.agency_id);
    if (!current || row.created_at > current) lastActivity.set(row.agency_id, row.created_at);
  }

  return (agencies ?? []).map((agency: { id: string; name: string }) => ({
    id: agency.id,
    name: agency.name,
    memberCount: memberCounts.get(agency.id) ?? 0,
    count: counts.get(agency.id) ?? 0,
    lastActivity: lastActivity.get(agency.id) ?? null,
  }));
}

/** Vue d'ensemble: real aggregate analytics instead of slicing full tables client-side. */
export async function loadOverview(section: string) {
  const { db, isAdmin, agencyId, memberIds } = await getStaffContext(section);
  const scoped = (query: any) => (!isAdmin && memberIds ? query.in("owner_id", memberIds) : query);
  const scopedByAgency = (query: any) => (!isAdmin ? query.eq("agency_id", agencyId ?? "00000000-0000-0000-0000-000000000000") : query);
  const propertyIds = !isAdmin ? await agencyPropertyIds(agencyId) : null;
  const scopedByProperty = (query: any) => (!isAdmin ? query.in("property_id", propertyIds!.length ? propertyIds! : ["00000000-0000-0000-0000-000000000000"]) : query);
  const leadStatuses = ["new", "contacted", "qualified", "visit_scheduled", "won", "lost"];
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAhead = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const tunisToday = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Tunis" }).format(new Date());
  const todayStart = `${tunisToday}T00:00:00+01:00`;
  const todayEnd = `${tunisToday}T23:59:59.999+01:00`;

  const [
    leadStatusCounts,
    contactsCount,
    openTasksCount,
    overdueTasksCount,
    upcomingVisitsCount,
    todayVisitsCount,
    publishedPropertiesCount,
    totalPropertiesCount,
    pendingRequestsCount,
    recentLeads,
    openTasks,
    nextVisits,
    todayVisits,
    recentVisitsForTrend,
  ] = await Promise.all([
    Promise.all(
      leadStatuses.map(async (status) => {
        const { count } = await scoped(db.from("leads").select("id", { count: "exact", head: true })).eq("status", status);
        return { status, count: count ?? 0 };
      }),
    ),
    scoped(db.from("contacts").select("id", { count: "exact", head: true })),
    scoped(db.from("crm_tasks").select("id", { count: "exact", head: true })).neq("status", "done"),
    scoped(db.from("crm_tasks").select("id", { count: "exact", head: true }))
      .neq("status", "done")
      .lt("due_date", tunisToday),
    scoped(db.from("visits").select("id", { count: "exact", head: true }))
      .eq("status", "scheduled")
      .gte("scheduled_at", new Date().toISOString())
      .lte("scheduled_at", sevenDaysAhead),
    scoped(db.from("visits").select("id", { count: "exact", head: true }))
      .eq("status", "scheduled")
      .gte("scheduled_at", todayStart)
      .lte("scheduled_at", todayEnd),
    scopedByAgency(db.from("properties").select("id", { count: "exact", head: true }).eq("status", "published")),
    scopedByAgency(db.from("properties").select("id", { count: "exact", head: true })),
    scopedByProperty(db.from("viewing_requests").select("id", { count: "exact", head: true }).in("status", ["requested"])),
    scoped(
      db
        .from("leads")
        .select("id, status, priority, created_at, message, contacts(id, full_name, email, phone), properties(id, title, city, price)"),
    )
      .order("created_at", { ascending: false })
      .limit(5),
    scoped(db.from("crm_tasks").select("id, title, status, due_date, priority"))
      .neq("status", "done")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(5),
    scoped(
      db
        .from("visits")
        .select("id, scheduled_at, status, contacts(id, full_name), properties(id, title)"),
    )
      .eq("status", "scheduled")
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(5),
    scoped(
      db
        .from("visits")
        .select("id, scheduled_at, status, contacts(id, full_name), properties(id, title)"),
    )
      .eq("status", "scheduled")
      .gte("scheduled_at", todayStart)
      .lte("scheduled_at", todayEnd)
      .order("scheduled_at", { ascending: true })
      .limit(8),
    scoped(db.from("visits").select("scheduled_at, status")).gte("scheduled_at", fourteenDaysAgo),
  ]);

  // Bucket the last 14 days of visits by day for a real trend chart, computed
  // from a single narrow (scheduled_at, status) query instead of the whole
  // visits table.
  const dayBuckets: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dayBuckets.push({ date: d.toISOString().slice(0, 10), count: 0 });
  }
  for (const visit of (recentVisitsForTrend.data ?? []) as { scheduled_at: string }[]) {
    const day = visit.scheduled_at?.slice(0, 10);
    const bucket = dayBuckets.find((b) => b.date === day);
    if (bucket) bucket.count += 1;
  }

  return {
    section: CRM_SECTIONS.dashboard,
    stats: {
      contacts: contactsCount.count ?? 0,
      openTasks: openTasksCount.count ?? 0,
      upcomingVisits: upcomingVisitsCount.count ?? 0,
      publishedProperties: publishedPropertiesCount.count ?? 0,
      totalProperties: totalPropertiesCount.count ?? 0,
      pendingRequests: pendingRequestsCount.count ?? 0,
      overdueTasks: overdueTasksCount.count ?? 0,
      todayVisits: todayVisitsCount.count ?? 0,
      wonLeads: leadStatusCounts.find((entry: { status: string }) => entry.status === "won")?.count ?? 0,
      lostLeads: leadStatusCounts.find((entry: { status: string }) => entry.status === "lost")?.count ?? 0,
      activeLeads: leadStatusCounts.reduce(
        (sum: number, entry: any) => (["won", "lost"].includes(entry.status) ? sum : sum + entry.count),
        0,
      ),
    },
    leadsByStatus: leadStatusCounts,
    visitsTrend: dayBuckets,
    recentLeads: recentLeads.data ?? [],
    openTasks: openTasks.data ?? [],
    nextVisits: nextVisits.data ?? [],
    todayVisits: todayVisits.data ?? [],
  };
}

export async function loadLeads(section: string, searchParams: SearchParams) {
  const { db, role, isAdmin, agencyId, memberIds } = await getStaffContext(section);
  const picked = pickedAgencyId(searchParams);
  if (isAdmin && !picked) {
    return { section: CRM_SECTIONS.leads, needsAgencyPick: true as const, agencies: await agencySummaryByOwner(db, "leads"), isAdmin: true };
  }
  const scopeMemberIds = isAdmin ? await agencyMemberIds(picked!) : memberIds;
  const scopeAgencyId = isAdmin ? picked! : agencyId;
  const agencyName = isAdmin ? (await db.from("agencies").select("name").eq("id", picked!).maybeSingle()).data?.name ?? null : null;

  const page = parsePage(searchParams);
  const pageSize = 30;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = db
    .from("leads")
    .select("id, status, priority, created_at, message, owner_id, contacts(id, full_name, email, phone), properties(id, title, city, price)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (scopeMemberIds) query = query.in("owner_id", scopeMemberIds.length ? scopeMemberIds : ["00000000-0000-0000-0000-000000000000"]);

  const [{ data, count }, properties] = await Promise.all([
    query,
    db.from("properties").select("id, title, city, price").eq("agency_id", scopeAgencyId ?? "00000000-0000-0000-0000-000000000000").order("created_at", { ascending: false }).limit(300),
  ]);
  return {
    section: CRM_SECTIONS.leads,
    leads: await attachAgencyNames(db, data ?? [], role === "admin"),
    pagination: paginate(count ?? 0, page, pageSize),
    properties: properties.data ?? [],
    isAdmin: role === "admin",
    agencyName,
    agencyId: picked ?? null,
  };
}

export async function loadContacts(section: string, searchParams: SearchParams) {
  const { db, role, isAdmin, memberIds } = await getStaffContext(section);
  const picked = pickedAgencyId(searchParams);
  if (isAdmin && !picked) {
    return { section: CRM_SECTIONS.contacts, needsAgencyPick: true as const, agencies: await agencySummaryByOwner(db, "contacts"), isAdmin: true };
  }
  const scopeMemberIds = isAdmin ? await agencyMemberIds(picked!) : memberIds;
  const agencyName = isAdmin ? (await db.from("agencies").select("name").eq("id", picked!).maybeSingle()).data?.name ?? null : null;

  const page = parsePage(searchParams);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = db
    .from("contacts")
    .select("id, full_name, email, phone, contact_type, notes, owner_id, created_at, updated_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (scopeMemberIds) query = query.in("owner_id", scopeMemberIds.length ? scopeMemberIds : ["00000000-0000-0000-0000-000000000000"]);

  const { data, count } = await query;
  return {
    section: CRM_SECTIONS.contacts,
    contacts: await attachAgencyNames(db, data ?? [], role === "admin"),
    pagination: paginate(count ?? 0, page),
    isAdmin: role === "admin",
    agencyName,
    agencyId: picked ?? null,
  };
}

export async function loadProperties(section: string, searchParams: SearchParams) {
  const { db, role, agencyId } = await getStaffContext(section);
  const isAdmin = role === "admin";
  const picked = pickedAgencyId(searchParams);
  if (isAdmin && !picked) {
    return { section: CRM_SECTIONS.biens, needsAgencyPick: true as const, agencies: await agencySummaryByAgencyColumn(db, "properties"), isAdmin: true };
  }
  const scopeAgencyId = isAdmin ? picked! : agencyId;
  const agencyName = isAdmin ? (await db.from("agencies").select("name").eq("id", picked!).maybeSingle()).data?.name ?? null : null;

  const page = parsePage(searchParams);
  const pageSize = 12;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Properties are directly FK'd to an agency, so this is a plain equality
  // filter instead of the owner-lookup dance leads/contacts/tasks need.
  const columns =
    "id, slug, title, city, neighborhood, property_type, transaction_type, price, bedrooms, bathrooms, area_m2, description, status, features, cover_path, created_at, updated_at" +
    (isAdmin ? ", agencies(id, name)" : "");

  const query = db
    .from("properties")
    .select(columns, { count: "exact" })
    .eq("agency_id", scopeAgencyId ?? "00000000-0000-0000-0000-000000000000")
    .order("created_at", { ascending: false })
    .range(from, to);
  const { data, count } = await query;

  return { section: CRM_SECTIONS.biens, properties: data ?? [], pagination: paginate(count ?? 0, page, pageSize), isAdmin, agencyName, agencyId: picked ?? null };
}

export async function loadTasks(section: string, searchParams: SearchParams) {
  const { db, role, isAdmin, agencyId, memberIds } = await getStaffContext(section);
  const picked = pickedAgencyId(searchParams);
  if (isAdmin && !picked) {
    return { section: CRM_SECTIONS.taches, needsAgencyPick: true as const, agencies: await agencySummaryByOwner(db, "crm_tasks"), isAdmin: true };
  }
  const scopeMemberIds = isAdmin ? await agencyMemberIds(picked!) : memberIds;
  const scopeAgencyId = isAdmin ? picked! : agencyId;
  const agencyName = isAdmin ? (await db.from("agencies").select("name").eq("id", picked!).maybeSingle()).data?.name ?? null : null;

  const page = parsePage(searchParams);
  const pageSize = 30;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = db
    .from("crm_tasks")
    .select("id, title, description, due_date, status, priority, created_at, owner_id, contacts(id, full_name), properties(id, title), leads(id)", { count: "exact" })
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (scopeMemberIds) query = query.in("owner_id", scopeMemberIds.length ? scopeMemberIds : ["00000000-0000-0000-0000-000000000000"]);

  const [{ data, count }, contacts, properties] = await Promise.all([
    query,
    scopedLookup(db, "contacts", "id, full_name", false, scopeMemberIds),
    db.from("properties").select("id, slug, title, city, neighborhood, property_type, transaction_type, price, bedrooms, bathrooms, area_m2, description, status, created_at, updated_at").eq("agency_id", scopeAgencyId ?? "00000000-0000-0000-0000-000000000000").order("created_at", { ascending: false }).limit(200),
  ]);

  return {
    section: CRM_SECTIONS.taches,
    tasks: await attachAgencyNames(db, data ?? [], role === "admin"),
    pagination: paginate(count ?? 0, page, pageSize),
    contacts: (contacts ?? []) as any,
    properties: properties.data ?? [],
    isAdmin: role === "admin",
    agencyName,
    agencyId: picked ?? null,
  };
}

export async function loadVisits(section: string, searchParams: SearchParams) {
  const { db, role, isAdmin, agencyId, memberIds } = await getStaffContext(section);
  const picked = pickedAgencyId(searchParams);
  if (isAdmin && !picked) {
    return { section: CRM_SECTIONS.visites, needsAgencyPick: true as const, agencies: await agencySummaryByOwner(db, "visits"), isAdmin: true };
  }
  const scopeMemberIds = isAdmin ? await agencyMemberIds(picked!) : memberIds;
  const scopeAgencyId = isAdmin ? picked! : agencyId;
  const agencyName = isAdmin ? (await db.from("agencies").select("name").eq("id", picked!).maybeSingle()).data?.name ?? null : null;

  const page = parsePage(searchParams);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = db
    .from("visits")
    .select("id, scheduled_at, status, notes, created_at, owner_id, contacts(id, full_name, phone, email), properties(id, title, city, slug)", { count: "exact" })
    .order("scheduled_at", { ascending: true })
    .range(from, to);
  if (scopeMemberIds) query = query.in("owner_id", scopeMemberIds.length ? scopeMemberIds : ["00000000-0000-0000-0000-000000000000"]);

  const propertyIds = await agencyPropertyIds(scopeAgencyId);

  const [{ data, count }, viewingRequests, contacts, properties] = await Promise.all([
    query,
    db
      .from("viewing_requests")
      .select("id, name, email, phone, requested_date, message, status, created_at, properties(id, title, city)")
      .in("status", ["requested"])
      .in("property_id", propertyIds.length ? propertyIds : ["00000000-0000-0000-0000-000000000000"])
      .order("created_at", { ascending: false })
      .limit(50),
    scopedLookup(db, "contacts", "id, full_name, phone, email", false, scopeMemberIds),
    db.from("properties").select("id, slug, title, city, neighborhood, property_type, transaction_type, price, bedrooms, bathrooms, area_m2, description, status, created_at, updated_at").eq("agency_id", scopeAgencyId ?? "00000000-0000-0000-0000-000000000000").order("created_at", { ascending: false }).limit(200),
  ]);

  return {
    section: CRM_SECTIONS.visites,
    visits: await attachAgencyNames(db, data ?? [], role === "admin"),
    pagination: paginate(count ?? 0, page),
    viewingRequests: viewingRequests.data ?? [],
    contacts: (contacts ?? []) as any,
    properties: properties.data ?? [],
    isAdmin: role === "admin",
    agencyName,
    agencyId: picked ?? null,
  };
}

export async function loadTeam(section: string) {
  const { db, role } = await getStaffContext(section);
  if (role !== "admin") redirect("/crm/dashboard");
  const [{ data: agencies }, { data: agents }] = await Promise.all([
    db.from("agencies").select("id, name, slug, description, city, address, phone, email, website, logo_path").order("name"),
    db.from("agents").select("id, agency_id, email, slug, avatar_path, is_public, access_blocked, profiles(full_name, role)").order("created_at", { ascending: false }),
  ]);
  return { section: CRM_SECTIONS.equipe, agencies: agencies ?? [], agents: agents ?? [] };
}

export async function loadSiteSettings(section: string) {
  const { role } = await getStaffContext(section);
  if (role !== "admin") redirect("/crm/dashboard");
  const [{ data: settings }, { data: properties }] = await Promise.all([
    createAdminClient().from("site_settings").select("key, value"),
    createAdminClient().from("properties").select("id, slug, title, city, cover_path").eq("status", "published").order("created_at", { ascending: false }).limit(200),
  ]);
  return {
    section: CRM_SECTIONS.site,
    settings: Object.fromEntries((settings ?? []).map((row: any) => [row.key, row.value])),
    properties: properties ?? [],
  };
}

/** Small lookup lists used by the "operations" modules (transactions, finances, etc.) for their select dropdowns. */
export async function loadOperationsLookups(section: string) {
  const { db, role, isAdmin, agencyId, memberIds } = await getStaffContext(section);
  const [contacts, properties, agencies, agents] = await Promise.all([
    scopedLookup(db, "contacts", "id, full_name", isAdmin, memberIds, 200),
    (() => {
      let pq = db.from("properties").select("id, title").order("created_at", { ascending: false }).limit(200);
      if (!isAdmin) pq = pq.eq("agency_id", agencyId ?? "00000000-0000-0000-0000-000000000000");
      return pq;
    })(),
    role === "admin" ? db.from("agencies").select("id, name, slug, description, city, address, phone, email, website, logo_path").order("name") : Promise.resolve({ data: [] }),
    role === "admin" ? db.from("agents").select("id, agency_id, email, slug, avatar_path, is_public, profiles(full_name, role)").order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
  ]);
  return {
    section: CRM_SECTIONS[section as CrmSection],
    role,
    contacts: (contacts ?? []) as any,
    properties: properties.data ?? [],
    agencies: agencies.data ?? [],
    agents: agents.data ?? [],
  };
}

export async function loadRole(section: string) {
  const { role, userId } = await getStaffContext(section);
  return { section: CRM_SECTIONS[section as CrmSection] ?? CRM_SECTIONS.dashboard, role, userId };
}

async function scopedLookup(db: any, table: string, columns: string, isAdmin: boolean, memberIds: string[] | null, limit = 300) {
  let query = db.from(table).select(columns).order("created_at", { ascending: false }).limit(limit);
  if (!isAdmin && memberIds) query = query.in("owner_id", memberIds);
  const { data } = await query;
  return data ?? [];
}

/**
 * Admin-only: attaches the owning agent's agency name to each row so the
 * admin view can show/sort/group by agency. Leads/contacts/tasks/visits are
 * owner_id-scoped (not directly FK'd to agents in PostgREST), so this does
 * one small lookup over the distinct owners instead of a per-row query.
 */
async function attachAgencyNames(db: any, rows: any[], isAdmin: boolean): Promise<any[]> {
  if (!isAdmin || rows.length === 0) return rows.map((row) => ({ ...row, agency_name: null }));
  const ownerIds = Array.from(new Set(rows.map((row) => row.owner_id).filter(Boolean))) as string[];
  if (ownerIds.length === 0) return rows.map((row) => ({ ...row, agency_name: null }));
  const { data: agents } = await db.from("agents").select("id, agencies(name)").in("id", ownerIds);
  const nameByOwner = new Map((agents ?? []).map((agent: any) => [agent.id, agent.agencies?.name ?? null]));
  return rows.map((row) => ({ ...row, agency_name: (row.owner_id ? nameByOwner.get(row.owner_id) : null) ?? null }));
}

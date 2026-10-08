export type Profile = { id: string; full_name: string | null; phone?: string | null; role: string; email?: string; preferences?: Record<string, unknown> | null }

export type Lead = {
  id: string
  status: string
  priority: string
  created_at: string
  message: string | null
  owner_id?: string | null
  agency_name?: string | null
  contacts: { id: string; full_name: string; email: string | null; phone: string | null } | null
  properties: { id: string; title: string; city: string; price: number } | null
}

export type Contact = {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  contact_type: string
  notes: string | null
  owner_id?: string | null
  agency_name?: string | null
  created_at: string
  updated_at: string
}

export type CrmProperty = {
  id: string
  slug: string
  title: string
  city: string
  neighborhood: string | null
  property_type: string
  transaction_type: string
  price: number
  bedrooms: number
  bathrooms: number
  area_m2: number
  description: string | null
  cover_path: string | null
  status: string
  features?: string[]
  created_at: string
  updated_at: string
  agencies?: { id: string; name: string } | null
}

export type Task = {
  id: string
  title: string
  description: string | null
  due_date: string | null
  status: string
  priority: string
  created_at: string
  owner_id?: string | null
  agency_name?: string | null
  contacts: { id: string; full_name: string } | null
  properties: { id: string; title: string } | null
  leads: { id: string } | null
}

export type Visit = {
  id: string
  scheduled_at: string
  status: string
  notes: string | null
  created_at: string
  owner_id?: string | null
  agency_name?: string | null
  contacts: { id: string; full_name: string; phone: string | null; email: string | null } | null
  properties: { id: string; title: string; city: string; slug: string } | null
}

export type CalendarTask = Pick<Task, "id" | "title" | "due_date" | "status" | "priority" | "owner_id" | "agency_name"> & {
  contacts: { id: string; full_name: string } | null
  properties: { id: string; title: string } | null
}

export type CalendarVisit = Pick<Visit, "id" | "scheduled_at" | "status" | "owner_id" | "agency_name"> & {
  contacts: { id: string; full_name: string } | null
  properties: { id: string; title: string; city: string } | null
}

export type ViewingRequest = {
  id: string
  name: string
  email: string
  phone: string | null
  requested_date: string | null
  message: string | null
  status: string
  created_at: string
  properties: { id: string; title: string; city: string } | null
}

export type Stats = { contacts: number; openTasks: number }

export type CrmNote = {
  id: string
  body: string
  author_id: string
  lead_id: string | null
  contact_id: string | null
  created_at: string
  profiles: { full_name: string | null } | null
  leads: { id: string; contacts: { full_name: string } | null } | null
  contacts: { id: string; full_name: string } | null
  agency_name?: string | null
  is_broadcast?: boolean
}

export type CrmActivity = {
  id: string
  actor_id: string
  activity_type: string
  body: string | null
  created_at: string
  profiles: { full_name: string | null; role: string } | null
  leads: { id: string; contacts: { full_name: string } | null } | null
  contacts: { id: string; full_name: string } | null
}

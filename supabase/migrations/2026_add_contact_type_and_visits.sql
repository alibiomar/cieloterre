-- Adds the two things the CRM frontend/API code expects that aren't in
-- the current schema: contacts.contact_type, and the visits table.

alter table public.contacts
  add column if not exists contact_type text not null default 'lead'
  check (contact_type = any (array['lead','buyer','seller','tenant','landlord','other']));

create table if not exists public.visits (
  id uuid not null default gen_random_uuid(),
  owner_id uuid not null,
  contact_id uuid,
  lead_id uuid,
  property_id uuid not null,
  viewing_request_id uuid,
  scheduled_at timestamp with time zone not null,
  status text not null default 'scheduled'
    check (status = any (array['scheduled','completed','cancelled','no_show'])),
  notes text,
  created_at timestamp with time zone not null default now(),
  constraint visits_pkey primary key (id),
  constraint visits_owner_id_fkey foreign key (owner_id) references public.profiles(id),
  constraint visits_contact_id_fkey foreign key (contact_id) references public.contacts(id),
  constraint visits_lead_id_fkey foreign key (lead_id) references public.leads(id),
  constraint visits_property_id_fkey foreign key (property_id) references public.properties(id),
  constraint visits_viewing_request_id_fkey foreign key (viewing_request_id) references public.viewing_requests(id)
);

create index if not exists visits_owner_id_idx on public.visits(owner_id);
create index if not exists visits_scheduled_at_idx on public.visits(scheduled_at);

-- Fixes the class of "Impossible de ..." errors on visits/tasks/documents/
-- transactions/finances/contrats/emails: those tables were created (or, for
-- crm_tasks, never created at all) without ever being granted to the
-- `authenticated` role or given RLS policies. PostgREST rejects any query
-- against them from the user-scoped client with a permission error, which
-- the API routes surface as a generic 500 message.

-- crm_tasks was referenced everywhere in the app code but was missing from
-- every .sql file in this repo.
create table if not exists public.crm_tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  title text not null,
  description text,
  due_date date,
  status text not null default 'open'
    check (status = any (array['open','in_progress','done','cancelled'])),
  priority text not null default 'normal'
    check (priority = any (array['low','normal','high'])),
  contact_id uuid references public.contacts(id),
  lead_id uuid references public.leads(id),
  property_id uuid references public.properties(id),
  created_at timestamptz not null default now()
);
create index if not exists crm_tasks_owner_id_idx on public.crm_tasks(owner_id);
create index if not exists crm_tasks_status_idx on public.crm_tasks(status);

-- A staff member (admin / agency_admin / agent) may access a row. Fine-
-- grained ownership/agency scoping already happens in the API layer
-- (lib/crm/auth.ts, lib/crm/scope.ts) via the user-scoped or admin client;
-- this policy is the floor that lets PostgREST touch the table at all.
create or replace function public.is_crm_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'agency_admin', 'agent')
  );
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'visits', 'crm_tasks', 'transactions', 'financial_entries',
    'crm_templates', 'crm_messages', 'crm_documents', 'crm_document_events'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    if not exists (
      select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = 'Staff can access ' || t
    ) then
      execute format(
        'create policy %L on public.%I for all to authenticated using (public.is_crm_staff()) with check (public.is_crm_staff())',
        'Staff can access ' || t, t
      );
    end if;
  end loop;
end
$$;

notify pgrst, 'reload schema';

create policy "Agents can create visits"
on public.visits
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'agent')
  )
);
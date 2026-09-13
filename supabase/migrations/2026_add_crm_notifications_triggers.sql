-- Replaces the on-the-fly notification queries (lib/crm/notifications.ts) with
-- a real, trigger-populated table. Each source table gets an AFTER INSERT
-- trigger that writes one row here; the API just reads this table.

create table if not exists public.crm_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type = any (array['lead','viewing_request','task','visit'])),
  title text not null,
  description text not null,
  href text not null,
  owner_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists crm_notifications_created_at_idx on public.crm_notifications(created_at desc);
create index if not exists crm_notifications_owner_id_idx on public.crm_notifications(owner_id);

alter table public.crm_notifications enable row level security;

drop policy if exists "staff can read notifications" on public.crm_notifications;
create policy "staff can read notifications" on public.crm_notifications
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin','agency_admin','agent')
    )
  );

-- lead created
create or replace function public.notify_new_lead() returns trigger as $$
begin
  if new.status = 'new' then
    insert into public.crm_notifications (type, title, description, href, owner_id)
    values (
      'lead',
      'Nouveau lead',
      coalesce((select full_name from public.contacts where id = new.contact_id), 'Contact inconnu')
        || ' · ' || coalesce((select title from public.properties where id = new.property_id), 'Projet immobilier'),
      '/crm/leads?highlight=' || new.id,
      new.owner_id
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notify_new_lead on public.leads;
create trigger trg_notify_new_lead
  after insert on public.leads
  for each row execute function public.notify_new_lead();

-- viewing request created
create or replace function public.notify_new_viewing_request() returns trigger as $$
begin
  if new.status = 'pending' then
    insert into public.crm_notifications (type, title, description, href, owner_id)
    values (
      'viewing_request',
      'Demande de visite',
      new.name || ' · ' || coalesce((select title from public.properties where id = new.property_id), 'Bien'),
      '/crm/visites?highlight=' || new.id,
      null
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notify_new_viewing_request on public.viewing_requests;
create trigger trg_notify_new_viewing_request
  after insert on public.viewing_requests
  for each row execute function public.notify_new_viewing_request();

-- task created with a due date
create or replace function public.notify_new_task() returns trigger as $$
begin
  if new.due_date is not null and new.status != 'done' then
    insert into public.crm_notifications (type, title, description, href, owner_id)
    values (
      'task',
      'Nouvelle tâche',
      new.title
        || coalesce((select ' · ' || full_name from public.contacts where id = new.contact_id), ''),
      '/crm/taches?highlight=' || new.id,
      new.owner_id
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notify_new_task on public.crm_tasks;
create trigger trg_notify_new_task
  after insert on public.crm_tasks
  for each row execute function public.notify_new_task();

-- visit scheduled
create or replace function public.notify_new_visit() returns trigger as $$
begin
  if new.status = 'scheduled' then
    insert into public.crm_notifications (type, title, description, href, owner_id)
    values (
      'visit',
      'Visite planifiée',
      coalesce((select title from public.properties where id = new.property_id), 'Bien')
        || ' · ' || coalesce((select full_name from public.contacts where id = new.contact_id), 'Contact'),
      '/crm/visites?highlight=' || new.id,
      new.owner_id
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notify_new_visit on public.visits;
create trigger trg_notify_new_visit
  after insert on public.visits
  for each row execute function public.notify_new_visit();

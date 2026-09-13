alter table public.crm_notes
  add column if not exists is_broadcast boolean not null default false;

create index if not exists crm_notes_is_broadcast_idx on public.crm_notes(is_broadcast) where is_broadcast = true;

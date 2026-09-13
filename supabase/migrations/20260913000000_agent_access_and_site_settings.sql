-- Block/unblock CRM access per agent
alter table public.agents
  add column if not exists access_blocked boolean not null default false;

-- Admin-controlled homepage hero
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

create policy "site_settings_public_read" on public.site_settings
  for select using (true);

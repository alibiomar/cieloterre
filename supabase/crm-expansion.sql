-- Apply this migration in Supabase before using the expanded CRM modules.
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid references public.agencies(id),
  agent_id uuid references public.agents(id),
  property_id uuid references public.properties(id),
  contact_id uuid references public.contacts(id),
  transaction_type text not null check (transaction_type in ('sale', 'rent', 'management')),
  stage text not null default 'prospect',
  amount numeric(14, 2) not null default 0,
  commission_rate numeric(6, 3) not null default 0,
  commission_amount numeric(14, 2) not null default 0,
  currency text not null default 'TND',
  expected_close_date date,
  closed_at timestamptz,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.financial_entries (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references public.transactions(id) on delete cascade,
  agency_id uuid references public.agencies(id),
  entry_type text not null check (entry_type in ('income', 'expense', 'commission', 'payment', 'refund')),
  category text not null default 'other',
  description text not null,
  amount numeric(14, 2) not null,
  currency text not null default 'TND',
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  due_date date,
  paid_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.crm_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('email', 'contract', 'notice')),
  subject text,
  body text not null,
  variables text[] not null default '{}',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_messages (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.crm_templates(id),
  contact_id uuid references public.contacts(id),
  transaction_id uuid references public.transactions(id),
  recipient_email text not null,
  subject text not null,
  body text not null,
  status text not null default 'draft' check (status in ('draft', 'queued', 'sent', 'failed')),
  sent_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.crm_documents (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references public.transactions(id) on delete cascade,
  contact_id uuid references public.contacts(id),
  name text not null,
  document_type text not null default 'other',
  file_url text not null,
  mime_type text not null default 'application/pdf',
  signature_status text not null default 'not_required'
    check (signature_status in ('not_required', 'pending', 'partially_signed', 'signed', 'declined')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_document_events (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.crm_documents(id) on delete cascade,
  event_type text not null check (event_type in ('viewed', 'downloaded', 'signature_requested', 'signed', 'declined')),
  actor_email text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists transactions_agency_idx on public.transactions(agency_id);
create index if not exists financial_entries_transaction_idx on public.financial_entries(transaction_id);
create index if not exists crm_messages_contact_idx on public.crm_messages(contact_id);
create index if not exists crm_documents_transaction_idx on public.crm_documents(transaction_id);
create index if not exists crm_document_events_document_idx on public.crm_document_events(document_id);

alter table public.profiles
  add column if not exists preferences jsonb not null default '{}'::jsonb;
alter table public.agents
  add column if not exists avatar_path text;
alter table public.agents
  add column if not exists languages text[] not null default '{}';
alter table public.agents
  add column if not exists is_public boolean not null default false;
alter table public.agencies
  add column if not exists city text;
alter table public.agencies
  add column if not exists address text;

create table if not exists public.crm_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category text not null default 'Immobilier',
  title text not null,
  excerpt text not null,
  body text not null default '',
  image_url text,
  read_time text not null default '5 min',
  published boolean not null default false,
  published_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.crm_articles enable row level security;

create index if not exists crm_articles_published_idx
  on public.crm_articles(published, published_at desc);

grant select on public.crm_articles to anon, authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'crm_articles'
      and policyname = 'Public can read published CRM articles'
  ) then
    create policy "Public can read published CRM articles"
      on public.crm_articles
      for select
      to anon, authenticated
      using (published = true);
  end if;
end
$$;

notify pgrst, 'reload schema';

insert into storage.buckets (id, name, public)
values ('public-media', 'public-media', true)
on conflict (id) do update set public = excluded.public;

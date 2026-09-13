-- Replaces "Contrats & modèles" (crm_templates) with real, per-agency
-- document organization: every document belongs to one agency and one of
-- a fixed set of categories. Admins browse every agency (see
-- /api/crm/documents/agencies, mirroring /api/crm/notes/agencies); agents
-- and agency_admins always see their own agency's library.

alter table public.crm_documents
  add column if not exists agency_id uuid references public.agencies(id);

alter table public.crm_documents
  add column if not exists category text not null default 'autre';

alter table public.crm_documents
  drop constraint if exists crm_documents_category_check;
alter table public.crm_documents
  add constraint crm_documents_category_check
    check (category in ('mandat', 'contrat', 'identite', 'financier', 'autre'));

-- Best-effort backfill: derive each existing document's agency from its
-- creator's agent record.
update public.crm_documents d
set agency_id = a.agency_id
from public.agents a
where d.agency_id is null and d.created_by = a.id and a.agency_id is not null;

create index if not exists crm_documents_agency_idx on public.crm_documents(agency_id);
create index if not exists crm_documents_category_idx on public.crm_documents(category);

notify pgrst, 'reload schema';

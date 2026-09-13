-- Templates (crm_templates) are a governed library: only admins/agency
-- admins edit the master copies, but every agent needs to *use* one to
-- produce a document for their own client. "Using" a contract/notice
-- template renders it into a crm_documents row holding the merged text —
-- so file_url can no longer be mandatory, and we track the source template.
alter table public.crm_documents
  add column if not exists generated_body text,
  add column if not exists source_template_id uuid references public.crm_templates(id) on delete set null;

alter table public.crm_documents
  alter column file_url drop not null;

alter table public.crm_documents
  drop constraint if exists crm_documents_has_content;
alter table public.crm_documents
  add constraint crm_documents_has_content check (file_url is not null or generated_body is not null);

-- Documents are per-agent working files (a filled mandate, a signed lease
-- scan, etc.) — track who created each one so the API can scope agents to
-- their own documents instead of the whole agency's.
alter table public.crm_documents
  add column if not exists created_by uuid references public.profiles(id) on delete set null;

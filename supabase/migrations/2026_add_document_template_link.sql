-- Link generated documents back to the template they were created from, so
-- "Contrats & modèles" (templates) and "Documents" (generated files) can be
-- connected via a "generate document from template" action.
alter table public.crm_documents
  add column if not exists template_id uuid references public.crm_templates(id) on delete set null;

create index if not exists crm_documents_template_idx on public.crm_documents(template_id);

-- crm-expansion.sql (which creates crm_documents) lives outside
-- supabase/migrations/, so its run order relative to
-- 2026_fix_rls_grants_and_tasks.sql isn't guaranteed. That migration's
-- DO block runs `alter table public.crm_documents ...` for every table in
-- one loop — if crm_documents didn't exist yet when it ran, that whole
-- statement fails and crm_documents never got its `grant` or its
-- "Staff can access crm_documents" policy, even though the migration
-- otherwise "succeeded" for the tables that did exist. That produces
-- exactly a 42501 on crm_documents (RLS enabled with no policy allowing
-- the row, auth.uid() effectively invisible to the query) while
-- crm_tasks/visits work fine.
--
-- Idempotent and safe to re-run: grants and policy creation are no-ops if
-- already present.

alter table public.crm_documents enable row level security;
alter table public.crm_document_events enable row level security;
alter table public.crm_templates enable row level security;
alter table public.crm_messages enable row level security;

grant select, insert, update, delete on public.crm_documents to authenticated;
grant select, insert, update, delete on public.crm_document_events to authenticated;
grant select, insert, update, delete on public.crm_templates to authenticated;
grant select, insert, update, delete on public.crm_messages to authenticated;

do $$
declare
  t text;
begin
  foreach t in array array['crm_documents', 'crm_document_events', 'crm_templates', 'crm_messages']
  loop
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

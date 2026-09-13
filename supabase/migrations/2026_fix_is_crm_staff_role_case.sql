-- lib/crm/auth.ts normalizes the role with .trim().toLowerCase() before
-- comparing it against the staff role list, but is_crm_staff() (used by
-- every "Staff can access <table>" RLS policy) compared the raw column
-- value. Any stray casing/whitespace in profiles.role (e.g. "Admin",
-- "agent ") passes the app-level check yet fails RLS, producing
-- "new row violates row-level security policy" on insert/update even
-- though the API had already approved the request as staff.
create or replace function public.is_crm_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and lower(trim(p.role)) in ('admin', 'agency_admin', 'agent')
  );
$$;

notify pgrst, 'reload schema';

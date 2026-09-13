-- "Demandes clients" (inquiries) had no agency boundary at all — every
-- agent/agency_admin could read every inquiry sitewide. This ties each
-- inquiry to the agency that owns the property it's about (same
-- convention as transactions/financial_entries), so the generic
-- /api/crm/operations scoping (lib/crm/scope.ts: "agency") applies here
-- unchanged.

alter table public.inquiries
  add column if not exists agency_id uuid references public.agencies(id);

create or replace function public.set_inquiry_agency() returns trigger as $$
begin
  if new.property_id is not null then
    select p.agency_id into new.agency_id from public.properties p where p.id = new.property_id;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_set_inquiry_agency on public.inquiries;
create trigger trg_set_inquiry_agency
  before insert on public.inquiries
  for each row execute function public.set_inquiry_agency();

-- Backfill existing rows.
update public.inquiries i
set agency_id = p.agency_id
from public.properties p
where i.property_id = p.id and i.agency_id is null;

create index if not exists inquiries_agency_idx on public.inquiries(agency_id);

notify pgrst, 'reload schema';

-- The original constraint required every note to reference a lead or a
-- contact. The team notes board also supports general posts (no specific
-- lead/contact attached), so we drop that requirement.
alter table public.crm_notes drop constraint if exists crm_notes_target_check;

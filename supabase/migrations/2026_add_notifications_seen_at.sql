-- Tracks the last time a staff member opened the CRM notification bell, so
-- we can compute an "unseen" count of new leads/visits/tasks/requests
-- without a dedicated notifications table.
alter table public.profiles
  add column if not exists notifications_seen_at timestamptz;

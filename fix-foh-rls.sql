-- Roberto's FOH — RLS write-access fix (June 2026)
-- Project: Leadership Hub Supabase (paoaivwtkzujmrgrfjuq). Run in SQL Editor. Safe to re-run.
--
-- SYMPTOM: the FOH schedule can't save a new shift, duplicate a week, or
-- delete a week. Writes fail with "new row violates row-level security policy
-- for table foh_roster" (Postgres 42501). Reading works; existing rows were
-- created earlier while a manager was logged in (authenticated role).
--
-- CAUSE: the schedule runs from the FOH public (PIN-gated, anon) layer, but
-- `foh_roster` was never granted anon write access. events/weeks/tasks/finance
-- were restored in launch-fix-june-2026.sql; the FOH tables were missed.
--
-- This mirrors that fix and the Kitchen App roster model: open operational
-- surface + PIN for accountability, for non-sensitive operational data
-- (ARCHITECTURE.md §1). If instead you want the schedule behind real auth,
-- do NOT run this — gate openFohSchedule() behind a Supabase session and add
-- `to authenticated` policies. (The badge data here is staff names + shift
-- times, not HR/payroll/finance.)

alter table foh_staff  enable row level security;
alter table foh_roster enable row level security;
alter table activity   enable row level security;

drop policy if exists "Allow all foh_staff"  on foh_staff;
drop policy if exists "Allow all foh_roster" on foh_roster;
drop policy if exists "Allow all activity"   on activity;

create policy "Allow all foh_staff"  on foh_staff  for all using (true) with check (true);
create policy "Allow all foh_roster" on foh_roster for all using (true) with check (true);
create policy "Allow all activity"   on activity   for all using (true) with check (true);

-- Realtime (the schedule subscribes to foh_roster changes across screens)
alter publication supabase_realtime add table foh_roster;

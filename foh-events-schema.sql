-- FOH schedule: day-events (up to 2 per day, shown at the top of the roster).
-- Run once in the Leadership Hub Supabase project (paoaivwtkzujmrgrfjuq) → SQL editor.

create table if not exists foh_events (
  id          uuid primary key default gen_random_uuid(),
  event_date  date not null,
  slot        smallint not null default 1,   -- 1 or 2 (two events per day)
  name        text not null,
  updated_at  timestamptz default now(),
  unique (event_date, slot)
);

-- The schedule writes from the public (PIN-gated, anon) layer — allow anon read/write,
-- same model as foh_roster / foh_staff.
alter table foh_events enable row level security;
drop policy if exists foh_events_all on foh_events;
create policy foh_events_all on foh_events for all using (true) with check (true);

-- Make PostgREST pick up the new table immediately.
notify pgrst, 'reload schema';

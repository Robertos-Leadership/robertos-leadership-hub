-- Roberto's FOH — Supabase schema (FOH-specific tables)
-- Project: Leadership Hub Supabase (paoaivwtkzujmrgrfjuq) — the same project
-- that backs events/weeks/tasks/finance (see schema.sql).
--
-- Purpose: stop the schema drift flagged in the June 2026 diagnostic. These
-- three tables are used by index.html but were never checked in. Column types
-- are reverse-engineered from the app's reads/writes; adjust to match the live
-- tables if they differ. SAFE TO RE-RUN — additive only (create ... if not
-- exists), per ARCHITECTURE.md §2.1. Run in the Supabase SQL Editor.

-- ── FOH staff roster (people) ──
-- Read:  index.html  sb.from('foh_staff').select('*').eq('active',true).order('sort_order')
-- Write: insert {name, role, section, sort_order, active}; update {role}, {emp_id}, {active:false}
create table if not exists foh_staff (
  id uuid default gen_random_uuid() primary key,
  name       text not null,
  role       text,
  section    text not null,           -- matches FOH_SECTIONS keys (Management, Bar, …)
  emp_id     text,                    -- COSEC employee id; null = no clock-in tracking
  sort_order integer default 0,
  active     boolean default true,
  created_at timestamptz default now()
);

-- ── FOH weekly roster (shifts per staff per day) ──
-- Read:  sb.from('foh_roster').select('*').gte('work_date',…).lte('work_date',…)
-- Write: upsert(..., { onConflict: 'staff_id,work_date' })  ← load-bearing unique key
create table if not exists foh_roster (
  id uuid default gen_random_uuid() primary key,
  staff_id     uuid references foh_staff(id) on delete cascade,
  work_date    date not null,
  status       text default 'working', -- working | off | wo | sl | al | ph | em | tr | cat
  shift_start  time,
  shift_end    time,
  shift_start2 time,                    -- optional split shift
  shift_end2   time,
  notes        text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
-- Required by the upsert onConflict target above:
create unique index if not exists foh_roster_staff_date_uniq
  on foh_roster (staff_id, work_date);

-- ── Activity log (Manager section audit trail) ──
-- Read:  sb.from('activity').select('*').order('created_at',{ascending:false}).limit(120)
-- Write: logActivity() → insert {user_email, action, entity_label, details}
create table if not exists activity (
  id uuid default gen_random_uuid() primary key,
  user_email   text,
  action       text not null,
  entity_label text,
  details      text,
  created_at   timestamptz default now()
);

-- ── RLS — CURRENT STATE (matches the live app today: open anon) ──
-- This reproduces the app as it runs now. See the TARGET block below for the
-- authenticated-only policies the diagnostic recommends.
alter table foh_staff  enable row level security;
alter table foh_roster enable row level security;
alter table activity   enable row level security;

create policy "Allow all foh_staff"  on foh_staff  for all using (true) with check (true);
create policy "Allow all foh_roster" on foh_roster for all using (true) with check (true);
create policy "Allow all activity"   on activity   for all using (true) with check (true);

-- Realtime (the schedule module subscribes to foh_roster changes)
alter publication supabase_realtime add table foh_roster;

-- ════════════════════════════════════════════════════════════════════════
-- TARGET (authenticated-only) — DO NOT RUN until auth gating is confirmed.
-- Flipping these will break any unauthenticated read/write. The FOH public
-- home does NOT read these tables, and the Manager/Schedule flows run after a
-- Supabase session exists, so this is the intended end state per
-- ARCHITECTURE.md §1 — but verify on DEV first. Left commented on purpose.
-- ════════════════════════════════════════════════════════════════════════
-- drop policy if exists "Allow all foh_staff"  on foh_staff;
-- drop policy if exists "Allow all foh_roster" on foh_roster;
-- drop policy if exists "Allow all activity"   on activity;
-- create policy "Authenticated foh_staff"  on foh_staff  for all to authenticated using (true) with check (true);
-- create policy "Authenticated foh_roster" on foh_roster for all to authenticated using (true) with check (true);
-- create policy "Authenticated activity"   on activity   for all to authenticated using (true) with check (true);
-- NB: the same review applies to events/weeks/tasks/finance in schema.sql.

-- ══════════════════════════════════════════════════════════════════════════
-- Roberto's — STOCK TAKE (monthly inventory) schema — FOH
-- FOH / Leadership Supabase project (paoaivwtkzujmrgrfjuq). Run in the SQL Editor.
-- ADDITIVE ONLY — create ... if not exists. Safe to re-run.
--
-- The FOH cost controller (Aung) emails stock-take Excels at each month-end —
-- one for the BAR (beverage), one for TOBACCO. Someone with a valid employee ID
-- uploads it in the app; it becomes that month's count sheet. Several people then
-- count quantities at once (live), each gated by employee ID, then a sheet is
-- reviewed and emailed/printed. Old months stay as history.
--
-- This is the BEVERAGE/TOBACCO twin of the Kitchen stock take. Identical tables —
-- the `dept` column ('beverage' | 'tobacco') keeps the two FOH counts separate,
-- exactly as the Kitchen used dept='kitchen'.
--
-- SCALE-READY ON PURPOSE (see THE-GOAL.md):
--  • venue_id on every table  → a 2nd branch is a setting, not a rebuild
--  • dept ('beverage' | 'tobacco') → one module, two (or more) lists
--  • month 'YYYY-MM'          → years of history, no per-month tables
--  • counted_by = employee id → every number is tied to a real person (foh_staff)
--
-- NOTE (money data): prices + total stock value are sensitive. RLS below is the
-- FOH app's current "open operational surface + employee-ID accountability" model
-- (allow-all anon, matching the rest of the FOH app during beta). When auth/roles
-- land, the review/send/value views move behind authenticated, role-scoped RLS —
-- the columns already carry venue_id/dept so that change is additive.
-- ══════════════════════════════════════════════════════════════════════════

-- ── 1. Month header — one row per venue + dept + month ──
create table if not exists stock_take_sheets (
  id            uuid default gen_random_uuid() primary key,
  venue_id      text not null default 'robertos-difc',
  dept          text not null,                       -- 'beverage' | 'tobacco'
  month         text not null,                       -- 'YYYY-MM'
  status        text not null default 'counting',    -- counting | reviewed | sent
  source_filename text,
  item_count    integer default 0,
  uploaded_by   text,                                -- employee id
  uploaded_by_name text,
  uploaded_at   timestamptz default now(),
  reviewed_by   text,
  reviewed_at   timestamptz,
  sent_at       timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create unique index if not exists stock_take_sheets_uniq
  on stock_take_sheets (venue_id, dept, month);

-- ── 2. The items to count for a given month (re-uploaded fresh each month) ──
create table if not exists stock_take_items (
  id          uuid default gen_random_uuid() primary key,
  venue_id    text not null default 'robertos-difc',
  dept        text not null,                         -- 'beverage' | 'tobacco'
  month       text not null,                         -- 'YYYY-MM'
  item_group  text,                                  -- category, e.g. 'Whiskey'
  code        text,                                  -- supplier/article code
  name        text not null,
  unit        text,                                  -- primary counting unit
  price       numeric default 0,                     -- AED average price / unit
  units       jsonb default '[]'::jsonb,             -- alt units [{unit,price}] (bottle vs case…)
  sort_order  integer default 0,
  is_added    boolean default false,                 -- added in-app, not on Aung's list
  added_by    text,                                  -- employee id of who added it
  active      boolean default true,
  created_at  timestamptz default now()
);
create index if not exists stock_take_items_month
  on stock_take_items (venue_id, dept, month, sort_order);

-- ── 3. The counted quantities — one row per item (last writer wins + realtime) ──
create table if not exists stock_take_counts (
  id            uuid default gen_random_uuid() primary key,
  item_id       uuid not null references stock_take_items(id) on delete cascade,
  venue_id      text not null default 'robertos-difc',
  dept          text not null,
  month         text not null,
  qty           numeric,
  unit          text,                                -- which unit was counted
  counted_by    text,                                -- employee id (accountability)
  counted_by_name text,
  updated_at    timestamptz default now()
);
create unique index if not exists stock_take_counts_item_uniq
  on stock_take_counts (item_id);
create index if not exists stock_take_counts_month
  on stock_take_counts (venue_id, dept, month);

-- ── RLS — current open operational model (matches the rest of the FOH app: allow-all anon) ──
alter table stock_take_sheets enable row level security;
alter table stock_take_items  enable row level security;
alter table stock_take_counts enable row level security;

drop policy if exists "allow all stock_take_sheets" on stock_take_sheets;
drop policy if exists "allow all stock_take_items"  on stock_take_items;
drop policy if exists "allow all stock_take_counts" on stock_take_counts;
create policy "allow all stock_take_sheets" on stock_take_sheets for all using (true) with check (true);
create policy "allow all stock_take_items"  on stock_take_items  for all using (true) with check (true);
create policy "allow all stock_take_counts" on stock_take_counts for all using (true) with check (true);

-- Realtime — live multi-person counting + live "item added" across devices.
-- Guarded so re-running the whole file never errors on "already a member".
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='stock_take_counts') then
    alter publication supabase_realtime add table stock_take_counts;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='stock_take_items') then
    alter publication supabase_realtime add table stock_take_items;
  end if;
end $$;

notify pgrst, 'reload schema';

-- ──────────────────────────────────────────────────────────────────────────
-- reset_log — audit trail for traceable actions in the FOH app.
--
-- WHY: roster "Send to HR" and closing-report "Save & Email" leave the building
-- (HR / the team). As of 25 Jun 2026 they require a validated Employee ID; this
-- table records WHO sent each one so every send is traceable.
--
-- Run this once in the FOH Supabase project (paoaivwtkzujmrgrfjuq).
-- The kitchen app has the same table in its own project — see
-- kitchen-ref/supabase/reset-log-schema.sql.
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists reset_log (
  id         bigint generated always as identity primary key,
  app        text        not null,            -- 'kitchen' | 'foh'
  action     text        not null,            -- e.g. 'roster_send', 'closing_report_send'
  scope      text,                            -- week / date label
  item_count int,
  emp_id     text        not null,
  emp_name   text        not null,
  at         timestamptz not null default now()
);

create index if not exists reset_log_at_idx on reset_log (at desc);

alter table reset_log enable row level security;

drop policy if exists reset_log_insert on reset_log;
create policy reset_log_insert on reset_log for insert to anon with check (true);

drop policy if exists reset_log_read on reset_log;
create policy reset_log_read on reset_log for select to anon using (true);

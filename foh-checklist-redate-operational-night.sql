-- Roberto's FOH — one-time cleanup: re-date old closing checklists to their operational night.
-- Project: Leadership Hub Supabase (paoaivwtkzujmrgrfjuq). Run in the SQL Editor.
--
-- WHY: closing checklists signed after midnight (e.g. Saturday night closed at 01:36 "Sunday")
-- were stamped with the calendar date before the app fix (22 Jun 2026). They belong to the
-- night that just ended. The app now does this automatically for NEW closings (chkToday uses
-- the same 6h business-day rollback as the closing report). This fixes the handful of OLD rows.
--
-- SAFE: only touches shift_type='closing' that were SIGNED in the early hours; never deletes;
-- only moves a row if the correct night has no closing row yet (so it can't clash).
-- Run STEP 1 first and eyeball it, then run STEP 2.

-- STEP 1 — PREVIEW (changes nothing). "correct_date" is where each row will move to.
select id, area,
       check_date                                                            as current_date,
       (verified_at at time zone 'Asia/Dubai' - interval '6 hours')::date     as correct_date,
       verified_name, verified_emp_id, verified_at
from foh_checklists
where shift_type = 'closing'
  and verified_at is not null
  and (verified_at at time zone 'Asia/Dubai' - interval '6 hours')::date <> check_date
order by check_date;

-- STEP 2 — APPLY the move (only where the target night is free).
update foh_checklists c
set check_date = (c.verified_at at time zone 'Asia/Dubai' - interval '6 hours')::date
where c.shift_type = 'closing'
  and c.verified_at is not null
  and (c.verified_at at time zone 'Asia/Dubai' - interval '6 hours')::date <> c.check_date
  and not exists (
    select 1 from foh_checklists x
    where x.shift_type = 'closing'
      and x.area = c.area
      and x.check_date = (c.verified_at at time zone 'Asia/Dubai' - interval '6 hours')::date
  );

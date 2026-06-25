-- ════════════════════════════════════════════════════════════════════════
--  FIX: Wrong nightly TOTALS — 11 nights, May–Jun 2026
--  Source of truth: Simphony "KPI Comparison" report (Sales Net VAT by Revenue Center)
--  Project: Leadership Hub Supabase (paoaivwtkzujmrgrfjuq). Run in SQL Editor.
--
--  These 11 nights had a total in the app that didn't match the till. This sets
--  net_actual + the Restaurant/Scala split exactly from Simphony.
--    rest_net   = Simphony "Restaurant" revenue centre
--    lounge_net = Simphony "Lounge" + "Cortina"  (Cortina folded into Scala)
--    net_actual = rest_net + lounge_net
--  The day's Lunch/Dinner split for these 11 nights is collapsed to Dinner
--  (the app's convention for area-total entries) so the area math reconciles.
--  Covers are left unchanged.
--
--  Run order vs the F&B-split script doesn't matter (different columns). After
--  BOTH run, every night reconciles: food+bev+tob+other = net = rest+lounge.
-- ════════════════════════════════════════════════════════════════════════

update rev_daily as r set
  rest_net          = v.rest,
  lounge_net        = v.loun,
  net_actual        = v.rest + v.loun,
  rest_dinner_net   = v.rest,
  rest_lunch_net    = null,
  lounge_dinner_net = v.loun,
  lounge_lunch_net  = null,
  updated_at        = now()
from (values
  -- service_date      rest_net (Restaurant)  lounge_net (Scala = Lounge+Cortina)
  ('2026-05-11'::date, 11674.20,  4031.03),
  ('2026-05-13'::date, 26166.41, 10037.56),
  ('2026-05-14'::date, 42195.67, 39689.13),
  ('2026-05-29'::date, 59537.66, 15695.13),
  ('2026-05-30'::date, 53442.54, 21576.58),
  ('2026-06-03'::date, 29990.26, 19436.93),
  ('2026-06-05'::date, 51776.87, 20742.91),
  ('2026-06-08'::date, 20088.61,  8881.67),
  ('2026-06-11'::date, 52030.30, 16788.68),
  ('2026-06-16'::date, 22191.88,  9791.14),
  ('2026-06-17'::date, 27284.95, 15509.54)
) as v(service_date, rest, loun)
where r.service_date = v.service_date;

-- Check: 11 rows; net_actual should now match the till and equal rest+lounge.
-- select service_date, rest_net, lounge_net, net_actual,
--        (rest_net+lounge_net) as area_sum,
--        (food_net+bev_net+tobacco_net+coalesce(other_net,0)) as split_sum
-- from rev_daily
-- where service_date in ('2026-05-11','2026-05-13','2026-05-14','2026-05-29',
--   '2026-05-30','2026-06-03','2026-06-05','2026-06-08','2026-06-11','2026-06-16','2026-06-17')
-- order by service_date;

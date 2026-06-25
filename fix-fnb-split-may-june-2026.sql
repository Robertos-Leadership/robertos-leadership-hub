-- ════════════════════════════════════════════════════════════════════════
--  FIX: Food / Beverage / Tobacco / Other Income split — May 1 to Jun 23, 2026
--  Source of truth: Simphony "Sales by Weekday" report (Sales Net VAT by Major Group)
--  Project: Leadership Hub Supabase (paoaivwtkzujmrgrfjuq). Run in SQL Editor.
--
--  Mapping used:
--    food_net    = Simphony "Food" major group
--    bev_net     = "Alcoholic" + "Wine & Champ" + "Non Alcoholic"
--    tobacco_net = "Tobacco"
--    other_net   = "Misc" major group  (OTHER INCOME — events/packages)
--
--  Only the four split columns are touched. net_actual and the
--  Restaurant/Scala split are NOT changed by this script.
--
--  "Other income" (Misc) only occurs on 3 nights:
--    May 3 = 9,183.69 · May 28 = 734.70 · May 30 = 2,072.45 ; all other days = 0.
--
--  ⚠ Days whose Simphony TOTAL differs from the stored net (separate issue,
--    NOT fixed here): see the "wrong totals" list in the handover note.
-- ════════════════════════════════════════════════════════════════════════

-- 1) New column for Other income (safe to re-run)
alter table rev_daily add column if not exists other_net numeric;
notify pgrst, 'reload schema';

-- 2) Write the real split from Simphony for every trading day
update rev_daily as r set
  food_net    = v.food,
  bev_net     = v.bev,
  tobacco_net = v.tob,
  other_net   = v.other,
  updated_at  = now()
from (values
  -- service_date      food        bev         tob        other
  ('2026-05-01'::date, 27607.72,   90294.20,   600.00,    0),
  ('2026-05-02'::date, 40414.77,   38233.79,   651.43,    0),
  ('2026-05-03'::date, 36076.80,   10494.71,   0.00,      9183.69),   -- Other income
  ('2026-05-04'::date, 4377.15,    5370.62,    80.00,     0),
  ('2026-05-05'::date, 19593.50,   18314.32,   80.00,     0),
  ('2026-05-06'::date, 20335.22,   17423.87,   401.63,    0),
  ('2026-05-07'::date, 44815.59,   41278.61,   280.00,    0),
  ('2026-05-08'::date, 29581.28,   53225.48,   683.27,    0),
  ('2026-05-09'::date, 57680.20,   55304.47,   80.00,     0),
  ('2026-05-11'::date, 10524.87,   5140.36,    40.00,     0),         -- total also wrong in app
  ('2026-05-12'::date, 19521.67,   19745.35,   120.00,    0),
  ('2026-05-13'::date, 16433.29,   19690.68,   80.00,     0),         -- total also wrong in app
  ('2026-05-14'::date, 28718.75,   50828.09,   2337.96,   0),
  ('2026-05-15'::date, 46281.47,   52072.01,   1280.82,   0),
  ('2026-05-16'::date, 45433.39,   42747.67,   390.20,    0),
  ('2026-05-18'::date, 9583.69,    11302.06,   525.72,    0),
  ('2026-05-19'::date, 26498.82,   18757.75,   80.00,     0),
  ('2026-05-20'::date, 19159.42,   18919.38,   40.00,     0),
  ('2026-05-21'::date, 25658.82,   31209.35,   324.08,    0),
  ('2026-05-22'::date, 31633.61,   53404.75,   2306.13,   0),
  ('2026-05-23'::date, 32394.02,   18075.21,   281.63,    0),
  ('2026-05-25'::date, 17252.68,   10160.02,   80.00,     0),
  ('2026-05-26'::date, 16683.62,   19430.90,   80.00,     0),
  ('2026-05-27'::date, 53305.97,   26986.82,   40.00,     0),
  ('2026-05-28'::date, 44061.38,   24667.31,   40.00,     734.70),    -- Other income
  ('2026-05-29'::date, 46392.33,   27926.99,   913.47,    0),
  ('2026-05-30'::date, 45424.18,   26956.79,   565.72,    2072.45),   -- Other income; total also wrong in app
  ('2026-06-01'::date, 21375.87,   19640.52,   200.00,    0),
  ('2026-06-02'::date, 16478.40,   16739.62,   1382.04,   0),
  ('2026-06-03'::date, 25455.54,   23570.02,   401.63,    0),         -- total also wrong in app
  ('2026-06-04'::date, 15444.11,   36802.85,   844.90,    0),
  ('2026-06-05'::date, 35723.08,   36366.49,   430.20,    0),         -- total also wrong in app
  ('2026-06-06'::date, 41546.69,   30674.82,   40.00,     0),
  ('2026-06-08'::date, 13656.78,   15313.49,   0.00,      0),         -- total also wrong in app
  ('2026-06-09'::date, 30159.56,   87803.26,   6920.01,   0),
  ('2026-06-10'::date, 24595.64,   29655.07,   481.63,    0),
  ('2026-06-11'::date, 33591.08,   33598.50,   1629.39,   0),
  ('2026-06-12'::date, 35037.78,   34937.45,   1702.04,   0),
  ('2026-06-13'::date, 36335.90,   43936.15,   651.43,    0),
  ('2026-06-15'::date, 24050.66,   11083.20,   281.63,    0),
  ('2026-06-16'::date, 19973.14,   11969.88,   40.00,     0),         -- total also wrong in app
  ('2026-06-17'::date, 24411.68,   18021.17,   361.63,    0),
  ('2026-06-18'::date, 41387.83,   44058.04,   671.84,    0),
  ('2026-06-19'::date, 43066.51,   50888.09,   1541.23,   0),
  ('2026-06-20'::date, 29345.52,   24307.63,   0.00,      0),
  ('2026-06-22'::date, 22444.94,   20259.22,   1583.68,   0),
  ('2026-06-23'::date, 19782.48,   23940.21,   120.00,    0)
) as v(service_date, food, bev, tob, other)
where r.service_date = v.service_date;

-- Check it worked: should return 47 rows; split_sum should equal Simphony's total.
-- select service_date, food_net, bev_net, tobacco_net, other_net,
--        (food_net+bev_net+tobacco_net+other_net) as split_sum, net_actual
-- from rev_daily
-- where service_date between '2026-05-01' and '2026-06-23'
-- order by service_date;

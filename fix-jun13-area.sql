-- Fix June 13 venue split — Restaurant was entered ~2,001 short (53,309 vs till 55,310).
-- Scala and total were already right; this makes rest+lounge reconcile to net.
update rev_daily set
  rest_net          = 55309.98,
  lounge_net        = 25613.52,   -- Lounge 26291.48 + Cortina (-677.96)
  net_actual        = 80923.50,
  rest_dinner_net   = 55309.98,
  rest_lunch_net    = null,
  lounge_dinner_net = 25613.52,
  lounge_lunch_net  = null,
  updated_at        = now()
where service_date = '2026-06-13';

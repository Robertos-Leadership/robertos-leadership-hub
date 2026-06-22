// ══════════════════════════════════════════════
//  foh-revenue.js — FOH Revenue module (slice 3 of the FOH file split)
//  Extracted verbatim from index.html (was lines ~4388-5016).
//  PURE relocation, zero renames. Functions stay GLOBAL so inline onclick
//  handlers keep working. Loaded AFTER the main inline <script> but BEFORE
//  foh-closing.js / foh-ops.js (they call revInit/revMoney). Uses sb,
//  state, renderMain from the main script (resolved at call time, post-load).
// ══════════════════════════════════════════════
// ══════════════════════════════════════════════
//  REVENUE MODULE — native rebuild of Daily Budget.xlsx
//  (Leader page · finance · authenticated-only)
// ══════════════════════════════════════════════
function revInit(){ if(!state.rev) state.rev={ rates:{}, daily:[], targets:{}, budgets:{}, proposals:{}, propSeq:0, loaded:false, loading:false, period:null, view:'month', tablesMissing:false }; return state.rev; }
async function loadRevenue(){
  var R=revInit(); if(R.loading) return; R.loading=true;
  try{
    var res=await Promise.all([
      sb.from('rev_rates').select('*'),
      sb.from('rev_daily').select('*').order('service_date'),
      sb.from('rev_targets').select('*')
    ]);
    R.tablesMissing = !!(res[0].error||res[1].error||res[2].error);
    R.rates={}; (res[0].data||[]).forEach(function(r){ R.rates[r.weekday]=r; });
    R.daily=res[1].data||[];
    R.targets={}; R.budgets={}; (res[2].data||[]).forEach(function(t){ R.targets[t.period]=Number(t.monthly_target)||0; if(t.monthly_budget!=null) R.budgets[t.period]=Number(t.monthly_budget); });
    if(!R.period) R.period=revLatestPeriod();
    R.loaded=true;
  }catch(e){ R.tablesMissing=true; R.loaded=true; }
  R.loading=false;
  if(state.currentTab==='revenue') renderMain();
}
// helpers
function revPeriodOf(d){ return String(d).slice(0,7); }
function revLatestPeriod(){ var R=revInit(); var ps=R.daily.map(function(d){return revPeriodOf(d.service_date);}); if(ps.length) return ps.sort().slice(-1)[0]; var n=new Date(); return n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0'); }
function revWeekday(ds){ return new Date(ds+'T12:00:00').toLocaleDateString('en-US',{weekday:'long'}); }
function revDailyMap(){ var m={}; revInit().daily.forEach(function(d){ m[String(d.service_date).slice(0,10)]=d; }); return m; }
function revRatesBudget(ds){ var r=revInit().rates[revWeekday(ds)]; if(!r) return 0; return (Number(r.cover_target)||0)*(Number(r.avg_spend)||0); }   // weekday pattern weight = cover_target × avg_spend
function revMonthlyBudget(p){ var R=revInit(); return (R.budgets&&R.budgets[p]!=null)?Number(R.budgets[p]):null; }
function revPatternTotal(p){ var dim=revDaysInMonth(p), s=0; for(var d=1; d<=dim; d++){ s+=revRatesBudget(p+'-'+String(d).padStart(2,'0')); } return s; }
// Auto daily budget: if a monthly budget is set, scale the weekday pattern to hit it exactly; else fall back to the rates pattern.
function revAutoBudget(ds){ var p=revPeriodOf(ds); var B=revMonthlyBudget(p); if(B==null) return revRatesBudget(ds); var tot=revPatternTotal(p); if(!tot) return 0; return B*revRatesBudget(ds)/tot; }
function revBudget(ds){ var row=revDailyMap()[ds]; if(row&&row.budget_override!=null) return Number(row.budget_override); return revAutoBudget(ds); }
function revDaysInMonth(p){ var a=p.split('-').map(Number); return new Date(a[0],a[1],0).getDate(); }
function revAddMonths(p,n){ var a=p.split('-').map(Number); var d=new Date(a[0],a[1]-1,1); d.setMonth(d.getMonth()+n); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); }
function revPrevPeriod(p){ return revAddMonths(p,-1); }
function revMoney(n){ return 'AED '+Math.round(Number(n)||0).toLocaleString(); }
function revPct(n){ if(n===''||n==null||!isFinite(n)) return '—'; return (n>=0?'+':'')+(n*100).toFixed(1)+'%'; }
function revPctClass(n){ if(n===''||n==null||!isFinite(n)) return ''; return n>=0?'rev-pos':'rev-neg'; }
function revMonthLabel(p){ var a=p.split('-').map(Number); return new Date(a[0],a[1]-1,1).toLocaleDateString('en-GB',{month:'long',year:'numeric'}); }
function revYearOf(p){ return p.split('-')[0]; }
function revChg(c,prev){ return prev? (c-prev)/prev : ''; }

function revMonthData(p){
  var R=revInit(), map=revDailyMap(), dim=revDaysInMonth(p), days=[];
  var mtdNet=0, budgetTotal=0, coversAct=0, tradingDays=0, windowDay=0;
  for(var d=1; d<=dim; d++){
    var ds=p+'-'+String(d).padStart(2,'0'); var wd=revWeekday(ds); var closed=(wd==='Sunday');
    var row=map[ds]||null; var budget=revBudget(ds);
    var net=(row&&row.net_actual!=null)?Number(row.net_actual):null;
    var rc=(row&&row.rest_covers_actual!=null)?Number(row.rest_covers_actual):null;
    var lc=(row&&row.lounge_covers_actual!=null)?Number(row.lounge_covers_actual):null;
    var tot=(rc!=null||lc!=null)?((rc||0)+(lc||0)):null;
    budgetTotal+=budget;   // budget is 0 for closed Sundays unless an override is set
    if(net!=null){ mtdNet+=net; tradingDays++; windowDay=d; if(tot!=null) coversAct+=tot; }
    days.push({d:d,date:ds,weekday:wd,closed:closed,budget:budget,net:net,restCov:rc,lounCov:lc,totalCov:tot,vsBudget:net!=null?net-budget:null,avgCover:(net!=null&&tot)?net/tot:null});
  }
  var budgetToDate=0; days.forEach(function(x){ if(x.d<=windowDay) budgetToDate+=x.budget; });
  return {period:p,days:days,mtdNet:mtdNet,budgetTotal:budgetTotal,budgetToDate:budgetToDate,coversAct:coversAct,tradingDays:tradingDays,windowDay:windowDay};
}
function revAreaMTD(p){
  var map=revDailyMap(), dim=revDaysInMonth(p);
  var o={restNet:0,restCov:0,lounNet:0,lounCov:0,totNet:0,totCov:0,rlNet:0,rlCov:0,rdNet:0,rdCov:0,llNet:0,llCov:0,ldNet:0,ldCov:0};
  for(var d=1; d<=dim; d++){ var ds=p+'-'+String(d).padStart(2,'0'); var row=map[ds];
    if(row&&row.net_actual!=null){
      o.restNet+=Number(row.rest_net||0); o.restCov+=Number(row.rest_covers_actual||0);
      o.lounNet+=Number(row.lounge_net||0); o.lounCov+=Number(row.lounge_covers_actual||0);
      o.totNet+=Number(row.net_actual||0); o.totCov+=(Number(row.rest_covers_actual||0)+Number(row.lounge_covers_actual||0));
      // Same convention as the day editor (revEditDay): if a day has no Lunch/Dinner split,
      // treat its area totals as Dinner (lunch is closed) so the daypart MTD covers ALL traded days.
      var hasDP=(row.rest_lunch_net!=null||row.rest_dinner_net!=null||row.lounge_lunch_net!=null||row.lounge_dinner_net!=null||row.rest_dinner_covers!=null||row.lounge_dinner_covers!=null);
      if(hasDP){
        o.rlNet+=Number(row.rest_lunch_net||0); o.rlCov+=Number(row.rest_lunch_covers||0);
        o.rdNet+=Number(row.rest_dinner_net||0); o.rdCov+=Number(row.rest_dinner_covers||0);
        o.llNet+=Number(row.lounge_lunch_net||0); o.llCov+=Number(row.lounge_lunch_covers||0);
        o.ldNet+=Number(row.lounge_dinner_net||0); o.ldCov+=Number(row.lounge_dinner_covers||0);
      } else {
        o.rdNet+=Number(row.rest_net||0); o.rdCov+=Number(row.rest_covers_actual||0);
        o.ldNet+=Number(row.lounge_net||0); o.ldCov+=Number(row.lounge_covers_actual||0);
      }
    } }
  return o;
}
function revWindowSum(p, W){
  var map=revDailyMap(), dim=revDaysInMonth(p);
  var o={net:0,covers:0,tdays:0,restNet:0,restCov:0,lounNet:0,lounCov:0};
  for(var d=1; d<=Math.min(W,dim); d++){
    var ds=p+'-'+String(d).padStart(2,'0'); var row=map[ds];
    if(row&&row.net_actual!=null){ o.net+=Number(row.net_actual); o.tdays++; o.covers+=(Number(row.rest_covers_actual||0)+Number(row.lounge_covers_actual||0)); o.restNet+=Number(row.rest_net||0); o.restCov+=Number(row.rest_covers_actual||0); o.lounNet+=Number(row.lounge_net||0); o.lounCov+=Number(row.lounge_covers_actual||0); }
  }
  return o;
}
function revWeekdayAvgs(p){
  var map=revDailyMap(), dim=revDaysInMonth(p), acc={};
  for(var d=1; d<=dim; d++){ var ds=p+'-'+String(d).padStart(2,'0'); var row=map[ds]; if(row&&row.net_actual!=null){ var wd=revWeekday(ds); (acc[wd]=acc[wd]||[]).push(Number(row.net_actual)); } }
  var out={}; Object.keys(acc).forEach(function(wd){ var a=acc[wd]; out[wd]=a.reduce(function(x,y){return x+y;},0)/a.length; }); return out;
}
function revReview(p){
  var cur=revMonthData(p), W=cur.windowDay||0, prevP=revPrevPeriod(p);
  var cW=revWindowSum(p,W), pW=revWindowSum(prevP,W);
  var cAvg=revWeekdayAvgs(p), pAvg=revWeekdayAvgs(prevP);
  var dim=revDaysInMonth(p), proj=0, remaining=0;
  for(var d=W+1; d<=dim; d++){ var wd=revWeekday(p+'-'+String(d).padStart(2,'0')); if(wd==='Sunday') continue; proj+=(cAvg[wd]||0); remaining++; }
  var forecast=cur.mtdNet+proj;
  function ac(o){ return o.tdays?o.net/o.tdays:0; }
  return {
    period:p, prevPeriod:prevP, windowDay:W,
    net:{cur:cW.net,prev:pW.net,chg:revChg(cW.net,pW.net)},
    tradingDays:{cur:cW.tdays,prev:pW.tdays},
    avgDay:{cur:ac(cW),prev:ac(pW),chg:revChg(ac(cW),ac(pW))},
    covers:{cur:cW.covers,prev:pW.covers,chg:revChg(cW.covers,pW.covers)},
    spendCover:{cur:cW.covers?cW.net/cW.covers:0,prev:pW.covers?pW.net/pW.covers:0,chg:revChg(cW.covers?cW.net/cW.covers:0,pW.covers?pW.net/pW.covers:0)},
    venueRest:{cur:cW.restCov?cW.restNet/cW.restCov:0,prev:pW.restCov?pW.restNet/pW.restCov:0,chg:revChg(cW.restCov?cW.restNet/cW.restCov:0,pW.restCov?pW.restNet/pW.restCov:0)},
    venueLoun:{cur:cW.lounCov?cW.lounNet/cW.lounCov:0,prev:pW.lounCov?pW.lounNet/pW.lounCov:0,chg:revChg(cW.lounCov?cW.lounNet/cW.lounCov:0,pW.lounCov?pW.lounNet/pW.lounCov:0)},
    weekdays:['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(function(wd){ return {wd:wd,cur:cAvg[wd]||0,prev:pAvg[wd]||0,chg:revChg(cAvg[wd]||0,pAvg[wd]||0)}; }),
    mtd:cur.mtdNet, projected:proj, remaining:remaining, forecast:forecast,
    budgetTotal:cur.budgetTotal, vsBudget:forecast-cur.budgetTotal, vsBudgetPct:cur.budgetTotal?(forecast-cur.budgetTotal)/cur.budgetTotal:''
  };
}

// ══════════════════════════════════════════════
//  SCENARIO ENGINE — deterministic what-if math (the AI never computes; it only
//  parameterises this and narrates the result). Mirrors revBudget() exactly,
//  with a per-weekday multiplier on the rates pattern, so all budget modes
//  (override / monthly-budget distribution / rates pattern) stay correct.
// ══════════════════════════════════════════════
function revScenarioBudget(p, mul){
  var map=revDailyMap(), dim=revDaysInMonth(p), B=revMonthlyBudget(p);
  function w(ds){ return revRatesBudget(ds)*mul(revWeekday(ds)); }   // scenario pattern weight
  var totW=0,d,ds; for(d=1; d<=dim; d++){ totW+=w(p+'-'+String(d).padStart(2,'0')); }
  var sum=0;
  for(d=1; d<=dim; d++){
    ds=p+'-'+String(d).padStart(2,'0'); var row=map[ds];
    if(row&&row.budget_override!=null){ sum+=Number(row.budget_override); continue; }  // fixed manual day
    if(B!=null){ sum += totW? B*w(ds)/totW : 0; continue; }                              // monthly-budget distribution
    sum += w(ds);                                                                         // rates pattern
  }
  return sum;
}
// params: { metric:'avg_spend'|'covers', changePct:Number, scope:'all'|<Weekday>, period? }
function revScenario(params){
  var R=revInit(), p=(params&&params.period)||R.period;
  var pct=Number(params&&params.changePct)||0, f=1+pct/100;
  var scope=(params&&params.scope)||'all';
  var metric=(params&&params.metric)||'avg_spend';
  function mul(wd){ return (scope==='all'||scope===wd)?f:1; }
  var baseBudget=revScenarioBudget(p, function(){return 1;});
  var scenBudget=revScenarioBudget(p, mul);
  var rv=revReview(p);
  // Forecast: actuals already booked (MTD) are history and never change. The change
  // re-rates only the REMAINING days' projected revenue (covers× or spend× both scale revenue linearly).
  var projScen;
  if(scope==='all'){ projScen=rv.projected*f; }
  else {
    var dim=revDaysInMonth(p), add=0, wAvg=(rv.weekdays.filter(function(x){return x.wd===scope;})[0]||{cur:0}).cur;
    for(var d=rv.windowDay+1; d<=dim; d++){ if(revWeekday(p+'-'+String(d).padStart(2,'0'))===scope) add += wAvg*(f-1); }
    projScen=rv.projected+add;
  }
  var scenForecast=rv.mtd+projScen;
  var target=(R.targets&&R.targets[p])||0;   // monthly target (rev_targets) — the fixed benchmark
  // ALL derived figures pre-computed here so the model never subtracts: gap to target (base & scenario), abs + %.
  var gap={ target:target,
    baseToTarget:rv.forecast-target, scenarioToTarget:scenForecast-target,
    baseToTargetPct: target?(rv.forecast-target)/target:0, scenarioToTargetPct: target?(scenForecast-target)/target:0 };
  return {
    period:p, periodLabel:revMonthLabel(p), metric:metric, changePct:pct, scope:scope,
    budget:{ base:baseBudget, scenario:scenBudget, deltaAbs:scenBudget-baseBudget, deltaPct: baseBudget?(scenBudget-baseBudget)/baseBudget:0 },
    forecast:{ base:rv.forecast, scenario:scenForecast, deltaAbs:scenForecast-rv.forecast, deltaPct: rv.forecast?(scenForecast-rv.forecast)/rv.forecast:0,
               mtd:rv.mtd, projectedBase:rv.projected, projectedScenario:projScen,
               basis:'Booked actuals (MTD '+Math.round(rv.mtd)+') unchanged; only the '+(scope==='all'?'remaining-day':scope+' remaining-day')+' projection is re-rated.' },
    gap:gap
  };
}

// ── Navigation ──
function revSetPeriod(p){ revInit().period=p; renderMain(); }
function revStep(n){ var R=revInit(); revSetPeriod(revAddMonths(R.period,n)); }
function revAddMonth(){ var R=revInit(); R.period=revAddMonths(revLatestPeriod(),1); renderMain(); }
function revSetView(v){ revInit().view=v; renderMain(); }
// Set the monthly budget for the current period (empty = clear → back to rates pattern). Distributes across days by weekday pattern.
async function revSaveMonthlyBudget(){
  var R=revInit(), p=R.period, v=revNum('rev-monthly-budget');
  if(v!=null) R.budgets[p]=v; else delete R.budgets[p];
  renderMain();
  var res=await sb.from('rev_targets').upsert({period:p, monthly_budget:v},{onConflict:'period'});
  if(res.error){ console.error('rev monthly budget',res.error); alert('Could not save monthly budget: '+res.error.message+(res.error.code==='PGRST204'?'\n\nRun revenue-monthly-budget.sql in Supabase first.':'')); }
}

// ── Edit a day (Restaurant/Lounge x Lunch/Dinner) ──
function revNum(id){ var el=document.getElementById(id); if(!el) return null; var v=el.value.trim(); if(v==='') return null; v=Number(v.replace(/[^0-9.\-]/g,'')); return isFinite(v)?v:null; }
function revEditDay(ds){
  var map=revDailyMap(); var row=map[ds]||{};
  document.getElementById('rev-edit-date').value=ds;
  document.getElementById('rev-edit-title').textContent=new Date(ds+'T12:00:00').toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  var defB=revAutoBudget(ds);
  document.getElementById('rev-edit-budget').value=(row.budget_override!=null?row.budget_override:(defB?Math.round(defB):''));
  var defEl=document.getElementById('rev-edit-budget-def'); if(defEl) defEl.textContent='default '+revMoney(defB)+(defB===0?' (closed)':'');
  function setv(id,v){ document.getElementById(id).value=(v!=null?v:''); }
  var hasDaypart=(row.rest_lunch_net!=null||row.rest_dinner_net!=null||row.lounge_lunch_net!=null||row.lounge_dinner_net!=null||row.rest_dinner_covers!=null||row.lounge_dinner_covers!=null);
  if(hasDaypart){
    setv('rev-rl-net',row.rest_lunch_net); setv('rev-rl-cov',row.rest_lunch_covers);
    setv('rev-rd-net',row.rest_dinner_net); setv('rev-rd-cov',row.rest_dinner_covers);
    setv('rev-ll-net',row.lounge_lunch_net); setv('rev-ll-cov',row.lounge_lunch_covers);
    setv('rev-ld-net',row.lounge_dinner_net); setv('rev-ld-cov',row.lounge_dinner_covers);
  } else {
    // legacy/seeded rows hold only area totals -> show under Dinner (lunch was closed)
    setv('rev-rl-net',null); setv('rev-rl-cov',null); setv('rev-rd-net',row.rest_net); setv('rev-rd-cov',row.rest_covers_actual);
    setv('rev-ll-net',null); setv('rev-ll-cov',null); setv('rev-ld-net',row.lounge_net); setv('rev-ld-cov',row.lounge_covers_actual);
  }
  setv('rev-food-net',row.food_net); setv('rev-bev-net',row.bev_net); setv('rev-tob-net',row.tobacco_net);
  revRecalc();
  document.getElementById('rev-edit-modal').style.display='flex';
}
function revCloseEdit(e){ if(e&&e.target!==document.getElementById('rev-edit-modal')) return; document.getElementById('rev-edit-modal').style.display='none'; }
function revRecalc(){
  function avg(net,cov){ return (net!=null&&cov)?revMoney(net/cov).replace('AED ',''):'—'; }
  var rl=revNum('rev-rl-net'),rlc=revNum('rev-rl-cov'),rd=revNum('rev-rd-net'),rdc=revNum('rev-rd-cov');
  var ll=revNum('rev-ll-net'),llc=revNum('rev-ll-cov'),ld=revNum('rev-ld-net'),ldc=revNum('rev-ld-cov');
  document.getElementById('rev-rl-avg').textContent=avg(rl,rlc);
  document.getElementById('rev-rd-avg').textContent=avg(rd,rdc);
  document.getElementById('rev-ll-avg').textContent=avg(ll,llc);
  document.getElementById('rev-ld-avg').textContent=avg(ld,ldc);
  var restNet=(rl||0)+(rd||0), lounNet=(ll||0)+(ld||0), tot=restNet+lounNet;
  var restCov=(rlc||0)+(rdc||0), lounCov=(llc||0)+(ldc||0), totCov=restCov+lounCov;
  var box=document.getElementById('rev-edit-totals');
  if(box) box.innerHTML='<div><span>Restaurant</span><b>'+revMoney(restNet)+' · '+restCov+' cov · '+(tot?Math.round(restNet/tot*100):0)+'%</b></div>'
    +'<div><span>Scala Lounge &amp; Bar</span><b>'+revMoney(lounNet)+' · '+lounCov+' cov · '+(tot?Math.round(lounNet/tot*100):0)+'%</b></div>'
    +'<div class="rev-edit-tot-total"><span>Total</span><b>'+revMoney(tot)+' · '+totCov+' cov · avg '+(totCov?revMoney(tot/totCov).replace('AED ',''):'—')+'</b></div>';
  // F&B split reconciliation hint
  var fb=revNum('rev-food-net')||0, bv=revNum('rev-bev-net')||0, tb=revNum('rev-tob-net')||0, fbSum=fb+bv+tb;
  var chk=document.getElementById('rev-fnb-check');
  if(chk){
    if(fbSum===0){ chk.style.color='var(--text-light)'; chk.textContent='Not entered — AI will estimate Food 48% / Bev 51% / Tobacco 1% of net.'; }
    else { var diff=fbSum-tot; chk.style.color=''; chk.innerHTML='F&B total '+revMoney(fbSum)+' vs net '+revMoney(tot)+' · '+(Math.abs(diff)<1?'<b style="color:#2d7a4f">matches</b>':'<b style="color:#b3402f">off by '+revMoney(Math.abs(diff)).replace('AED ','')+'</b>'); }
  }
}
async function revSaveDay(){
  var ds=document.getElementById('rev-edit-date').value;
  var rl=revNum('rev-rl-net'),rlc=revNum('rev-rl-cov'),rd=revNum('rev-rd-net'),rdc=revNum('rev-rd-cov');
  var ll=revNum('rev-ll-net'),llc=revNum('rev-ll-cov'),ld=revNum('rev-ld-net'),ldc=revNum('rev-ld-cov');
  function sum(a,b){ return (a==null&&b==null)?null:((a||0)+(b||0)); }
  var restNet=sum(rl,rd), restCov=sum(rlc,rdc), lounNet=sum(ll,ld), lounCov=sum(llc,ldc);
  var net=(restNet==null&&lounNet==null)?null:((restNet||0)+(lounNet||0));
  var bIn=revNum('rev-edit-budget'), defB=revAutoBudget(ds);
  var budgetOverride=(bIn==null||Math.abs(bIn-defB)<1)?null:bIn;   // store only if changed from the auto (distributed) default
  var food=revNum('rev-food-net'), bev=revNum('rev-bev-net'), tob=revNum('rev-tob-net');
  var payload={ service_date:ds, budget_override:budgetOverride,
    rest_lunch_net:rl, rest_lunch_covers:rlc, rest_dinner_net:rd, rest_dinner_covers:rdc,
    lounge_lunch_net:ll, lounge_lunch_covers:llc, lounge_dinner_net:ld, lounge_dinner_covers:ldc,
    rest_net:restNet, rest_covers_actual:restCov, lounge_net:lounNet, lounge_covers_actual:lounCov,
    food_net:food, bev_net:bev, tobacco_net:tob,
    net_actual:net, updated_at:new Date().toISOString() };
  var R=revInit(); var i=R.daily.findIndex(function(x){ return String(x.service_date).slice(0,10)===ds; });
  if(i>=0) R.daily[i]=Object.assign({},R.daily[i],payload); else R.daily.push(payload);
  document.getElementById('rev-edit-modal').style.display='none'; renderMain();
  var res=await sb.from('rev_daily').upsert(payload,{onConflict:'service_date'});
  if(res.error){ console.error('rev save',res.error); alert('Could not save: '+res.error.message+(res.error.code==='PGRST204'?'\n\nRun revenue-daypart-columns.sql in Supabase first.':'')); }
}

// ── AI report agent (mirrors Kitchen survey-assistant pattern) ──
var REV_AI_URL='https://paoaivwtkzujmrgrfjuq.supabase.co/functions/v1/revenue-assistant';
// Standard DSR sales mix — used to ESTIMATE F&B when a day's split hasn't been entered.
var REV_FNB_MIX={food:0.48, bev:0.51, tob:0.01};
function revFnbSplit(row){
  var net=Number(row.net_actual)||0;
  if(row.food_net!=null||row.bev_net!=null||row.tobacco_net!=null)
    return {food:Number(row.food_net||0), bev:Number(row.bev_net||0), tob:Number(row.tobacco_net||0), est:false};
  return {food:Math.round(net*REV_FNB_MIX.food), bev:Math.round(net*REV_FNB_MIX.bev), tob:Math.round(net*REV_FNB_MIX.tob), est:true};
}
// Comprehensive grounding: the FULL dataset (every entered day + F&B actual/estimate) plus
// rates, budgets and the computed analysis — so the agent can answer about any day or metric.
function revBriefing(){
  var R=revInit(), p=R.period, L=[];
  var nowD=new Date(), tD=new Date(nowD.getTime()+nowD.getTimezoneOffset()*60000+4*3600000);
  var todayStr=tD.getFullYear()+'-'+String(tD.getMonth()+1).padStart(2,'0')+'-'+String(tD.getDate()).padStart(2,'0');
  L.push('ROBERTO\'S DIFC — REVENUE DATA (all figures AED). Currently viewing '+revMonthLabel(p)+'. Today (Dubai): '+todayStr+'.');
  L.push('Venues: Restaurant and Scala Lounge & Bar. Lunch is normally closed (dinner only).');
  L.push('F&B split: "actual" = entered from the DSR; "est" = estimated at Food '+(REV_FNB_MIX.food*100)+'% / Bev '+(REV_FNB_MIX.bev*100)+'% / Tobacco '+(REV_FNB_MIX.tob*100)+'% of net. Always label estimates as estimates.');
  L.push('\nWEEKDAY RATES (daily budget pattern = cover_target × avg_spend):');
  ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].forEach(function(wd){ var r=R.rates[wd]; if(r) L.push('  '+wd+': avg_spend '+Number(r.avg_spend)+', cover_target '+Number(r.cover_target)+', daily budget '+(Number(r.cover_target)*Number(r.avg_spend))); });
  L.push('\nMONTHLY TARGETS / BUDGETS:');
  Object.keys(R.targets||{}).sort().forEach(function(per){ L.push('  '+per+': target '+Math.round(R.targets[per]||0)+((R.budgets&&R.budgets[per]!=null)?', monthly budget '+Math.round(R.budgets[per]):'')); });
  L.push('\nDAILY ACTUALS (every entered day; ? = not split out):');
  R.daily.slice().sort(function(a,b){return String(a.service_date).localeCompare(String(b.service_date));}).forEach(function(row){
    if(row.net_actual==null) return;
    var ds=String(row.service_date).slice(0,10), wd=revWeekday(ds), f=revFnbSplit(row);
    var rc=(row.rest_covers_actual!=null?row.rest_covers_actual:'?'), lc=(row.lounge_covers_actual!=null?row.lounge_covers_actual:'?');
    L.push('  '+ds+' ('+wd.slice(0,3)+'): net '+Math.round(row.net_actual)
      +' | Restaurant '+Math.round(row.rest_net||0)+'/'+rc+'cov | Scala '+Math.round(row.lounge_net||0)+'/'+lc+'cov'
      +' | F&B('+(f.est?'est':'actual')+') food '+f.food+' bev '+f.bev+' tob '+f.tob);
  });
  var rv=revReview(p), m=revMonthData(p);
  L.push('\nANALYSIS — '+revMonthLabel(p)+' (through day '+rv.windowDay+'):');
  L.push('  MTD net '+Math.round(rv.mtd)+' over '+rv.tradingDays.cur+' trading days; budget-to-date '+Math.round(m.budgetToDate)+'.');
  L.push('  Vs '+revMonthLabel(rv.prevPeriod)+' matched window: net '+revPct(rv.net.chg)+', covers '+revPct(rv.covers.chg)+', avg spend/cover '+revPct(rv.spendCover.chg)+'.');
  L.push('  Weekday avg net: '+rv.weekdays.map(function(w){return w.wd.slice(0,3)+' '+Math.round(w.cur);}).join(', ')+'.');
  L.push('  Full-month forecast '+Math.round(rv.forecast)+' vs budget '+Math.round(rv.budgetTotal)+' ('+revPct(rv.vsBudgetPct)+').');
  var T=(R.targets&&R.targets[p])||0;
  if(T>0){ var reqRem=T-rv.mtd, upl=rv.projected?(reqRem/rv.projected-1):null;
    L.push('  Target '+Math.round(T)+'. Forecast vs target: '+Math.round(rv.forecast-T)+' ('+revPct(T?(rv.forecast-T)/T:0)+'). To hit target, the remaining days must deliver '+Math.round(reqRem)+' vs projected '+Math.round(rv.projected)+(upl!=null?' = a '+(upl>=0?'+':'')+(upl*100).toFixed(1)+'% uplift on the current run-rate':'')+'.'); }
  var od=revOpsDigest(); if(od) L.push(od);
  return L.join('\n');
}
// The ONLY tool the analyst can call. It never does arithmetic itself — it parameterises
// this, the app computes the exact result (revScenario), and the model narrates the figures.
var REV_TOOL_SCENARIO={
  name:'compute_scenario',
  description:'Compute an EXACT what-if on the revenue model (budget + forecast). You MUST call this for ANY question about the impact of changing average spend or covers (e.g. "+2% avg spend → final budget", "Fridays +5% covers"). Never calculate yourself — call this and report only its exact numbers.',
  input_schema:{ type:'object', properties:{
    metric:{ type:'string', enum:['avg_spend','covers'], description:'Lever to change: avg_spend (spend per cover) or covers.' },
    changePct:{ type:'number', description:'Percent change. 2 means +2%, -5 means -5%.' },
    scope:{ type:'string', description:'"all" for every trading day, or a single weekday name (Monday..Saturday) to change only that weekday. Default "all".' },
    period:{ type:'string', description:'Month as YYYY-MM. Default = the month currently being viewed.' }
  }, required:['metric','changePct'] }
};
function revScenRound(r){ return {
  period:r.periodLabel, metric:r.metric, changePct:r.changePct, scope:r.scope,
  budget:{ base:Math.round(r.budget.base), scenario:Math.round(r.budget.scenario), change:Math.round(r.budget.deltaAbs), changePct:+(r.budget.deltaPct*100).toFixed(2) },
  forecast:{ base:Math.round(r.forecast.base), scenario:Math.round(r.forecast.scenario), change:Math.round(r.forecast.deltaAbs), changePct:+(r.forecast.deltaPct*100).toFixed(2), note:r.forecast.basis },
  gap_to_target:{ target:Math.round(r.gap.target), base:Math.round(r.gap.baseToTarget), scenario:Math.round(r.gap.scenarioToTarget), basePct:+(r.gap.baseToTargetPct*100).toFixed(2), scenarioPct:+(r.gap.scenarioToTargetPct*100).toFixed(2) }
}; }
function revScenarioCardHTML(r){
  function chip(o){ return '<b class="'+revPctClass(o.deltaPct)+'">'+(o.deltaAbs>=0?'+':'−')+revMoney(Math.abs(o.deltaAbs)).replace('AED ','')+' ('+revPct(o.deltaPct)+')</b>'; }
  var title=(r.metric==='avg_spend'?'Average spend':'Covers')+' '+(r.changePct>=0?'+':'')+r.changePct+'%'+(r.scope&&r.scope!=='all'?' · '+r.scope+' only':'')+' — '+r.periodLabel;
  return '<div class="rev-scen-card"><div class="rev-scen-h">Scenario · '+title+'</div>'
    +'<table class="rev-scen-tbl"><thead><tr><th></th><th>Now</th><th>Scenario</th><th>Change</th></tr></thead><tbody>'
    +'<tr><td>Monthly budget</td><td>'+revMoney(r.budget.base)+'</td><td>'+revMoney(r.budget.scenario)+'</td><td>'+chip(r.budget)+'</td></tr>'
    +'<tr><td>Full-month forecast</td><td>'+revMoney(r.forecast.base)+'</td><td>'+revMoney(r.forecast.scenario)+'</td><td>'+chip(r.forecast)+'</td></tr>'
    +(r.gap.target?('<tr><td>Forecast vs target ('+revMoney(r.gap.target)+')</td><td class="'+(r.gap.baseToTarget>=0?'rev-pos':'rev-neg')+'">'+revMoney(r.gap.baseToTarget).replace('AED ','')+'</td><td class="'+(r.gap.scenarioToTarget>=0?'rev-pos':'rev-neg')+'">'+revMoney(r.gap.scenarioToTarget).replace('AED ','')+'</td><td>'+chip(r.forecast)+'</td></tr>'):'')
    +'</tbody></table><div class="rev-scen-note">'+r.forecast.basis+'</div></div>';
}
// ── Apply-on-approval: the AI PROPOSES a budget/rate change; the user approves; the app writes it. ──
var REV_TOOL_PROPOSE={
  name:'propose_change',
  description:'Propose an EXACT change to the revenue config (monthly budget, a weekday average spend, or a weekday cover target) for the user to APPROVE before anything is written. Use when the user asks to set/change/apply such a value (e.g. "set July budget to 1.6M", "apply +2% avg spend to Friday", "raise Saturday cover target to 270"). Give the final ABSOLUTE value. You never apply it yourself — the app shows an Approve button; tell the user to review and approve.',
  input_schema:{ type:'object', properties:{
    action:{ type:'string', enum:['set_monthly_budget','set_avg_spend','set_cover_target'], description:'What to change.' },
    period:{ type:'string', description:'For set_monthly_budget: month YYYY-MM (default the viewed month).' },
    weekday:{ type:'string', description:'For set_avg_spend / set_cover_target: weekday name Monday..Sunday.' },
    value:{ type:'number', description:'New ABSOLUTE value (AED for budget/avg_spend; cover count for cover_target).' },
    reason:{ type:'string', description:'One short line explaining why, shown to the user.' }
  }, required:['action','value'] }
};
function revProposalPreview(a){
  var R=revInit();
  if(a.action==='set_monthly_budget'){ var p=a.period||R.period, cur=revMonthlyBudget(p);
    return { title:'Set monthly budget — '+revMonthLabel(p), rows:[['Monthly budget', cur!=null?revMoney(cur):'rates pattern', revMoney(a.value)]] }; }
  if(a.action==='set_avg_spend'){ var r=R.rates[a.weekday]||{}, ct=Number(r.cover_target)||0;
    return { title:'Set average spend — '+a.weekday, rows:[['Avg spend', revMoney(r.avg_spend||0), revMoney(a.value)], ['Daily budget ('+a.weekday+')', revMoney((Number(r.avg_spend)||0)*ct), revMoney(a.value*ct)]] }; }
  if(a.action==='set_cover_target'){ var r2=R.rates[a.weekday]||{}, av=Number(r2.avg_spend)||0;
    return { title:'Set cover target — '+a.weekday, rows:[['Cover target', String(r2.cover_target||0), String(a.value)], ['Daily budget ('+a.weekday+')', revMoney((Number(r2.cover_target)||0)*av), revMoney(a.value*av)]] }; }
  return { title:'Change', rows:[] };
}
function revProposalCardHTML(id){
  var pr=revInit().proposals[id]; if(!pr) return '';
  var rows=pr.preview.rows.map(function(r){return '<tr><td>'+clEsc(r[0])+'</td><td>'+r[1]+'</td><td style="color:#9c8a72">&rarr;</td><td><b>'+r[2]+'</b></td></tr>';}).join('');
  var foot;
  if(pr.status==='applied') foot='<div class="rev-prop-done rev-pos">&#10003; Applied</div>';
  else if(pr.status==='rejected') foot='<div class="rev-prop-done rev-mut">Dismissed</div>';
  else if(pr.status==='applying') foot='<div class="rev-prop-done rev-mut">Applying…</div>';
  else if(pr.status==='error') foot='<div class="rev-prop-done rev-neg">Failed: '+clEsc(pr.error||'')+'</div>';
  else foot='<div class="rev-prop-actions"><button class="rev-prop-no" onclick="revReject(\''+id+'\')">Dismiss</button><button class="rev-prop-yes" onclick="revApprove(\''+id+'\')">Approve &amp; apply</button></div>';
  return '<div class="rev-prop-card"><div class="rev-prop-h">&#9888;&#65039; Proposed change · '+clEsc(pr.preview.title)+'</div>'+(pr.action.reason?'<div class="rev-prop-reason">'+clEsc(pr.action.reason)+'</div>':'')+'<table class="rev-prop-tbl"><thead><tr><th></th><th>Now</th><th></th><th>Proposed</th></tr></thead><tbody>'+rows+'</tbody></table>'+foot+'</div>';
}
async function revApplyAction(a){
  var R=revInit();
  if(a.action==='set_monthly_budget'){ var p=a.period||R.period; var res=await sb.from('rev_targets').upsert({period:p, monthly_budget:a.value},{onConflict:'period'}); if(res.error) return res.error.message; R.budgets[p]=a.value; return null; }
  if(a.action==='set_avg_spend'){ if(!R.rates[a.weekday]) return 'Unknown weekday'; var res2=await sb.from('rev_rates').update({avg_spend:a.value}).eq('weekday',a.weekday); if(res2.error) return res2.error.message; R.rates[a.weekday].avg_spend=a.value; return null; }
  if(a.action==='set_cover_target'){ if(!R.rates[a.weekday]) return 'Unknown weekday'; var res3=await sb.from('rev_rates').update({cover_target:a.value}).eq('weekday',a.weekday); if(res3.error) return res3.error.message; R.rates[a.weekday].cover_target=a.value; return null; }
  return 'Unknown action';
}
async function revApprove(id){
  var pr=revInit().proposals[id]; if(!pr||pr.status!=='pending') return;
  pr.status='applying'; revChatRender();
  var err=await revApplyAction(pr.action);
  if(err){ pr.status='error'; pr.error=err; } else { pr.status='applied'; if(state.currentTab==='revenue') renderMain(); }
  revChatRender();
}
function revReject(id){ var pr=revInit().proposals[id]; if(pr&&pr.status==='pending'){ pr.status='rejected'; revChatRender(); } }
async function revAiReport(){
  var q=prompt('Ask the revenue analyst (e.g. "F&B split on 12 May", "if avg spend +2%, what\'s the final budget?", "Fridays +5% covers"):','If average spend increased 2%, what would the final budget and forecast look like?');
  if(q===null) return;
  var box=document.getElementById('rev-ai-out'); if(box){ box.style.display='block'; box.textContent='Analysing…'; }
  var SYS='You are a precise F&B revenue analyst for Roberto\'s DIFC. Use ONLY the figures in the DATA block or returned by the compute_scenario tool — never invent or calculate numbers yourself. For ANY what-if about changing average spend or covers you MUST call compute_scenario. The tool result already contains EVERY derived figure you need — budget/forecast deltas (absolute and %) and gap_to_target (base, scenario, and %). Quote those values verbatim; do NOT perform arithmetic of your own (no subtraction, no computing percentages). When F&B figures are marked "est", state they are estimates from the standard mix, not actuals. Be concise, board-ready, in AED; call out risks and notable swings.';
  var messages=[{role:'user', content:q+'\n\nDATA:\n'+revBriefing()}], cardHTML='';
  try{
    for(var step=0; step<5; step++){
      var resp=await fetch(REV_AI_URL,{ method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+SUPABASE_KEY,'apikey':SUPABASE_KEY}, body:JSON.stringify({ action:'chat', model:'claude-sonnet-4-6', max_tokens:1600, system:SYS, tools:[REV_TOOL_SCENARIO], messages:messages }) });
      var data=await resp.json();
      if(!resp.ok) throw new Error(data.error||('HTTP '+resp.status));
      var content=data.content||[];
      messages.push({role:'assistant', content:content});
      var toolUses=content.filter(function(b){return b.type==='tool_use';});
      if(data.stop_reason==='tool_use' && toolUses.length){
        var results=toolUses.map(function(tu){ var r=revScenario(tu.input); cardHTML+=revScenarioCardHTML(r); return {id:tu.id, round:revScenRound(r)}; });
        if(box) box.innerHTML=cardHTML+'<div class="rev-scen-think">Writing analysis…</div>';
        messages.push({role:'user', content:results.map(function(x){ return {type:'tool_result', tool_use_id:x.id, content:JSON.stringify(x.round)}; })});
        continue;
      }
      var text=content.filter(function(b){return b.type==='text';}).map(function(b){return b.text;}).join('\n').trim() || data.text || '';
      if(box){ box.innerHTML=cardHTML+'<div class="rev-ai-text"></div>'; box.querySelector('.rev-ai-text').textContent=text; }
      return;
    }
    if(box) box.innerHTML=cardHTML+'<div class="rev-scen-think">Reached the scenario step limit.</div>';
  }catch(err){ if(box) box.textContent='Analyst not available yet ('+(err.message||err)+'). Make sure the revenue-assistant Edge Function is deployed with tool support (v2).'; }
}

// ══════════════════════════════════════════════
//  AI CHAT / REPORTS — full-screen module. Multi-turn, quick-report chips,
//  same deterministic engine (the model never computes; it parameterises + narrates).
// ══════════════════════════════════════════════
var REV_CHAT_SYS='You are a precise F&B revenue analyst for Roberto\'s DIFC. Use ONLY the figures in the DATA block or returned by the compute_scenario tool — never invent or calculate numbers yourself. For ANY what-if about changing average spend or covers you MUST call compute_scenario; the tool result already contains every derived figure (deltas, gap_to_target, percentages) — quote them verbatim, do NOT do arithmetic. When F&B figures are marked "est", say they are estimates from the standard mix, not actuals. An OPERATIONS LOG (closing reports) may be provided — when asked about patterns/themes, mine it for recurring shift challenges, comps trends, and comment themes, and quantify how often each recurs. When the user asks to SET / CHANGE / APPLY a monthly budget, a weekday average spend, or a weekday cover target, call propose_change with the final value — NEVER claim it has been applied; the app shows the user an Approve button they must click. Be a clear, board-ready analyst: use short headings, tables and bullets; lead with the answer; call out risks and notable swings. Keep follow-ups in context.';
function revChatInit(){ var R=revInit(); if(!R.chat) R.chat={thread:[], api:[], busy:false}; return R.chat; }
function revChatOpen(){ revChatInit(); document.getElementById('rev-chat-modal').style.display='flex'; revChatRender(); var inp=document.getElementById('rev-chat-input'); if(inp) setTimeout(function(){inp.focus();},60); }
function revChatClose(){ document.getElementById('rev-chat-modal').style.display='none'; }
function revChatClear(){ var c=revChatInit(); c.thread=[]; c.api=[]; revChatRender(); }
function revChatKey(e){ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); revChatSubmit(); } }
function revChatSubmit(){ var inp=document.getElementById('rev-chat-input'); if(!inp) return; var t=inp.value.trim(); if(!t) return; inp.value=''; inp.style.height='auto'; revChatSend(t); }
function revChatChip(type){
  var ml=revMonthLabel(revInit().period);
  var q={
    board:'Give me a board-ready summary of '+ml+': performance vs last month, full-month forecast vs budget, and the key risks.',
    whatif:'What happens to the budget and forecast for '+ml+' if average spend rises 2%? Does it close the gap to target?',
    day:'Give me the full breakdown — net, Restaurant vs Scala, daypart, covers, average spend and F&B — for the most recent trading day.',
    gap:'How far is '+ml+' from the target, and what uplift in the remaining days would be needed to close the gap?',
    patterns:'Looking across the closing reports (the OPERATIONS LOG), what recurring patterns, issues and themes come up — in shift challenges, comps, and the good/bad comments? Summarise the top themes, how often each appears, and any link to weak nights.'
  }[type];
  if(q) revChatSend(q);
}
async function revChatSend(text){
  var c=revChatInit(); if(c.busy) return;
  c.thread.push({role:'user', text:text}); c.api.push({role:'user', content:text});
  c.busy=true; revChatRender();
  if(!revInit().closingsLoaded) await clLoadHistory();
  var SYS=REV_CHAT_SYS+'\n\nDATA:\n'+revBriefing();
  var cardsHTML='', propIds=[];
  try{
    for(var step=0; step<6; step++){
      var resp=await fetch(REV_AI_URL,{ method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+SUPABASE_KEY,'apikey':SUPABASE_KEY}, body:JSON.stringify({ action:'chat', model:'claude-sonnet-4-6', max_tokens:1800, system:SYS, tools:[REV_TOOL_SCENARIO, REV_TOOL_PROPOSE], messages:c.api }) });
      var data=await resp.json();
      if(!resp.ok) throw new Error(data.error||('HTTP '+resp.status));
      var content=data.content||[];
      c.api.push({role:'assistant', content:content.length?content:[{type:'text',text:(data.text||'')}]});
      var toolUses=content.filter(function(b){return b.type==='tool_use';});
      if(data.stop_reason==='tool_use' && toolUses.length){
        var trs=toolUses.map(function(tu){
          if(tu.name==='propose_change'){
            var pid='p'+(++revInit().propSeq);
            revInit().proposals[pid]={action:tu.input, preview:revProposalPreview(tu.input), status:'pending'};
            propIds.push(pid);
            return {type:'tool_result', tool_use_id:tu.id, content:JSON.stringify({status:'awaiting_user_approval', note:'A proposal card with an Approve button is now shown to the user. Ask them to review and approve to apply — do NOT claim it has been applied.', preview:revProposalPreview(tu.input)})};
          }
          var r=revScenario(tu.input); cardsHTML+=revScenarioCardHTML(r);
          return {type:'tool_result', tool_use_id:tu.id, content:JSON.stringify(revScenRound(r))};
        });
        c.api.push({role:'user', content:trs});
        revChatRender(); continue;
      }
      var textOut=content.filter(function(b){return b.type==='text';}).map(function(b){return b.text;}).join('\n').trim() || data.text || '';
      c.thread.push({role:'assistant', text:textOut, cards:cardsHTML, props:propIds}); c.busy=false; revChatRender(); return;
    }
    c.thread.push({role:'assistant', text:'Reached the analysis step limit — try narrowing the question.', cards:cardsHTML, props:propIds}); c.busy=false; revChatRender();
  }catch(err){ c.busy=false; c.thread.push({role:'assistant', text:'⚠️ Analyst unavailable: '+(err.message||err), cards:cardsHTML, props:propIds}); revChatRender(); }
}
// markdown-lite → HTML (headings, tables, bullets, bold/italic/code). Escapes first.
function revMd(s){
  s=String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  function inl(t){ return t.replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').replace(/`([^`]+)`/g,'<code>$1</code>'); }
  var lines=s.split('\n'), out=[], i=0;
  function cells(r){ return r.replace(/^\s*\|/,'').replace(/\|\s*$/,'').split('|').map(function(x){return x.trim();}); }
  while(i<lines.length){
    var ln=lines[i];
    if(/\|/.test(ln) && i+1<lines.length && /^[\s|:\-]+$/.test(lines[i+1]) && /-/.test(lines[i+1])){
      var th=cells(ln).map(function(x){return '<th>'+inl(x)+'</th>';}).join(''); i+=2; var trs=[];
      while(i<lines.length && /\|/.test(lines[i])){ trs.push('<tr>'+cells(lines[i]).map(function(x){return '<td>'+inl(x)+'</td>';}).join('')+'</tr>'); i++; }
      out.push('<table class="rev-md-tbl"><thead><tr>'+th+'</tr></thead><tbody>'+trs.join('')+'</tbody></table>'); continue;
    }
    if(/^#{1,4}\s+/.test(ln)){ out.push('<div class="rev-md-h">'+inl(ln.replace(/^#+\s+/,''))+'</div>'); i++; continue; }
    if(/^\s*---+\s*$/.test(ln)){ out.push('<hr class="rev-md-hr">'); i++; continue; }
    if(/^\s*[-*]\s+/.test(ln)){ var items=[]; while(i<lines.length && /^\s*[-*]\s+/.test(lines[i])){ items.push('<li>'+inl(lines[i].replace(/^\s*[-*]\s+/,''))+'</li>'); i++; } out.push('<ul class="rev-md-ul">'+items.join('')+'</ul>'); continue; }
    if(ln.trim()===''){ out.push('<div class="rev-md-sp"></div>'); i++; continue; }
    out.push('<div class="rev-md-p">'+inl(ln)+'</div>'); i++;
  }
  return out.join('');
}
function revChatRender(){
  var c=revChatInit(), box=document.getElementById('rev-chat-thread'); if(!box) return;
  function esc(t){ return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  var h='';
  if(!c.thread.length){ h+='<div class="rev-chat-empty"><div class="rev-chat-empty-t">Ask anything about your revenue</div><div class="rev-chat-empty-s">e.g. "compare June to May", "F&B split on 12 May", "Fridays +5% covers", "investor one-pager" — or tap a quick report below.</div></div>'; }
  c.thread.forEach(function(m){
    if(m.role==='user'){ h+='<div class="rev-chat-row rev-chat-u"><div class="rev-chat-bub rev-chat-ub">'+esc(m.text)+'</div></div>'; }
    else { h+='<div class="rev-chat-row rev-chat-a"><div class="rev-chat-bub rev-chat-ab">'+(m.cards||'')+(m.props||[]).map(revProposalCardHTML).join('')+'<div class="rev-chat-md">'+revMd(m.text)+'</div></div></div>'; }
  });
  if(c.busy){ h+='<div class="rev-chat-row rev-chat-a"><div class="rev-chat-bub rev-chat-ab rev-chat-think"><span></span><span></span><span></span></div></div>'; }
  box.innerHTML=h; box.scrollTop=box.scrollHeight;
}

// CLOSING REPORT module (cl* functions) extracted to foh-closing.js — loaded via <script> after this one.
// ── Operations page (ops*) extracted to foh-ops.js — loaded via <script> after foh-closing.js. ──

// ── Render ──
function renderRevenue(){
  var R=revInit();
  if(!R.loaded){ if(!R.loading) loadRevenue(); return '<div class="loading">Loading revenue…</div>'; }
  if(R.tablesMissing){ return '<div class="rev-wrap"><div class="rev-setup"><div class="rev-h">Revenue module — setup needed</div><p>The revenue tables aren\'t in the database yet. In the Supabase SQL Editor (project paoaivwtkzujmrgrfjuq) run <b>revenue-schema.sql</b> then <b>revenue-seed-history.sql</b>, then reopen this tab.</p></div></div>'; }
  if(R.view==='year') return revRenderYear();
  return revRenderMonth();
}
function revBar(pct){ var w=Math.max(0,Math.min(100,Math.round(pct))); return '<div class="rev-bar"><div class="rev-bar-fill" style="width:'+w+'%"></div></div>'; }
function revRenderMonth(){
  var R=revInit(), p=R.period, m=revMonthData(p), rv=revReview(p);
  var toBudget = m.budgetToDate? Math.round(m.mtdNet/m.budgetToDate*100):0;
  var h=[];
  h.push('<div class="rev-wrap">');
  // toolbar
  h.push('<div class="rev-toolbar"><div class="rev-nav"><button class="rev-btn" onclick="revStep(-1)">&#8592;</button><span class="rev-period">'+revMonthLabel(p)+'</span><button class="rev-btn" onclick="revStep(1)">&#8594;</button><button class="rev-btn" onclick="revAddMonth()">+ Add month</button></div>'
    +'<div class="rev-views"><button class="rev-vtab active" onclick="revSetView(\'month\')">Month</button><button class="rev-vtab" onclick="revSetView(\'year\')">Year</button><button class="rev-btn rev-ai-btn" onclick="revChatOpen()">&#9733; Ask / Reports</button></div></div>');
  // monthly budget — enter once, auto-distributes across days by weekday pattern (editable per day)
  var mb=revMonthlyBudget(p), allocD=m.budgetTotal-(mb||0), onBudget=(mb!=null&&Math.abs(allocD)<1);
  h.push('<div class="rev-budget-bar">'
    +'<label class="rev-lbl" style="margin:0">Monthly budget</label>'
    +'<input id="rev-monthly-budget" type="number" inputmode="decimal" class="rev-inp" style="width:150px" value="'+(mb!=null?mb:'')+'" placeholder="e.g. 2000000" onkeydown="if(event.key===\'Enter\')revSaveMonthlyBudget()">'
    +'<button class="rev-btn" onclick="revSaveMonthlyBudget()">Set</button>'
    +(mb!=null
      ? (onBudget
          ? '<span class="rev-alloc rev-pos">Allocated '+revMoney(m.budgetTotal)+' = budget &#10003;</span>'
          : '<span class="rev-alloc">Allocated '+revMoney(m.budgetTotal)+' / budget '+revMoney(mb)+' <b>('+(allocD>=0?'+':'−')+revMoney(Math.abs(allocD)).replace('AED ','')+')</b></span>')
      : '<span class="rev-alloc rev-mut">Distributes across days by weekday pattern. Leave empty to use the rates pattern.</span>')
    +'</div>');
  // summary cards
  h.push('<div class="rev-cards">');
  h.push('<div class="rev-card"><div class="rev-k">MTD net sales</div><div class="rev-v">'+revMoney(m.mtdNet)+'</div><div class="rev-sub">'+m.tradingDays+' trading days</div></div>');
  h.push('<div class="rev-card"><div class="rev-k">Budget to date</div><div class="rev-v">'+revMoney(m.budgetToDate)+'</div>'+revBar(toBudget)+'<div class="rev-sub '+(m.mtdNet>=m.budgetToDate?'rev-pos':'rev-neg')+'">'+toBudget+'% of budget</div></div>');
  h.push('<div class="rev-card"><div class="rev-k">Full-month forecast</div><div class="rev-v">'+revMoney(rv.forecast)+'</div><div class="rev-sub '+revPctClass(rv.vsBudgetPct)+'">'+revPct(rv.vsBudgetPct)+' vs budget</div></div>');
  h.push('<div class="rev-card"><div class="rev-k">Avg spend / cover</div><div class="rev-v">'+revMoney(rv.spendCover.cur)+'</div><div class="rev-sub '+revPctClass(rv.spendCover.chg)+'">'+revPct(rv.spendCover.chg)+' vs '+revMonthLabel(rv.prevPeriod).split(' ')[0]+'</div></div>');
  h.push('</div>');
  // by area (MTD) — Restaurant vs Scala, with % share
  var area=revAreaMTD(p);
  var rPct=area.totNet?Math.round(area.restNet/area.totNet*100):0, lPct=area.totNet?(100-rPct):0;
  function share(net){ return area.totNet?Math.round(net/area.totNet*100)+'%':'—'; }
  function arow(name,net,cov){ return '<tr><td class="rev-day">'+name+'</td><td>'+revMoney(net)+'</td><td>'+share(net)+'</td><td>'+cov+'</td><td>'+(cov?revMoney(net/cov).replace('AED ',''):'—')+'</td></tr>'; }
  h.push('<div class="rev-section-h">By area — '+revMonthLabel(p)+' (MTD) · Lounge vs Restaurant</div>');
  if(area.totNet) h.push('<div class="rev-split"><div class="rev-split-r" style="width:'+rPct+'%">Restaurant '+rPct+'%</div><div class="rev-split-l" style="width:'+lPct+'%">Lounge '+lPct+'%</div></div>');
  h.push('<div class="rev-grid-wrap"><table class="rev-grid"><thead><tr><th>Area</th><th>Revenue</th><th>Share</th><th>Covers</th><th>Avg / cover</th></tr></thead><tbody>');
  h.push(arow('Restaurant',area.restNet,area.restCov));
  h.push(arow('Scala Lounge &amp; Bar',area.lounNet,area.lounCov));
  h.push('<tr class="rev-total"><td>Total venue</td><td>'+revMoney(area.totNet)+'</td><td>100%</td><td>'+area.totCov+'</td><td>'+(area.totCov?revMoney(area.totNet/area.totCov).replace('AED ',''):'—')+'</td></tr>');
  h.push('</tbody></table></div>');
  // by area & daypart (only once daypart data is entered)
  var anyDP=(area.rlNet+area.rdNet+area.llNet+area.ldNet+area.rlCov+area.rdCov+area.llCov+area.ldCov)>0;
  if(anyDP){
    function drow(name,net,cov){ return '<tr><td class="rev-day">'+name+'</td><td>'+revMoney(net)+'</td><td>'+cov+'</td><td>'+(cov?revMoney(net/cov).replace('AED ',''):'—')+'</td></tr>'; }
    h.push('<div class="rev-section-h">By area &amp; daypart (MTD)</div>');
    h.push('<div class="rev-grid-wrap"><table class="rev-grid"><thead><tr><th>Area · daypart</th><th>Revenue</th><th>Covers</th><th>Avg / cover</th></tr></thead><tbody>');
    h.push(drow('Restaurant · Lunch',area.rlNet,area.rlCov));
    h.push(drow('Restaurant · Dinner',area.rdNet,area.rdCov));
    h.push(drow('Scala · Lunch',area.llNet,area.llCov));
    h.push(drow('Scala · Dinner',area.ldNet,area.ldCov));
    h.push('</tbody></table></div>');
  }
  // month grid
  h.push('<div class="rev-section-h">Daily — '+revMonthLabel(p)+'</div>');
  h.push('<div class="rev-grid-wrap rev-grid-scroll"><table class="rev-grid"><thead><tr><th>Day</th><th>Net (actual)</th><th>Budget</th><th>vs Budget</th><th>Covers</th><th>Avg/cover</th></tr></thead><tbody>');
  m.days.forEach(function(d){
    var sun=d.closed; // Sunday — normally closed, but enterable if opened (e.g. private event)
    var noBudget=(sun && d.budget===0);
    var vsCls=(!noBudget && d.vsBudget!=null)?(d.vsBudget>=0?'rev-pos':'rev-neg'):'';
    var netCell=d.net!=null?revMoney(d.net):'<span class="rev-add">+ enter'+(sun?' (Sun)':'')+'</span>';
    var budgetCell=noBudget?'<span class="rev-mut">—</span>':revMoney(d.budget);
    var vsCell=(noBudget||d.vsBudget==null)?'—':((d.vsBudget>=0?'+':'')+revMoney(d.vsBudget).replace('AED ',''));
    h.push('<tr onclick="revEditDay(\''+d.date+'\')"'+(sun?' class="rev-sun"':'')+'>'
      +'<td class="rev-day">'+d.weekday.slice(0,3)+' '+d.d+'</td>'
      +'<td>'+netCell+'</td>'
      +'<td class="rev-mut">'+budgetCell+'</td>'
      +'<td class="'+vsCls+'">'+vsCell+'</td>'
      +'<td>'+(d.totalCov!=null?d.totalCov:'—')+'</td>'
      +'<td>'+(d.avgCover!=null?revMoney(d.avgCover).replace('AED ',''):'—')+'</td></tr>');
  });
  h.push('<tr class="rev-total"><td>MTD</td><td>'+revMoney(m.mtdNet)+'</td><td>'+revMoney(m.budgetTotal)+'</td><td colspan="3"></td></tr>');
  h.push('</tbody></table></div>');
  // Review
  h.push('<div class="rev-section-h">Review — '+revMonthLabel(p)+' vs '+revMonthLabel(rv.prevPeriod)+' (matched window, through day '+rv.windowDay+')</div>');
  function rrow(label,o,money){ return '<tr><td>'+label+'</td><td>'+(money?revMoney(o.prev):Math.round(o.prev).toLocaleString())+'</td><td>'+(money?revMoney(o.cur):Math.round(o.cur).toLocaleString())+'</td><td class="'+revPctClass(o.chg)+'">'+revPct(o.chg)+'</td></tr>'; }
  h.push('<div class="rev-grid-wrap"><table class="rev-grid"><thead><tr><th>Metric</th><th>'+revMonthLabel(rv.prevPeriod).split(' ')[0]+'</th><th>'+revMonthLabel(p).split(' ')[0]+'</th><th>Change</th></tr></thead><tbody>');
  h.push(rrow('Net sales',rv.net,true));
  h.push(rrow('Avg net / day',rv.avgDay,true));
  h.push(rrow('Covers',rv.covers,false));
  h.push(rrow('Avg spend / cover',rv.spendCover,true));
  h.push(rrow('Restaurant spend/cover',rv.venueRest,true));
  h.push(rrow('Lounge spend/cover',rv.venueLoun,true));
  h.push('</tbody></table></div>');
  // weekday averages
  h.push('<div class="rev-section-h">Avg net by weekday (apples-to-apples)</div>');
  h.push('<div class="rev-grid-wrap"><table class="rev-grid"><thead><tr><th>Weekday</th><th>'+revMonthLabel(rv.prevPeriod).split(' ')[0]+' avg</th><th>'+revMonthLabel(p).split(' ')[0]+' avg</th><th>Change</th></tr></thead><tbody>');
  rv.weekdays.forEach(function(w){ h.push('<tr><td>'+w.wd+'</td><td>'+revMoney(w.prev)+'</td><td>'+revMoney(w.cur)+'</td><td class="'+revPctClass(w.chg)+'">'+revPct(w.chg)+'</td></tr>'); });
  h.push('</tbody></table></div>');
  // projection
  h.push('<div class="rev-section-h">Full-month projection</div>');
  h.push('<div class="rev-proj">'
    +'<div class="rev-proj-row"><span>Actual MTD</span><b>'+revMoney(rv.mtd)+'</b></div>'
    +'<div class="rev-proj-row"><span>Projected — '+rv.remaining+' remaining days (this month\'s weekday run-rate)</span><b>'+revMoney(rv.projected)+'</b></div>'
    +'<div class="rev-proj-row rev-proj-fore"><span>Forecast — full month</span><b>'+revMoney(rv.forecast)+'</b></div>'
    +'<div class="rev-proj-row"><span>vs Budget ('+revMoney(rv.budgetTotal)+')</span><b class="'+revPctClass(rv.vsBudgetPct)+'">'+revMoney(rv.vsBudget)+' · '+revPct(rv.vsBudgetPct)+'</b></div></div>');
  h.push('<div id="rev-ai-out" class="rev-ai-out" style="display:none"></div>');
  h.push('</div>');
  return h.join('');
}
function revRenderYear(){
  var R=revInit(), year=revYearOf(R.period); var h=[];
  h.push('<div class="rev-wrap">');
  h.push('<div class="rev-toolbar"><div class="rev-nav"><button class="rev-btn" onclick="revSetPeriod(\''+(parseInt(year)-1)+'-01\')">&#8592;</button><span class="rev-period">'+year+'</span><button class="rev-btn" onclick="revSetPeriod(\''+(parseInt(year)+1)+'-01\')">&#8594;</button></div>'
    +'<div class="rev-views"><button class="rev-vtab" onclick="revSetView(\'month\')">Month</button><button class="rev-vtab active" onclick="revSetView(\'year\')">Year</button></div></div>');
  var ytdNet=0, ytdBudget=0;
  h.push('<div class="rev-section-h">'+year+' — month by month</div>');
  h.push('<div class="rev-grid-wrap"><table class="rev-grid"><thead><tr><th>Month</th><th>Net sales</th><th>Budget</th><th>vs Budget</th><th>Trading days</th></tr></thead><tbody>');
  for(var mo=1; mo<=12; mo++){
    var p=year+'-'+String(mo).padStart(2,'0'); var m=revMonthData(p);
    if(m.tradingDays===0) continue;
    ytdNet+=m.mtdNet; ytdBudget+=m.budgetToDate;
    var vs=m.budgetToDate?(m.mtdNet-m.budgetToDate)/m.budgetToDate:'';
    h.push('<tr onclick="revSetView(\'month\');revSetPeriod(\''+p+'\')"><td class="rev-day">'+new Date(parseInt(year),mo-1,1).toLocaleDateString('en-GB',{month:'long'})+'</td><td>'+revMoney(m.mtdNet)+'</td><td class="rev-mut">'+revMoney(m.budgetToDate)+'</td><td class="'+revPctClass(vs)+'">'+revPct(vs)+'</td><td>'+m.tradingDays+'</td></tr>');
  }
  var ytdVs=ytdBudget?(ytdNet-ytdBudget)/ytdBudget:'';
  h.push('<tr class="rev-total"><td>YTD</td><td>'+revMoney(ytdNet)+'</td><td>'+revMoney(ytdBudget)+'</td><td class="'+revPctClass(ytdVs)+'">'+revPct(ytdVs)+'</td><td></td></tr>');
  h.push('</tbody></table></div></div>');
  return h.join('');
}

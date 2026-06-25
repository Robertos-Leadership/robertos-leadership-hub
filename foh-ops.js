// ──────────────────────────────────────────────────────────────────────────
// FOH Operations page (ops*) — slice 2 of the index.html split.
// Hosts the Daily Closing Report launcher + the recent-reports history table.
//
// PURE RELOCATION (no renames). Loaded as a classic <script> AFTER the main
// inline script and foh-closing.js, so its functions stay global (inline
// onclick handlers keep working) and it sees the shared globals it needs:
//   sb, state, revInit, revMoney  (main script)
//   clToday, clOpen               (foh-closing.js)
// These functions run only on tab navigation / realtime refresh, never at boot.
// ──────────────────────────────────────────────────────────────────────────
function renderOperations(){
  var today=clToday(), h=[];
  var view=revInit().opsView||'recent';
  h.push('<div class="ops-wrap">');
  h.push('<div class="ops-hero"><div class="ops-hero-k">Operations</div><div class="ops-hero-t">Daily Closing Report</div>'
    +'<div class="ops-hero-s">Capture the night at close — revenue, tips, comps and shift notes. It flows into Revenue automatically and feeds the Analyst for patterns.</div>'
    +'<div class="ops-hero-actions"><button class="ops-btn-primary" onclick="clOpen()">&#128203; Start today’s report</button>'
    +'<span class="ops-date">Another day <input type="date" id="ops-date" value="'+today+'"><button class="ops-btn-sec" onclick="clOpen(document.getElementById(\'ops-date\').value)">Open</button></span></div></div>');
  // Sub-view toggle: recent reports list vs the Service feedback History & Trends.
  function pill(k,label){ var on=(view===k); return '<button onclick="opsSetView(\''+k+'\')" style="padding:6px 14px;border-radius:16px;border:1px solid var(--vino);cursor:pointer;font-family:var(--font-sans);font-size:13px;'+(on?'background:var(--vino);color:var(--cream);font-weight:700':'background:transparent;color:var(--vino)')+'">'+label+'</button>'; }
  h.push('<div style="display:flex;gap:8px;margin:14px 0 4px">'+pill('recent','Recent reports')+pill('feedback','History & Trends')+'</div>');
  if(view==='feedback'){
    h.push('<div id="ops-feedback">'+opsFeedbackHTML()+'</div>');
    if(!revInit().opsFeedbackLoaded) opsLoadFeedback();
  } else {
    h.push('<div class="rev-section-h">Recent closing reports</div><div id="ops-recent">'+opsRecentHTML()+'</div>');
    if(!revInit().opsRecentLoaded) opsLoadRecent();
  }
  h.push('</div>');
  return h.join('');
}
function opsSetView(v){ revInit().opsView=v; if(typeof renderMain==='function') renderMain(); }
function opsRecentHTML(){
  var R=revInit();
  if(!R.opsRecent) return '<div class="rev-mut" style="padding:12px">Loading…</div>';
  if(!R.opsRecent.length) return '<div class="rev-mut" style="padding:12px">No closing reports yet — start today’s above.</div>';
  function fdate(ds){ return new Date(String(ds).slice(0,10)+'T12:00:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}); }
  var rows=R.opsRecent.map(function(r){
    var net=Number(r.rest_lunch_net||0)+Number(r.rest_dinner_net||0)+Number(r.lounge_lunch_net||0)+Number(r.lounge_dinner_net||0);
    var cov=Number(r.rest_lunch_covers||0)+Number(r.rest_dinner_covers||0)+Number(r.lounge_lunch_covers||0)+Number(r.lounge_dinner_covers||0);
    var nc=((r.comments_good||[]).length)+((r.comments_bad||[]).length);
    return '<tr onclick="clOpen(\''+String(r.service_date).slice(0,10)+'\')"><td class="rev-day">'+fdate(r.service_date)+'</td><td>'+revMoney(net)+'</td><td>'+cov+'</td><td>'+(r.manager_pm||r.manager_am||'—')+'</td><td>'+(nc?nc+' note'+(nc>1?'s':''):'—')+'</td></tr>';
  }).join('');
  return '<div class="rev-grid-wrap"><table class="rev-grid"><thead><tr><th>Date</th><th>Net</th><th>Covers</th><th>Manager</th><th>Notes</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}
async function opsLoadRecent(){
  var R=revInit(); R.opsRecentLoaded=true;
  try{
    var res=await sb.from('closing_reports').select('service_date,rest_lunch_net,rest_dinner_net,lounge_lunch_net,lounge_dinner_net,rest_lunch_covers,rest_dinner_covers,lounge_lunch_covers,lounge_dinner_covers,manager_am,manager_pm,comments_good,comments_bad').order('service_date',{ascending:false}).limit(30);
    R.opsRecent = res.error ? [] : (res.data||[]);
  }catch(e){ R.opsRecent=[]; }
  if(state.currentTab==='operations'){ var box=document.getElementById('ops-recent'); if(box) box.innerHTML=opsRecentHTML(); }
}

// ── History & Trends: Service feedback (guest comments over the last 90 days) ──
async function opsLoadFeedback(){
  var R=revInit(); R.opsFeedbackLoaded=true;
  try{
    var s=new Date(); s.setDate(s.getDate()-90);
    var since=s.getFullYear()+'-'+String(s.getMonth()+1).padStart(2,'0')+'-'+String(s.getDate()).padStart(2,'0');
    var res=await sb.from('closing_reports').select('service_date,comments_good,comments_bad,manager_am,manager_pm').gte('service_date',since).order('service_date',{ascending:false}).limit(120);
    R.opsFeedback = res.error ? [] : (res.data||[]);
  }catch(e){ R.opsFeedback=[]; }
  if(state.currentTab==='operations' && (revInit().opsView==='feedback')){ var box=document.getElementById('ops-feedback'); if(box) box.innerHTML=opsFeedbackHTML(); }
}
function opsFeedbackHTML(){
  var R=revInit();
  if(!R.opsFeedback) return '<div class="rev-mut" style="padding:12px">Loading…</div>';
  if(!R.opsFeedback.length) return '<div class="rev-mut" style="padding:12px">No service feedback logged in the last 90 days.</div>';
  function fdate(ds){ return new Date(String(ds).slice(0,10)+'T12:00:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}); }
  var good=[], bad=[], nRep=R.opsFeedback.length;
  R.opsFeedback.forEach(function(r){
    var mgr=(r.manager_pm||r.manager_am||'');
    (r.comments_good||[]).forEach(function(t){ if(t&&String(t).trim()) good.push({d:r.service_date,t:String(t).trim(),m:mgr}); });
    (r.comments_bad||[]).forEach(function(t){ if(t&&String(t).trim()) bad.push({d:r.service_date,t:String(t).trim(),m:mgr}); });
  });
  function list(items,color){
    return items.slice(0,30).map(function(x){
      return '<div style="padding:8px 10px;border-left:3px solid '+color+';background:var(--sabbia-light);margin-bottom:6px;border-radius:4px">'
        +'<div style="font-size:11px;color:var(--vino-light);text-transform:uppercase;letter-spacing:.5px;font-family:var(--font-sans)">'+fdate(x.d)+(x.m?' · '+clEsc(x.m):'')+'</div>'
        +'<div style="font-size:14px;color:var(--ink);margin-top:2px">'+clEsc(x.t)+'</div></div>';
    }).join('');
  }
  var h='';
  h+='<div class="rev-section-h">Service feedback · last 90 days</div>';
  h+='<div class="rev-mut" style="padding:0 0 12px">'+nRep+' report'+(nRep>1?'s':'')+' · <b style="color:#2d7a4f">'+good.length+'</b> positive · <b style="color:#b3402f">'+bad.length+'</b> needs attention</div>';
  h+='<div style="font-size:13px;font-weight:700;color:#b3402f;margin:6px 0 8px">&#128078; Needs attention ('+bad.length+')</div>';
  h+= bad.length?list(bad,'#b3402f'):'<div class="rev-mut" style="margin-bottom:8px">None logged — nothing flagged.</div>';
  h+='<div style="font-size:13px;font-weight:700;color:#2d7a4f;margin:16px 0 8px">&#128077; Praise ('+good.length+')</div>';
  h+= good.length?list(good,'#2d7a4f'):'<div class="rev-mut">None logged.</div>';
  if(bad.length>30||good.length>30) h+='<div class="rev-mut" style="margin-top:10px;font-size:12px">Showing the most recent 30 of each.</div>';
  return h;
}

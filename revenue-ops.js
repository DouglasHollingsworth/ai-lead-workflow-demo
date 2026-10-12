/* KAIJ Revenue Operations Pilot
   Browser-only demonstration. Does not send messages, run paid models, deploy code,
   charge cards, scrape prospects, or read other projects.
   Extends the existing AI Lead Workflow Demo without changing its source data shape.
*/
(function () {
  "use strict";
  var HISTORY_KEY = "ai-lead-workflow-demo-ops-pilot-r1";
  var STAGES = ["new", "contacted", "proposal", "won", "lost"];
  var root = document.createElement("section");
  root.className = "panel ops-pilot";
  root.id = "opsPilot";
  root.setAttribute("aria-label", "Revenue operations pilot");
  root.innerHTML = [
    '<div class="panel-head"><div><p class="eyebrow">07 — REVENUE OPERATIONS · SANDBOX</p>',
    '<h2>Founder control room</h2></div><span class="badge muted">Propose-only agent</span></div>',
    '<p class="ops-muted">A working business-control loop for the existing lead pipeline. ',
    'All recommendations are rule-based. Nothing is emailed, billed, or published; ',
    'approval and deal outcomes remain human-recorded.</p>',
    '<div class="ops-metrics">',
    '<div><span>Open pipeline</span><strong id="opsPipeline">$0</strong></div>',
    '<div><span>Won / booked</span><strong id="opsBooked">$0</strong></div>',
    '<div><span>Collected (reported)</span><strong id="opsCollected">$0</strong></div>',
    '<div><span>Recorded wins</span><strong id="opsWins">0</strong></div></div>',
    '<div class="ops-cols">',
    '<div class="ops-box"><div class="ops-box-head"><h3>Agent recommendations</h3>',
    '<button type="button" class="primary" id="opsRun">Run review</button></div>',
    '<p class="ops-muted">Prioritizes existing leads. Never contacts anyone automatically.</p>',
    '<ol id="opsQueue" class="ops-queue"></ol>',
    '<div id="opsRunInfo" class="ops-muted" aria-live="polite"></div></div>',
    '<div class="ops-box"><h3>Record deal outcome</h3>',
    '<label>Lead<select id="opsLead"></select></label>',
    '<label>Sales stage<select id="opsStage"><option value="new">New / qualification</option>',
    '<option value="contacted">Contacted (manually confirmed)</option>',
    '<option value="proposal">Proposal sent (manually confirmed)</option>',
    '<option value="won">Won (manually confirmed)</option>',
    '<option value="lost">Lost / not a fit</option></select></label>',
    '<div class="ops-two"><label>Opportunity ($)<input type="number" id="opsValue" min="0" max="100000000" step="0.01" value="0"></label>',
    '<label>Money received ($)<input type="number" id="opsPaid" min="0" max="100000000" step="0.01" value="0"></label></div>',
    '<label>Evidence / next step<textarea id="opsNotes" rows="3" placeholder="Call date, invoice reference, reason, or next step"></textarea></label>',
    '<button type="button" id="opsSave" class="primary">Save verified status</button>',
    '<p id="opsNotice" class="ops-muted" role="status"></p></div></div>',
    '<div class="ops-footer"><div><strong>Guardrails</strong><span> $0 outside spend · No auto-send · No invented prospects · Browser-local data</span></div>',
    '<button id="opsExport" type="button" class="ghost">Export outcomes CSV</button></div>'
  ].join("");
  var dashboard = document.querySelector(".dashboard");
  if (!dashboard || typeof state === "undefined" || typeof saveLeads !== "function") return;
  dashboard.after(root);

  function byId(id) { return document.getElementById(id); }
  function dollars(v) {
    return Number(v || 0).toLocaleString("en-US", {style:"currency",currency:"USD",maximumFractionDigits:0});
  }
  function num(v) {
    var n = Number(v);
    return Number.isFinite(n) && n >= 0 ? Math.min(100000000, Math.round(n * 100) / 100) : 0;
  }
  function deal(lead) {
    var x = lead.ops || {};
    return {stage:STAGES.includes(x.stage) ? x.stage : "new",
      value:num(x.value), paid:num(x.paid), note:String(x.note || "")};
  }
  function recommendation(lead) {
    var d = deal(lead);
    var score = Number(lead.qualification && lead.qualification.score || 0);
    var name = String(lead.name || "Unnamed lead");
    var step, why, rank;
    if (d.stage === "lost") return null;
    if (lead.gate && lead.gate.decision === "BLOCK") {
      step = "Resolve missing contact details before outreach";
      why = "Original contact gate blocked this lead"; rank = 10;
    } else if (d.stage === "won") {
      if (d.paid < d.value) {
        step = "Verify invoice and follow up on outstanding payment";
        why = "Won deal has uncollected balance recorded"; rank = 90;
      } else {
        step = "Document delivery and request a referral when appropriate";
        why = "Won deal has no recorded balance"; rank = 30;
      }
    } else if (d.stage === "proposal") {
      step = "Check proposal response and record the buyer decision";
      why = "Proposal stage needs an outcome"; rank = 85;
    } else if (d.stage === "contacted") {
      step = "Review conversation and agree a scoped next step";
      why = "Contact is recorded, but no proposal exists"; rank = 70;
    } else if (lead.status === "Needs approval") {
      step = "Review and approve or reject the existing follow-up draft";
      why = "Outbound approval gate still pending"; rank = 95;
    } else if (lead.status === "Approved") {
      step = "Manually send the approved message; record contact only after sending";
      why = "Approved does not mean sent"; rank = 80;
    } else {
      step = "Qualify the need and confirm a contact path";
      why = "No verified outreach action"; rank = 40;
    }
    return {id:lead.id, name:name, step:step, why:why,
      score:score, rank:rank + score / 1000};
  }
  function queue() {
    return state.leads.map(recommendation).filter(Boolean)
      .sort(function(a,b){return b.rank-a.rank || b.score-a.score;});
  }
  function history() {
    try { var list = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      return Array.isArray(list) ? list.slice(0,20) : []; } catch (_) { return []; }
  }
  function persistHistory(item) {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify([item].concat(history()).slice(0,20))); }
    catch (_) { byId("opsRunInfo").textContent = "History could not be saved in this browser."; }
  }
  function renderLeadEditor() {
    var select = byId("opsLead");
    var previous = select.value;
    select.replaceChildren();
    state.leads.forEach(function(l){
      var opt = new Option(l.name + " · " + l.service, String(l.id));
      select.add(opt);
    });
    if (state.leads.some(function(l){return String(l.id) === previous;})) select.value = previous;
    select.disabled = !state.leads.length;
    syncEditor();
  }
  function selected() {
    return state.leads.find(function(l){return String(l.id) === byId("opsLead").value;});
  }
  function syncEditor() {
    var lead = selected();
    var d = lead ? deal(lead) : {stage:"new",value:0,paid:0,note:""};
    byId("opsStage").value = d.stage;
    byId("opsValue").value = d.value;
    byId("opsPaid").value = d.paid;
    byId("opsNotes").value = d.note;
    byId("opsSave").disabled = !lead;
    byId("opsNotice").textContent = lead ? "Record only outcomes you can verify. No messages are sent." : "Add a lead using intake above.";
  }
  function paintQueue(items) {
    var ul = byId("opsQueue");
    ul.replaceChildren();
    if (!items.length) {
      var empty = document.createElement("li");
      empty.textContent = "No active leads yet. The next revenue action is to collect a real inquiry.";
      ul.appendChild(empty);
      return;
    }
    items.slice(0,5).forEach(function(item){
      var li=document.createElement("li");
      var title=document.createElement("strong");
      title.textContent=item.name + " · " + item.step;
      var explain=document.createElement("span");
      explain.textContent=item.why;
      li.append(title,explain);ul.appendChild(li);
    });
  }
  function paint() {
    var open=0,booked=0,paid=0,wins=0;
    state.leads.forEach(function(l){
      var d=deal(l);
      if (d.stage==="won") { booked+=d.value; paid+=d.paid; wins++; }
      else if (d.stage!=="lost") open+=d.value;
    });
    byId("opsPipeline").textContent=dollars(open);
    byId("opsBooked").textContent=dollars(booked);
    byId("opsCollected").textContent=dollars(paid);
    byId("opsWins").textContent=String(wins);
    paintQueue(queue());
    var h=history();
    byId("opsRunInfo").textContent = h.length
      ? "Last review: " + new Date(h[0].at).toLocaleString() + " · " + h[0].count + " actions proposed · no external actions"
      : "No agent reviews recorded yet.";
    renderLeadEditor();
  }
  function review() {
    var items=queue();
    persistHistory({at:new Date().toISOString(),count:items.length});
    paintQueue(items);
    var h=history();
    byId("opsRunInfo").textContent = "Review #" + h.length + ": " + items.length
      + " recommended actions · none executed or emailed.";
    if (typeof addActivity === "function") addActivity("OPS PILOT — local review proposed " + items.length + " actions; no outbound activity.");
  }
  function save() {
    var lead=selected();
    if (!lead) return;
    var stage=byId("opsStage").value, value=Number(byId("opsValue").value),
      paid=Number(byId("opsPaid").value);
    if (!STAGES.includes(stage) || !Number.isFinite(value) || !Number.isFinite(paid)
      || value<0 || paid<0 || value>100000000 || paid>value) {
      byId("opsNotice").textContent = "Enter valid amounts. Received cannot exceed opportunity value.";
      return;
    }
    var note=byId("opsNotes").value.trim();
    if ((stage==="won" || stage==="proposal" || stage==="contacted") && !note) {
      byId("opsNotice").textContent = "Add evidence or a note before recording this stage.";
      return;
    }
    lead.ops={stage:stage,value:num(value),paid:num(paid),note:note.slice(0,2000),
      updatedAt:new Date().toISOString(),source:"human-entered"};
    saveLeads();
    if (typeof addActivity === "function") addActivity("OPS PILOT — human recorded " + stage + " for " + lead.name + "; no payment verified externally.");
    var choice=String(lead.id);
    paint();
    byId("opsLead").value=choice;
    syncEditor();
    byId("opsNotice").textContent = "Saved locally. Revenue and payment values are self-reported, not bank/Stripe verified.";
  }
  function csvCell(raw) {
    var s=String(raw===undefined || raw===null ? "" : raw);
    if (/^[\s]*[=+\-@]/.test(s)) s="'"+s;
    return '"' + s.replace(/"/g,'""') + '"';
  }
  function exportCsv() {
    var rows=[["Lead","Email","Service","Score","Approval","Stage","Opportunity USD","Reported received USD","Notes"]];
    state.leads.forEach(function(l){
      var d=deal(l);
      rows.push([l.name,l.email,l.service,(l.qualification||{}).score,l.status,d.stage,d.value,d.paid,d.note]);
    });
    var csv=rows.map(function(row){return row.map(csvCell).join(",");}).join("\r\n");
    var blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
    var url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download="kaij-revenue-pilot-outcomes.csv";document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},1000);
  }
  byId("opsRun").addEventListener("click",review);
  byId("opsLead").addEventListener("change",syncEditor);
  byId("opsSave").addEventListener("click",save);
  byId("opsExport").addEventListener("click",exportCsv);
  document.getElementById("leadForm").addEventListener("submit",paint);
  document.getElementById("approveBtn").addEventListener("click",paint);
  document.getElementById("resetBtn").addEventListener("click",function(){
    localStorage.removeItem(HISTORY_KEY);paint();
  });
  paint();
  window.KAIJRevenuePilot={recommendation:recommendation, queue:queue};
})();
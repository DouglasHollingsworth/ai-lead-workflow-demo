/* KAIJ CEO Operations Pilot: manual planning simulator.
 * No autonomous worker, AI provider, network, permissions, money, or external actions.
 * Source: original KAIJ code; architectural inspirations are described in the documentation.
 */
(function () {
  "use strict";
  var KEY = "kaij-ceo-operations-pilot-v1";
  var COMPANY = "kaij-consulting-innovation";
  var DEFAULT_GOAL = "Win the first verified paying client for KAIJ Consulting & Innovation.";
  var VALID = ["suggested","approved","in_progress","needs_continuation","completed","failed","rejected"];
  var BLOCKED = ["in_progress","needs_continuation"];
  var MAX_ACTIVE = 3;
  if (typeof state === "undefined" || !window.KAIJRevenuePilot) return;

  var root = document.createElement("section");
  root.id = "kaijCeoPilot";
  root.className = "panel ceo-pilot";
  root.setAttribute("aria-label", "KAIJ CEO planning loop pilot");
  root.innerHTML = [
    '<div class="panel-head"><div><p class="eyebrow">08 — OPERATIONS DIRECTOR · MANUAL SIMULATOR</p>',
    '<h2>Plan → Approve → Execute → Verify</h2></div>',
    '<span class="badge muted">No unattended agent</span></div>',
    '<p class="ops-muted">A bounded founder-directed task queue. It suggests work based on the existing lead pipeline,',
    ' but never performs outreach, edits websites, deploys code, or makes purchases.</p>',
    '<div class="ceo-goal"><label>Company objective<input id="ceoGoal" maxlength="240" placeholder="Business objective"></label>',
    '<button id="ceoSaveGoal" class="ghost" type="button">Save goal</button></div>',
    '<div class="ceo-top"><div class="ceo-counters">',
    '<div><span>Suggested</span><strong id="ceoSuggested">0</strong></div>',
    '<div><span>Approved</span><strong id="ceoApproved">0</strong></div>',
    '<div><span>Unfinished</span><strong id="ceoUnfinished">0</strong></div>',
    '<div><span>Verified work</span><strong id="ceoCompleted">0</strong></div></div>',
    '<button id="ceoPlan" type="button" class="primary">Plan next work</button></div>',
    '<div class="ceo-columns"><div class="ceo-module"><h3>Bounded task backlog</h3>',
    '<p class="ops-muted">Maximum three pending tasks. Suggestions are grounded in actual lead states or clearly marked preparation tasks.</p>',
    '<ol id="ceoTaskList" class="ceo-task-list"></ol></div>',
    '<div class="ceo-module"><h3>Owner task controls</h3>',
    '<label>Select task<select id="ceoSelect"></select></label>',
    '<p id="ceoDetails" class="ops-muted"></p>',
    '<label>Evidence, continuation note, or rejection reason<textarea id="ceoEvidence" rows="3"',
    ' placeholder="Link to work, customer note, rejection reason, or clear next step"></textarea></label>',
    '<div class="ceo-actions">',
    '<button class="ghost" type="button" id="ceoApprove">Approve</button>',
    '<button class="ghost" type="button" id="ceoBegin">Begin / Resume</button>',
    '<button class="ghost" type="button" id="ceoContinue">Needs continuation</button>',
    '<button class="ghost" type="button" id="ceoComplete">Verify completion</button>',
    '<button class="ghost" type="button" id="ceoFail">Failed</button>',
    '<button class="ghost" type="button" id="ceoReject">Reject</button></div>',
    '<p class="ops-muted" id="ceoFeedback" role="status"></p></div></div>',
    '<div class="ceo-report"><div class="ceo-report-head"><h3>CEO operating brief</h3>',
    '<span class="badge muted">Evidence-based</span></div>',
    '<p id="ceoReport" class="ops-muted">No review has been run.</p></div>',
    '<p class="ops-muted ceo-note"><strong>Boundary:</strong> This is an interactive, browser-local operating-model',
    ' demonstration. The proposal engine uses deterministic rules, not a live AI model.',
    ' It does not run on a schedule. Completion reflects human-entered evidence, not external verification.</p>'
  ].join("");
  var prior = document.getElementById("opsPilot");
  if (!prior) return;
  prior.after(root);

  function el(id) { return document.getElementById(id); }
  function now() { return new Date().toISOString(); }
  function initial() {
    return { companyId:COMPANY,goal:DEFAULT_GOAL,tasks:[],events:[],lastReport:"",reviewCount:0 };
  }
  function read() {
    try {
      var data = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!data || data.companyId !== COMPANY || !Array.isArray(data.tasks) || !Array.isArray(data.events)) return initial();
      data.tasks = data.tasks.filter(function(t){return t && VALID.includes(t.status) && typeof t.key==="string" && typeof t.id==="string";}).slice(-100);
      data.events = data.events.slice(-100);
      data.goal = String(data.goal||DEFAULT_GOAL).slice(0,240);
      data.lastReport = String(data.lastReport||"").slice(0,1500);
      data.reviewCount = Math.max(0, Number(data.reviewCount)||0);
      return data;
    } catch(_) {return initial();}
  }
  var store = read();
  function save() {
    try {localStorage.setItem(KEY,JSON.stringify(store));return true;}
    catch (_) {el("ceoFeedback").textContent="Storage unavailable; this session may not persist.";return false;}
  }
  function addEvent(kind,taskId,detail) {
    store.events.push({at:now(),kind:kind,taskId:taskId,detail:String(detail||"").slice(0,600)});
    store.events = store.events.slice(-100);
  }
  function active() {
    return store.tasks.filter(function(t){return ["suggested","approved","in_progress","needs_continuation"].includes(t.status);});
  }
  function leadSuggestions() {
    var items=window.KAIJRevenuePilot.queue();
    return items.slice(0,12).map(function(p){
      var lead=state.leads.find(function(l){return String(l.id)===String(p.id);});
      var stage=lead && lead.ops && lead.ops.stage || "new";
      var approval=lead && lead.status || "unknown";
      var role=stage==="won"?"Finance":stage==="proposal"?"Sales":stage==="new"?"Sales":"Operations";
      return {key:"lead:"+String(p.id)+":"+stage+":"+approval,
        title:p.step,
        why:"Existing lead: "+p.name+". "+p.why,
        role:role,priority:3,leadId:String(p.id)};
    });
  }
  function evergreen() {
    return [
      {key:"prep:offer",title:"Validate one narrow consulting service offer",
       why:"Clearly define the buyer, deliverable, scope and price before prospecting.",
       role:"Strategy",priority:2},
      {key:"prep:prospects",title:"Research ten verifiable local business prospects",
       why:"Produce an evidence-backed prospect list. Do not fabricate contacts or send messages.",
       role:"Research",priority:2},
      {key:"prep:outreach",title:"Draft five personalized, approval-only introduction messages",
       why:"Use only verified contacts and a confirmed service offer; do not send automatically.",
       role:"Sales",priority:1},
      {key:"prep:delivery",title:"Document the client intake and delivery checklist",
       why:"Prevent overselling: describe what KAIJ can actually deliver and how to verify it.",
       role:"Operations",priority:1}
    ];
  }
  function proposals() {
    return leadSuggestions().concat(evergreen()).filter(function(candidate){
      return !store.tasks.some(function(task){return task.key===candidate.key;});
    });
  }
  function plan() {
    store.reviewCount++;
    var paused=store.tasks.find(function(t){return BLOCKED.includes(t.status);});
    var count=0;
    if (!paused) {
      var capacity=Math.max(0,MAX_ACTIVE-active().length);
      proposals().slice(0,capacity).forEach(function(p){
        store.tasks.push({id:"KAIJ-"+String(Date.now())+"-"+String(store.tasks.length+1),
          key:p.key,title:p.title,why:p.why,role:p.role,priority:p.priority,
          leadId:p.leadId||null,status:"suggested",createdAt:now(),evidence:""});
        count++;
      });
    }
    var real=state.leads.filter(function(l){return l.name && l.email && !String(l.email).endsWith("@example.com");}).length;
    var won=state.leads.filter(function(l){return l.ops && l.ops.stage==="won";}).length;
    var stats="Lead entries: "+state.leads.length+" ("+real+" non-example contact records; not externally validated). "+
      "Owner-reported wins: "+won+". ";
    var pending=active().length;
    var detail=paused ?
      "Planning paused: "+paused.title+" is "+paused.status+". Add a continuation note or completion evidence before more proposals. " :
      "Added "+count+" new proposal(s); "+pending+" pending tasks of "+MAX_ACTIVE+" allowed. ";
    store.lastReport=stats+detail+"Objective: "+store.goal+
      " No messages, purchases, code changes or other external actions executed.";
    addEvent("plan",null,store.lastReport);save();render();
    el("ceoFeedback").textContent=paused?"Review logged; unfinished task requires attention.":"Review logged; proposals await explicit approval.";
    return {added:count,paused:!!paused,pending:pending,report:store.lastReport};
  }
  function selected() {
    return store.tasks.find(function(t){return t.id===el("ceoSelect").value;});
  }
  var transitions={
    approved:["suggested"],
    in_progress:["approved","needs_continuation"],
    needs_continuation:["in_progress"],
    completed:["in_progress"],
    failed:["in_progress","needs_continuation"],
    rejected:["suggested","approved"]
  };
  function transition(status,evidence) {
    var task=selected(), note=String(evidence||"").trim();
    if(!task) return {ok:false,reason:"Select a task."};
    if(!transitions[status] || !transitions[status].includes(task.status))
      return {ok:false,reason:"Invalid transition from "+task.status+" to "+status+"."};
    if(["completed","needs_continuation","failed","rejected"].includes(status) && note.length<12)
      return {ok:false,reason:"Add at least 12 characters of meaningful evidence or reasoning."};
    if(status==="in_progress" && store.tasks.some(function(t){return t.id!==task.id && BLOCKED.includes(t.status);}))
      return {ok:false,reason:"One unfinished task at a time. Resolve or resume it first."};
    task.status=status;
    if(note)task.evidence=note.slice(0,2000);
    task.updatedAt=now();
    addEvent(status,task.id,note);
    save();render(task.id);
    return {ok:true,status:status};
  }
  function apply(status){
    var result=transition(status,el("ceoEvidence").value);
    el("ceoFeedback").textContent=result.ok?"Recorded "+result.status+". No external work was performed by this button.":result.reason;
    if(result.ok)el("ceoEvidence").value="";
  }
  function render(preferred) {
    el("ceoGoal").value=store.goal;
    el("ceoSuggested").textContent=String(store.tasks.filter(function(t){return t.status==="suggested";}).length);
    el("ceoApproved").textContent=String(store.tasks.filter(function(t){return t.status==="approved";}).length);
    el("ceoUnfinished").textContent=String(store.tasks.filter(function(t){return BLOCKED.includes(t.status);}).length);
    el("ceoCompleted").textContent=String(store.tasks.filter(function(t){return t.status==="completed";}).length);
    el("ceoReport").textContent=store.lastReport||"Run a manual review to see the baseline and proposed next tasks.";
    var list=el("ceoTaskList"), select=el("ceoSelect");
    var chosen=preferred || select.value;
    list.replaceChildren();select.replaceChildren();
    var tasks=store.tasks.filter(function(t){return !["completed","failed","rejected"].includes(t.status);});
    tasks.sort(function(a,b){return b.priority-a.priority;});
    if(!tasks.length){
      var none=document.createElement("li");none.textContent="No pending tasks. Plan next work to draft up to three proposals.";list.appendChild(none);
    }
    tasks.forEach(function(t){
      var li=document.createElement("li"),title=document.createElement("strong"),subtitle=document.createElement("span");
      title.textContent=t.title;
      subtitle.textContent=t.role+" · "+t.status.replaceAll("_"," ")+" · "+t.why;
      li.append(title,subtitle);list.appendChild(li);
      select.add(new Option(t.title+" ("+t.status+")",t.id));
    });
    if(tasks.some(function(t){return t.id===chosen;}))select.value=chosen;
    select.disabled=tasks.length===0;
    details();
  }
  function details() {
    var t=selected();
    el("ceoDetails").textContent=t ?
      "Assigned: "+t.role+". Why: "+t.why+
      (t.evidence?" Last note: "+t.evidence:"") : "No pending task selected.";
    var status=t && t.status;
    ["Approve","Begin","Continue","Complete","Fail","Reject"].forEach(function(action){
      var next={Approve:"approved",Begin:"in_progress",Continue:"needs_continuation",Complete:"completed",Fail:"failed",Reject:"rejected"}[action];
      el("ceo"+action).disabled=!status||!transitions[next].includes(status);
    });
  }
  el("ceoSaveGoal").addEventListener("click",function(){
    var goal=el("ceoGoal").value.trim().slice(0,240);
    if(goal.length<12){el("ceoFeedback").textContent="Enter a concrete, measurable goal of at least 12 characters.";return;}
    store.goal=goal;addEvent("goal_changed",null,goal);save();render();
    el("ceoFeedback").textContent="Goal saved for KAIJ only. No changes made to other businesses.";
  });
  el("ceoPlan").addEventListener("click",plan);
  el("ceoSelect").addEventListener("change",details);
  ["Approve","Begin","Continue","Complete","Fail","Reject"].forEach(function(action){
    var next={Approve:"approved",Begin:"in_progress",Continue:"needs_continuation",Complete:"completed",Fail:"failed",Reject:"rejected"}[action];
    el("ceo"+action).addEventListener("click",function(){apply(next);});
  });
  // Preserve existing reset behavior without modifying the original application.
  el("resetBtn").addEventListener("click",function(){
    store=initial();localStorage.removeItem(KEY);render();el("ceoEvidence").value="";
  });
  render();
  window.KAIJCEOPilot={
    plan:plan, transition:transition, readState:function(){return JSON.parse(JSON.stringify(store));},
    companyId:COMPANY
  };
})();
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

class FakeElement {
  constructor(name) {
    this.name=name; this.value=""; this.children=[]; this.options=[];
    this.handlers={}; this.disabled=false; this.textContent="";
  }
  setAttribute() {}
  after() {}
  append(...children) { this.children.push(...children); }
  appendChild(child) { this.children.push(child); }
  replaceChildren() { this.children=[]; this.options=[]; this.value=""; }
  add(option) { this.options.push(option); if(!this.value) this.value=option.value; }
  remove() {}
  click() {}
  addEventListener(name, handler) { this.handlers[name]=handler; }
}
const elements=new Map();
function get(id) {
  if(!elements.has(id)) elements.set(id,new FakeElement(id));
  return elements.get(id);
}
const lead={
  id:"l1",name:"Jordan Lee",email:"jordan@example.com",service:"CRM cleanup",
  qualification:{score:84},gate:{decision:"REVIEW NOW"},status:"Needs approval"
};
let saves=0;
const data=new Map();
const context={
  state:{leads:[lead]},
  document:{
    createElement:(name)=>new FakeElement(name),
    querySelector:()=>get("dashboard"),
    getElementById:get,
    body:get("body")
  },
  Option:class {constructor(label,value){this.text=label;this.value=value;}},
  localStorage:{
    getItem:(key)=>data.get(key)||null,
    setItem:(key,val)=>data.set(key,val),
    removeItem:(key)=>data.delete(key)
  },
  saveLeads:()=>saves++,
  addActivity:()=>{},
  window:{},
  URL:{createObjectURL:()=>"blob:test",revokeObjectURL:()=>{}},
  Blob:class {constructor(content,opts){this.content=content;this.opts=opts;}},
  setTimeout:()=>{}
};
const source=fs.readFileSync(require("node:path").join(__dirname,"..","revenue-ops.js"),"utf8");
vm.runInNewContext(source,context,{filename:"revenue-ops.js"});
const agent=context.window.KAIJRevenuePilot;
assert.ok(agent,"Module should expose inspectable recommendation functions");
assert.match(agent.recommendation(lead).step,/approve or reject/i);
assert.equal(get("opsPipeline").textContent,"$0");
assert.equal(get("opsWins").textContent,"0");

lead.status="Approved";
assert.match(agent.recommendation(lead).step,/Manually send/);
lead.ops={stage:"proposal",value:1500,paid:0,note:"Sent quote"};
assert.match(agent.recommendation(lead).step,/proposal/i);
lead.ops={stage:"won",value:1500,paid:500,note:"Signed scope; payment recorded by owner"};
assert.match(agent.recommendation(lead).step,/outstanding payment/i);

get("opsLead").value="l1";
get("opsStage").value="won";
get("opsValue").value="1500";
get("opsPaid").value="500";
get("opsNotes").value="Owner-entered result";
get("opsSave").handlers.click();
assert.equal(saves,1);
assert.equal(get("opsBooked").textContent,"$1,500");
assert.equal(get("opsCollected").textContent,"$500");

get("opsLead").value="l1";
get("opsStage").value="won";
get("opsValue").value="1500";
get("opsPaid").value="1700";
get("opsNotes").value="invalid overpayment";
get("opsSave").handlers.click();
assert.equal(saves,1,"Overpayment must not persist");

get("opsRun").handlers.click();
assert.ok(data.has("ai-lead-workflow-demo-ops-pilot-r1"));
lead.ops.stage="lost";
assert.equal(agent.recommendation(lead),null);
console.log("Revenue operations pilot: 11 assertions passed");

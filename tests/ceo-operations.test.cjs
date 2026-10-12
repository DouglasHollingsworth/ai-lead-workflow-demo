const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");

class Element {
  constructor(name){this.name=name;this.children=[];this.options=[];this.value="";this.textContent="";this.handlers={};this.disabled=false;}
  setAttribute(){}
  after(){}
  append(...children){this.children.push(...children);}
  appendChild(item){this.children.push(item);}
  replaceChildren(){this.children=[];this.options=[];this.value="";}
  add(option){this.options.push(option);if(!this.value)this.value=option.value;}
  addEventListener(event,cb){this.handlers[event]=cb;}
}
const elements=new Map();
function el(id){if(!elements.has(id))elements.set(id,new Element(id));return elements.get(id);}
const memory=new Map();
const lead={id:"l1",name:"Jordan Lee",email:"jordan@example.com",status:"Needs approval",ops:{stage:"new"}};
const ctx={
  state:{leads:[lead]},
  document:{createElement:(name)=>new Element(name),getElementById:el},
  localStorage:{
    getItem:(key)=>memory.get(key)||null,
    setItem:(key,value)=>memory.set(key,value),
    removeItem:(key)=>memory.delete(key)
  },
  Option:class{constructor(label,value){this.text=label;this.value=value;}},
  window:{KAIJRevenuePilot:{queue:()=>[{id:"l1",name:"Jordan Lee",step:"Review follow-up draft",why:"Approval is pending."}]}}
};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,"..","ceo-operations.js"),"utf8"),ctx,{filename:"ceo-operations.js"});
const ceo=ctx.window.KAIJCEOPilot;
assert.ok(ceo,"CEO module must load after revenue operations pilot");
assert.equal(ceo.companyId,"kaij-consulting-innovation");
assert.equal(ceo.readState().tasks.length,0);
let result=ceo.plan();
assert.equal(result.added,3,"first plan should cap proposal backlog to three");
assert.equal(ceo.readState().tasks.length,3);
assert.equal(ceo.readState().tasks[0].role,"Sales");
assert.equal(ceo.plan().added,0,"repeat review should not duplicate proposals");
assert.equal(ceo.readState().tasks.length,3);
assert.match(ceo.readState().lastReport,/No messages, purchases/i);
let task=ceo.readState().tasks[0];
el("ceoSelect").value=task.id;
assert.equal(ceo.transition("completed","a full description of completion evidence").ok,false,"direct completion forbidden");
assert.equal(ceo.transition("approved","").ok,true);
assert.equal(ceo.transition("in_progress","").ok,true);
assert.equal(ceo.plan().paused,true,"unfinished work freezes new suggestions");
assert.equal(ceo.transition("completed","short").ok,false,"short evidence must be rejected");
assert.equal(ceo.transition("completed","Human reviewed and documented the actual work performed.").ok,true);
assert.equal(ceo.readState().tasks[0].status,"completed");
assert.equal(ceo.plan().added,1,"completed work frees bounded backlog capacity");
assert.equal(ceo.readState().tasks.filter(t=>["suggested","approved","in_progress","needs_continuation"].includes(t.status)).length,3);
let next=ceo.readState().tasks.find(t=>t.status==="suggested");
el("ceoSelect").value=next.id;
assert.equal(ceo.transition("approved","").ok,true);
assert.equal(ceo.transition("in_progress","").ok,true);
assert.equal(ceo.transition("needs_continuation","Need to verify the customer contact information first.").ok,true);
assert.equal(ceo.transition("in_progress","").ok,true,"resuming task should be allowed");
assert.ok(memory.has("kaij-ceo-operations-pilot-v1"));
el("ceoGoal").value="Secure an evidenced first consulting customer this quarter.";
el("ceoSaveGoal").handlers.click();
assert.match(ceo.readState().goal,/first consulting customer/);
el("resetBtn").handlers.click();
assert.equal(ceo.readState().tasks.length,0,"reset clears queue");
assert.equal(memory.has("kaij-ceo-operations-pilot-v1"),false);
console.log("KAIJ CEO operations pilot: lifecycle and bounded-backlog checks passed");
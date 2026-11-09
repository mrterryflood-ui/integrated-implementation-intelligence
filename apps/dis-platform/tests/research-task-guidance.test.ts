import test from "node:test";
import assert from "node:assert/strict";
import {buildPlaybook,validatePlaybook,reconcileTaskCompletion} from "../lib/decision-playbook";
import {emptyResearchWorkflow,buildResearchWorkflowCase,reviseResearchWorkflowReport} from "../lib/research-workflow";
import {applyResearchTaskGuidance,projectResearchGapTask,researchTaskGuidance,researchTaskReviewNotice,taskGuidanceChanges} from "../lib/research-task-guidance";

function fixture(){
 const workflow=emptyResearchWorkflow();workflow.publicAggregateConfirmed=true;
 const initial=buildResearchWorkflowCase(workflow),plan=buildPlaybook(initial.question,initial.report);
 const task=plan.tasks.find(item=>item.sourceGapId==="literature-not-retrieved")!;
 delete task.sourceGapId; // Actual pre-repair cases carried the link in their rationale.
 task.owner="Synthetic retained owner";task.evidence="Synthetic prior search notes";task.done=true;task.review="Synthetic review trigger";
 const changed=reviseResearchWorkflowReport(initial.report,{...workflow,retrievalQuery:"Synthetic source appraisal search",leads:[{id:"synthetic-lead",kind:"SCHOLARLY",title:"Synthetic discovery lead",summary:"Fixture only",source:"Synthetic index",url:"https://example.org/paper",retrievedAt:"2026-11-08T12:00:00Z",sourceStatus:"DISCOVERY_ONLY"}]});
 return {initial,plan,task,changed};
}
test("legacy task follows its gap identity after discovery, with explicit draft adoption only",()=>{
 const {initial,task,changed}=fixture(),before=structuredClone(task);
 const guidance=researchTaskGuidance(changed,task)!;
 assert.equal(guidance.sourceGapId,"literature-not-retrieved");assert.equal(guidance.changed,true);
 assert.match(guidance.gap!.problem,/leads are now attached/);
 const after=applyResearchTaskGuidance(task,changed);
 assert.equal(after.title,"Appraise discovery leads and record source applicability");
 for(const key of ["id","owner","evidence","review","due","phase"] as const)assert.equal(after[key],before[key]);
 assert.equal(before.done,true);assert.equal(after.done,false);
 assert.deepEqual(task,before);assert.notEqual(initial.report,changed);
 for(const key of ["causalEffectEstablished","independentOutcomeVerified","interventionAuthorized","externalCommunicationAuthorized"])assert.equal(changed[key],false);
 assert.equal(researchTaskGuidance(changed,after)!.changed,false);
});
test("reordered gaps do not remap tasks; missing or duplicated gaps never imply completion",()=>{
 const {task,changed}=fixture();const report=structuredClone(changed) as any;
 report.gapLedger.reverse();
 assert.equal(researchTaskGuidance(report,task)!.sourceGapId,"literature-not-retrieved");
 report.gapLedger=report.gapLedger.filter((gap:any)=>gap.id!=="literature-not-retrieved");
 assert.equal(researchTaskGuidance(report,task)!.current,null);assert.deepEqual(applyResearchTaskGuidance(task,report),task);
 assert.match(researchTaskReviewNotice(report,[task]),/1 linked task\(s\) have no unique current gap/);
 const duplicate=structuredClone(changed) as any;duplicate.gapLedger.push(duplicate.gapLedger.find((gap:any)=>gap.id==="literature-not-retrieved"));
 assert.equal(researchTaskGuidance(duplicate,task)!.current,null);
});
test("custom task rationale retains explicit source association and a council wrapper does not hide changes",()=>{
 const {task,changed}=fixture();const accepted=applyResearchTaskGuidance(task,changed);
 accepted.title="Synthetic local adaptation";accepted.why="Synthetic local reason";
 const guidance=researchTaskGuidance({retainedResearch:changed},accepted)!;
 assert.equal(guidance.sourceGapId,"literature-not-retrieved");assert.equal(guidance.changed,true);
 assert.equal(accepted.title,"Synthetic local adaptation");
});
test("long gap descriptions remain full in the report and bounded tasks point to them without broken sentences",()=>{
 const gap={id:"synthetic-long-gap",severity:"RESEARCH_REQUIRED" as const,problem:"A full source requirement. ".repeat(30),ownerRole:"Proposed reviewer",nextEvidence:"A full acceptance requirement. ".repeat(40)};
 const task=projectResearchGapTask(gap);
 assert.equal(task.title,"Investigate evidence gap: synthetic-long-gap");assert.match(task.success,/retain the full requirement/);
 assert.equal(gap.problem,"A full source requirement. ".repeat(30));
});
test("invalid task identities and guidance cannot be saved as a valid playbook",()=>{
 const {plan}=fixture();assert.equal(validatePlaybook(plan),true);
 for(const change of [(p:any)=>p.tasks.push({...p.tasks[0]}),(p:any)=>p.tasks[0].why={},(p:any)=>p.tasks[0].why="x".repeat(2001),(p:any)=>p.tasks[0].sourceGapId=42,(p:any)=>p.tasks[0].title=" "]){
  const invalid=structuredClone(plan);change(invalid);assert.equal(validatePlaybook(invalid),false);
 }
});
test("history discloses before and after guidance and leaves older summary-only events unreconstructed",()=>{
 const {plan,task,changed}=fixture();const after=structuredClone(plan);
 after.tasks=after.tasks.map(item=>item.id===task.id?applyResearchTaskGuidance(item,changed):item);
 const changes=taskGuidanceChanges({previousPlaybook:plan,playbook:after});
 assert.equal(changes.length,1);assert.match(changes[0].before,/No fresh scholarly retrieval/);assert.match(changes[0].after,/Appraise discovery leads/);
 assert.deepEqual(taskGuidanceChanges({summary:{tasksTotal:25}}),[]);
});
test("server normalization rejects carried completion after any definition change and allows later explicit completion",()=>{
 const {plan,task}=fixture();
 for(const key of ["title","why","success"] as const){
  const submitted=structuredClone(plan),edited=submitted.tasks.find(item=>item.id===task.id)!;
  edited[key]="Synthetic changed requirement";edited.done=true;
  const normalized=reconcileTaskCompletion(plan,submitted);
  assert.equal(normalized.playbook.tasks.find(item=>item.id===task.id)!.done,false);assert.deepEqual(normalized.reopenedTaskIds,[task.id]);
  assert.equal(submitted.tasks.find(item=>item.id===task.id)!.done,true);assert.equal(plan.tasks.find(item=>item.id===task.id)!.done,true);
  const reviewed=structuredClone(normalized.playbook);reviewed.tasks.find(item=>item.id===task.id)!.done=true;
  assert.equal(reconcileTaskCompletion(normalized.playbook,reviewed).playbook.tasks.find(item=>item.id===task.id)!.done,true);
 }
});

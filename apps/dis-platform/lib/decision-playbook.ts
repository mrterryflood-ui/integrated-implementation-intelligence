export type WorkItem={id:string,phase:string,title:string,why:string,success:string,owner:string,due:string|null,done:boolean,evidence:string,review:string|null};
export type Measure={id:string,label:string,baseline:string,target:string,observed:string,unit:string,verified:boolean};
export type Playbook={objective:string,decision:string,assumptions:string[],alternatives:string[],tasks:WorkItem[],metrics:Measure[],nextReview:string,progressNotes:string[],evidenceLevel:string,version:number};
const phases=[
 ["scope","Define success and boundaries","Clarify the desired end state, affected people and constraints","Written objective, decision owner and measurable acceptance criteria"],
 ["evidence","Verify evidence and gaps","Identify sources, conflicts and knowledge limits","Claims supported by addressable passages, or explicitly marked unresolved"],
 ["options","Compare courses of action","Evaluate at least three options including no change","Trade-offs documented across impact, feasibility, cost, equity and reversibility"],
 ["challenge","Pressure-test action and reaction","Consider failure modes, second-order effects and counteractions","Red-team risks, triggers and mitigations reviewed"],
 ["pilot","Design and run a controlled test","Specify baseline, trial group, measures, owners and stop rules","Authorized pilot completed with reproducible observations"],
 ["decision","Make a conditional decision","Reconcile evidence, dissent, uncertainty and authorization","Go/no-go decision records conditions, approver and remaining dissent"],
 ["sustain","Check results and adapt","Assess adoption, costs, outcomes and unintended consequences","Observed measures compared with targets and next review scheduled"]
];
export function buildPlaybook(question:string,report:unknown):Playbook{
 const status=(report&&typeof report==="object"&&"state" in report)?String((report as {state:unknown}).state):"UNKNOWN";
 return {objective:question,decision:"UNDECIDED — evidence and user authorization required",assumptions:["Question interpretation and end state need user validation","Selected council lenses are not human advice or endorsements","Research metadata or abstracts alone do not verify each claim"],
 alternatives:["Improve existing approach","Test a different intervention","Retain current state pending evidence"],
 tasks:phases.map(([id,title,why,success])=>({id,phase:id,title,why,success,owner:"Unassigned",due:null,done:false,evidence:"",review:null})),
 metrics:[
 {id:"evidence",label:"Priority claims independently checked",baseline:"Unknown",target:"100",observed:"",unit:"%",verified:false},
 {id:"delivery",label:"Planned milestones completed and accepted",baseline:"0",target:"100",observed:"0",unit:"%",verified:false},
 {id:"impact",label:"Primary outcome improvement over baseline",baseline:"Not established",target:"To be agreed",observed:"",unit:"Defined by user",verified:false},
 {id:"adoption",label:"Intended users successfully completing the key task",baseline:"Not established",target:"To be agreed",observed:"",unit:"%",verified:false},
 {id:"sustain",label:"Postimplementation outcome sustained",baseline:"Not established",target:"To be agreed",observed:"",unit:"Review cycles",verified:false}
 ],nextReview:"Not scheduled",progressNotes:[],evidenceLevel:status,version:1};
}
export function validatePlaybook(value:unknown):value is Playbook{
 if(!value||typeof value!=="object")return false;
 const x=value as Record<string,unknown>;
 if(typeof x.objective!=="string"||x.objective.length>3000||typeof x.decision!=="string"||x.decision.length>2000)return false;
 if(!Array.isArray(x.tasks)||x.tasks.length>35||!Array.isArray(x.metrics)||x.metrics.length>25||!Array.isArray(x.progressNotes)||x.progressNotes.length>80)return false;
 if(!x.tasks.every(t=>t&&typeof t==="object"&&typeof t.id==="string"&&typeof t.title==="string"&&t.title.length<500&&typeof t.done==="boolean"&&typeof t.evidence==="string"&&t.evidence.length<=2000&&typeof t.owner==="string"&&t.owner.length<150&&typeof t.success==="string"&&t.success.length<800))return false;
 if(!x.metrics.every(m=>m&&typeof m==="object"&&typeof m.id==="string"&&typeof m.label==="string"&&m.label.length<200&&typeof m.observed==="string"&&m.observed.length<250&&typeof m.target==="string"&&m.target.length<250&&typeof m.verified==="boolean"))return false;
 return typeof x.nextReview==="string"&&x.nextReview.length<80&&x.progressNotes.every(v=>typeof v==="string"&&v.length<=1000);
}
export function summarizeProgress(p:Playbook){
 const completed=p.tasks.filter(t=>t.done).length;
 const accepted=p.metrics.filter(m=>m.verified).length;
 const unknown=p.metrics.filter(m=>!m.verified).length;
 return {completed,total:p.tasks.length,percentage:p.tasks.length?Math.round(100*completed/p.tasks.length):0,measuresVerified:accepted,measuresUnverified:unknown,reviewDue:p.nextReview};
}

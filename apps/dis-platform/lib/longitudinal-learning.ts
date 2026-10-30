/**
 * DIS longitudinal learning: snapshots of user-observed changes, not an adaptive
 * model training store or a scientifically validated impact measure.
 *
 * One canonical case event per successful case revision. PostgreSQL RLS controls
 * tenant access. The server timestamps and versions each event; human review
 * controls whether any prospective strategy becomes an authorized intervention.
 */
import type {Playbook} from "./decision-playbook";

export type LearningReflection={
 knowledge:string;
 skills:string;
 strategy:string;
 nextExperiment:string;
};
export type LearningCheckpoint={
 kind:"DIS_LONGITUDINAL_CHECKPOINT_V1";
 caseVersion:number;
 recordedAt:string;
 evidenceState:"USER_REPORTED_UNVERIFIED";
 learningMode:"RETROSPECTIVE_AND_PROSPECTIVE";
 summary:{
  measuresDefined:number;
  measuresObserved:number;
  observedWithSource:number;
  observedWithDate:number;
  selfAttested:number;
  ownedTasks:number;
  tasksWithRecordedCompletion:number;
  completedWithEvidence:number;
  tasksTotal:number;
  reviewScheduled:boolean;
 };
 metrics:Array<{
  id:string;
  label:string;
  baseline:string;
  target:string;
  observed:string;
  unit:string;
  source:string;
  observedAt:string;
  sourceState:"SELF_ATTESTED_NOT_INDEPENDENTLY_VERIFIED"|"USER_REPORTED_UNVERIFIED";
 }>;
 reflection:LearningReflection;
 nextReview:string;
 assurance:string;
};
export type CaseLearningEvent={
 id:string;
 event_type:string;
 created_at:string;
 payload:unknown;
};
export type MetricChange={
 id:string;
 label:string;
 unit:string;
 first:{value:string;recordedAt:string};
 latest:{value:string;recordedAt:string};
 delta:number|null;
 observations:number;
 evidenceState:"USER_REPORTED_UNVERIFIED";
};

const clean=(value:unknown,max=250)=>typeof value==="string"?value.trim().slice(0,max):"";
const isScheduled=(value:unknown)=>!!clean(value,80)&&!/^(not scheduled|unknown|tbd|none)$/i.test(clean(value,80));
const safeReflection=(value:unknown):LearningReflection=>{
 const v=value&&typeof value==="object"?value as Record<string,unknown>:{};
 return {
  knowledge:clean(v.knowledge,1000),
  skills:clean(v.skills,1000),
  strategy:clean(v.strategy,1000),
  nextExperiment:clean(v.nextExperiment,1000),
 };
};
const evidenceRecorded=(value:string)=>value.trim().length>0;
const numeric=(raw:string):number|null=>{
 const text=raw.trim();
 return /^[-+]?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)$/.test(text)&&Number.isFinite(Number(text))?Number(text):null;
};

/** Process-documentation completeness only. These counts do not certify efficacy or skill. */
export function buildLearningCheckpoint(plan:Playbook,caseVersion:number,recordedAt:string):LearningCheckpoint{
 const metrics=plan.metrics.map(m=>({
  id:clean(m.id,100),label:clean(m.label,200),
  baseline:clean(m.baseline,250),target:clean(m.target,250),
  observed:clean(m.observed,250),unit:clean(m.unit,80),
  source:clean(m.source,500),observedAt:clean(m.observedAt,40),
  sourceState:m.verified?"SELF_ATTESTED_NOT_INDEPENDENTLY_VERIFIED" as const:"USER_REPORTED_UNVERIFIED" as const
 }));
 const observed=metrics.filter(m=>evidenceRecorded(m.observed));
 const completed=plan.tasks.filter(t=>t.done);
 return {
  kind:"DIS_LONGITUDINAL_CHECKPOINT_V1",
  caseVersion,recordedAt,
  evidenceState:"USER_REPORTED_UNVERIFIED",
  learningMode:"RETROSPECTIVE_AND_PROSPECTIVE",
  summary:{
   measuresDefined:metrics.length,
   measuresObserved:observed.length,
   observedWithSource:observed.filter(m=>evidenceRecorded(m.source)).length,
   observedWithDate:observed.filter(m=>evidenceRecorded(m.observedAt)).length,
   selfAttested:observed.filter(m=>m.sourceState==="SELF_ATTESTED_NOT_INDEPENDENTLY_VERIFIED").length,
   ownedTasks:plan.tasks.filter(t=>evidenceRecorded(t.owner)&&t.owner.trim().toLowerCase()!=="unassigned").length,
   tasksWithRecordedCompletion:completed.length,
   completedWithEvidence:completed.filter(t=>evidenceRecorded(t.evidence)).length,
   tasksTotal:plan.tasks.length,
   reviewScheduled:isScheduled(plan.nextReview)
  },
  metrics,
  reflection:safeReflection(plan.learningReview),
  nextReview:clean(plan.nextReview,80),
  assurance:"User-entered measurements, skills and lessons are self-reports. Completion counts are not independently verified outcomes. No causal effect, actual skill gain, strategic superiority or automatic model improvement is established.",
 };
}
export function asLearningCheckpoints(events:CaseLearningEvent[]):LearningCheckpoint[]{
 return events.flatMap(event=>{
  if(event.event_type!=="CHECKPOINT"||!event.payload||typeof event.payload!=="object")return [];
  const p=event.payload as Record<string,unknown>;
  if(p.kind!=="DIS_LONGITUDINAL_CHECKPOINT_V1"||!Array.isArray(p.metrics)||
     typeof p.caseVersion!=="number"||typeof p.recordedAt!=="string"||
     !p.summary||typeof p.summary!=="object")return [];
  return [p as unknown as LearningCheckpoint];
 }).sort((a,b)=>a.caseVersion-b.caseVersion||a.recordedAt.localeCompare(b.recordedAt));
}
/** Only comparable numeric observations with unchanged units can have a numerical delta. */
export function summarizeMetricChanges(events:CaseLearningEvent[]):MetricChange[]{
 const timeline=asLearningCheckpoints(events);
 const byMetric=new Map<string,{label:string;unit:string;points:{value:string;recordedAt:string}[]}>();
 for(const entry of timeline){
  for(const m of entry.metrics){
   if(!m||typeof m.id!=="string"||typeof m.observed!=="string"||!m.observed.trim())continue;
   const prior=byMetric.get(m.id);
   if(!prior){byMetric.set(m.id,{label:m.label,unit:m.unit,points:[{value:m.observed,recordedAt:entry.recordedAt}]});continue;}
   if(prior.unit!==m.unit){prior.unit="";} // changed unit: no meaningful arithmetic
   prior.label=m.label;
   const last=prior.points[prior.points.length-1];
   if(last.value!==m.observed)prior.points.push({value:m.observed,recordedAt:entry.recordedAt});
  }
 }
 return [...byMetric.entries()].map(([id,v])=>{
  const first=v.points[0],latest=v.points[v.points.length-1],a=numeric(first.value),b=numeric(latest.value);
  return {id,label:v.label,unit:v.unit,first,latest,
   delta:v.unit&&a!==null&&b!==null?Math.round((b-a)*10000)/10000:null,
   observations:v.points.length,evidenceState:"USER_REPORTED_UNVERIFIED" as const};
 });
}

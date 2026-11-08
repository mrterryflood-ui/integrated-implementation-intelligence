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
 first:{value:string;recordedAt:string;label:string;unit:string;source:string;observedAt:string};
 latest:{value:string;recordedAt:string;label:string;unit:string;source:string;observedAt:string};
 delta:number|null;
 comparabilityIssues:string[];
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
  if(!["CREATED","CHECKPOINT"].includes(event.event_type)||!event.payload||typeof event.payload!=="object")return [];
  const p=event.payload as Record<string,unknown>;
  if(p.kind!=="DIS_LONGITUDINAL_CHECKPOINT_V1"||!Array.isArray(p.metrics)||
     typeof p.caseVersion!=="number"||typeof p.recordedAt!=="string"||
     !p.summary||typeof p.summary!=="object")return [];
  return [p as unknown as LearningCheckpoint];
 }).sort((a,b)=>a.caseVersion-b.caseVersion||a.recordedAt.localeCompare(b.recordedAt));
}
/** Preserve original context; changing definitions/sources cannot create a numeric trend. */
export function summarizeMetricChanges(events:CaseLearningEvent[]):MetricChange[]{
 const timeline=asLearningCheckpoints(events);
 type Point=MetricChange["first"];
 const byMetric=new Map<string,{label:string;unit:string;source:string;issues:Set<string>;points:Point[]}>();
 for(const entry of timeline){
  for(const m of entry.metrics){
   if(!m||typeof m.id!=="string"||typeof m.observed!=="string"||!m.observed.trim())continue;
   const prior=byMetric.get(m.id);
   const point:Point={value:m.observed,recordedAt:entry.recordedAt,label:clean(m.label,200),unit:clean(m.unit,80),source:clean(m.source,500),observedAt:clean(m.observedAt,40)};
   if(!prior){byMetric.set(m.id,{label:point.label,unit:point.unit,source:point.source,issues:new Set(),points:[point]});continue;}
   if(prior.unit!==point.unit)prior.issues.add("UNIT_CHANGED");
   if(prior.label!==point.label)prior.issues.add("MEASURE_DEFINITION_CHANGED_USE_NEW_ID");
   if(prior.source!==point.source)prior.issues.add("SOURCE_CHANGED_REQUIRES_HARMONIZATION_REVIEW");
   const last=prior.points[prior.points.length-1];
   if(last.value!==point.value||last.label!==point.label||last.unit!==point.unit||last.source!==point.source||last.observedAt!==point.observedAt)prior.points.push(point);
  }
 }
 return [...byMetric.entries()].map(([id,v])=>{
  const first=v.points[0],latest=v.points[v.points.length-1],a=numeric(first.value),b=numeric(latest.value);
  const difference=a!==null&&b!==null?b-a:null;
  if(difference!==null&&!Number.isFinite(difference))v.issues.add("NUMERIC_OVERFLOW");
  return {id,label:v.label,unit:v.unit,first,latest,
   delta:v.unit&&v.issues.size===0&&difference!==null&&Number.isFinite(difference)?Number(difference.toFixed(4)):null,
   comparabilityIssues:[...v.issues],
   observations:v.points.length,evidenceState:"USER_REPORTED_UNVERIFIED" as const};
 });
}

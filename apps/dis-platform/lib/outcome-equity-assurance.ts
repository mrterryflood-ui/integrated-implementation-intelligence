/** Descriptive internal exercise; never a clinical or causal decision engine. */
export type OutcomeCell={group:string;baselineNumerator:number|null;baselineDenominator:number|null;followupNumerator:number|null;followupDenominator:number|null;suppressed:boolean};
export type OutcomeExercise={construct:string;role:"PROCESS"|"BENEFIT"|"HARM";direction:"HIGHER_IS_BETTER"|"LOWER_IS_BETTER";populationFrame:string;baselinePeriod:string;followupPeriod:string;baselineMethod:string;followupMethod:string;sourceUrl:string;cells:OutcomeCell[]};
export type OutcomeAudit={state:"INVALID_INPUT"|"REOPEN_MEASUREMENT"|"SUBGROUP_ADVERSE_SIGNAL"|"PROCESS_ONLY"|"DESCRIPTIVE_REVIEW_REQUIRED";issues:string[];groupChanges:{group:string;baseline:number;followup:number;change:number;benefitDirectionChange:number}[];overallChange:number|null;absoluteGapChange:number|null;equitableSuccessEstablished:false;causalEffectEstablished:false};
const obj=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==="object"&&!Array.isArray(x);
const text=(x:unknown)=>typeof x==="string"&&x.trim().length>0&&x.length<=700;
const https=(x:unknown)=>{try{const u=new URL(String(x));return u.protocol==="https:"&&!u.username&&!u.password;}catch{return false;}};
export function reviewOutcomeEquity(input:unknown):OutcomeAudit{
 const result:OutcomeAudit={state:"INVALID_INPUT",issues:[],groupChanges:[],overallChange:null,absoluteGapChange:null,equitableSuccessEstablished:false,causalEffectEstablished:false};
 if(!obj(input)){result.issues.push("An aggregate outcome record is required.");return result;}
 const keys=["construct","role","direction","populationFrame","baselinePeriod","followupPeriod","baselineMethod","followupMethod","sourceUrl","cells"];
 if(Object.keys(input).some(k=>!keys.includes(k)))result.issues.push("Unrecognized field; no identifiers or private record fields permitted.");
 for(const k of ["construct","populationFrame","baselinePeriod","followupPeriod","baselineMethod","followupMethod"])if(!text(input[k]))result.issues.push(k+" must identify the actual source definition.");
 if(!["PROCESS","BENEFIT","HARM"].includes(String(input.role)))result.issues.push("Outcome role is required.");
 if(!["HIGHER_IS_BETTER","LOWER_IS_BETTER"].includes(String(input.direction)))result.issues.push("Benefit direction is required.");
 if(!https(input.sourceUrl))result.issues.push("A traceable HTTPS source is required.");
 if(!Array.isArray(input.cells)||input.cells.length<2||input.cells.length>20){result.issues.push("Two to twenty mutually exclusive, source-authorized aggregate groups are required.");return result;}
 const seen=new Set<string>();
 for(const cell of input.cells){
  if(!obj(cell)){result.issues.push("Invalid group record.");continue;}
  const allowed=["group","baselineNumerator","baselineDenominator","followupNumerator","followupDenominator","suppressed"];
  if(Object.keys(cell).some(k=>!allowed.includes(k)))result.issues.push("Unexpected group field.");
  const id=typeof cell.group==="string"?cell.group.trim():"";
  if(!id||seen.has(id)||id.length>100)result.issues.push("Group identifiers must be unique, non-identifying labels.");
  seen.add(id);
  if(cell.suppressed!==false){result.issues.push("Suppressed or undisclosed group: no reconstruction or zero substitution.");continue;}
  for(const p of ["baseline","followup"]){
   const n=cell[p+"Numerator"],d=cell[p+"Denominator"];
   if(typeof n!=="number"||typeof d!=="number"||!Number.isSafeInteger(n)||!Number.isSafeInteger(d)||n<0||d<=0||n>d)result.issues.push("Each proportion requires integer numerator and positive eligible denominator.");
  }
 }
 if(result.issues.length)return result;
 const x=input as unknown as OutcomeExercise;
 if(x.baselineMethod!==x.followupMethod||x.baselinePeriod===x.followupPeriod){
  result.state="REOPEN_MEASUREMENT";result.issues.push("Changed measurement definition or identical periods: re-examine the decision before arithmetic.");return result;
 }
 let bn=0,bd=0,fn=0,fd=0;
 const sign=x.direction==="HIGHER_IS_BETTER"?1:-1;
 for(const c of x.cells){
  const b=100*c.baselineNumerator!/c.baselineDenominator!,f=100*c.followupNumerator!/c.followupDenominator!;
  result.groupChanges.push({group:c.group,baseline:b,followup:f,change:f-b,benefitDirectionChange:sign*(f-b)});
  bn+=c.baselineNumerator!;bd+=c.baselineDenominator!;fn+=c.followupNumerator!;fd+=c.followupDenominator!;
 }
 result.overallChange=100*fn/fd-100*bn/bd;
 const before=result.groupChanges.map(c=>c.baseline),after=result.groupChanges.map(c=>c.followup);
 result.absoluteGapChange=(Math.max(...after)-Math.min(...after))-(Math.max(...before)-Math.min(...before));
 if(result.groupChanges.some(c=>c.benefitDirectionChange<0)){
  result.state="SUBGROUP_ADVERSE_SIGNAL";result.issues.push("At least one group moves in an adverse direction, even if the aggregate improves. Investigate uncertainty, composition, harm and mechanism.");
 }else result.state=x.role==="PROCESS"?"PROCESS_ONLY":"DESCRIPTIVE_REVIEW_REQUIRED";
 if(x.role==="PROCESS")result.issues.push("Process completion does not establish beneficiary benefit.");
 if(result.absoluteGapChange>0)result.issues.push("The descriptive absolute between-group gap widens; this is not adjusted or causal inequity attribution.");
 result.issues.push("Open cohorts and changed composition can alter these proportions. No confidence interval, causal identification, minimum clinically meaningful effect or independent outcome adjudication was performed.");
 return result;
}
export const SYNTHETIC_EQUITY_EXERCISE:OutcomeExercise={construct:"Synthetic service completion",role:"PROCESS",direction:"HIGHER_IS_BETTER",populationFrame:"Synthetic disjoint groups, not actual patients",baselinePeriod:"Synthetic baseline",followupPeriod:"Synthetic follow-up",baselineMethod:"Fixed synthetic eligibility",followupMethod:"Fixed synthetic eligibility",sourceUrl:"https://example.org/synthetic-not-real-data",cells:[{group:"Group A (synthetic)",baselineNumerator:50,baselineDenominator:100,followupNumerator:80,followupDenominator:100,suppressed:false},{group:"Group B (synthetic)",baselineNumerator:50,baselineDenominator:100,followupNumerator:40,followupDenominator:100,suppressed:false}]};

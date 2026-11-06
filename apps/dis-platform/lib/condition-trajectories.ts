/**
 * DIS × RPLICE: source-qualified annual trajectory preflight.
 * Descriptive analysis of operator-supplied PUBLIC AGGREGATES only.
 * This module does not ingest registries, verify uploaded citations, infer
 * individual risk, estimate causality or call an external MCP method.
 */
export const TRAJECTORY_CONDITIONS=[
 "COLORECTAL_CANCER","LUNG_CANCER","BREAST_CANCER",
 "ENDOMETRIOSIS","PCOS","UTERINE_FIBROIDS"
] as const;
export type TrajectoryCondition=typeof TRAJECTORY_CONDITIONS[number];
export const TRAJECTORY_MEASURES=[
 "ALL_STAGE_INCIDENCE","LATE_STAGE_INCIDENCE","LATE_STAGE_CASE_SHARE",
 "MORTALITY","EVER_DIAGNOSED_PERCENT"
] as const;
export type TrajectoryMeasure=typeof TRAJECTORY_MEASURES[number];
export const TRAJECTORY_PUBLIC_SOURCES=[
 "cdc-uscs","nci-scp","brfss","state-registry","nchs-nsfg-2022-2023"
] as const;
export type TrajectorySource=typeof TRAJECTORY_PUBLIC_SOURCES[number];
export type AnnualObservation={
 condition:TrajectoryCondition;
 geography:string;
 geographyLevel:"STATE"|"NATION";
 measure:TrajectoryMeasure;
 periodStartYear:number;
 periodEndYear:number;
 value:number|null;
 reporting:"OBSERVED"|"SUPPRESSED"|"MISSING";
 unit:"PER_100K"|"PERCENT";
 sourceId:TrajectorySource;
 sourceVersion:string;
 populationDefinition:string;
 numeratorDefinition:string;
 denominatorDefinition:string;
 sex:"ALL"|"FEMALE"|"MALE";
 raceEthnicity:string;
 ageStandard:string;
 stageDefinition:string;
 ascertainment:string;
 confidenceInterval?:readonly [number,number]|null;
};
export type TrajectorySeries={
 condition:TrajectoryCondition;geography:string;geographyLevel:"STATE"|"NATION";
 measure:TrajectoryMeasure;sourceId:TrajectorySource;
 status:"DESCRIPTIVE_SERIES_ONLY"|"INSUFFICIENT_ANNUAL_DATA"|"NONCOMPARABLE_DEFINITIONS";
 years:number[];points:number;missingYears:number[];
 slopePerYear:number|null;firstValue:number|null;lastValue:number|null;
 percentChange:number|null;
 reasons:string[];
};
export type TrajectoryReview={
 schema:"dis-chainweb-annual-trajectory-preflight-v1";
 status:"INPUT_INVALID"|"NO_ANNUAL_OBSERVATIONS"|"DESCRIPTIVE_ONLY"|"INSUFFICIENT_EVIDENCE";
 sourceVerification:"OPERATOR_SUPPLIED_NOT_INDEPENDENTLY_REPRODUCED";
 causalAttribution:"NOT_ESTABLISHED";
 methodExecution:"HUMAN_SELECTION_SEPARATE_NO_REMOTE_CALL";
 conclusionsMayBeAppliedToIndividuals:false;
 series:TrajectorySeries[];
 issues:string[];
};

const own=(value:unknown):value is Record<string,unknown>=>Boolean(value)&&typeof value==="object"&&!Array.isArray(value);
const isNonempty=(x:unknown)=>typeof x==="string"&&x.trim().length>=2&&x.length<=320;
const includes=(xs:readonly string[],x:unknown)=>typeof x==="string"&&xs.includes(x);
const fixed=(n:number)=>Math.round(n*10000)/10000;
const STRINGS=["geography","sourceVersion","populationDefinition","numeratorDefinition",
 "denominatorDefinition","raceEthnicity","ageStandard","stageDefinition","ascertainment"] as const;
const FINGERPRINT=["unit","sourceId","sourceVersion","populationDefinition",
 "numeratorDefinition","denominatorDefinition","sex","raceEthnicity","ageStandard",
 "stageDefinition","ascertainment"] as const;
const FORBIDDEN_FIELDS=["patientId","personId","dob","dateOfBirth","patientName",
 "patient","firstName","lastName","address","email","ssn","medicalRecordNumber"] as const;
const MAX_ROWS=1200;
const EMPTY={
 schema:"dis-chainweb-annual-trajectory-preflight-v1",
 sourceVerification:"OPERATOR_SUPPLIED_NOT_INDEPENDENTLY_REPRODUCED",
 causalAttribution:"NOT_ESTABLISHED",
 methodExecution:"HUMAN_SELECTION_SEPARATE_NO_REMOTE_CALL",
 conclusionsMayBeAppliedToIndividuals:false
} as const;

export function reviewAnnualTrajectories(data:unknown):TrajectoryReview{
 const issues:string[]=[];
 const finish=(status:TrajectoryReview["status"],series:TrajectorySeries[]=[]):TrajectoryReview=>
  ({...EMPTY,status,series,issues});
 if(!Array.isArray(data)||data.length>MAX_ROWS){
  issues.push("Provide a JSON array of at most 1200 public aggregate annual observations.");
  return finish("INPUT_INVALID");
 }
 if(data.length===0){
  issues.push("The NCI 2019–2023 five-year state snapshot and the 2022–2023 NSFG survey are not annual trajectory points. Independently sourced annual records are still required.");
  return finish("NO_ANNUAL_OBSERVATIONS");
 }
 const observations:AnnualObservation[]=[];
 for(let i=0;i<data.length;i++){
  const x=data[i];
  if(!own(x)){issues.push("Row "+(i+1)+": expected an aggregate observation object.");continue;}
  if(FORBIDDEN_FIELDS.some(field=>field in x)){
   issues.push("Row "+(i+1)+": individual identifiers are not permitted. Import public aggregates only.");continue;
  }
  const validLabels=includes(TRAJECTORY_CONDITIONS,x.condition) &&
   includes(TRAJECTORY_MEASURES,x.measure) &&
   includes(["STATE","NATION"],x.geographyLevel) &&
   includes(["OBSERVED","SUPPRESSED","MISSING"],x.reporting) &&
   includes(["PER_100K","PERCENT"],x.unit) &&
   includes(TRAJECTORY_PUBLIC_SOURCES,x.sourceId) &&
   includes(["ALL","FEMALE","MALE"],x.sex) &&
   STRINGS.every(key=>isNonempty(x[key]));
  if(!validLabels){issues.push("Row "+(i+1)+": missing or unrecognized measure, source, population, group, geography or definition.");continue;}
  const a=x as AnnualObservation;
  const annual=Number.isInteger(a.periodStartYear)&&Number.isInteger(a.periodEndYear) &&
    a.periodStartYear>=1990&&a.periodEndYear<=2026&&a.periodStartYear===a.periodEndYear;
  if(!annual){
   issues.push("Row "+(i+1)+": only a single observed calendar year is allowed; pooled multi-year values cannot be relabeled as yearly data.");continue;
  }
  if(a.sourceId==="nchs-nsfg-2022-2023"){
   issues.push("Row "+(i+1)+": the registered NSFG 2022–2023 survey supplies pooled estimates, not independent annual observations.");continue;
  }
  if(a.measure.endsWith("_PERCENT")||a.measure==="LATE_STAGE_CASE_SHARE"){
   if(a.unit!=="PERCENT"){issues.push("Row "+(i+1)+": prevalence/share must use a percent denominator.");continue;}
  }else if(a.unit!=="PER_100K"){
   issues.push("Row "+(i+1)+": population incidence/mortality requires cases or deaths per 100,000.");continue;
  }
  const observed=a.reporting==="OBSERVED";
  if((observed&& (typeof a.value!=="number"||!Number.isFinite(a.value)||a.value<0||
      (a.unit==="PERCENT"&&a.value>100)))||(!observed&&a.value!==null)){
   issues.push("Row "+(i+1)+": observed value must be finite and valid; missing/suppressed values must be null, never imputed to zero.");continue;
  }
  if(a.confidenceInterval!==undefined&&a.confidenceInterval!==null){
   const ci=a.confidenceInterval;
   if(!observed||!Array.isArray(ci)||ci.length!==2||
     ci.some((n:unknown)=>typeof n!=="number"||!Number.isFinite(n)||n<0)||
     ci[0]>a.value!||ci[1]<a.value!||ci[0]>ci[1]){
    issues.push("Row "+(i+1)+": invalid confidence interval or interval on a suppressed value.");continue;
   }
  }
  if(a.geography.includes("|")||a.geography.includes("\n")){
   issues.push("Row "+(i+1)+": geography label contains a forbidden separator.");continue;
  }
  observations.push(a);
 }
 if(issues.length)return finish("INPUT_INVALID");
 const groups=new Map<string,AnnualObservation[]>();
 for(const x of observations){
  const key=[x.condition,x.geographyLevel,x.geography,x.measure].join("|");
  groups.set(key,[...(groups.get(key)||[]),x]);
 }
 const series:TrajectorySeries[]=[];
 for(const rows of groups.values()){
  const first=rows[0],sorted=[...rows].sort((a,b)=>a.periodStartYear-b.periodStartYear);
  const years=sorted.map(x=>x.periodStartYear);
  const reasons:string[]=[];
  const definitionMismatch=sorted.some(r=>FINGERPRINT.some(k=>r[k]!==first[k]));
  if(definitionMismatch)reasons.push("Numerator, denominator, population, source vintage, ascertainment, subgroup or standard changed; investigate a documented crosswalk before estimating a trajectory.");
  if(new Set(years).size!==years.length)reasons.push("Duplicate year for the same condition, geography and measure.");
  const missingYears:number[]=[];
  for(let y=years[0];y<=years[years.length-1];y++)if(!years.includes(y))missingYears.push(y);
  if(missingYears.length)reasons.push("Missing calendar years prevent an uninterrupted annual series.");
  if(sorted.some(x=>x.reporting!=="OBSERVED"))reasons.push("Suppressed or missing measures cannot be treated as observed zeros.");
  if(sorted.length<5)reasons.push("At least five distinct consecutive annual observations are required for descriptive trend estimation.");
  const incompatible=definitionMismatch||new Set(years).size!==years.length;
  const ready=reasons.length===0;
  const slope=ready?(()=>{
   const ys=sorted.map(x=>x.value as number);
   const mx=years.reduce((s,n)=>s+n,0)/years.length;
   const my=ys.reduce((s,n)=>s+n,0)/ys.length;
   const den=years.reduce((s,n)=>s+(n-mx)**2,0);
   return fixed(years.reduce((s,n,i)=>s+(n-mx)*(ys[i]-my),0)/den);
  })():null;
  const start=ready?sorted[0].value:null,end=ready?sorted[sorted.length-1].value:null;
  series.push({condition:first.condition,geography:first.geography,geographyLevel:first.geographyLevel,
   measure:first.measure,sourceId:first.sourceId,
   status:ready?"DESCRIPTIVE_SERIES_ONLY":incompatible?"NONCOMPARABLE_DEFINITIONS":"INSUFFICIENT_ANNUAL_DATA",
   years,points:sorted.length,missingYears,slopePerYear:slope,firstValue:start,lastValue:end,
   percentChange:ready&&start!==null&&start!==0&&end!==null?fixed(100*(end-start)/start):null,reasons});
 }
 series.sort((a,b)=>a.condition.localeCompare(b.condition)||a.geography.localeCompare(b.geography));
 const readyCount=series.filter(s=>s.status==="DESCRIPTIVE_SERIES_ONLY").length;
 if(!readyCount)issues.push("No comparable five-year annual series is ready. The current pooled snapshots cannot support trajectory claims.");
 else issues.push("These are descriptive trends in submitted aggregate measurements, NOT independently reproduced datasets, disease causation, statistical significance or validated interventional effects.");
 if(series.some(s=>s.status!=="DESCRIPTIVE_SERIES_ONLY"))issues.push("Unready series remain visible; do not silently drop unknown, suppressed, mismatched or sparse years.");
 return finish(readyCount?"DESCRIPTIVE_ONLY":"INSUFFICIENT_EVIDENCE",series);
}

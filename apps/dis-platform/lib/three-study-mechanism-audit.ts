/** Mechanism-discrimination contracts for the three internal research studies.
 * These are mathematical demonstrations and review gates, not causal estimators.
 */
export type StageFlow={incidentDiagnoses:number;stagedDiagnoses:number;lateStageDiagnoses:number};
export function stageFlowAudit(x:StageFlow){
 const valid=Object.values(x).every(v=>Number.isSafeInteger(v)&&v>=0)&&x.lateStageDiagnoses<=x.stagedDiagnoses&&x.stagedDiagnoses<=x.incidentDiagnoses&&x.incidentDiagnoses>0;
 if(!valid)return {status:"INVALID" as const,lateAmongStaged:null,stagingCompleteness:null,lateAmongAll:null,warning:"Invalid or unbounded stage counts."};
 return {status:"DESCRIPTIVE_ONLY" as const,lateAmongStaged:x.stagedDiagnoses?x.lateStageDiagnoses/x.stagedDiagnoses:null,stagingCompleteness:x.stagedDiagnoses/x.incidentDiagnoses,lateAmongAll:x.lateStageDiagnoses/x.incidentDiagnoses,warning:"Different denominators produce different shares. Unstaged cases may have unknown stage; late among all is not an unbiased true late-stage proportion."};
}
export type AgeCell={ageBand:string;cases:number;personYears:number;standardWeight:number};
export function ageStandardizedIncidence(cells:readonly AgeCell[]){
 if(!cells.length||new Set(cells.map(c=>c.ageBand)).size!==cells.length||cells.some(c=>!Number.isFinite(c.cases)||!Number.isFinite(c.personYears)||!Number.isFinite(c.standardWeight)||c.cases<0||c.personYears<=0||c.standardWeight<0||c.cases>c.personYears))return {status:"INVALID" as const,per100k:null};
 const sum=cells.reduce((a,c)=>a+c.standardWeight,0);
 if(Math.abs(sum-1)>1e-8)return {status:"INVALID" as const,per100k:null};
 return {status:"ARITHMETIC_ONLY" as const,per100k:100000*cells.reduce((a,c)=>a+c.standardWeight*c.cases/c.personYears,0)};
}
export type CorrelationCell={unitId:string;x:number;y:number;period:string;sourceVersion:string};
export function pairedCorrelationAudit(rows:readonly CorrelationCell[]){
 const issues:string[]=[];if(rows.length<5)issues.push("At least five paired units required for exploratory correlation");
 if(new Set(rows.map(r=>r.unitId)).size!==rows.length)issues.push("Duplicate geographic unit");
 if(rows.some(r=>!Number.isFinite(r.x)||!Number.isFinite(r.y)))issues.push("Nonfinite measurement");
 if(new Set(rows.map(r=>r.period)).size!==1||new Set(rows.map(r=>r.sourceVersion)).size!==1)issues.push("Unharmonized period or source release");
 if(issues.length)return {status:"MEASUREMENT_BLOCK" as const,pearson:null,issues};
 const mx=rows.reduce((s,r)=>s+r.x,0)/rows.length,my=rows.reduce((s,r)=>s+r.y,0)/rows.length;
 const dx=rows.map(r=>r.x-mx),dy=rows.map(r=>r.y-my);
 const xx=dx.reduce((s,v)=>s+v*v,0),yy=dy.reduce((s,v)=>s+v*v,0);
 if(xx<=0||yy<=0)return {status:"MEASUREMENT_BLOCK" as const,pearson:null,issues:["Zero variance"]};
 const r=dx.reduce((s,v,i)=>s+v*dy[i],0)/Math.sqrt(xx*yy);
 return {status:"DESCRIPTIVE_ONLY" as const,pearson:r,issues:["Ecological correlation does not establish shared mechanism or individual-level association.","No uncertainty, confounding, missingness or spatial dependence review performed."]};
}
export type MechanismRecord={id:string;observationId:string;proposedMechanism:string;rivalMechanism:string;discriminatingEvidence:string;possibleConfounders:string[];wouldDisconfirm:string;reviewStatus:"NOT_TESTED"|"SUPPORTED_DESCRIPTIVELY"|"CONTRADICTED"|"INDETERMINATE";independentReviewerVerified:boolean};
export function assessMechanism(m:MechanismRecord){
 const complete=[m.id,m.observationId,m.proposedMechanism,m.rivalMechanism,m.discriminatingEvidence,m.wouldDisconfirm].every(v=>typeof v==="string"&&v.trim().length>0)&&Array.isArray(m.possibleConfounders);
 return {status:!complete?"INVALID":m.reviewStatus==="NOT_TESTED"?"UNTESTED":"REVIEW_REQUIRED",causalMechanismEstablished:false,independentVerificationRecorded:complete&&m.independentReviewerVerified,needs:["Actual discriminating observation","Confounder assessment","Independent review of original source and methods","Causal design where an effect is claimed"]};
}

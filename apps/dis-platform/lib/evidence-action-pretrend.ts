/**
 * Descriptive pre-intervention diagnostics, not an inferential parallel-trends test.
 * References: Roth (2022), doi:10.1257/aeri.20210236; Rambachan & Roth (2023),
 * doi:10.1093/restud/rdad018. Equal observed slopes cannot establish the unobserved
 * untreated post-intervention counterfactual. No universal acceptance threshold.
 * Pure, bounded, network-free; accepts untrusted JSON and never imputes missingness.
 */
export type PretrendPoint = {year:number; treated:number; comparator:number; gap:number};
export type PretrendDiagnostics = {
 schema:"dis-descriptive-pretrend-v1";
 state:"INVALID_PANEL"|"INSUFFICIENT_PREPERIODS"|"DESCRIPTIVE_DIAGNOSTICS_ONLY";
 errors:string[]; warnings:string[]; unit:string|null;
 matchedPreYears:number[]; unmatchedPreYears:{treatedOnly:number[];comparatorOnly:number[]};
 points:PretrendPoint[];
 treatedSlopePerYear:number|null; comparatorSlopePerYear:number|null; gapSlopePerYear:number|null;
 gapRange:number|null; endpointGapChange:number|null; maxAbsAdjacentGapChangePerYear:number|null;
 linearGapResidualRms:number|null;
 statisticalTestPerformed:false; parallelTrendsEstablished:false; causalEffectEstablished:false;
};
const object=(x:unknown):x is Record<string,unknown>=>Boolean(x)&&typeof x==="object"&&!Array.isArray(x);
const year=(x:unknown):x is number=>typeof x==="number"&&Number.isInteger(x)&&x>=1900&&x<=2200;
const finite=(x:unknown):x is number=>typeof x==="number"&&Number.isFinite(x);
const empty=():PretrendDiagnostics=>({schema:"dis-descriptive-pretrend-v1",state:"INVALID_PANEL",
 errors:[],warnings:[],unit:null,matchedPreYears:[],unmatchedPreYears:{treatedOnly:[],comparatorOnly:[]},
 points:[],treatedSlopePerYear:null,comparatorSlopePerYear:null,gapSlopePerYear:null,
 gapRange:null,endpointGapChange:null,maxAbsAdjacentGapChangePerYear:null,linearGapResidualRms:null,
 statisticalTestPerformed:false,parallelTrendsEstablished:false,causalEffectEstablished:false});

/** Annual values stay on their declared scale; denominators are checked, not pooled. */
export function diagnosePretrends(input:unknown):PretrendDiagnostics{
 const out=empty();
 if(!object(input)){out.errors.push("PANEL_OBJECT_REQUIRED");return out;}
 if(!year(input.interventionYear)){out.errors.push("INTERVENTION_YEAR_INVALID");return out;}
 if(typeof input.unit!=="string"||!input.unit.trim()||input.unit.length>200){out.errors.push("UNIT_REQUIRED");return out;}
 out.unit=input.unit.trim();
 const intervention=input.interventionYear;
 const read=(raw:unknown,label:string)=>{
  const map=new Map<number,number>();
  if(!object(raw)||!Array.isArray(raw.observations)){out.errors.push(label+":OBSERVATIONS_REQUIRED");return map;}
  if(raw.observations.length>200){out.errors.push(label+":OBSERVATION_LIMIT_EXCEEDED");return map;}
  const seen=new Set<number>();
  for(const row of raw.observations){
   if(!object(row)||!year(row.year)){out.errors.push(label+":ROW_OR_YEAR_INVALID");continue;}
   if(seen.has(row.year)){out.errors.push(label+":DUPLICATE_YEAR");continue;}
   seen.add(row.year);
   if(!finite(row.value)){out.errors.push(label+":MISSING_OR_NONFINITE_VALUE");continue;}
   if(!finite(row.denominator)||row.denominator<=0){out.errors.push(label+":DENOMINATOR_REQUIRED");continue;}
   if(row.year<intervention)map.set(row.year,row.value);
  }
  return map;
 };
 const treated=read(input.treated,"TREATED"),control=read(input.comparator,"COMPARATOR");
 if(out.errors.length)return out;
 const sorted=(items:Iterable<number>)=>[...items].sort((a,b)=>a-b);
 out.matchedPreYears=sorted([...treated.keys()].filter(y=>control.has(y)));
 out.unmatchedPreYears={treatedOnly:sorted([...treated.keys()].filter(y=>!control.has(y))),
  comparatorOnly:sorted([...control.keys()].filter(y=>!treated.has(y)))};
 if(out.unmatchedPreYears.treatedOnly.length||out.unmatchedPreYears.comparatorOnly.length)
  out.warnings.push("UNMATCHED_PREPERIODS_NOT_IMPUTED");
 if(out.matchedPreYears.length<3){
  out.state="INSUFFICIENT_PREPERIODS";out.errors.push("THREE_COMMON_PREPERIODS_REQUIRED_BY_LOCAL_SCREEN_NOT_A_VALIDITY_STANDARD");return out;
 }
 out.points=out.matchedPreYears.map(y=>({year:y,treated:treated.get(y)!,comparator:control.get(y)!,gap:treated.get(y)!-control.get(y)!}));
 if(out.points.some(p=>!Number.isFinite(p.gap))){out.points=[];out.errors.push("NUMERIC_OVERFLOW");return out;}
 const n=out.points.length,mean=(v:number[])=>v.reduce((a,b)=>a+b/n,0);
 const xs=out.matchedPreYears.map(y=>y-out.matchedPreYears[0]),mx=mean(xs),dx=xs.map(x=>x-mx);
 const xx=dx.reduce((a,b)=>a+b*b,0);
 const slope=(ys:number[])=>{const my=mean(ys);return dx.reduce((a,x,i)=>a+x*(ys[i]-my),0)/xx;};
 const t=out.points.map(p=>p.treated),c=out.points.map(p=>p.comparator),g=out.points.map(p=>p.gap);
 const ts=slope(t),cs=slope(c),gs=slope(g),gm=mean(g);
 const residuals=g.map((v,i)=>v-gm-gs*dx[i]);
 const rms=Math.sqrt(mean(residuals.map(v=>v*v)));
 const range=Math.max(...g)-Math.min(...g),change=g[n-1]-g[0];
 const adjacent=g.slice(1).map((v,i)=>Math.abs((v-g[i])/(xs[i+1]-xs[i])));
 const maxAdjacent=Math.max(...adjacent);
 if(![ts,cs,gs,rms,range,change,maxAdjacent].every(Number.isFinite)){
  out.points=[];out.errors.push("NUMERIC_OVERFLOW");return out;
 }
 out.state="DESCRIPTIVE_DIAGNOSTICS_ONLY";
 Object.assign(out,{treatedSlopePerYear:ts,comparatorSlopePerYear:cs,gapSlopePerYear:gs,
  gapRange:range,endpointGapChange:change,maxAbsAdjacentGapChangePerYear:maxAdjacent,linearGapResidualRms:rms});
 // This tolerance guards arithmetic roundoff ONLY. It is not a practical margin,
 // equivalence bound, clinical threshold, p-value or scientific acceptance rule.
 const tolerance=Number.EPSILON*128*Math.max(1,...t.map(Math.abs),...c.map(Math.abs));
 if(range>tolerance)out.warnings.push("OBSERVED_PREPERIOD_GAP_VARIES_REVIEW_MAGNITUDE_AND_UNCERTAINTY");
 if(rms>tolerance)out.warnings.push("LINEAR_SLOPE_DOES_NOT_CAPTURE_ALL_PREPERIOD_PATTERN");
 if(out.matchedPreYears.slice(1).some((y,i)=>y-out.matchedPreYears[i]!==1))
  out.warnings.push("NONANNUAL_SPACING_PRESERVED_IN_SLOPE");
 out.warnings.push("NO_P_VALUE_OR_CAUSAL_ACCEPTANCE_FROM_AGGREGATE_PREPERIODS",
  "CONSTANT_OBSERVED_GAP_DOES_NOT_PROVE_PARALLEL_UNTREATED_POST_TRENDS");
 return out;
}

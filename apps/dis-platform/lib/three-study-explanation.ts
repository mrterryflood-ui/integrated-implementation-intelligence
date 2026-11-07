/** DIS: measurement-aware explanation engine. Public aggregate evidence only.
 * Does not estimate causal effects, diagnosis, prevalence or clinical benefit.
 */
export type EvidenceClass="PUBLISHED_AGGREGATE"|"DERIVED_ARITHMETIC"|"HYPOTHESIS"|"UNVERIFIED";
export type Construct="AGE_ADJUSTED_LATE_STAGE_INCIDENCE"|"LATE_STAGE_CASE_SHARE"|"ANNUAL_LATE_STAGE_COUNT"|"EVER_DIAGNOSED_SURVEY_SHARE"|"AGE_ADJUSTED_ALL_STAGE_INCIDENCE";
export type Observation={id:string;study:"CRC_COUNTIES"|"THREE_CANCER"|"GYNECOLOGIC_DIAGNOSIS";condition:string;geography:string;population:string;period:string;construct:Construct;value:number;unit:string;sourceUrl:string;sourceVersion:string;evidence:EvidenceClass;denominator:string;ci95?:[number,number]};
export type Explanation={id:string;study:string;observationIds:string[];finding:string;canConclude:string[];cannotConclude:string[];hypotheses:{mechanism:string;alternative:string;discriminatingEvidence:string}[];gaps:string[];status:"DESCRIPTIVE_ONLY"|"MEASUREMENT_BLOCK"};
const allowed:Record<Construct,{unit:string;min:number;max:number}>={
 AGE_ADJUSTED_LATE_STAGE_INCIDENCE:{unit:"per_100k",min:0,max:100000},
 LATE_STAGE_CASE_SHARE:{unit:"percent",min:0,max:100},
 ANNUAL_LATE_STAGE_COUNT:{unit:"cases_per_year",min:0,max:10000000},
 EVER_DIAGNOSED_SURVEY_SHARE:{unit:"percent",min:0,max:100},
 AGE_ADJUSTED_ALL_STAGE_INCIDENCE:{unit:"per_100k",min:0,max:100000}
};
export function validateObservation(x:Observation):string[]{
 const issues:string[]=[];if(!x||typeof x!=="object")return ["Observation missing"];
 for(const k of ["id","study","condition","geography","population","period","construct","unit","sourceUrl","sourceVersion","denominator"] as const)if(typeof x[k]!=="string"||!x[k].trim())issues.push(k+" required");
 const rule=allowed[x.construct];if(!rule)issues.push("Unrecognized construct");else if(x.unit!==rule.unit)issues.push("Unit mismatches construct");
 if(!Number.isFinite(x.value)||!rule||x.value<rule.min||x.value>rule.max)issues.push("Value outside construct range");
 if(!["PUBLISHED_AGGREGATE","DERIVED_ARITHMETIC","HYPOTHESIS","UNVERIFIED"].includes(x.evidence))issues.push("Invalid evidence class");
 try{const u=new URL(x.sourceUrl);if(u.protocol!=="https:"||u.username||u.password)issues.push("Source must be HTTPS");}catch{issues.push("Invalid source URL");}
 if(x.ci95&&(!Array.isArray(x.ci95)||x.ci95.length!==2||x.ci95.some(v=>!Number.isFinite(v))||x.ci95[0]>x.value||x.ci95[1]<x.value))issues.push("Invalid confidence interval");
 return issues;
}
const distinct=(a:string[])=>[...new Set(a)];
export function explainStudy(observations:Observation[],study:Observation["study"]):Explanation{
 const rows=observations.filter(x=>x.study===study),issues=rows.flatMap(x=>validateObservation(x).map(v=>x.id+": "+v));
 if(new Set(rows.map(x=>x.id)).size!==rows.length)issues.push("Duplicate observation identifiers");
 if(!rows.length)issues.push("No measurements supplied");
 const gap=distinct(issues);
 const base={id:"DIS-EXPLAIN-"+study,study,observationIds:rows.map(x=>x.id),finding:"",canConclude:[] as string[],cannotConclude:[] as string[],hypotheses:[] as Explanation["hypotheses"],gaps:gap,status:"DESCRIPTIVE_ONLY" as Explanation["status"]};
 if(study==="CRC_COUNTIES"){
  const shares=rows.filter(x=>x.construct==="LATE_STAGE_CASE_SHARE");
  const rates=rows.filter(x=>x.construct==="AGE_ADJUSTED_LATE_STAGE_INCIDENCE");
  const matched=shares.length>=2&&rates.length>=2&&rows.every(x=>x.period===rows[0].period);
  if(!matched)gap.push("Need matched county periods and both stage shares and adjusted late-stage rates");
  base.finding="Stage share and age-adjusted late-stage incidence are different constructs. Similar conditional shares do not imply equal population burden.";
  base.canConclude.push("Only compare same-construct measures within source-compatible populations, periods and definitions.");
  base.cannotConclude.push("Cannot infer all-stage incidence by dividing an age-adjusted late-stage rate by an unadjusted case share.","Cannot infer screening performance, diagnostic delay, causation or city-level burden from county aggregates.");
  base.hypotheses.push({mechanism:"Lower historical screening and polypectomy prevention could contribute to higher observed all-stage incidence",alternative:"Different baseline risk, diet, exposures, age-specific eligibility, detection intensity or screening quality",discriminatingEvidence:"Historical guideline-eligible colonoscopy completion, polyp detection/removal, surveillance and incident cancer trends with appropriate lag and confounder controls; invitation-to-screen trial effects are not county-level causal estimates"},{mechanism:"Different underlying incidence",alternative:"Different detection, case mix or stage ascertainment",discriminatingEvidence:"Matched all-stage age-specific incidence, staging completeness and case definitions"},{mechanism:"Different diagnostic follow-up capacity",alternative:"Different eligible populations and screening uptake",discriminatingEvidence:"Eligible screening cohorts, abnormal-result-to-resolution times and service capacity"});
 }else if(study==="THREE_CANCER"){
  const conditions=distinct(rows.map(x=>x.condition));
  if(conditions.length<3)gap.push("Three cancer-specific source-aligned measurement series required");
  if(!rows.some(x=>x.construct==="LATE_STAGE_CASE_SHARE")||!rows.some(x=>x.construct==="AGE_ADJUSTED_LATE_STAGE_INCIDENCE"))gap.push("Both construct families required; correlations must be computed within each family");
  base.finding="A correlation of adjusted incidence rates and a correlation of conditional stage shares answer different questions.";
  base.canConclude.push("Differences in ecological correlation are descriptive, not evidence of a shared disease mechanism.");
  base.cannotConclude.push("Cannot infer person-level associations or common causes from state correlations.","Cannot compare Pearson and Spearman or source vintages as if identical estimands.");
  base.hypotheses.push({mechanism:"Common exposure or structural context",alternative:"Age composition, screening intensity, registry completeness or mathematical denominator differences",discriminatingEvidence:"Cancer-specific age-stratified source panels, screening eligibility, staging completeness, robustness and negative controls"});
 }else{
  if(rows.some(x=>x.construct!=="EVER_DIAGNOSED_SURVEY_SHARE"))gap.push("Gynecologic survey analysis must not silently substitute clinical prevalence or cancer-stage measures");
  if(distinct(rows.map(x=>x.condition)).length<3)gap.push("Separate endometriosis, PCOS and fibroids source definitions required");
  base.finding="Ever-diagnosed survey proportions measure reported recognition, not independently measured biological prevalence.";
  base.canConclude.push("Published weighted survey estimates can describe self-reported prior diagnosis within their survey population.");
  base.cannotConclude.push("Cannot attribute diagnosis gaps to biology or access without discrimination tests.","Cannot interpret an unweighted raw count as a national percentage or infer state prevalence from a national survey.");
  base.hypotheses.push({mechanism:"Differences in actual disease occurrence",alternative:"Differences in symptom recognition, clinician diagnosis, access and recall",discriminatingEvidence:"Validated condition-specific clinical ascertainment plus survey-weighted recognition and diagnostic delay data"},{mechanism:"Differences in fertility-related consequences",alternative:"Selection into care and confounding by age and parity",discriminatingEvidence:"Survey-design-aware stratified analyses and appropriate longitudinal cohorts"});
 }
 if(rows.some(x=>x.evidence!=="PUBLISHED_AGGREGATE"))gap.push("Unverified or derived observations cannot serve as independently source-verified measurements");
 if(rows.some(x=>!x.sourceVersion.trim()))gap.push("Source release/version required");
 base.gaps=distinct(gap);base.status=base.gaps.length?"MEASUREMENT_BLOCK":"DESCRIPTIVE_ONLY";
 return base;
}

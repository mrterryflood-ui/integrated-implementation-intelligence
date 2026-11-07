/**
 * Selected published-case implementation-science comparator preflight.
 * Data are manually curated published aggregates; this is NOT independent
 * patient research, a scored ChainWeb trial, or proof of method superiority.
 *
 * Preserve the competent updated-CFIR + iterative PRISM/RE-AIM + FRAME-IS arm.
 * Both arms receive precisely the same source evidence. RPLICE is HIL-selected,
 * never silently invoked. Does not call a network/API.
 */
import {createHash} from "node:crypto";

export type CaseDesign="RANDOMIZED_EBI"|"OBSERVATIONAL_PROGRAM"|"OBSERVATIONAL_DIAGNOSIS"|"METHODS_APPLICATION";
export type Endpoint="SCREENING_COMPLETION"|"DIAGNOSTIC_COMPLETION"|"IMPLEMENTATION_DELIVERY";
export type Outcome={
 id:string; label:string;time:string;endpoint:Endpoint;
 treatment:number;comparison:number;difference:number;
 ci95:readonly [number,number]|null;comparisonType:"RANDOMIZED_ARMS"|"UNCONTROLLED_YEAR_TO_YEAR";
};
export type SelectedCase={
 id:string;design:CaseDesign;source:string;setting:string;population:string;
 intervention:string;comparator:string;coreFunctions:readonly string[];
 outcomes:readonly Outcome[];
 fidelity:readonly {component:string;numerator:number;denominator:number;percent:number;conditioning:string}[];
 contextQuestions:readonly string[];
};
const o=(id:string,label:string,time:string,endpoint:Endpoint,treatment:number,comparison:number,
 difference:number,ci95:readonly [number,number]|null,comparisonType:Outcome["comparisonType"]="RANDOMIZED_ARMS"):Outcome=>
 ({id,label,time,endpoint,treatment,comparison,difference,ci95,comparisonType});
export const SELECTED_METHOD_CASES:readonly SelectedCase[]=[
 {id:"NC24",design:"RANDOMIZED_EBI",source:"https://doi.org/10.1001/jamanetworkopen.2024.46693",
 setting:"12 NC FQHC delivery sites, centralized cancer-center operations",population:"4002 overdue average-risk adults 50–75",
 intervention:"Centralized mailed FIT with navigated diagnostic follow-up",comparator:"Usual care",
 coreFunctions:["determine eligibility","mail appropriate FIT","communicate results","support appropriate resolution"],
 outcomes:[o("screen6m","Completed CRC screening","6 months","SCREENING_COMPLETION",30,9.7,20.29,[17.85,22.73]),
 o("followup6m","Colonoscopy after positive FIT","6 months","DIAGNOSTIC_COMPLETION",68.8,44.4,24.3,[-2.13,50.74])],
 fidelity:[],contextQuestions:["Does centralized staffing exist locally?","Positive-FIT subgroup was small; what diagnostic capacity is available?","Are costs/sustainment measured?"]},
 {id:"US23",design:"RANDOMIZED_EBI",source:"https://doi.org/10.1001/jama.2023.18755",
 setting:"44 practices in three U.S. health networks",population:"11980 patients with unresolved abnormal screening results",
 intervention:"EHR reminders, outreach and additional navigation",comparator:"Usual care or active outreach",
 coreFunctions:["identify unresolved abnormal findings","reach patient","complete indicated follow-up"],
 outcomes:[o("navUsual","120-day completed follow-up vs usual care","120 days","DIAGNOSTIC_COMPLETION",31.4,22.9,8.5,[4.8,12]),
 o("navOutreach","Incremental navigation vs outreach","120 days","DIAGNOSTIC_COMPLETION",31.4,31.0,0.4,[-3.6,4.2])],
 fidelity:[{component:"navigator calls",numerator:1421,denominator:3455,percent:41.1,conditioning:"Some participants completed follow-up before call was due"}],
 contextQuestions:["Separate component effects from bundle effects","Were calls indicated for every patient?","No equivalence claim from interval crossing zero"]},
 {id:"WA25",design:"RANDOMIZED_EBI",source:"https://doi.org/10.7326/ANNALS-24-01885",
 setting:"32 Washington State FQHC clinics",population:"967 analyzed adults aged 50–75 with abnormal stool test",
 intervention:"Bilingual six-topic telephone patient navigation",comparator:"Usual care",
 coreFunctions:["notify after abnormal stool test","address barriers","complete clinically indicated colonoscopy"],
 outcomes:[o("colonoscopy1y","Diagnostic colonoscopy received","1 year","DIAGNOSTIC_COMPLETION",55.1,42.1,13,[6.5,19.4])],
 fidelity:[],contextQuestions:["GI/endoscopy capacity","COVID-era context","Colonoscopy completion is not lower cancer incidence"]},
 {id:"OR25",design:"RANDOMIZED_EBI",source:"https://doi.org/10.1001/jamanetworkopen.2025.0928",
 setting:"28 rural Oregon clinics, Medicaid plans",population:"5614 Medicaid enrollees evaluated",
 intervention:"Mailed FIT, reminders and navigation",comparator:"Usual care",
 coreFunctions:["verify eligible enrollees","mail FIT","remind","navigate abnormal FIT"],
 outcomes:[o("screen6m","Any CRC screening completed","6 months","SCREENING_COMPLETION",11.8,4.5,7.3,[5.3,9.2])],
 fidelity:[{component:"mailed FIT in screened eligible subset",numerator:1489,denominator:1489,percent:100,conditioning:"Subset after clinic eligibility scrub"},
 {component:"navigation after abnormal FIT",numerator:11,denominator:19,percent:57.9,conditioning:"Only identified abnormal FIT recipients needing navigation"}],
 contextQuestions:["Medicaid-plan support","Different denominators by component","Low overall reach despite positive effect","Recheck clinic-year variation"]},
 {id:"CA26",design:"RANDOMIZED_EBI",source:"https://doi.org/10.1001/jamanetworkopen.2026.39013",
 setting:"16 Southern California FQHC clinics in two organizations",population:"20250 baseline patients aged 50–75",
 intervention:"Annual mailed FIT outreach",comparator:"Usual care",
 coreFunctions:["verify due year","mail at appropriate time","record receipt","maintain service capacity"],
 outcomes:[o("year2","Up-to-date screening year two","year 2","SCREENING_COMPLETION",37.8,27.0,10.8,[4.9,16.7]),
 o("year3","Up-to-date screening year three","year 3","SCREENING_COMPLETION",39.4,36.5,2.9,[-3.2,9.0])],
 fidelity:[],contextQuestions:["Year-three eligibility query moved earlier","Intervention group rose while control group improved more","Annual denominators/case mix changed","Cannot infer that intervention stopped working"]},
 {id:"ALTA25",design:"OBSERVATIONAL_PROGRAM",source:"https://doi.org/10.1002/cncr.70031",
 setting:"California AltaMed FQHC 2021–2023",population:"Separate annual clinic screening cohorts",
 intervention:"Mailed FIT and patient navigation program",comparator:"Earlier operational cohort, NOT randomized",
 coreFunctions:["identify eligible patients","navigate","record FIT returns","check diagnostic closure and costs"],
 outcomes:[o("returns","FIT returns among navigated patients","2021 vs 2023","SCREENING_COMPLETION",51,36.6,14.4,null,"UNCONTROLLED_YEAR_TO_YEAR")],
 fidelity:[],contextQuestions:["Changing annual cohort composition","Costs and follow-up colonoscopy","Observational improvement is not treatment effect"]},
 {id:"PCOS24",design:"OBSERVATIONAL_DIAGNOSIS",source:"https://pubmed.ncbi.nlm.nih.gov/39394785/",
 setting:"Boston Medical Center retrospective EHR cohort",population:"At-risk PCOS diagnosis cohort, historical 2003–2015",
 intervention:"NONE — observational diagnostic ascertainment",comparator:"Recorded demographic/access categories",
 coreFunctions:[],outcomes:[],fidelity:[],contextQuestions:["Diagnostic codes/algorithms require validation","Race-associated missed diagnoses not a clinical intervention result","No state-specific underlying prevalence"]},
 {id:"FRAME26",design:"METHODS_APPLICATION",source:"https://doi.org/10.1177/26334895251407338",
 setting:"32 clinics in two Midwestern healthcare systems",population:"Multilevel opioid-guideline deimplementation trial context",
 intervention:"FRAME-IS retrospective documentation of modified implementation strategies",comparator:"Not a ChainWeb trial",
 coreFunctions:[],outcomes:[],fidelity:[],contextQuestions:["Nested and cascading modification records","Acknowledges established methods already capture adaptation","No superiority claim from case report"]}
] as const;

export type EffectClass="POSITIVE_DEFINED_ENDPOINT"|"NEGATIVE_DEFINED_ENDPOINT"|"UNCERTAIN_NOT_EQUIVALENCE"|"OBSERVATIONAL_NONCAUSAL";
export const effectClass=(design:CaseDesign,outcome:Outcome):EffectClass=>
 design!=="RANDOMIZED_EBI"?"OBSERVATIONAL_NONCAUSAL":!outcome.ci95?"UNCERTAIN_NOT_EQUIVALENCE":
 outcome.ci95[0]>0?"POSITIVE_DEFINED_ENDPOINT":outcome.ci95[1]<0?"NEGATIVE_DEFINED_ENDPOINT":"UNCERTAIN_NOT_EQUIVALENCE";

export function evidencePreflight(cases:readonly SelectedCase[]=SELECTED_METHOD_CASES){
 const errors:string[]=[];const seen=new Set<string>();let numericalContrasts=0;
 for(const c of cases){
  if(!c.id||seen.has(c.id))errors.push("Missing/duplicate case id "+c.id);
  seen.add(c.id);
  if(!c.source.startsWith("https://")||!c.setting||!c.population||!c.comparator||!c.intervention)errors.push("Missing source/scope "+c.id);
  if(c.design==="RANDOMIZED_EBI"&&!c.coreFunctions.length)errors.push("Missing clinical EBI core functions "+c.id);
  for(const m of c.outcomes){
   numericalContrasts++;
   if(!m.id||!m.time||!m.label)errors.push("Outcome/time missing "+c.id);
   if([m.treatment,m.comparison,m.difference].some(x=>!Number.isFinite(x))||m.treatment<0||m.treatment>100||m.comparison<0||m.comparison>100)errors.push("Invalid values "+c.id);
   // Adjusted published contrasts may not match differences of rounded adjusted percentages exactly.
   if(Math.abs((m.treatment-m.comparison)-m.difference)>0.55)errors.push("Contrast mismatch "+c.id+"/"+m.id);
   if(c.design==="RANDOMIZED_EBI"&&m.comparisonType!=="RANDOMIZED_ARMS")errors.push("Contradictory RCT comparison "+c.id);
   if(c.design!=="RANDOMIZED_EBI"&&m.comparisonType==="RANDOMIZED_ARMS")errors.push("Observational trend mislabeled RCT "+c.id);
   if(m.ci95&&!(m.ci95.length===2&&m.ci95[0]<=m.difference&&m.ci95[1]>=m.difference))errors.push("Invalid reported CI "+c.id);
  }
  for(const d of c.fidelity){
   if(!(Number.isInteger(d.numerator)&&Number.isInteger(d.denominator)&&d.denominator>0&&d.numerator>=0&&d.numerator<=d.denominator&&Math.abs(100*d.numerator/d.denominator-d.percent)<0.15&&d.conditioning))errors.push("Invalid conditional fidelity denominator "+c.id);
  }
 }
 return {schema:"dis-implementation-method-case-preflight-v1" as const,cases:cases.length,numericalContrasts,
  evidenceContractPassed:errors.length===0,errors,
  sourceRowAudit:"CURATED_PUBLISHED_VALUES_NOT_SECOND_REVIEWED" as const,
  chainwebSuperiorityMeasured:false as const,independentAdjudicationPerformed:false as const,
  clinicalEffectOfChainwebMeasured:false as const,interventionAuthorized:false as const};
}
export const STANDARD_COMPARATOR="Updated CFIR (2022) + iterative PRISM–RE-AIM + FRAME-IS + the 2026 learning-health-system implementation/sustainment process, with full original evidence, causal reasoning, adaptation and sustainment, equal support and time";
export const CHAINWEB_ADDITION="All standard comparator methods PLUS source-classed multilevel evidence-chain, linked hypotheses, test/owner/response/outcome and temporal re-map; RPLICE optional HIL selection, not automatically run";

export function constructEqualEvidenceComparison(cases:readonly SelectedCase[]=SELECTED_METHOD_CASES){
 const pre=evidencePreflight(cases);if(!pre.evidenceContractPassed)throw Error(pre.errors.join("; "));
 const packets=cases.flatMap(c=>{
  const digest=createHash("sha256").update(JSON.stringify(c)).digest("hex");
  return [{caseId:c.id,method:"STANDARD" as const,sourceDigest:digest,caseEvidence:c,task:"Diagnose the appropriate EBI and implementation failure, test alternatives, specify fidelity, adaptation, equity, cost and sustainment. Do not overclaim.",instructions:STANDARD_COMPARATOR},
    {caseId:c.id,method:"CHAINWEB_AUGMENTED" as const,sourceDigest:digest,caseEvidence:c,task:"Diagnose the appropriate EBI and implementation failure, test alternatives, specify fidelity, adaptation, equity, cost and sustainment. Do not overclaim.",instructions:CHAINWEB_ADDITION}];
 });
 return {schema:"dis-method-comparison-preparation-v1" as const,
  packets,studyStatus:"EQUAL_EVIDENCE_PACKETS_ONLY_NOT_EXECUTED" as const,
  comparatorIsCompetent:true as const,independentRatings:0,
  goldStandardIndependentlyAdjudicated:false as const,superiorityEstablished:false as const,
  requiredEndpoints:["independently adjudicated material gap recall","unsupported consequential claims","correct context-fit action","core fidelity and adaptation","time/cost","equity and sustainment"] as const,
  noPartnerOrClinicalAction:true as const};
}

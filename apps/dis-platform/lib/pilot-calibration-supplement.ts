/** Retained public aggregate evidence, separately versioned from the legacy case.
 * Byte/numeric replay belongs to platform_snapshot.py; metadata checks here do
 * not authenticate a source or establish clinical/scientific validity.
 */
import retained from "../data/pilot-calibration-20261108.json";
import {explainStudy,type Observation} from "./three-study-explanation";
import {credentialFreeHttps,strictTimestamp} from "./evidence-action-input-integrity";
import {sameJsonContent} from "./json-content-equality";
export type CalibrationSupplement=typeof retained;
const sourceIds=["nsfg_female","nsfg_codebook","nsfg_published","colorectal_states","lung_states","breast_states","hinds_all","hinds_late","harris_all","harris_late"];
const sha=(x:string)=>/^[a-f0-9]{64}$/.test(x);
// Python source receipts retain microseconds. Validate the real calendar/zone
// with the shared millisecond parser while preserving the original timestamp.
const captureTime=(x:string)=>strictTimestamp(x.replace(/(\.\d{3})\d{1,3}(?=Z|[+-]\d{2}:\d{2}$)/,"$1"));
const finite=(x:number,lo:number,hi:number)=>typeof x==="number"&&Number.isFinite(x)&&x>=lo&&x<=hi;
const fail=(message:string):never=>{throw Error("Calibration supplement: "+message);};
const exactKeys=(value:object,expected:string[])=>Object.keys(value).length===expected.length&&expected.every(k=>Object.prototype.hasOwnProperty.call(value,k));
function interval(values:number[],point:number,lo:number,hi:number){return values.length===2&&values.every(x=>finite(x,lo,hi))&&values[0]<=point&&point<=values[1];}
export function validateCalibrationSupplement(s:CalibrationSupplement):void{
  if(s.schema!=="dis-calibration-supplement-v1"||s.state!=="DESCRIPTIVE_RESEARCH_CALIBRATION"||
    !/^[a-f0-9]{40}$/.test(s.analysisProducerRevision)||captureTime(s.sourceCaptureCompletedAt)===null)fail("version or producer/capture identity");
  if(Object.values(s.authority).some(x=>x!==false)||!exactKeys(s.authority,["causalEffectEstablished","clinicalActionAuthorized","fieldBenefitMeasured","actualAssignmentsAccepted"])||
    Object.values(s.missing).some(x=>x!==null)||!exactKeys(s.missing,["localDiagnosticResolution","interventionEffect","incrementalPlatformBenefit"]))fail("unknowns or authority cannot be promoted");
  if(Object.values(s.artifacts).some(h=>!sha(h))||s.id!=="retained-public-cycle-"+s.artifacts.acquisitionReceiptSha256.slice(0,12))fail("artifact identity");
  if(s.sources.length!==10||new Set(s.sources.map(x=>x.id)).size!==10||sourceIds.some(id=>!s.sources.some(x=>x.id===id)))fail("source identities");
  for(const x of s.sources)if(!sha(x.sha256)||!credentialFreeHttps(x.url)||!Number.isSafeInteger(x.bytes)||x.bytes<=0||captureTime(x.capturedAt)===null)fail("source metadata");
  if(s.county.period!=="2019-2023"||s.county.condition!=="colorectal"||s.county.rows.length!==2||
    s.county.scope!=="County residence; both sexes; all races including Hispanic; all ages"||
    !s.county.stageShareDefinition.includes("unknown-stage denominator handling unresolved"))fail("county source frame");
  for(const [i,r] of s.county.rows.entries()){
    if(r.fips!==["28049","48201"][i]||r.name!==["Hinds County","Harris County"][i]||r.allSourceId!==["hinds_all","harris_all"][i]||r.lateSourceId!==["hinds_late","harris_late"][i])fail("county identity");
    for(const x of [r.all,r.late])if(!finite(x.rate_per_100k,0,100000)||!interval(x.ci95,x.rate_per_100k,0,100000)||!Number.isSafeInteger(x.annual_count)||x.annual_count<0)fail("county rate, interval or count");
    if(!finite(r.late.late_share_percent,0,100))fail("case share is not zero-filled suppression");
  }
  const [h,t]=s.county.rows;
  if(s.county.contrasts.late_stage_rate_difference!==h.late.rate_per_100k-t.late.rate_per_100k||
    s.county.contrasts.all_stage_rate_difference!==h.all.rate_per_100k-t.all.rate_per_100k||
    s.county.contrasts.share_difference_pp!==h.late.late_share_percent-t.late.late_share_percent)fail("contrast/source disagreement");
  if(s.national.period!=="2019-2023"||s.national.states!==50||
    s.national.excludedAggregates.join("|")!=="United States|District of Columbia|Puerto Rico"||
    s.national.scope!=="CRC and lung: both sexes; breast: female; all ages; all races including Hispanic")fail("state frame or sex-specific scope");
  const keys=s.national.correlations.map(x=>x.construct+":"+x.pair.join("/"));
  if(keys.length!==6||new Set(keys).size!==6||["rate","share"].some(c=>["colorectal/lung","colorectal/breast","lung/breast"].some(p=>!keys.includes(c+":"+p))))fail("six distinct correlation estimands required");
  for(const x of s.national.correlations)if(!finite(x.pearson,-1,1)||!interval(x.conditionalIidFisher95,x.pearson,-1,1)||!finite(x.conditionalExchangeablePermutationP,0,1))fail("conditional correlation sensitivity");
  if(!s.national.uncertaintyLimit.includes("spatial dependence"))fail("conditional uncertainty disclosure");
  if(s.survey.period!=="2022-2023"||s.survey.literalInterview20to49N!==4855||s.survey.eligibilityAge50SensitivityN!==4856||!sha(s.survey.publicCsvSha256))fail("survey domains/lineage");
  if(s.survey.standardization.bands.map(x=>x.join("-")).join("/")!=="20-29/30-39/40-50"||s.survey.standardization.weights.length!==3||s.survey.standardization.weights.some(x=>x!==1/3)||s.survey.standardization.weights.reduce((a,b)=>a+b,0)!==1)fail("survey standardization");
  if(s.survey.conditions.map(x=>x.code).join("/")!=="ENDO/PCOS/UF")fail("condition-specific survey measures");
  for(const c of s.survey.conditions){
    if(!finite(c.publishedPercent,0,100)||!finite(c.publishedSePp,0,100)||Math.round(c.eligibilitySensitivity.percent*10)/10!==c.publishedPercent||Math.round(c.eligibilitySensitivity.taylor_se_pp*100)/100!==c.publishedSePp)fail("published survey point/SE rounding");
    for(const [d,n] of [[c.literalDomain,4855],[c.eligibilitySensitivity,4856]] as const)
      if(!finite(d.percent,0,100)||!finite(d.taylor_se_pp,0,100)||!Number.isSafeInteger(d.n_valid)||d.n_valid<0||!Number.isSafeInteger(d.n_excluded)||d.n_excluded<0||d.n_valid+d.n_excluded!==n)fail("survey point/SE/domain");
    if(c.publicGroups.map(g=>g.code).join("/")!=="1/2/3/4"||c.publicGroups.map(g=>g.label).join("/")!=="Hispanic/non_Hispanic_White/non_Hispanic_Black/non_Hispanic_other_or_multiple")fail("public group definitions");
    if(c.publicGroups.reduce((n,g)=>n+g.validN+g.itemMissingN,0)!==4856)fail("survey subgroup denominator");
    for(const g of c.publicGroups){const d=g.standardizedGroupMinusOverall;
      if(!Number.isSafeInteger(g.validN)||g.validN<0||!Number.isSafeInteger(g.itemMissingN)||g.itemMissingN<0||!finite(g.crudePercent,0,100)||d.estimand!=="EQUAL_BAND_STANDARDIZED_GROUP_MINUS_OVERALL"||d.scale!=="PERCENTAGE_POINTS"||d.notUncertaintyForCrudePercent!==true||!finite(d.sePp,0,100)||!interval(d.unadjusted95CiPp,d.estimatePp,-100,100))fail("survey contrast is not crude-prevalence uncertainty");
    }
  }
  if(new TextEncoder().encode(JSON.stringify(s)).length>20000)fail("case-record payload budget");
}
export function getCalibrationSupplement():CalibrationSupplement{
  validateCalibrationSupplement(retained);return structuredClone(retained);
}
export const matchesReproducedCalibrationReference=(s:CalibrationSupplement)=>sameJsonContent(s,retained);
/** Reuse the existing explanation engine only for its supported constructs.
 * Correlations are not passed off as incidence observations or pooled with NSFG.
 */
export function calibrationExplanations(s:CalibrationSupplement){
  const source=(id:string)=>s.sources.find(x=>x.id===id)!;
  const observations:Observation[]=[];
  for(const r of s.county.rows)for(const [name,construct,value,unit,denominator,sourceId,ci95] of [
    ["all","AGE_ADJUSTED_ALL_STAGE_INCIDENCE",r.all.rate_per_100k,"per_100k","Resident population, age-standardized",r.allSourceId,r.all.ci95],
    ["late","AGE_ADJUSTED_LATE_STAGE_INCIDENCE",r.late.rate_per_100k,"per_100k","Resident population, age-standardized",r.lateSourceId,r.late.ci95],
    ["share","LATE_STAGE_CASE_SHARE",r.late.late_share_percent,"percent",s.county.stageShareDefinition,r.lateSourceId,undefined]
  ] as const)observations.push({id:r.fips+"-"+name,study:"CRC_COUNTIES",condition:"colorectal",geography:r.name,population:s.county.scope,period:s.county.period,construct,value,unit,sourceUrl:source(sourceId).url,sourceVersion:source(sourceId).sha256,evidence:"PUBLISHED_AGGREGATE",denominator,...(ci95?{ci95:[...ci95] as [number,number]}:{})});
  const survey:Observation[]=s.survey.conditions.map(c=>({id:c.code,study:"GYNECOLOGIC_DIAGNOSIS",condition:c.code,geography:"United States",population:s.survey.population,period:s.survey.period,construct:"EVER_DIAGNOSED_SURVEY_SHARE",value:c.publishedPercent,unit:"percent",sourceUrl:source("nsfg_published").url,sourceVersion:source("nsfg_published").sha256,evidence:"PUBLISHED_AGGREGATE",denominator:"NCHS published eligible-domain reported-diagnosis denominator"}));
  return {county:explainStudy(observations,"CRC_COUNTIES"),survey:explainStudy(survey,"GYNECOLOGIC_DIAGNOSIS")};
}

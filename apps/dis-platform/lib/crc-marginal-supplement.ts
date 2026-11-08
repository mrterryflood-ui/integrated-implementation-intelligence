/** Original-source marginal estimates; not joint strata, a screening policy,
 * a causal model or an empirical intervention-effect estimate. */
import retained from "../data/crc-marginals-20261108.json";
import {credentialFreeHttps,strictTimestamp} from "./evidence-action-input-integrity";
import {sameJsonContent} from "./json-content-equality";
export type CrcMarginalSupplement=typeof retained;
const fail=(why:string):never=>{throw Error("CRC marginal supplement: "+why);};
const finite=(n:number)=>typeof n==="number"&&Number.isFinite(n)&&n>=0;
export function marginalSourceUrl(s:CrcMarginalSupplement,id:string){
 const source=s.sources.find(x=>x.id===id);if(!source)fail("unbound source identity");return s.sourceEndpoint+"?"+source!.query;
}
export function validateCrcMarginals(s:CrcMarginalSupplement){
 if(s.schema!=="dis-crc-marginal-supplement-v1"||s.period!=="2019-2023"||s.state!=="DESCRIPTIVE_RESEARCH_CALIBRATION"||
   s.id!=="crc-marginals-"+s.sourceReceiptSha256.slice(0,12)||![s.sourceReceiptSha256,s.projectionScriptSha256].every(x=>/^[a-f0-9]{64}$/.test(x)))fail("version/provenance");
 if(s.sourceConfidenceIntervalsOnly!==true||s.jointAgeRaceAnalysis!==false||s.causalEffectEstablished!==false||s.under45InferenceSupported!==false||s.clinicalActionAuthorized!==false)fail("scope or authority promotion");
 if(s.sourceEndpoint!=="https://statecancerprofiles.cancer.gov/incidencerates/index.php"||s.sources.length!==16||new Set(s.sources.map(x=>x.id)).size!==16)fail("source identity");
 for(const source of s.sources)if(!/^[a-f0-9]{64}$/.test(source.sha256)||!credentialFreeHttps(marginalSourceUrl(s,source.id))||!Number.isSafeInteger(source.bytes)||source.bytes<=0||strictTimestamp(source.capturedAt.replace(/(\.\d{3})\d{1,3}(?=Z|[+-]\d{2}:\d{2}$)/,"$1"))===null)fail("source metadata");
 const specs=[["age","009","<50"],["age","136","50+"],["race","07","White (Non-Hispanic)"],["race","28","Black (Non-Hispanic)"]];
 if(s.strata.length!==4)fail("four distinct marginal strata required");
 const referenced:string[]=[];
 s.strata.forEach((row,i)=>{
  const [dimension,code,label]=specs[i];
  if(row.dimension!==dimension||row.code!==code||row.label!==label||row.sex!=="Both sexes"||row.age!==(dimension==="age"?label:"All ages")||row.race!==(dimension==="race"?label:"All races including Hispanic")||row.counties.length!==2)fail("marginal frame");
  row.counties.forEach((county,j)=>{
   const key=j===0?"hinds":"harris",state=j===0?"28":"48";
   if(county.fips!==["28049","48201"][j]||county.name!==["Hinds County, MS","Harris County, TX"][j])fail("county identity");
   for(const [stage,estimate] of [["all",county.all],["late",county.late]] as const){
    const sid=key+"_"+dimension+"_"+code+"_"+stage;referenced.push(sid);
    if(estimate.sourceId!==sid)fail("source/cell identity");
    const q=new URL(marginalSourceUrl(s,sid)).searchParams;
    const expected={cancer:"020",sex:"0",stage:stage==="all"?"999":"211",age:dimension==="age"?code:"001",race:dimension==="race"?code:"00",statefips:state,areatype:"county",year:"0",ruralurban:"0"};
    if(Object.entries(expected).some(([k,v])=>q.getAll(k).length!==1||q.get(k)!==v))fail("source query frame");
    if(estimate.state==="OBSERVED_SOURCE_AGGREGATE"){
     if(estimate.ratePer100k===null||!finite(estimate.ratePer100k)||!estimate.ci95||estimate.ci95.length!==2||!estimate.ci95.every(finite)||estimate.ci95[0]>estimate.ratePer100k||estimate.ci95[1]<estimate.ratePer100k)fail("source rate/interval");
    }else if(estimate.state!=="SUPPRESSED_OR_MISSING"||estimate.ratePer100k!==null||estimate.ci95!==null)fail("suppression cannot become zero");
    if(estimate.averageAnnualCount!==null&&(!Number.isSafeInteger(estimate.averageAnnualCount)||estimate.averageAnnualCount<0))fail("count");
    if(stage==="all"&&estimate.lateCaseSharePercent!==null)fail("case-share stage");
    if(estimate.lateCaseSharePercent!==null&&(!finite(estimate.lateCaseSharePercent)||estimate.lateCaseSharePercent>100))fail("case share");
   }
  });
  const [h,t]=row.counties;
  const rate=h.late.ratePer100k===null||t.late.ratePer100k===null?null:h.late.ratePer100k-t.late.ratePer100k;
  const share=h.late.lateCaseSharePercent===null||t.late.lateCaseSharePercent===null?null:h.late.lateCaseSharePercent-t.late.lateCaseSharePercent;
  if(row.lateRateDifference!==rate||row.lateShareDifferencePp!==share)fail("contrast/source agreement");
 });
 if(new Set(referenced).size!==16||s.sources.some(x=>!referenced.includes(x.id)))fail("orphan source");
 if(new TextEncoder().encode(JSON.stringify(s)).length>12000)fail("case payload budget");
}
export function getCrcMarginals():CrcMarginalSupplement{validateCrcMarginals(retained);return structuredClone(retained);}
export const matchesReproducedMarginalReference=(s:CrcMarginalSupplement)=>sameJsonContent(s,retained);

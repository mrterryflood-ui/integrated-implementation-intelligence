/** Environmental research extends the existing DIS programme and bridge.
 * Proposed protocols and bounded replay checks are not field validation,
 * safe-water determinations, partner commitments or submission authority.
 */
import {buildResearchProgram,type ResearchProgramSpec,type DataSource} from "./research-program";
import {reviewEvidenceToAction} from "./evidence-action-bridge";
import type {IntelligenceRecord} from "./consultation-research";

export const ENVIRONMENTAL_VERSION="dis-environmental-research-v1" as const;
export type EnvironmentalStudy="epa-water-reuse"|"noaa-hazard-decisions";
export const ENVIRONMENTAL_STUDIES:readonly EnvironmentalStudy[]=["epa-water-reuse","noaa-hazard-decisions"];
export type ResearchPartner={organization:string;proposedRole:string;state:"PROSPECTIVE"};
export type StudyProtocol={
 id:EnvironmentalStudy;title:string;solicitation:string;topic:string;
 submissionDeadline:string;deadlineLabel:string;sourceUrl:string;
 durationMonths:number;planningBudget:number;budgetState:"PLANNING_NOT_APPROVED";
 question:string;contribution:string;noveltyState:"HYPOTHESIS_REQUIRES_PRIOR_ART_REVIEW";
 comparator:string[];aims:string[];outcomes:{name:string;definition:string}[];
 failureCases:string[];methods:string[];methodExecution:"HUMAN_SELECTION_REQUIRED_NOT_INVOKED";
 sources:{title:string;url:string;use:string;limit:string}[];
 dependencies:{id:string;owner:string;evidence:string}[];
};
const EPA="https://www.fedconnect.net/FedConnect/default.aspx?agency=EPA&doc=68HERW26R0102";
const NOAA="https://simpler.grants.gov/opportunity/df29db0f-809b-40ad-9cbe-c7954b9e5cfd";
const commonDependencies=[
 {id:"pi",owner:"Applicant and PI",evidence:"Named PI, appropriate expertise and solicitation-specific employment/eligibility evidence; a role declaration is not an employer letter."},
 {id:"partners",owner:"PI and prospective organizations",evidence:"Actual role, access, cost, data rights and participation agreement; names or relationship interest are not commitments."},
 {id:"oversight",owner:"Research institution and data steward",evidence:"Determine research ethics, privacy, sampling and disclosure requirements from actual activities."},
 {id:"budget",owner:"Applicant finance lead",evidence:"Allowable hours, rates, procurement, workshare and final owner-reviewed budget; no unsupported quotes or awards."},
 {id:"submission",owner:"Applicant authorized official",evidence:"Current registrations, exact compliant package, explicit approval, then actual provider receipt."}
];
const PROTOCOLS:Record<EnvironmentalStudy,StudyProtocol>={
 "epa-water-reuse":{
  id:"epa-water-reuse",title:"Distinguishing treatment failure from sensor failure in water reuse monitoring",
  solicitation:"68HERW26R0102",topic:"1A Monitoring Technologies for Water Reuse",
  submissionDeadline:"2026-11-09T04:59:00Z",deadlineLabel:"November 8, 2026 at 10:59 p.m. Central / 11:59 p.m. Eastern Standard",
  sourceUrl:EPA,durationMonths:6,planningBudget:100000,budgetState:"PLANNING_NOT_APPROVED",
  question:"Does a source-linked, calibration-aware monitoring evidence layer improve identification of reuse-system anomalies without increasing missed events or operator burden compared with competent conventional monitoring?",
  contribution:"Test the incremental contribution of source lineage, instrument validity, process context, missingness and explicit abstention. Generic dashboards and anomaly detection already exist; superiority and novelty are not established.",
  noveltyState:"HYPOTHESIS_REQUIRES_PRIOR_ART_REVIEW",
  comparator:["Existing operator thresholds and documented workflow","A tuned transparent multivariate/statistical monitoring baseline","Candidate DIS-assisted evidence reconciliation; ablate provenance and uncertainty features"],
  aims:["Bind observations to plant, treatment barrier, intended reuse, instrument, calibration, units and decision time.","Evaluate separately adjudicated process anomalies, sensor faults, missing/stale inputs and unknown events using whole-episode held-out data.","Estimate detection delay, missed events, false reports, abstention, analyst burden and operating cost; preserve failures and lifecycle tradeoffs."],
  outcomes:[{name:"Event sensitivity and false reports",definition:"Adjudicated process-anomaly events detected / eligible anomaly events, and false reports / monitored hour; cluster by source episode."},{name:"Detection delay",definition:"Time from independently defined event onset to the first qualifying flag; include missed/censored events."},{name:"Fault differentiation and abstention",definition:"Confusion matrix for sensor fault, process anomaly and unknown; report coverage and error among non-abstained episodes."},{name:"Lifecycle and implementation",definition:"Estimated energy, maintenance, data/review costs and operator time on matched tasks; no claimed water-safety certification."}],
  failureCases:["Sensor drift mistaken for treatment failure","Real anomaly hidden by a reconstructed sensor trace","Missing/expired calibration reported as normal","Multiple feeds share one sensor or upstream source","Future data leak into earlier decisions","Performance only on injected synthetic faults"],
  methods:["CFIR for local determinants, if selected","RE-AIM for reach, adoption, implementation and sustainment, if selected","SALP only for explicitly selected hypothetical adaptation analysis"],methodExecution:"HUMAN_SELECTION_REQUIRED_NOT_INVOKED",
  sources:[
   {title:"EPA Topic 1A and October 13 updated instructions",url:EPA,use:"Controlling topic and application requirements",limit:"An opportunity is not applicant eligibility or evidence of technical performance."},
   {title:"Thompson et al. 2022 industrial discharge detection at an advanced reuse facility",url:"https://doi.org/10.3389/frwa.2022.1014556",use:"Prior art and comparator design",limit:"Published work by others; not ISS performance or a license to their data."},
   {title:"Grimm et al. 2024 long-term ultrafiltration process monitoring",url:"https://doi.org/10.1021/acsestengg.4c00042",use:"Long-term monitoring and tuning as baseline requirements",limit:"One treatment context does not establish local transferability."},
   {title:"Li et al. 2026 sensor unreliability and contamination differentiation",url:"https://doi.org/10.1038/s41545-026-00595-2",use:"Challenge novelty of fault-aware monitoring",limit:"Distribution-network/model scenarios are not a reuse-plant field trial."}
  ],dependencies:[{id:"plant-data",owner:"Actual reuse operator and water scientist",evidence:"Authorized plant/barrier data, instrument and lab methods, event adjudication and a feasible six-month replay/bench protocol."},...commonDependencies,
   {id:"epa-compliance",owner:"ISS applicant administrator",evidence:"Current SAM All Awards, FedConnect authority, SBC Control ID, eligible PI employment, domestic work and at least two-thirds applicant research effort."}]
 },
 "noaa-hazard-decisions":{
  id:"noaa-hazard-decisions",title:"Source-linked AI for flood decisions across fragmented local hazard systems",
  solicitation:"NOAA-OAR-CPO-2027-33392",topic:"Priority Area 2 objectives a and b",
  submissionDeadline:"2027-02-10T07:59:00Z",deadlineLabel:"Full application February 9, 2027 at 11:59 p.m. Pacific; encouraged LOI November 17, 2026 at 11:59 p.m. Pacific",
  sourceUrl:NOAA,durationMonths:24,planningBudget:480000,budgetState:"PLANNING_NOT_APPROVED",
  question:"When does source-linked AI/ML improve local flood decision quality, uncertainty understanding and appropriate use of NOAA information compared with existing practice and a transparent rule baseline?",
  contribution:"Evaluate the scientific and behavioral value of source reconciliation and accountable decision prompts; distinguish model contribution from an improved interface alone.",noveltyState:"HYPOTHESIS_REQUIRES_PRIOR_ART_REVIEW",
  comparator:["Participant's competent existing workflow","Matched-source transparent rule synthesis","DIS/Hazard Aware candidate with fixed model version and source-linked prompts"],
  aims:["Map current NOAA-to-local information pathways, staffing, governance and missing data with actual participating organizations.","Build timestamp-faithful flood scenarios with no look-ahead leakage and independently adjudicated scenario facts.","Run a preregistered counterbalanced study of decision quality, attribution, uncertainty, workload and adoption; retain null or harmful effects."],
  outcomes:[{name:"Defensible decision and attribution",definition:"Independent blinded scoring under the same available evidence, with false and missed leads and explicit uncertainty."},{name:"Time and workload",definition:"Time to a defensible decision, incomplete decisions, task burden and learning/order effects under matched scenario conditions."},{name:"Adoption and equity",definition:"Context-specific access, usability, staffing, trust calibration and maintenance cost; prospective participants are not enrolled by this protocol."}],
  failureCases:["Current information silently used in a historical decision","One NOAA feed counted as independent corroboration through several portals","Interface improvements misattributed to AI","Practice/carryover effects in repeated tasks","No benefit for resource-constrained jurisdictions","Transmission mistaken for understood or implemented action"],
  methods:["CFIR for organizational determinants, if selected","RE-AIM for implementation and sustainment, if selected","SALP for owner-selected adaptation questions only"],methodExecution:"HUMAN_SELECTION_REQUIRED_NOT_INVOKED",
  sources:[{title:"NOAA FY2027 revised notice",url:NOAA,use:"Scope, eligibility and submission requirements",limit:"Research grant, not a license purchase; no fee/profit or partner commitment inferred."},{title:"NOAA NWS official alerts API",url:"https://www.weather.gov/documentation/services-web-api",use:"Authoritative NOAA source documentation",limit:"A public current-alert API is not a complete historical archive or local operational authorization."}],
  dependencies:[{id:"noaa-data",owner:"PI and hydrometeorology lead",evidence:"Licensed archived NOAA products, event/issue/receipt time, geography and scenario truth; a working live adapter does not establish archive completeness."},{id:"study-design",owner:"Independent quantitative evaluator",evidence:"Pilot-informed power and sampling, counterbalancing, appropriate participant/case clustering, preregistration and human-subjects determination."},...commonDependencies]
 }
};
export function getEnvironmentalProtocol(id:EnvironmentalStudy):StudyProtocol{
 if(!ENVIRONMENTAL_STUDIES.includes(id))throw Error("Unknown environmental study");
 return structuredClone(PROTOCOLS[id]);
}
export function buildEnvironmentalResearch(id:EnvironmentalStudy,leads:readonly IntelligenceRecord[]=[]){
 const protocol=getEnvironmentalProtocol(id);
 const target=id==="epa-water-reuse"?"Authorized reuse system and treatment barrier not yet selected":"Participating local flood decision-makers not yet enrolled";
 const sources:DataSource[]=protocol.sources.map((s,i)=>({id:"ENV-SOURCE-"+i,name:s.title,url:s.url,owner:i===0?"Issuing agency":"Original authors",granularity:"Source-specific; inspect original methods",kind:"SOURCE_CATALOG_ONLY",observationWindow:"No local observations supplied",legitimateUse:s.use,prohibitedUse:s.limit,connection:"CURATED_REFERENCE_ONLY"}));
 const spec:ResearchProgramSpec={id,site:"general",question:protocol.question,problemDefinition:protocol.contribution,lastSourceCheck:"2026-11-07",
  population:{targetName:target,analysisUnit:target,proxyUnit:target,proxyFips:null,equivalence:"NOT_ESTABLISHED",notes:"No county average or another research case is substituted for a plant, participant or episode."},indicators:[],dataSources:sources,strata:[],
  drivers:protocol.failureCases.slice(0,4).map((f,i)=>({id:"ENV-HYP-"+i,label:f,hypothesis:"Candidate issue: "+f,competingExplanation:"The apparent issue may reflect a different source, instrument, interface or contextual cause.",discriminatingTest:"Compare source-bound records with independently adjudicated truth and an appropriate baseline.",instrumentOrDataNeeded:"Domain-specific source records, validity metadata and matched comparison observations",evidenceState:"NOT_LOCALLY_TESTED",responsibleReviewers:"Domain scientist and independent evaluator"})),
  strategies:[{id:"ENV-EVIDENCE-LAYER",name:"Evaluate source-linked evidence reconciliation",whereInJourney:"Measurement to human review",basis:"CANDIDATE_TO_EVALUATE",sourceUrl:protocol.sourceUrl,studyTarget:target,localEffect:"NOT_ESTABLISHED",measureToVerify:protocol.outcomes.map(x=>x.name).join("; "),potentialHarm:"False reassurance, missed events, extra burden or inequitable access"}]
 };
 const program=buildResearchProgram(spec);
 program.successMeasures=protocol.outcomes.map((x,i)=>({role:i===0?"PRIMARY_DISTAL" as const:"SAFETY_BALANCE" as const,name:x.name,definition:x.definition,cadence:"Prespecified episode/scenario evaluation; not an observed result"}));
 return {schemaVersion:ENVIRONMENTAL_VERSION,protocol,program,bridge:reviewEvidenceToAction(program,[],leads),studyResults:"NOT_COLLECTED" as const,submissionState:"PREPARATION_ONLY" as const};
}

export type ReplayRecord={sourceId:string;lineageId:string;metric:string;unit:string;value:number|null;observedAt:string;availableAt:string;calibrationUntil:string;kind:"OBSERVED"|"MODELED"|"SYNTHETIC"};
export type WaterReplayInput={decisionAt:string;requiredMetrics:string[];expectedUnits:Record<string,string>;records:ReplayRecord[]};
const validDate=(x:unknown)=>{
 if(typeof x!=="string")return false;
 const m=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(?:Z|([+-])(\d{2}):(\d{2}))$/.exec(x);
 if(!m)return false;
 const [year,month,day,hour,minute,second]=m.slice(1,7).map(Number);
 const leap=year%4===0&&(year%100!==0||year%400===0);
 const days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
 return month>=1&&month<=12&&day>=1&&day<=days[month-1]&&hour<=23&&minute<=59&&second<=59&&(!m[7]||(Number(m[8])<=23&&Number(m[9])<=59))&&Number.isFinite(Date.parse(x));
};
/** Metadata/measurement admissibility only. Never infers contamination or safety. */
export function reviewWaterReplay(input:unknown){
 if(!input||typeof input!=="object")throw Error("A bounded replay object is required");
 const x=input as WaterReplayInput;
 if(!validDate(x.decisionAt)||!Array.isArray(x.records)||x.records.length>500||!Array.isArray(x.requiredMetrics)||x.requiredMetrics.length<1||x.requiredMetrics.length>20||!x.expectedUnits||typeof x.expectedUnits!=="object"||Array.isArray(x.expectedUnits))throw Error("Decision timestamp, expected units, 1-20 required metrics and at most 500 records are required");
 if(x.requiredMetrics.some(m=>typeof m!=="string"||!m.trim()||m.length>100)||new Set(x.requiredMetrics).size!==x.requiredMetrics.length)throw Error("Required metric names must be unique and bounded");
 const issues:string[]=[];const admissible:ReplayRecord[]=[];const seen=new Set<string>();const t=Date.parse(x.decisionAt);
 for(const [i,r] of x.records.entries()){
  const prefix="Record "+(i+1)+": ";
  if(!r||typeof r!=="object"){issues.push(prefix+"invalid record");continue;}
  if([r.sourceId,r.lineageId,r.metric,r.unit].some(v=>typeof v!=="string"||!v.trim()||v.length>160)){issues.push(prefix+"source, lineage, metric and unit required");continue;}
  if(!["OBSERVED","MODELED","SYNTHETIC"].includes(r.kind)){issues.push(prefix+"evidence kind missing");continue;}
  if(!validDate(r.observedAt)||!validDate(r.availableAt)||!validDate(r.calibrationUntil)){issues.push(prefix+"timestamps or calibration validity unknown");continue;}
  if(Date.parse(r.observedAt)>Date.parse(r.availableAt)||Date.parse(r.availableAt)>t){issues.push(prefix+"not knowable at the decision time");continue;}
  if(Date.parse(r.calibrationUntil)<Date.parse(r.observedAt)||Date.parse(r.calibrationUntil)<t){issues.push(prefix+"calibration expired for this review");continue;}
  if(r.value===null||typeof r.value!=="number"||!Number.isFinite(r.value)){issues.push(prefix+"measurement missing or invalid; zero was not substituted");continue;}
  if(!Object.hasOwn(x.expectedUnits,r.metric)||x.expectedUnits[r.metric]!==r.unit){issues.push(prefix+"unit or metric mismatch; no conversion inferred");continue;}
  const key=JSON.stringify([r.sourceId,r.metric,r.observedAt]);if(seen.has(key)){issues.push(prefix+"duplicate source record");continue;}seen.add(key);
  admissible.push({...r});
 }
 const observed=admissible.filter(r=>r.kind==="OBSERVED");
 const missing=x.requiredMetrics.filter(m=>!observed.some(r=>r.metric===m));
 const lineages=new Set(admissible.map(r=>r.lineageId));
 if(admissible.length>lineages.size)issues.push("Several admissible records share lineage; record count is not independent source count.");
 return {scope:"REPLAY_METADATA_PREFLIGHT_ONLY" as const,admissibleRecords:admissible.length,observedRecords:observed.length,modeledOrSyntheticRecords:admissible.length-observed.length,lineageCount:lineages.size,missingObservedMetrics:missing,issues,
  state:missing.length||issues.length?"EVIDENCE_REVIEW_REQUIRED":"METADATA_CONSISTENT_NOT_SAFETY_VALIDATED",contaminationDetected:null,waterSafe:null,actionAuthorized:false,limitations:"No chemical or microbial inference, calibration authenticity check, freshness tolerance validation or operating threshold is supplied. These checks do not establish sensor accuracy or a safe reuse decision."};
}
export function exportEnvironmentalResearch(id:EnvironmentalStudy,options:{pi:string;partners:ResearchPartner[];leads?:IntelligenceRecord[]}){
 if(typeof options.pi!=="string"||!options.pi.trim()||options.pi.length>160||!Array.isArray(options.partners)||options.partners.length>12)throw Error("PI and bounded prospective partner list required");
 if(options.partners.some(p=>!p||typeof p.organization!=="string"||!p.organization.trim()||p.organization.length>200||typeof p.proposedRole!=="string"||p.proposedRole.length>500||p.state!=="PROSPECTIVE"))throw Error("This preparation export accepts only prospective partners; verified agreements require the private evidence workflow.");
 return {...buildEnvironmentalResearch(id,options.leads),pi:{name:options.pi.trim(),role:"OWNER_DESIGNATED_NOT_ELIGIBILITY_CERTIFICATION"},partners:options.partners.map(p=>({...p})),externalCommitments:false,externalSubmissionAuthorized:false};
}

/**
 * DIS: disease-agnostic observational evidence contract and county comparison.
 * The initial cohort is a manually transcribed, source-identified NCI
 * colorectal late-stage registry snapshot. Other conditions require separate
 * accepted source records; neither an ECHO facility nor a GIS point is a
 * person-level exposure, cancer diagnosis or validated causal determinant.
 */
export type DiseaseId="colorectal"|"breast"|"lung"|"cervix"|"prostate"|"other";
export type MetricId="incident-disease"|"incident-late-stage"|"late-stage-share"|"mortality"|"screening"|"risk-factor"|"environmental-context";
export type EvidenceGrade="OBSERVED_REGISTRY_AGGREGATE"|"MODELED_SMALL_AREA"|"DESCRIPTIVE_CONTEXT"|"HYPOTHESIS"|"UNAVAILABLE";
export type HealthObservation={
 id:string; disease:DiseaseId; metric:MetricId; countyFips:string;
 county:string; region:string; anchorCity:string;
 lat:number; lon:number; referencePeriod:string;
 value:number; unit:string; ciLow:number|null; ciHigh:number|null;
 lateStagePercent:number|null; averageAnnualCount:number|null;
 evidenceGrade:EvidenceGrade; sourceUrl:string;
 sourceInstitution:string; denominator:string; limitation:string;
};
export const NCI_PERIOD="2018–2022";
export const NCI_SOURCE="NCI/CDC State Cancer Profiles, SEER+NPCR";
export const NCI_BASE="https://statecancerprofiles.cancer.gov/incidencerates/index.php";
export const SOURCE_LINKS=[
 {id:"nci-profiles",name:"NCI/CDC State Cancer Profiles",url:"https://statecancerprofiles.cancer.gov/",use:"Observed population cancer incidence, case stage and uncertainty",status:"CURATED_COHORT_NOT_LIVE_IMPORT",grade:"OBSERVED_REGISTRY_AGGREGATE"},
 {id:"nci-cancer-atlas",name:"NCI Cancer Atlas",url:"https://gis.cancer.gov/canceratlas/",use:"Existing official county/health-service-area GIS and original downloadable data",status:"EXTERNAL_FEDERATED_VIEW",grade:"OBSERVED_REGISTRY_AGGREGATE"},
 {id:"cdc-places",name:"CDC PLACES",url:"https://www.cdc.gov/places/about/",use:"Modeled local health and screening estimates; not a causal treatment evaluation",status:"CATALOG_NOT_INGESTED",grade:"MODELED_SMALL_AREA"},
 {id:"acs",name:"American Community Survey",url:"https://www.census.gov/programs-surveys/acs",use:"Population structure, poverty, insurance, housing, travel and economic environment",status:"CATALOG_NOT_INGESTED",grade:"DESCRIPTIVE_CONTEXT"},
 {id:"epa-echo",name:"EPA ECHO Facilities Map Service",url:"https://echo.epa.gov/tools/map-service",use:"Weekly updated EPA-regulated facility locations, compliance and inspection context",status:"PUBLIC_MAP_OVERLAY_OPTIONAL",grade:"DESCRIPTIVE_CONTEXT"},
 {id:"usda-food",name:"USDA Food Environment Atlas",url:"https://www.ers.usda.gov/data-products/food-environment-atlas",use:"County-level food-access and food-environment indicators",status:"CATALOG_NOT_INGESTED",grade:"DESCRIPTIVE_CONTEXT"},
 {id:"cdc-svi",name:"CDC/ATSDR Social Vulnerability Index",url:"https://www.atsdr.cdc.gov/place-health/php/svi/",use:"Structural vulnerability and community planning, not individual disease susceptibility",status:"CATALOG_NOT_INGESTED",grade:"DESCRIPTIVE_CONTEXT"}
] as const;
export type DiseaseSource = {
 id:DiseaseId;name:string;primaryOutcome:string;preventionQuestion:string;
 observedCountyData:boolean; stageDefinition:string; canonicalSource:string;
};
export const DISEASES:DiseaseSource[]=[
 {id:"colorectal",name:"Colorectal cancer",primaryOutcome:"Age-standardized incidence of new invasive colorectal cancers",preventionQuestion:"Which preventable causes, precancerous lesions and protective conditions change new disease incidence?",observedCountyData:true,stageDefinition:"Regional or distant stage",canonicalSource:"https://gis.cancer.gov/canceratlas/"},
 {id:"breast",name:"Female breast cancer",primaryOutcome:"Age-standardized new invasive breast cancer incidence",preventionQuestion:"Which modifiable and nonmodifiable causes, individual risk and exposures influence incidence?",observedCountyData:false,stageDefinition:"Cancer-specific staging; do not recycle colorectal thresholds",canonicalSource:"https://gis.cancer.gov/canceratlas/"},
 {id:"lung",name:"Lung cancer",primaryOutcome:"Age-standardized new invasive lung cancer incidence",preventionQuestion:"What roles do tobacco use, radon, occupational and air exposures play?",observedCountyData:false,stageDefinition:"Cancer-specific staging",canonicalSource:"https://gis.cancer.gov/canceratlas/"},
 {id:"cervix",name:"Cervical cancer",primaryOutcome:"Age-standardized new invasive cervical cancer incidence",preventionQuestion:"What preventable infections, vaccine and follow-up pathway gaps explain new disease?",observedCountyData:false,stageDefinition:"Cancer-specific staging",canonicalSource:"https://gis.cancer.gov/canceratlas/"},
 {id:"prostate",name:"Prostate cancer",primaryOutcome:"Age-standardized new prostate cancer incidence",preventionQuestion:"Which inherited and age-related risks, diagnostic changes and biases explain observed incidence?",observedCountyData:false,stageDefinition:"Cancer-specific staging",canonicalSource:"https://gis.cancer.gov/canceratlas/"},
 {id:"other",name:"Other disease or condition",primaryOutcome:"Condition-specific incidence among the eligible at-risk population",preventionQuestion:"What factors cause new disease, and what valid data distinguish its mechanisms?",observedCountyData:false,stageDefinition:"Must be defined by disease-specific experts",canonicalSource:"https://www.cdc.gov/"}
];
const source=(st:string)=>NCI_BASE+"?age=001&areatype=county&cancer=020&race=00&ruralurban=0&sex=0&sortOrder=desc&sortVariableName=count&stage=211&statefips="+st+"&type=incd&year=0";
const wrap=(id:string,county:string,region:string,fips:string,city:string,lat:number,lon:number,rate:number,ciLow:number,ciHigh:number,count:number,pct:number,stateFips:string):HealthObservation=>({
 id,disease:"colorectal",metric:"incident-late-stage",countyFips:fips,county,region,anchorCity:city,lat,lon,
 referencePeriod:NCI_PERIOD,value:rate,unit:"age-adjusted annual cases per 100,000",
 ciLow,ciHigh,lateStagePercent:pct,averageAnnualCount:count,
 evidenceGrade:"OBSERVED_REGISTRY_AGGREGATE",sourceUrl:source(stateFips),sourceInstitution:NCI_SOURCE,
 denominator:"Age-standardized county population for incidence; all newly diagnosed colorectal cases for late-stage percentage",
 limitation:"The plotted point marks an approximate city anchor, NOT county boundaries or individual risk. The percentage and age-adjusted rate have different denominators. No causal inference."
});
/** All selected comparators have >=100 average late-stage cases annually; Hinds is a 76-case/year, 5-year (~380 total) sentinel retained with its CI. */
export const CURATED_COUNTIES:HealthObservation[]=[
 wrap("hinds","Hinds County","MS","28049","Jackson",32.2988,-90.1848,30.4,27.3,33.8,76,63.3,"28"),
 wrap("harris","Harris County","TX","48201","Houston",29.7604,-95.3698,23.3,22.7,24.0,1044,63.4,"48"),
 wrap("dallas","Dallas County","TX","48113","Dallas",32.7767,-96.7970,22.9,22.1,23.8,568,62.5,"48"),
 wrap("travis","Travis County","TX","48453","Austin",30.2672,-97.7431,21.8,20.6,23.1,257,63.7,"48"),
 wrap("fort-bend","Fort Bend County","TX","48157","Sugar Land",29.6197,-95.6349,19.7,18.3,21.2,164,58.1,"48"),
 wrap("cook","Cook County","IL","17031","Chicago",41.8781,-87.6298,23.6,23.1,24.2,1416,62.0,"17"),
 wrap("will","Will County","IL","17197","Joliet",41.5250,-88.0817,25.9,24.2,27.6,197,65.6,"17"),
 wrap("kane","Kane County","IL","17089","Aurora",41.7606,-88.3201,21.8,20.1,23.7,126,63.5,"17"),
 wrap("fulton","Fulton County","GA","13121","Atlanta",33.7490,-84.3880,21.9,20.6,23.2,233,59.1,"13"),
 wrap("gwinnett","Gwinnett County","GA","13135","Lawrenceville",33.9562,-83.9879,21.9,20.5,23.3,201,63.1,"13"),
 wrap("dekalb","DeKalb County","GA","13089","Decatur",33.7748,-84.2963,21.3,19.9,22.9,169,59.7,"13"),
 wrap("los-angeles","Los Angeles County","CA","06037","Los Angeles",34.0522,-118.2437,18.9,18.5,19.3,2099,54.3,"06"),
 wrap("san-diego","San Diego County","CA","06073","San Diego",32.7157,-117.1611,19.5,18.9,20.2,708,56.8,"06"),
 wrap("orange-ca","Orange County","CA","06059","Santa Ana",33.7455,-117.8677,18.2,17.6,18.8,670,56.7,"06"),
 wrap("mobile","Mobile County","AL","01097","Mobile",30.6954,-88.0399,26.1,24.0,28.2,129,58.7,"01")
];
export const COMPARATOR_MIN_ANNUAL=100;
export function comparisonCohort(rows:readonly HealthObservation[]=CURATED_COUNTIES,minAnnual=COMPARATOR_MIN_ANNUAL){
 if(!Number.isFinite(minAnnual)||minAnnual<1)throw Error("Positive minimum observed annual count required");
 return rows.filter(x=>x.averageAnnualCount!==null&&x.averageAnnualCount>=minAnnual);
}
export function findSimilarStageShares(anchor:HealthObservation,rows:readonly HealthObservation[]=CURATED_COUNTIES,maximumDifference=1,minAnnual=COMPARATOR_MIN_ANNUAL){
 if(!Number.isFinite(maximumDifference)||maximumDifference<0)throw Error("Invalid percent-point similarity tolerance");
 return comparisonCohort(rows,minAnnual).filter(x=>x.id!==anchor.id&&x.disease===anchor.disease&&x.referencePeriod===anchor.referencePeriod&&
  x.lateStagePercent!==null&&anchor.lateStagePercent!==null&&Math.abs(x.lateStagePercent-anchor.lateStagePercent)<=maximumDifference)
  .map(x=>({county:x,shareDifferencePP:Math.abs(x.lateStagePercent!-anchor.lateStagePercent!),
    rateDifferencePercent:100*(x.value-anchor.value)/anchor.value,
    nonoverlappingRateCIs:anchor.ciHigh!==null&&anchor.ciLow!==null&&x.ciLow!==null&&x.ciHigh!==null&&
      (anchor.ciLow>x.ciHigh||x.ciLow>anchor.ciHigh),
    interpretation:"Descriptive matching, not statistical equivalence or shared causation."}))
  .sort((a,b)=>a.shareDifferencePP-b.shareDifferencePP||b.county.averageAnnualCount!-a.county.averageAnnualCount!);
}
export type EvidenceGateStatus="READY_TO_COMPARE"|"NO_VALID_OBSERVATIONS"|"MISSING_CAUSAL_DESIGN";
export function evidenceGate(disease:DiseaseId,metric:MetricId){
 const has=CURATED_COUNTIES.some(x=>x.disease===disease&&x.metric===metric);
 return {status:has?"READY_TO_COMPARE" as EvidenceGateStatus:"NO_VALID_OBSERVATIONS" as EvidenceGateStatus,
  causalStatus:"MISSING_CAUSAL_DESIGN" as const,
  note:has?"Descriptive, source-identified county observations only; environmental context does not attribute exposure or disease.":"This measure has no approved locally bound observation in this curated cohort. Select the correct official disease-specific dataset and provenance before showing a rate."};
}
export const COUNTERFACTUALS=[
 {id:"statusquo",label:"Continue competent current care",design:"Reconstruct existing standards, risk reduction, screening, abnormal-result closure and clinical practice as actually delivered. Measure secular trends and policy changes."},
 {id:"prevention",label:"Primary prevention system",design:"Compare realistic, evidence-based reductions in tobacco, alcohol, obesity, sedentary behavior and dietary exposures, stratified by risk and socioeconomic context; observe incident cancer with latency."},
 {id:"precancer",label:"Precancer interception",design:"Evaluate age- and risk-appropriate screening, actual adenoma detection/removal and appropriate follow-up rather than only cancer deaths."},
 {id:"hybrid",label:"Prevention + navigation + accountable diagnostic closure",design:"Couple upstream environmental and behavioral risk reduction with safe detection and complete positive-test follow-up; audit costs, equity and harms."}
] as const;

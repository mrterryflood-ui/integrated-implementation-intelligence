/**
 * DIS × RPLICE study cohort registry (research geography, not a disease estimate).
 * National evidence first. Focal regions are deliberately differentiated from
 * their approximating county boundaries. New York City is FIVE counties.
 *
 * Working study has 6 state policy contexts, 5 named cities plus CO statewide.
 * Denver County is optional Colorado urban comparison, not a substitute for CO.
 * HIL method choices, consent, and provider authorization stay separate.
 */
export const COHORT_VERSION="dis-rplice-six-state-study-cohort-2026-11-06" as const;
export type CohortScope="COUNTY_PROXY"|"FIVE_COUNTY_CITY"|"STATEWIDE";
export type SiteCode="JACKSON_MS"|"HOUSTON_TX"|"COLORADO_CO"|"NEW_YORK_CITY_NY"|"LOS_ANGELES_CA"|"CHARLOTTE_NC";
export type StudySite={
 id:SiteCode;name:string;state:string;stateFips:string;scope:CohortScope;
 countyFips:readonly string[];countyNames:readonly string[];
 geographyCaveat:string;firstCompare:string;cityEquivalentToCounty:boolean;
};
export const SIX_STUDY_SITES:readonly StudySite[]=[
 {id:"JACKSON_MS",name:"Jackson, Mississippi",state:"Mississippi",stateFips:"28",scope:"COUNTY_PROXY",
  countyFips:["28049"],countyNames:["Hinds"],geographyCaveat:"Hinds County contains other places; county rates are not City of Jackson rates.",
  firstCompare:"Harris County; city versus rural Mississippi and historical socioeconomic conditions.",cityEquivalentToCounty:false},
 {id:"HOUSTON_TX",name:"Houston, Texas",state:"Texas",stateFips:"48",scope:"COUNTY_PROXY",
  countyFips:["48201"],countyNames:["Harris"],geographyCaveat:"Harris County is a county-wide reference, not the municipal Houston boundary; Houston extends into other counties.",
  firstCompare:"Hinds County; high within-county ethnic, economic, social and health-access heterogeneity.",cityEquivalentToCounty:false},
 {id:"COLORADO_CO",name:"Colorado — statewide comparator",state:"Colorado",stateFips:"08",scope:"STATEWIDE",
  countyFips:[],countyNames:[],geographyCaveat:"The statewide policy context is not interchangeable with Denver County or any single Colorado city; Denver County FIPS 08031 is an optional stratified urban comparator.",
  firstCompare:"High-similarity colorectal stage shares with different population incidence; compare within-race/age/sex and rural/urban strata.",cityEquivalentToCounty:false},
 {id:"NEW_YORK_CITY_NY",name:"New York City, New York",state:"New York",stateFips:"36",scope:"FIVE_COUNTY_CITY",
  countyFips:["36005","36047","36061","36081","36085"],countyNames:["Bronx","Kings (Brooklyn)","New York (Manhattan)","Queens","Richmond (Staten Island)"],
  geographyCaveat:"NYC comprises FIVE counties. New York County means Manhattan only. Do not sum age-adjusted county rates or average stage shares to estimate NYC; use a defensible NYC city-level rate or age-stratified pooled cases and denominators.",
  firstCompare:"Within-city borough disparities and NY state policy; avoid assigning a single race or socioeconomic profile to all NYC boroughs.",cityEquivalentToCounty:false},
 {id:"LOS_ANGELES_CA",name:"Los Angeles, California",state:"California",stateFips:"06",scope:"COUNTY_PROXY",
  countyFips:["06037"],countyNames:["Los Angeles"],
  geographyCaveat:"Los Angeles County includes many municipalities and unincorporated areas. County-wide cancer rate is not a City of Los Angeles rate.",
  firstCompare:"New York City and Houston urban contrasts; historical exposures, immigration, insurance, housing, environmental burdens and access.",cityEquivalentToCounty:false},
 {id:"CHARLOTTE_NC",name:"Charlotte, North Carolina",state:"North Carolina",stateFips:"37",scope:"COUNTY_PROXY",
  countyFips:["37119"],countyNames:["Mecklenburg"],
  geographyCaveat:"Mecklenburg County contains more than Charlotte; the city's extent is not identical to the county.",
  firstCompare:"The three cancers and the women's health diagnostic pathway in an NC expansion-policy context.",cityEquivalentToCounty:false},
] as const;
export const FOCAL_STATES=["Mississippi","Texas","Colorado","New York","California","North Carolina"] as const;

export type StudyCondition={id:string;name:string;category:"CANCER"|"WOMENS_HEALTH";primaryEndpoint:string;populationDefinition:string;dataState:string;diagnosisRisk:string};
export const STUDY_CONDITIONS:readonly StudyCondition[]=[
 {id:"colorectal",name:"Invasive colorectal cancer",category:"CANCER",
  primaryEndpoint:"Age-adjusted all-stage incident cancers per 100,000 person-years",
  populationDefinition:"All sexes, age- and race-stratified where published",
  dataState:"2019–2023 national state stage/late incidence public aggregate assembled in both systems; county and race-by-place extracts need coherent versioned validation.",
  diagnosisRisk:"Screening and diagnosis can change case detection; polypectomy can also prevent new incidence."},
 {id:"lung",name:"Invasive lung and bronchus cancer",category:"CANCER",
  primaryEndpoint:"Age-adjusted all-stage incident cancers per 100,000 person-years",
  populationDefinition:"All sexes, model smoking history and sex as distinct dimensions",
  dataState:"2019–2023 national state stage/late incidence public aggregate assembled in both systems; county harmonization not complete.",
  diagnosisRisk:"LDCT screens appropriate high-risk people but generally detects cancer rather than preventing its initial occurrence."},
 {id:"breast",name:"Invasive female breast cancer",category:"CANCER",
  primaryEndpoint:"Age-adjusted all-stage incident cancers per 100,000 female person-years",
  populationDefinition:"Female cancer registry rate denominator; age, race, subtype and detection-adjusted analyses",
  dataState:"2019–2023 national state stage/late incidence public aggregate assembled in both systems; county harmonization not complete.",
  diagnosisRisk:"Mammography detects disease; subtype, treatment and overdiagnosis patterns affect comparisons."},
 {id:"endometriosis",name:"Endometriosis",category:"WOMENS_HEALTH",
  primaryEndpoint:"Validated diagnosed and estimated underlying prevalence separated, plus symptom-to-diagnosis delay",
  populationDefinition:"Women with appropriate age and condition criteria; ensure inclusive interpretation of reproductive-health service needs",
  dataState:"2022–2023 national self-reported lifetime diagnosis comparator available; no defensible six-state prevalence series assembled.",
  diagnosisRisk:"Not classified as an established autoimmune disease; diagnostic recognition and access can cause measured prevalence differences."},
 {id:"pcos",name:"Polycystic ovary syndrome (PCOS)",category:"WOMENS_HEALTH",
  primaryEndpoint:"Clinically defined prevalence and time-to-correct-diagnosis, with socioeconomic and racial equity measures",
  populationDefinition:"Condition-specific reproductive age, diagnostic criteria and subgroup definitions",
  dataState:"2022–2023 national self-reported ever-diagnosed comparator available; state and city clinical case definitions not harmonized.",
  diagnosisRisk:"Phenotype and diagnostic criteria vary; lower reported diagnoses do not establish lower underlying prevalence."},
 {id:"fibroids",name:"Uterine fibroids",category:"WOMENS_HEALTH",
  primaryEndpoint:"Validated disease prevalence and patient-important symptom, treatment, fertility and quality-of-life outcomes",
  populationDefinition:"Women with condition-specific age, race and health-outcome definitions",
  dataState:"2022–2023 national self-reported ever-diagnosed comparator available; cross-state validated prevalence and treatment equity remain open.",
  diagnosisRisk:"Care access, symptom severity, radiologic recognition, treatment choice, hysterectomy history and structural inequities change observed rates."},
] as const;
export const AUTOIMMUNE_COMPARATOR={
 condition:"Systemic lupus erythematosus (SLE)",status:"SEVENTH_SPECIALIST_COMPARATOR_NOT_SIX_CORE_ENDPOINTS",
 purpose:"Genuine autoimmune disease comparator to test claims about inflammation, recognition, race/sex and access. Do not relabel endometriosis autoimmune.",
 sourceRequirement:"CDC Lupus Registries and comparable cohort evidence; prevalence definitions, race/sex/age and geographic coverage must be verified."
} as const;
export type DeliveryPhase="CURRENT_STUDY"|"DEFERRED_UNTIL_STUDY_COMPLETE";
export const POST_STUDY_HEALTHCARE_EQUITY_HANDOFF={
 id:"FUTURE-HEALTH-EQUITY-PLATFORM-TRANSFER",
 phase:"DEFERRED_UNTIL_STUDY_COMPLETE" as DeliveryPhase,
 description:"Translate verified, race/age/sex/place/condition-specific mechanisms and evidence into existing healthcare platforms (HerHealth, MaleHealth, ThriveUp/Virtual CHW and aligned products), not duplicate engines.",
 trigger:"A completed reproducible six-state, nationwide-referenced and six-condition report; peer-critique and independent correction of source, measures, causal claims and implementation applicability; documented human approval.",
 inputs:["Verified epidemiologic disparities and their uncertainty","Valid exposure–mechanism or diagnostic pathways","Local stakeholder confirmation","Target intervention and counterfactual","Clinical and privacy review for any individual-level implementation"],
 outputs:["State/condition-tailored equity dashboards with provenance","Plain-language community/official/provider versions","Implementation plan, owners, costs, fidelity and adaptation","Monitoring, harm, equity and sustainment plan"],
 now:"NOT_STARTED; no changes authorized to independent healthcare platform repositories."
} as const;
export function validateSixStudySites(){
 const states=new Set(SIX_STUDY_SITES.map(x=>x.state));
 const allFips=SIX_STUDY_SITES.flatMap(x=>x.countyFips);
 return {
  oneNationalReference:true,siteCount:SIX_STUDY_SITES.length,stateCount:states.size,
  uniqueFips:new Set(allFips).size===allFips.length,
  newYorkCityFiveCounties:SIX_STUDY_SITES.find(s=>s.id==="NEW_YORK_CITY_NY")?.countyFips.length===5,
  conditions:STUDY_CONDITIONS.length,postStudyNotExecuted:POST_STUDY_HEALTHCARE_EQUITY_HANDOFF.now.startsWith("NOT_STARTED")
 };
}

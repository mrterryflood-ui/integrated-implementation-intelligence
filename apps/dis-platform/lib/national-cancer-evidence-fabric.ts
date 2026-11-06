/**
 * Nationwide population-health evidence fabric: source discovery + comparable-cohort rule.
 *
 * A catalog entry does NOT represent a live data connection, authorized user access,
 * signed DUA, actual research finding, clinical determination, or spatial causal link.
 * This fabric is disease-agnostic: source suitability is evaluated at the level of
 * outcome, population, strata, time, geography and provenance.
 */
export type EvidenceRole="POPULATION_OUTCOME"|"ENVIRONMENTAL_EXPOSURE"|"DEMOGRAPHIC_CONTEXT"|"BIOLOGICAL_MECHANISM"|"CARE_PROCESS";
export type AccessClass="PUBLIC"|"INDIVIDUAL_REGISTRATION"|"SEPARATE_APPROVAL_REQUIRED";
export type ConnectionClaim="PUBLIC_SOURCE_IDENTIFIED_NOT_INGESTED"|"CURATED_AGGREGATE_ONLY"|"INDIVIDUAL_AUTHENTICATION_NOT_ESTABLISHED";
export type SourceContract={
 id:string;title:string;owner:string;url:string;
 role:EvidenceRole;access:AccessClass;connection:ConnectionClaim;
 geographicUnit:string;timeConstraint:string;legitimateUse:string;cannotInfer:string;
};

export const NATIONAL_HEALTH_SOURCE_CONTRACTS:readonly SourceContract[]=[
 {id:"cdc-uscs",title:"U.S. Cancer Statistics — complete national registry",owner:"CDC NPCR and NCI SEER",
  url:"https://www.cdc.gov/united-states-cancer-statistics/dataviz/index.html",role:"POPULATION_OUTCOME",access:"PUBLIC",
  connection:"PUBLIC_SOURCE_IDENTIFIED_NOT_INGESTED",geographicUnit:"Nation, state, county when officially reported",
  timeConstraint:"June 2026 data release, incident diagnoses through 2023; latest 2019–2023 5-year series",
  legitimateUse:"Primary nation-state-county disease incidence/stage comparisons; stratify on compatible reported race, age, sex and rurality cells",
  cannotInfer:"Patient-specific disease; unsuppressed small counts; facility exposure; geographic or causal effect from a summary rate"},
 {id:"nci-scp",title:"NCI State Cancer Profiles — published county aggregates",owner:"National Cancer Institute",
  url:"https://statecancerprofiles.cancer.gov/",role:"POPULATION_OUTCOME",access:"PUBLIC",
  connection:"CURATED_AGGREGATE_ONLY",geographicUnit:"County and state subject to source filtering",
  timeConstraint:"Historical 2018–2022 curated Hinds/Harris case; must reextract matching 2019–2023 cohort for national comparison",
  legitimateUse:"Preserve previously verified county late-stage share, annual case count and late-stage age-adjusted rate as separate outcomes",
  cannotInfer:"2018–2022 county measures are not directly pooled with a 2019–2023 state series or Jackson/Houston city estimates"},
 {id:"nci-seer-research",title:"NCI SEER Research Data (individual registered)",owner:"National Cancer Institute",
  url:"https://seer.cancer.gov/data/",role:"POPULATION_OUTCOME",access:"INDIVIDUAL_REGISTRATION",
  connection:"INDIVIDUAL_AUTHENTICATION_NOT_ESTABLISHED",geographicUnit:"SEER registry analysis; restricted detailed geography not released in Research Data",
  timeConstraint:"1975–2023 November 2025 submission; release and DUA version must be cited",
  legitimateUse:"Authorized person can use SEER*Stat to analyze permitted site, subtype, age, sex, race and stage; only publish approved nonidentifying aggregates",
  cannotInfer:"Account ownership proves application data connection; full national coverage; county location or exposure linkage; reidentifiable cases"},
 {id:"nci-seer-plus",title:"NCI SEER Research Plus — detailed geographic variables",owner:"National Cancer Institute",
  url:"https://seer.cancer.gov/data/access.html",role:"POPULATION_OUTCOME",access:"SEPARATE_APPROVAL_REQUIRED",
  connection:"INDIVIDUAL_AUTHENTICATION_NOT_ESTABLISHED",geographicUnit:"Approved SEER restricted geographic variables only",
  timeConstraint:"Approval and individual DUA version separate from Research Data",
  legitimateUse:"Only separately authorized researcher may conduct appropriately permitted geographic analyses",
  cannotInfer:"Research Data account approval automatically includes Research Plus or USCS case-level database access"},
 {id:"nci-gdc",title:"NCI Genomic Data Commons public molecular cohorts",owner:"National Cancer Institute",
  url:"https://portal.gdc.cancer.gov/",role:"BIOLOGICAL_MECHANISM",access:"PUBLIC",
  connection:"PUBLIC_SOURCE_IDENTIFIED_NOT_INGESTED",geographicUnit:"Selected tumor/cohort material; not a census or national resident denominator",
  timeConstraint:"Dataset program and sample vintage; preserve selection bias",
  legitimateUse:"Molecular subtype and pathogenic mechanism hypotheses, not population incidence estimation",
  cannotInfer:"Population prevalence, county risk, germline susceptibility from tumor-only profiles, or data access to controlled genomic records"},
 {id:"epa-echo",title:"EPA ECHO regulated-facility GIS points",owner:"U.S. Environmental Protection Agency",
  url:"https://echo.epa.gov/tools/map-service",role:"ENVIRONMENTAL_EXPOSURE",access:"PUBLIC",
  connection:"PUBLIC_SOURCE_IDENTIFIED_NOT_INGESTED",geographicUnit:"Reported facility point and county FIPS",
  timeConstraint:"Current inventory is not a historic 10–30-year exposure profile",
  legitimateUse:"Discover locations and program histories to nominate chemical, water, air and occupational exposure questions",
  cannotInfer:"Facility proximity is measured individual dose, pollution harm or evidence that a facility caused cancer"},
 {id:"epa-tri",title:"EPA Toxics Release Inventory",owner:"U.S. Environmental Protection Agency",
  url:"https://www.epa.gov/toxics-release-inventory-tri-program",role:"ENVIRONMENTAL_EXPOSURE",access:"PUBLIC",
  connection:"PUBLIC_SOURCE_IDENTIFIED_NOT_INGESTED",geographicUnit:"Facility, chemical, reporting year, release medium",
  timeConstraint:"Lag releases and migration history to plausible disease latency",
  legitimateUse:"Assess potential historical chemicals and release pathways against appropriately matched disease outcomes",
  cannotInfer:"Emissions = absorbed dose or person-specific exposure; TRI identifies every source or pollutant"},
 {id:"epa-superfund",title:"EPA Superfund site histories",owner:"U.S. Environmental Protection Agency",
  url:"https://www.epa.gov/superfund/superfund-national-priorities-list-npl",role:"ENVIRONMENTAL_EXPOSURE",access:"PUBLIC",
  connection:"PUBLIC_SOURCE_IDENTIFIED_NOT_INGESTED",geographicUnit:"Sites, contaminant footprints and verified history when published",
  timeConstraint:"Contamination chronology and remediation phases, not just current pins",
  legitimateUse:"Form chemical-specific exposure, pathway and latency hypotheses",
  cannotInfer:"Site presence causes colorectal cancer or indicates that adjacent residences were exposed"},
 {id:"epa-aqs",title:"EPA Air Quality System monitoring",owner:"U.S. Environmental Protection Agency",
  url:"https://www.epa.gov/aqs",role:"ENVIRONMENTAL_EXPOSURE",access:"PUBLIC",
  connection:"PUBLIC_SOURCE_IDENTIFIED_NOT_INGESTED",geographicUnit:"Monitors, pollutant and time interval; area interpolation requires method",
  timeConstraint:"Historical exposure window with monitoring gaps",
  legitimateUse:"Test environmental air hypotheses with adequate covariates and quantified uncertainty",
  cannotInfer:"Nearest monitor equals individual dose or unmeasured past exposure"},
 {id:"usda-food",title:"USDA Food Environment Atlas",owner:"USDA Economic Research Service",
  url:"https://www.ers.usda.gov/data-products/food-environment-atlas/",role:"DEMOGRAPHIC_CONTEXT",access:"PUBLIC",
  connection:"PUBLIC_SOURCE_IDENTIFIED_NOT_INGESTED",geographicUnit:"County indicators for types of restaurants, stores, food assistance and consumption proxies",
  timeConstraint:"Each measure has its own reporting vintage and denominator",
  legitimateUse:"Generate hypotheses about food retail/restaurant context, availability and health-system interactions",
  cannotInfer:"Restaurant density equals individual diet, food chemistry or carcinogenicity"},
 {id:"usda-food-access",title:"USDA Food Access Research Atlas",owner:"USDA Economic Research Service",
  url:"https://www.ers.usda.gov/data-products/food-access-research-atlas/",role:"DEMOGRAPHIC_CONTEXT",access:"PUBLIC",
  connection:"PUBLIC_SOURCE_IDENTIFIED_NOT_INGESTED",geographicUnit:"Census tract with vintage-specific definitions",
  timeConstraint:"Tract boundaries and version must align before spatial joins",
  legitimateUse:"Assess location and distance of grocery access, rural/urban context and resource barriers",
  cannotInfer:"Individual diet, hereditary risk or food consumed"},
 {id:"census-acs",title:"American Community Survey",owner:"U.S. Census Bureau",
  url:"https://www.census.gov/programs-surveys/acs",role:"DEMOGRAPHIC_CONTEXT",access:"PUBLIC",
  connection:"PUBLIC_SOURCE_IDENTIFIED_NOT_INGESTED",geographicUnit:"State, county, tract where statistically supported",
  timeConstraint:"5-year intervals with sampling and ACS uncertainty",
  legitimateUse:"Compare population denominators, income, race/ethnicity, age, insurance, housing, workforce and urbanicity",
  cannotInfer:"The identity or risk profile of cancer patients from aggregate county population composition"},
 {id:"cdc-places",title:"CDC PLACES modeled health indicators",owner:"Centers for Disease Control and Prevention",
  url:"https://www.cdc.gov/places/",role:"DEMOGRAPHIC_CONTEXT",access:"PUBLIC",
  connection:"PUBLIC_SOURCE_IDENTIFIED_NOT_INGESTED",geographicUnit:"County, place, tract and other modeled geographies depending on release",
  timeConstraint:"Model vintage and original survey observation window must be recorded",
  legitimateUse:"Hypotheses about population health and prevention gaps with modeled-data warnings",
  cannotInfer:"Observed patient screening completions or causal local intervention effects"},
 {id:"brfss",title:"Behavioral Risk Factor Surveillance System",owner:"Centers for Disease Control and Prevention",
  url:"https://www.cdc.gov/brfss/",role:"CARE_PROCESS",access:"PUBLIC",
  connection:"PUBLIC_SOURCE_IDENTIFIED_NOT_INGESTED",geographicUnit:"Survey populations; state and supported strata, not universal county measures",
  timeConstraint:"Survey year, eligibility ages and self-report definitions must match comparison purpose",
  legitimateUse:"Screening and behavior context, including how prevalence varies by age/race/sex when reliable",
  cannotInfer:"Why a registry-defined cancer case was diagnosed late; diagnosis pathway completion"},
] as const;

export type CohortMeasurement={
 condition:string;metric:"ALL_STAGE_INCIDENCE"|"LATE_STAGE_INCIDENCE"|"LATE_STAGE_CASE_SHARE"|"MORTALITY"|"SCREENING_COVERAGE";
 stageDefinition:string;periodStart:number;periodEnd:number;
 ageStratum:string;sexStratum:string;raceEthnicityStratum:string;
 ascertainment:string;geography:string;sourceId:string;
 numeratorDefinition:string;denominatorDefinition:string;
 annualCaseCount:number|null;rateCI?:readonly [number,number];
 standardPopulation:string;
};
export type ComparabilityResult={comparable:boolean;reasons:string[];precisionWarning:string|null};
/** Consistency gate, not a claim of statistical equivalence or causal transportability. */
export function assessComparablePopulations(a:CohortMeasurement,b:CohortMeasurement,minimumAnnualCases=100):ComparabilityResult{
 const reasons:string[]=[];
 for(const key of ["condition","metric","stageDefinition","periodStart","periodEnd","ageStratum",
   "sexStratum","raceEthnicityStratum","ascertainment","numeratorDefinition","denominatorDefinition","standardPopulation"] as const){
  if(a[key]!==b[key])reasons.push("Mismatch: "+key);
 }
 const sourceA=NATIONAL_HEALTH_SOURCE_CONTRACTS.find(x=>x.id===a.sourceId);
 const sourceB=NATIONAL_HEALTH_SOURCE_CONTRACTS.find(x=>x.id===b.sourceId);
 if(!sourceA||!sourceB)reasons.push("Unregistered original source");
 if(a.annualCaseCount===null||b.annualCaseCount===null)return {comparable:reasons.length===0,
   reasons,precisionWarning:"At least one site lacks an observed annual case count; uncertainty not evaluated."};
 if(!Number.isFinite(a.annualCaseCount)||!Number.isFinite(b.annualCaseCount)||a.annualCaseCount<0||b.annualCaseCount<0)
  reasons.push("Invalid case count");
 const below=Math.min(a.annualCaseCount,b.annualCaseCount)<minimumAnnualCases;
 return {comparable:reasons.length===0,reasons,
  precisionWarning:below?"Exploratory low-count site: inspect confidence intervals, count suppression, time stability and hierarchical shrinkage; do not rank.":(!a.rateCI||!b.rateCI)?"No confidence interval supplied: verify uncertainty before ranking or interpreting closeness.":null};
}
export function sourcesForRole(role:EvidenceRole){return NATIONAL_HEALTH_SOURCE_CONTRACTS.filter(x=>x.role===role);}

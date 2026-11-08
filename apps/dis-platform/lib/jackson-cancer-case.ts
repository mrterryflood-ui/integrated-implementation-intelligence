/** Public-source reference case — Jackson, Mississippi.
 * IMPORTANT: NCI values concern HINDS COUNTY, not Jackson city and not
 * Jackson County, Mississippi. Period is 2018–2022; published rates are not
 * contemporaneous city-specific findings or program evaluation results.
 */
import type {ResearchProgramSpec,SiteKey,ResearchIndicator,DataSource,PopulationStratum,DriverQuestion,StrategyCandidate} from "./research-program";
const CRC_URL="https://www.statecancerprofiles.cancer.gov/incidencerates/index.php?age=001&areatype=county&cancer=020&graph=2&race=00&ruralurban=0&sex=0&sortOrder=desc&sortVariableName=count&stage=211&statefips=28&type=incd&year=0";
const BREAST_URL="https://statecancerprofiles.cancer.gov/incidencerates/index.php?age=001&areatype=county&cancer=055&race=00&ruralurban=0&sex=2&sortOrder=desc&sortVariableName=count&stage=211&statefips=28&type=incd";
const base=(id:string,label:string,site:SiteKey,value:number,unit:string,num:string,den:string,url:string,limit:string,ci?:[number,number]):ResearchIndicator=>({
  id,label,site,value,unit,numeratorDefinition:num,denominatorDefinition:den,
  period:"2018–2022 (multi-year annualized incidence or case share)",
  sourceUrl:url,sourceOwner:"National Cancer Institute — State Cancer Profiles / Mississippi registry",geography:"Hinds County, MS",
  evidenceState:"PUBLISHED_AGGREGATE",sourceLimit:limit,...(ci?{confidenceInterval:ci}:{})
});
export const JACKSON_CANCER_INDICATORS:ResearchIndicator[]=[
  base("CRC-LATE-INC","Colorectal cancer late-stage age-adjusted incidence", "colorectal",30.4,"cases per 100,000 annually",
    "Incident colorectal cancers classified late-stage (according to NCI definition)",
    "Age-adjusted resident population under NCI rate standard",CRC_URL,
    "Historical Hinds County rate; not Jackson city, not the population share of late-stage cases, and not an intervention effect.",[27.3,33.8]),
  base("CRC-LATE-SHARE","Share of incident colorectal cancers diagnosed late-stage","colorectal",63.3,"percent",
    "Incident colorectal cancers classified late-stage",
    "Provider-defined incident colorectal cancers in the published percentage; unknown-stage handling unresolved",CRC_URL,
    "Hinds County 2018–2022. Diagnosed-case percentage, not screening-eligible population. Retained methods do not verify exclusion of unknown-stage cases."),
  base("CRC-LATE-COUNT","Average annual late-stage colorectal cases","colorectal",76,"average cases per year",
    "Average annual late-stage colorectal cases in 2018–2022",
    "Five-year population registry count annualized; not per 100,000",CRC_URL,
    "Rounded annual case count across five years; cannot infer subgroup rates or individual diagnoses."),
  base("BREAST-LATE-INC","Female breast cancer late-stage age-adjusted incidence","breast",53.2,"cases per 100,000 females annually",
    "Female incident breast cancers classified late-stage",
    "Age-adjusted female resident population under NCI rate standard",BREAST_URL,
    "Historical Hinds County female breast cancer measure, not Jackson city.",[47.7,59.1]),
  base("BREAST-LATE-SHARE","Share of female incident breast cancers diagnosed late-stage","breast",37.7,"percent",
    "Female incident breast cancers classified late-stage",
    "Provider-defined female incident breast cancers in the published percentage; unknown-stage handling unresolved",BREAST_URL,
    "Hinds County 2018–2022. Not directly comparable with colorectal stage percentage. Unknown-stage denominator handling needs source-method verification."),
  base("BREAST-LATE-COUNT","Average annual female late-stage breast cancer cases","breast",74,"average cases per year",
    "Average annual female late-stage breast cancer cases in 2018–2022",
    "Five-year registry case count annualized, not a percentage of screening-eligible women",BREAST_URL,
    "Rounded annual average for Hinds County. Not an estimate for Jackson city or 2026.")
];
export const JACKSON_PUBLIC_SOURCES:DataSource[]=[
  {id:"nci-crc",name:"NCI State Cancer Profiles — late-stage colorectal incidence",
    url:CRC_URL,owner:"NCI / Mississippi cancer registry",granularity:"County (Hinds), site, both sexes",
    kind:"PUBLISHED_AGGREGATE",observationWindow:"Diagnoses 2018–2022",
    legitimateUse:"Historical source-specific county baseline with uncertainty",
    prohibitedUse:"City/tract rate, individual cases, current event trigger, causally attributed improvement",
    connection:"CURATED_REFERENCE_ONLY"},
  {id:"nci-breast",name:"NCI State Cancer Profiles — late-stage female breast incidence",
    url:BREAST_URL,owner:"NCI / Mississippi cancer registry",granularity:"County (Hinds), site, female",
    kind:"PUBLISHED_AGGREGATE",observationWindow:"Diagnoses 2018–2022",
    legitimateUse:"Historical county breast cancer baseline with site-specific denominators",
    prohibitedUse:"Jackson-city or neighborhood estimate; generic all-cancer rate",
    connection:"CURATED_REFERENCE_ONLY"},
  {id:"cdc-uscs",name:"CDC United States Cancer Statistics 2026",
    url:"https://www.cdc.gov/united-states-cancer-statistics/dataviz/index.html",
    owner:"CDC NPCR / NCI SEER",granularity:"As published: county/state/national, site and demographic filters vary",
    kind:"SOURCE_CATALOG_ONLY",observationWindow:"Incidence through 2023 in June 2026 release",
    legitimateUse:"Cross-check stage definitions, time trends, official aggregate cases and rates",
    prohibitedUse:"Linking records to identify a person; inferring missing suppressed cells",
    connection:"CURATED_REFERENCE_ONLY"},
  {id:"cdc-places",name:"CDC PLACES 2025 screening estimates",
    url:"https://chronicdata.cdc.gov/500-Cities-Places/PLACES-Place-Data-GIS-Friendly-Format-2025-release/vgc8-iyc4/data",
    owner:"CDC PLACES",granularity:"Place and other geographies; model-based estimates",
    kind:"MODELED_ESTIMATE",observationWindow:"2025 release; some cancer screening indicators reflect 2022 BRFSS",
    legitimateUse:"Hypothesis generation about screening-access differences and candidate priority areas",
    prohibitedUse:"Directly observed city screening counts or detection of local intervention effects",
    connection:"CURATED_REFERENCE_ONLY"},
  {id:"hrsa-uds",name:"HRSA Uniform Data System — Mississippi 2025",
    url:"https://data.hrsa.gov/topics/healthcenters/uds/overview/state/MS",
    owner:"HRSA Health Center Program",granularity:"State/program awardee reporting; not city cancer registry stage",
    kind:"SOURCE_CATALOG_ONLY",observationWindow:"Reporting period 2025",
    legitimateUse:"Health center capacity and screening quality-measure context where defined",
    prohibitedUse:"Hinds County registry stage, local patient counts, comparative causal benefit",
    connection:"CURATED_REFERENCE_ONLY"},
  {id:"local-protected",name:"Authorized clinical, registry, navigator, claims and community access records",
    url:"https://www.cdc.gov/cancer/data/",
    owner:"Participating institutions, cancer registry and approved public-health partners",
    granularity:"Potential individual/clinic/site measures; no current access",
    kind:"NOT_OBSERVED",observationWindow:"Not established",
    legitimateUse:"Only with lawful permitted research purpose, data-sharing and privacy controls",
    prohibitedUse:"Unconsented retrieval, reidentification, inference of suppressed cells or live clinical decisions",
    connection:"AUTHORIZED_EXCHANGE_NOT_CONNECTED"}
];
const stratum=(id:string,dimension:string,comparison:string,availability:PopulationStratum["availability"],why:string,risk:string):PopulationStratum=>({
  id,dimension,comparison,availability,neededFor:why,interpretationRisk:risk
});
const COMMON_STRATA:PopulationStratum[]=[
  stratum("SITE","Cancer site and stage","Colorectal vs breast — separate site-specific measures","MEASURED_IN_CASE_BASELINE",
    "Define each cancer's stage categories and screening/diagnostic trajectory","Pooling sites masks distinct screening eligibility and case denominators."),
  stratum("AGE","Age or birth cohort","Site-appropriate screening eligible ages; younger symptomatic populations","BREAKDOWN_NOT_YET_VERIFIED",
    "Test whether earlier diagnosis differs by age while respecting guidelines","Age-adjusted incidence is not the age profile of diagnoses."),
  stratum("RACE","Race and ethnicity","Registry-reported self-identified subgroups, wherever robust","BREAKDOWN_NOT_YET_VERIFIED",
    "Evaluate access and outcomes without presuming biological/social cause","Small cells, classification changes, confounding and structural bias."),
  stratum("GEO","Place and neighborhood","Jackson city vs Hinds County, census tract, residence and service catchment","BREAKDOWN_NOT_YET_VERIFIED",
    "Map geographic gaps in care while retaining original boundaries","Clinic location and county residence do not identify city-specific case burden."),
  stratum("PAYER","Insurance and affordability","Uninsured, Medicaid/Medicare, private and out-of-pocket barrier","REQUIRES_AUTHORIZED_DATA",
    "Test insurance continuity, affordability and referral bottlenecks","Ecological insurance estimates are not registry-based causal attribution."),
  stratum("ACCESS","Transportation, hours, language, disability","Ability to book, travel, communicate and complete diagnostic follow-up","REQUIRES_AUTHORIZED_DATA",
    "Discover actual service barriers through accessible surveys and administrative records","Access is multi-dimensional; self-reported obstacles must be independently investigated."),
  stratum("JOURNEY","Screening and diagnostic journey","Offered → completed → abnormal result → referral → resolved diagnosis","REQUIRES_AUTHORIZED_DATA",
    "Find where patients experience preventable delay or missing closure","Claims, EHR and patient report have distinct denominators and missingness.")
];
const d=(id:string,label:string,hypothesis:string,test:string,alternative:string,data:string,reviewers:string):DriverQuestion=>({
  id,label,hypothesis,discriminatingTest:test,competingExplanation:alternative,
  instrumentOrDataNeeded:data,evidenceState:"NOT_LOCALLY_TESTED",responsibleReviewers:reviewers
});
export const JACKSON_DRIVERS:DriverQuestion[]=[
 d("H-SCREEN","Appropriate screening access and completion",
  "Some people who meet a specific cancer screening recommendation are not screened within the intended window.",
  "Measure documented eligibility, offer, invitation and completion with a valid at-risk denominator, before/after plus credible comparator.",
  "Differences may reflect true differences in eligibility, risk, patient preference or coding rather than screening access.",
  "Site-specific EHR aggregate; guideline version; insurance; access interviews; approved registry linkage where needed.",
  "Primary care, epidemiology, navigators and community advisers"),
 d("H-FOLLOW","Abnormal-result follow-up and diagnostic closure",
  "Some abnormal screening or concerning clinical findings are not resolved promptly through the next indicated diagnostic step.",
  "Reconstruct result-to-contact, referral, scheduling, definitive follow-up timelines and undocumented loss to follow-up.",
  "Documentation lags and referral leakage across systems can mimic clinical delays; urgent pathways differ by site.",
  "De-identified referral timestamps, procedure capacity, patient journey interviews, outcome adjudication.",
  "Clinical pathway owner, quality lead and health information specialist"),
 d("H-CAPACITY","Capacity, scheduling and procedure access",
  "Local clinical diagnostic capacity, hours or referral availability contribute to delayed evaluation in parts of the catchment.",
  "Compare capacity, wait times and completed referrals across facilities and eligible populations, including seasonal demand.",
  "Observed wait may reflect case mix, selection, prioritization or missing external records.",
  "Colonoscopy/imaging/pathology capacity, staff schedules, referral queues and completion data.",
  "Health systems, specialist service lines and workforce evaluator"),
 d("H-BARRIERS","Structural and social access barriers",
  "Transportation, affordability, paid leave, childcare, access needs or communication problems contribute to missed screening or follow-up.",
  "Triangulate consented patient/CHW interviews with appointment logs and structural access measures.",
  "Different risk eligibility and provider supply may explain observed geographic variation; avoid attributing differences to group identity.",
  "Patient experience, language and disability accessibility, administrative barriers, travel and affordability measures.",
  "Community co-investigators, navigators, social service partners"),
 d("H-CLINICAL","Diagnostic and symptom evaluation",
  "Some cancers present through symptoms or risk pathways for which routine screening does not apply, and delays may occur in evaluation.",
  "Audit symptom onset where documented, referral decisions, diagnostic tests and adjudicated stage by site.",
  "Underlying cancer biology, interval cancer and disease aggressiveness may explain advanced stage despite timely care.",
  "Clinical review, tumor type, symptom pathways, diagnostic record audit and registry case definitions.",
  "Licensed clinical reviewers and registry scientist"),
 d("H-MEASUREMENT","Registration, coding, denominators and temporal bias",
  "Apparent changes in late-stage burden may partly reflect shifts in surveillance completeness, stage coding, populations or screening intensity.",
  "Audit registry stage definitions, source revisions, missing stage, site mix, annualized counts and age-adjustment; conduct sensitivity analysis.",
  "The change may be real, may be case mix, or an altered observation process; don't presume any one.",
  "Original registry metadata, completeness audits, Census denominators, repeat data extract, independent review.",
  "Cancer registry methodologist, biostatistician and external reviewer")
];
const st=(id:string,name:string,journey:string,basis:StrategyCandidate["basis"],url:string,target:string,measure:string,harm:string):StrategyCandidate=>({
  id,name,whereInJourney:journey,basis,sourceUrl:url,studyTarget:target,
  localEffect:"NOT_ESTABLISHED",measureToVerify:measure,potentialHarm:harm
});
const CRC_DISCOVERY_DRIVERS:DriverQuestion[]=[
 d("H-EARLY","What is missed before routine screening or diagnosis?",
  "Some people may have earlier identifiable risk or clinical signals that the existing pathway misses; age is one candidate, not an established cause.",
  "Link age, stage, prior risk information, eligibility, symptoms and care history; separately examine average-risk asymptomatic screening, higher-risk pathways and symptomatic/abnormal-result evaluation. Test interactions with access and follow-through.",
  "Biology, interval disease, prior prevention, referral loss, case mix, documentation or measurement may explain the pattern, separately or together. All-age rates cannot establish when a person should have been screened.",
  "Authorized age/risk/stage and longitudinal pathway data; pre-outcome signals without leakage; qualified instruments, external validation and incremental benefit/harm evaluation.",
  "Registry scientist, clinical pathway lead, biostatistician and patient partners"),
 d("H-PREVENT","Occurrence, precancer prevention and discovery",
  "Differences in underlying occurrence or opportunities for effective precancer prevention may contribute to late-stage population burden.",
  "Study age-specific all-stage incidence, prior screening and polyp detection/removal, relevant risk/context measures and stage completeness; distinguish prevention from earlier detection.",
  "Detection intensity, population composition, disease biology or registration differences may change observed incidence without a local prevention effect.",
  "Time-aligned registry history, appropriate eligibility and procedure records, validated risk measures and a suitable longitudinal comparator.",
  "Cancer epidemiologist, prevention clinician and implementation evaluator")
];
const CORE_STRATEGIES:StrategyCandidate[]=[
  st("EBI-NAV","Patient navigation","Due for screening through definitive diagnostic follow-up",
    "EVIDENCE_FOR_SCREENING_UPTAKE","https://www.cdc.gov/cancer/php/interventions/patient-navigation.html",
    "Can improve screening access; do not assume change in late-stage incidence locally",
    "Eligible screening completion, appropriate abnormal-result resolution, equitable reach, workload",
    "Mismatched eligibility, disclosure, navigation cost, missed or late referrals"),
  st("EBI-BARRIER","Reduce structural barriers","Transportation, scheduling, site access and language/administrative processes",
    "EVIDENCE_FOR_SCREENING_UPTAKE","https://www.cdc.gov/cancer/php/ebi-planning-guides/reducing-structural-barriers-planning-guide.html",
    "Increase access to guideline-concordant screening",
    "Screening completion with eligible denominator, travel/appointment burden, equity and cost",
    "Overextension, inconvenient site changes, resource diversion"),
  st("EBI-REMIND","Patient and provider reminders","Screening identification and due-date prompt",
    "EVIDENCE_FOR_SCREENING_UPTAKE","https://www.cdc.gov/cancer/php/interventions/index.html",
    "Improve appropriate screening uptake in applicable settings",
    "Correct eligibility, completed screening, opt-outs, duplication and costs",
    "Over-screening, missed consent, false eligibility, exclusion of digitally underserved"),
  st("LOCAL-FOLLOW","Closed-loop result and referral follow-up","Abnormal finding to definitive clinical disposition",
    "CANDIDATE_TO_EVALUATE","https://www.cdc.gov/cancer/php/interventions/patient-navigation.html",
    "Test local referral reliability; external evidence for a specific design not established in this case",
    "Timely documented resolution, preventable missingness, appropriate triage, harms",
    "Unnecessary procedures, clinician alerts, false-positive escalation and privacy")
];

export function jacksonCancerCase(site:SiteKey="colorectal"):ResearchProgramSpec{
  const scope:ResearchProgramSpec["population"]={
    targetName:"Jackson, Mississippi",analysisUnit:"Jackson municipal population (not observed in cited incidence table)",
    proxyUnit:"Hinds County, MS",proxyFips:"28049",equivalence:"NOT_ESTABLISHED",
    notes:"The public historical NCI rates are for Hinds County, which must not be relabeled as Jackson City or Jackson County, Mississippi. City, surrounding county catchments and facilities require separate geographic verification."
  };
  const selected=site==="general"?JACKSON_CANCER_INDICATORS:JACKSON_CANCER_INDICATORS.filter(m=>m.site===site);
  return {
    id:"jackson-ms-late-stage-"+site,
    question:"What contributors can be validated and what evidence-based, equitable, sustainable actions might reduce late-stage cancer diagnosis in Jackson, Mississippi?",
    site,population:scope,
    problemDefinition:"Determine why cancers are diagnosed at advanced stages in the target population, distinguishing cancer site, registry definitions, screening access, abnormal-result follow-up, symptom evaluation, biology and contextual determinants.",
    lastSourceCheck:"2026-11-06; historical published data period is 2018–2022.",
    indicators:selected,dataSources:JACKSON_PUBLIC_SOURCES,
    strata:COMMON_STRATA,drivers:site==="colorectal"?[...JACKSON_DRIVERS,...CRC_DISCOVERY_DRIVERS]:JACKSON_DRIVERS,strategies:CORE_STRATEGIES
  };
}

export function unsourcedResearchCase(question:string,targetName:string):ResearchProgramSpec{
  const q=question.trim().slice(0,300),target=targetName.trim().slice(0,130);
  return {
    id:"custom-unsourced-method",question:q,
    site:"general",
    population:{targetName:target||"Population not yet defined",analysisUnit:target||"Unverified",proxyUnit:target||"Unverified",proxyFips:null,equivalence:"NOT_ESTABLISHED",
      notes:"Custom question: no public data has been retrieved, analyzed or verified. Define geography, phenomenon, denominator and owners before numerical claims."},
    problemDefinition:q||"Phenomenon and decision need specification.",
    lastSourceCheck:"Not performed for this custom case.",
    indicators:[],dataSources:[],strata:[
      {id:"RELEVANT-STRATA",dimension:"Candidate subgroup definitions",comparison:"Specify based on the actual phenomenon",availability:"BREAKDOWN_NOT_YET_VERIFIED",neededFor:"Identify appropriate strata, reference standard and denominator.",interpretationRisk:"Do not infer the outcome or causes from identity groups."}
    ],
    drivers:[
      {id:"H-UNKNOWN",label:"Open-world competing explanations",hypothesis:"Causes and contributors are not yet identified.",
        discriminatingTest:"Define measurable competing hypotheses, instruments and potential falsifiers before inference.",
        competingExplanation:"Unknown alternatives remain.",instrumentOrDataNeeded:"Authorized primary sources and stakeholder/measurement audit.",
        evidenceState:"NOT_LOCALLY_TESTED",responsibleReviewers:"Named research owner and domain experts"}
    ],
    strategies:[]
  };
}

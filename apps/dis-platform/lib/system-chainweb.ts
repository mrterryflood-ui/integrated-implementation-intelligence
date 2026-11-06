/**
 * DIS Chainweb v0.1 — domain-neutral whole-system evidence map.
 *
 * A multi-level causal-INQUIRY map, NOT a causal graph with verified edges.
 * No inference of personal risk from neighborhood data; no ranking/profiling.
 * Distinguish source evidence, plausible cross-system dependencies,
 * hypotheses, unknowns, and mismatched spatial/temporal denominators.
 */
import type {ResearchProgram} from "./research-program";

export type Layer="MACRO"|"MESO"|"LOCAL"|"ORGANIZATION"|"HOUSEHOLD"|"PERSON"|"OUTCOME";
export type Sector="POLICY"|"ECONOMICS"|"EDUCATION"|"FOOD"|"BUILT_ENVIRONMENT"|"SAFETY"|
  "COMMUNITY"|"HEALTHCARE"|"ENVIRONMENT"|"MEASUREMENT"|"BUSINESS"|"TECHNOLOGY"|"OUTCOME";
export type EvidenceClass="OBSERVED_PUBLIC_AGGREGATE"|"SECONDARY_SOURCE_REPORT"|"MODEL_CONTEXT_ONLY"|
  "DOCUMENTED_GENERAL_FRAMEWORK"|"QUESTION_NOT_MEASURED";
export type EdgeClass="DEPENDENCY_TO_VALIDATE"|"HYPOTHESIS_TO_TEST"|"GENERAL_ASSOCIATION_NOT_LOCAL_CAUSAL";
export type Signal={
  label:string;value:number|null;unit:string;geo:string;period:string;source:string;
  numerator:string;denominator:string;
};
export type WebNode={
  id:string;name:string;layer:Layer;sector:Sector;description:string;
  evidence:EvidenceClass;source:string|null;signal:Signal|null;
  targetPopulationChecked:false;individualInferenceAuthorized:false;
  missingDataQuestion:string;
};
export type WebEdge={
  id:string;from:string;to:string;relationship:EdgeClass;claim:string;
  counterExplanation:string;discriminatingTest:string;instrumentNeeded:string;
  localCausalEffectVerified:false;
};
export type Chainweb={
  schemaVersion:"dis-whole-system-chainweb-v1";
  topic:string;target:string;domain:"HEALTH"|"BUSINESS"|"SOFTWARE"|"GENERAL";
  evidenceScope:"PUBLIC_AGGREGATE_AND_UNTESTED_EXPLANATIONS";
  levels:readonly Layer[];nodes:WebNode[];edges:WebEdge[];
  assertions:{sourceSpecific:false;localCausalityVerified:false;individualProfilingAuthorized:false;
    contextTransferVerified:false;universalRiskOrReadinessScore:false};
  socialSystems:{
    observed:number;reported:number;hypothesized:number;unmeasured:number;
    openCrossSystemQuestions:number;verifiedCausalEdges:0;
  };
  spatialWarnings:string[];temporalWarnings:string[];
  questions:string[];integrationInstructions:string[];
};

const LEVELS:readonly Layer[]=["MACRO","MESO","LOCAL","ORGANIZATION","HOUSEHOLD","PERSON","OUTCOME"] as const;
function node(id:string,name:string,layer:Layer,sector:Sector,description:string,missingDataQuestion:string,
  evidence:EvidenceClass="QUESTION_NOT_MEASURED",source:string|null=null,signal:Signal|null=null):WebNode{
  return {id,name,layer,sector,description,evidence,source,signal,
    targetPopulationChecked:false,individualInferenceAuthorized:false,missingDataQuestion};
}
function edge(id:string,from:string,to:string,claim:string,discriminatingTest:string,
  counterExplanation:string,instrumentNeeded:string,relationship:EdgeClass="HYPOTHESIS_TO_TEST"):WebEdge{
  return {id,from,to,claim,relationship,discriminatingTest,counterExplanation,instrumentNeeded,
    localCausalEffectVerified:false};
}
const CENSUS="https://www.census.gov/quickfacts/fact/table/jacksoncitymississippi/LFE041223";
const CDC="https://www.cdc.gov/infrastructure/public-health-systems-emerging-practices/social-determinants-of-health.html";
const WISQARS="https://www.cdc.gov/injury/wisqars/index.html";
const CRIME="https://mississippitoday.org/2026/02/04/when-its-affecting-you-crime-is-bad-competing-realities-behind-jacksons-falling-homicide-figures/";
const USDA="https://ers.usda.gov/data-products/food-access-research-atlas";
const PLACES="https://www.cdc.gov/places/about/";
const proxy="Hinds County, MS";
const city="Jackson city, MS";
function jacksonNodes(p:ResearchProgram):WebNode[]{
  const colorectal=p.indicators.find(x=>x.id==="CRC-LATE-SHARE")||p.indicators.find(x=>x.id==="BREAST-LATE-SHARE");
  const countySignal:Signal|null=colorectal?{
    label:colorectal.label,value:colorectal.value,unit:colorectal.unit,
    geo:colorectal.geography,period:colorectal.period,source:colorectal.sourceUrl,
    numerator:colorectal.numeratorDefinition,denominator:colorectal.denominatorDefinition
  }:null;
  return [
    node("policy","Policies, eligibility and financing","MACRO","POLICY",
      "Federal/state/local laws, reimbursement, budgets, service standards and public-safety governance can affect many downstream systems.",
      "Which policies are in force on the decision date, who is affected, and what measurable operational change do they cause?"),
    node("employment","Work conditions, wages and scheduling flexibility","MACRO","ECONOMICS",
      "Income opportunity, paid leave, employment schedules, benefits and institutional incentives may shape service availability.",
      "Are paid leave, employer schedules, wages and financial shocks linked to missed screening or follow-up locally?"),
    node("health-system","Regional health coverage and service organization","MESO","HEALTHCARE",
      "Insurance access, safety-net financing, specialist network and referral topology influence access and delivery opportunities.",
      "Which authorized aggregate clinic and payer records reveal incomplete care, and who owns the denominators?"),
    node("education","Education, literacy and digital access","MESO","EDUCATION",
      "Educational access, health information and digital communication can shape how services are designed and understood.",
      "Does accessible communication or outreach affect the actual completion of an appropriate care step?"),
    node("policy-change","Policy implementation and intergovernmental coordination","MESO","POLICY",
      "Policy design, resource allocation and experienced delivery may diverge; jurisdictional responsibility must be traced.",
      "Which actual policy, decision owner, funded obligation, service contract and outcome date can be documented?"),
    node("city-poverty","Jackson city poverty estimate","LOCAL","ECONOMICS",
      "Contextual city poverty is measured; individual financial situations and associations with cancer diagnosis are not.",
      "Which eligible people face financial or employment barriers, and how are they measured without ecological inference?",
      "OBSERVED_PUBLIC_AGGREGATE",CENSUS,{
        label:"People in poverty",value:27.9,unit:"percent",geo:city,
        period:"2020–2024 ACS 5-year estimate",source:CENSUS,
        numerator:"Residents below Census poverty threshold",
        denominator:"Jackson residents in the Census poverty universe"
      }),
    node("city-income","Jackson city median household income","LOCAL","ECONOMICS",
      "A population-level economic measure, not individual wages or a verified late-stage-cancer cause.",
      "How do wages, income stability and missed work affect participation or access among actual eligible individuals?",
      "OBSERVED_PUBLIC_AGGREGATE",CENSUS,{
        label:"Median household income",value:42071,unit:"USD (2024 dollars)",geo:city,
        period:"2020–2024 ACS 5-year estimate",source:CENSUS,
        numerator:"Median of household income distribution",
        denominator:"Jackson households in ACS income universe"
      }),
    node("city-uninsured","Jackson city under-65 uninsured estimate","LOCAL","HEALTHCARE",
      "A city-level insurance access signal, not a direct measurement of locally missed follow-up or cancer stage.",
      "What eligible clinical population is actually uninsured and what care steps are affected?",
      "OBSERVED_PUBLIC_AGGREGATE",CENSUS,{
        label:"Under age 65 without health insurance",value:17.3,unit:"percent",geo:city,
        period:"2020–2024 ACS 5-year estimate",source:CENSUS,
        numerator:"Uninsured residents below 65",
        denominator:"Jackson civilian noninstitutionalized residents under 65"
      }),
    node("food-access","Food and nutrition environment","LOCAL","FOOD",
      "USDA provides tract-level measures of retailer access, but no Jackson census-tract value has been verified in this study.",
      "Are transport, distance and affordability limitations measured in specific tracts, and is there a credible pathway to the outcome?",
      "QUESTION_NOT_MEASURED",USDA),
    node("environment","Housing, water, transport and infrastructure","LOCAL","BUILT_ENVIRONMENT",
      "Neighborhood built environment and transport can affect many services; no measured direct effect on late-stage diagnosis is established.",
      "What are actual travel times, water quality, housing instability and geographic accessibility for the target cohort?",
      "DOCUMENTED_GENERAL_FRAMEWORK",CDC),
    node("violence","Community violence and safety conditions","LOCAL","SAFETY",
      "2025 Jackson homicide reports indicate a decline from the 2021 peak, with source disagreement around the 2025 count; this is context, not a measured cancer causal factor.",
      "How does measured violence exposure (not an address proxy) affect service accessibility, trauma and care continuity over time?",
      "SECONDARY_SOURCE_REPORT",CRIME,{
        label:"Reported 2025 homicides (one published count)",value:74,unit:"reported homicides",
        geo:city,period:"Calendar year 2025, reported February 4, 2026",source:CRIME,
        numerator:"Reported homicides attributed to Jackson city limits by reporting source",
        denominator:"Annual count, NOT age-adjusted risk; another report lists 75"
      }),
    node("community-trust","Social cohesion, discrimination, safety and trust","LOCAL","COMMUNITY",
      "Relationships, experiences of discrimination, public safety and trust may affect participation; local effect is unmeasured.",
      "What do affected residents report through appropriately sampled, accessible, consent-based engagement?",
      "DOCUMENTED_GENERAL_FRAMEWORK",CDC),
    node("clinic-capacity","Referral and clinical diagnostic capacity","ORGANIZATION","HEALTHCARE",
      "Actual scheduling, procedures, pathology access and follow-up are provider-specific and require authorized evidence.",
      "What fraction of appropriately referred cases had timely definitive disposition, by relevant care pathway?"),
    node("program-operations","Outreach, communication and navigation practice","ORGANIZATION","HEALTHCARE",
      "Designed outreach and documented clinical workflow may differ from actual patient-experienced access.",
      "Which navigation components, fidelity and referral handoffs are operational and accepted by participants?"),
    node("institution-incentives","Funding, staffing and institutional incentives","ORGANIZATION","ECONOMICS",
      "Targets or billing metrics may redirect behavior; causation and local incentive alignment must be tested.",
      "Are incentives tracking activity volume rather than completed appropriate diagnosis and benefit?"),
    node("household-load","Household demands, affordability and transportation","HOUSEHOLD","ECONOMICS",
      "Financial resources, caregiving and travel burdens may interact but cannot be inferred for individuals from neighborhood income.",
      "Which consented household-reported barriers correspond to observed appointment completion or noncompletion?"),
    node("experienced-access","Lived experience and service navigation","PERSON","COMMUNITY",
      "Patient-reported barriers and priorities need real participant methods, not synthetic personas or race-based assumptions.",
      "What do affected people report, and what conflicts with administrative records under consented evaluation?"),
    node("clinical-eligibility","Personal screening, risk and symptom pathways","PERSON","HEALTHCARE",
      "Age, risk, symptoms and eligibility differ by cancer site and require licensed clinical determination.",
      "Were appropriate screening and diagnostic pathways offered and completed for this eligible cohort?"),
    node("diagnostic-closure","Abnormal result to diagnostic resolution","ORGANIZATION","HEALTHCARE",
      "Timely resolution requires actual source events and a valid denominator, not just attendance or referral counts.",
      "What is the distribution and missingness of follow-up time from abnormal result to resolution?"),
    node("cancer-stage","Site-specific late-stage cancer diagnosis","OUTCOME","OUTCOME",
      "Historical county cancer-stage share is a distinct outcome from city economic and violence indicators.",
      "Can valid residence-specific stage and year data eventually be linked at approved aggregate or protected research level without suppressing minority cells?",
      countySignal?"OBSERVED_PUBLIC_AGGREGATE":"QUESTION_NOT_MEASURED",
      countySignal?.source||null,countySignal),
    node("other-harms","Other public health, economic and community outcomes","OUTCOME","OUTCOME",
      "Violence, chronic disease, disability, economic mobility and service resilience may share contexts but remain distinct outcomes.",
      "Which outcomes are independent, competing or linked, and how will the comparison avoid double-counting or population-level inference?")
  ];
}
const JACKSON_EDGES:WebEdge[]=[
  edge("E1","policy","health-system","Policy choices may affect insurance and care-delivery capacity.",
    "Compare actual eligibility, funds and service change timelines with unaffected populations.",
    "Local provider capacity, staffing and broader economic trends may be more important.",
    "Policy enactment/implementation records, finance, enrollment and clinical service records"),
  edge("E2","employment","household-load","Wage, scheduling and leave constraints may influence available time for care.",
    "Test documented work/leave barriers and actual appointment outcomes against comparable groups.",
    "Provider access, medical indication and scheduling may explain difference.",
    "Consented participant information, administrative scheduling and occupational context"),
  edge("E3","city-poverty","household-load","Neighborhood economic conditions may be related to household care constraints.",
    "Test directly measured household barriers and service outcomes; no transfer from city average to individuals.",
    "Clinic distribution, population case mix and personal circumstances may dominate.",
    "Census/ACS contextual geography plus approved participant-level study"),
  edge("E4","education","experienced-access","Health literacy and information accessibility may change experienced service access.",
    "Test communication comprehension and appropriately indicated service completion across accessible formats.",
    "Access capacity and eligibility may explain noncompletion instead.",
    "Accessibility evaluation, surveys, administrative service completion"),
  edge("E5","food-access","other-harms","Food access may relate to chronic health and economic outcomes, with different pathways than stage of cancer diagnosis.",
    "Measure actual food access and clearly specified intermediate outcomes, avoid inferring cancer stage effects.",
    "Income, vehicle access, market definition and preexisting conditions may explain association.",
    "USDA tract access metrics, transport, actual household exposure and clinically appropriate outcome"),
  edge("E6","environment","clinic-capacity","Transport and infrastructure could influence service capacity and reach.",
    "Test real travel-time variation, service cancellations and follow-up for appropriately defined cohorts.",
    "Staffing/referral decisions and clinical urgency may better explain delays.",
    "Trip/service logs, infrastructure maps, clinical referral data"),
  edge("E7","violence","experienced-access","Violence exposure and perceived safety may interact with mobility and trust in different ways.",
    "Triangulate actual local exposure time/space and consented lived experience with service use.",
    "Changes in policing/reporting, demographics and clinic logistics may explain coincidence.",
    "Crime reporting definitions, qualitative study and matched service records"),
  edge("E8","community-trust","program-operations","Trust and communication may affect uptake of offered services.",
    "Contrast communication designs with informed participation and independently observed service completion.",
    "Eligibility, insurance or clinic hours may drive apparent uptake.",
    "Patient-reported trust and service audit with valid consent and sampling"),
  edge("E9","city-uninsured","clinical-eligibility","Insurance context may relate to screening or diagnosis access, but city prevalence is not individual eligibility.",
    "Check actual clinical insurance, indication, time and completion; no personal risk inferred from a census statistic.",
    "Risk eligibility, symptoms, services and payer/provider contract may explain pattern.",
    "Approved clinical records and aggregate insurance cohort"),
  edge("E10","household-load","experienced-access","Household needs may affect patient service-navigation experience.",
    "Document actual needs, practical constraints and counterexamples across those using the service.",
    "A different service offering or patient choice may explain nonattendance.",
    "Consented interviews, appropriate service logs"),
  edge("E11","clinic-capacity","diagnostic-closure","Clinical capacity and workflow may determine how quickly indicated diagnostic referrals resolve.",
    "Compare queue/resource constraints with actual resolution time, conditional on urgency and site.",
    "Clinical triage differences or records held elsewhere may explain observed delay.",
    "Authorized provider queues, referral closure and procedure records"),
  edge("E12","program-operations","diagnostic-closure","Navigation or reminder programs may improve closure if they address actual bottlenecks.",
    "Prespecify comparator and test timely actual diagnostic disposition with fidelity and safety measures.",
    "Extra recording might look like increased closure without improving care.",
    "Program implementation audit, outcome record, comparison group"),
  edge("E13","institution-incentives","program-operations","Funding and performance targets may change reporting or actions.",
    "Compare documented incentive/rules changes to independent process and beneficiary outcome measures.",
    "An actual improved workflow rather than gaming may explain recorded gains.",
    "Contracts, coding versions, independent outcome audit"),
  edge("E14","clinical-eligibility","diagnostic-closure","Appropriate screening/referral depends on actual site-specific clinical indication.",
    "Independently adjudicate appropriate eligibility and diagnostic pathway from authorized clinical records.",
    "More intensive screening may increase detections without stage shift.",
    "Approved clinical review and eligibility standards"),
  edge("E15","diagnostic-closure","cancer-stage","Missed diagnostic closure could contribute to late diagnosis if a relevant causal pathway is demonstrated.",
    "Test temporal precedence, appropriate control/case mix, stage/diagnosis data and independent clinical adjudication.",
    "Biology, symptoms, interval disease or different screening intensity may explain stage distribution.",
    "Cancer registry, clinician review, counterfactual design and follow-up"),
  edge("E16","policy-change","institution-incentives","Operational implementation of policy can alter institutional funding and incentives.",
    "Trace policy/funding decisions and their actual effects on organizational resources over time.",
    "National demand and institutional changes may be responsible.",
    "Dated law and administrative/fiscal records"),
  edge("E17","community-trust","experienced-access","Community context may inform individual experience in heterogeneous ways.",
    "Compare direct resident experience rather than assign a group-level trait.",
    "Administrative service access or unmeasured individual differences could explain patterns.",
    "Accessible consented mixed-method stakeholder engagement"),
  edge("E18","violence","other-harms","Community violence is a separate outcome and may share upstream conditions with health barriers.",
    "Study separate time- and place-matched outcome series and competing mechanisms without assuming a direct cancer effect.",
    "Crime trends, healthcare trends and demographics may change independently.",
    "Public safety original incident series plus independent health outcomes"),
  edge("E19","policy","education","Education resources and policies may affect access and later opportunities.",
    "Validate dated policies and resources against observed educational opportunity, avoiding a partisan shortcut.",
    "Economic and institutional histories, cohorts and lag effects may be more relevant.",
    "Education administrative records and policy timeline"),
  edge("E20","clinic-capacity","other-harms","Clinical system load may influence avoidable burden and different patient outcomes.",
    "Evaluate workload, capacity, safety events and actual patient outcomes under valid denominators.",
    "Coding shifts or selection may explain changes.",
    "Provider operations and safety event audits")
];
const crossGeneric:(domain:"BUSINESS"|"SOFTWARE"|"GENERAL")=>Array<WebNode>=(domain)=>[
  node("macro-conditions","Policy, standards, macroeconomics","MACRO","POLICY",
    "Regulations, funding, labor markets and technological regimes influence organizational opportunity.",
    "Which dated external conditions change the actual decision and whose interests are affected?"),
  node("system-ecosystem","Sector ecosystem and external dependencies","MESO",domain==="SOFTWARE"?"TECHNOLOGY":"BUSINESS",
    "Suppliers, infrastructure, platforms, institutions and market/operational relationships have different incentives.",
    "What interdependencies, contracts, data, incentives and observed disruptions exist?"),
  node("place-context","Local market, geography and resources","LOCAL","ECONOMICS",
    "Place, skills, income, infrastructure and access may matter differently for each product and customer.",
    "Which local indicators are valid and which are proxies for an unobserved customer experience?"),
  node("organization","Institutional capacity, workflows and incentives","ORGANIZATION",domain==="SOFTWARE"?"TECHNOLOGY":"BUSINESS",
    "Designed requirements differ from operational performance and experienced outcomes.",
    "Does the actual system execute a correct end-to-end workflow with realistic users and constraints?"),
  node("team-household","Time, resource and interdependent human roles","HOUSEHOLD","COMMUNITY",
    "Team and household constraints influence implementation, workload and access; no personal inference from aggregate data.",
    "What resource burden, stakeholder constraints and decision rights are independently verified?"),
  node("user","User experience, behavior and trust","PERSON","COMMUNITY",
    "Real users may experience friction despite a green build or a favorable survey metric.",
    "Which independent user tasks, interviews and outcomes confirm or contradict the intended function?"),
  node("outcome","Actual system or beneficiary outcome","OUTCOME","OUTCOME",
    "The target must be measured independently from feature counts, revenue claims, uptime or outputs.",
    "What comparator, denominator, instrument, timeframe and adverse outcome establish meaningful improvement?")
];
export function buildChainweb(program:ResearchProgram,domain:"HEALTH"|"BUSINESS"|"SOFTWARE"|"GENERAL"="HEALTH",targetOverride?:string):Chainweb{
  const nodes=domain==="HEALTH"?jacksonNodes(program):crossGeneric(domain==="GENERAL"?"GENERAL":domain);
  const edges=domain==="HEALTH"?JACKSON_EDGES:[
    edge("D1","macro-conditions","system-ecosystem","External rules may influence opportunities and operating constraints.",
      "Compare policies and actual business/software changes with dated controls.",
      "Vendor, finance or organization changes may matter more.","Policy history and environment logs"),
    edge("D2","system-ecosystem","organization","Ecosystem interfaces and vendor dependencies may determine actual capability.",
      "Run real cross-system integration with independent failure injection and incident tracking.",
      "Internal implementation bugs may explain the same failure.","API, identity, contracts and telemetry"),
    edge("D3","place-context","team-household","Local resource context may shape capability and access.",
      "Test actual staff/customer context rather than area-level averages.","Product fit or eligibility may explain results.",
      "Stakeholder interviews and site resource data"),
    edge("D4","organization","user","Actual delivery of a service may differ from user experience.",
      "Compare observed task completion and user testimony with logs, including accessibility.",
      "Different client permissions, versions or devices may be responsible.","Usability and operational audit"),
    edge("D5","team-household","user","Human resource constraints may affect service completion.",
      "Measure workload, available supports and outcomes independently.","Product design or system availability may explain noncompletion.","User/worker study"),
    edge("D6","user","outcome","User behavior and access may affect measurable benefit.",
      "Test a meaningful outcome with a comparison condition and a valid instrument.",
      "Selection, novelty or reporting may explain observed gains.","Independent outcome measure and experiment")
  ];
  const ids=new Set(nodes.map(n=>n.id));
  if(ids.size!==nodes.length)throw Error("Duplicate chainweb node identities cannot support association.");
  if(edges.some(e=>!ids.has(e.from)||!ids.has(e.to)||e.from===e.to))throw Error("Broken chainweb linkage.");
  for(const n of nodes){
    if(n.evidence==="OBSERVED_PUBLIC_AGGREGATE"||n.evidence==="SECONDARY_SOURCE_REPORT"){
      if(!n.signal||!n.source||!n.source.startsWith("https://")||!n.signal.geo||!n.signal.period||
         n.signal.value===null||!Number.isFinite(n.signal.value)||!n.signal.unit)
        throw Error("A measured aggregate cannot be represented without provenance, geography, unit and period.");
    }
    if(n.evidence==="QUESTION_NOT_MEASURED"&&n.signal!==null)
      throw Error("Unmeasured context cannot be made into an invented numeric finding.");
  }
  const observed=nodes.filter(n=>n.evidence==="OBSERVED_PUBLIC_AGGREGATE").length,
    reported=nodes.filter(n=>n.evidence==="SECONDARY_SOURCE_REPORT").length,
    hypothesized=nodes.filter(n=>n.evidence==="DOCUMENTED_GENERAL_FRAMEWORK").length,
    unmeasured=nodes.filter(n=>n.evidence==="QUESTION_NOT_MEASURED").length;
  return {
    schemaVersion:"dis-whole-system-chainweb-v1",
    topic:program.question,target:targetOverride||program.population.targetName,domain,
    evidenceScope:"PUBLIC_AGGREGATE_AND_UNTESTED_EXPLANATIONS",
    levels:LEVELS,nodes,edges,
    assertions:{sourceSpecific:false,localCausalityVerified:false,individualProfilingAuthorized:false,
      contextTransferVerified:false,universalRiskOrReadinessScore:false},
    socialSystems:{observed,reported,hypothesized,unmeasured,
      openCrossSystemQuestions:edges.length,verifiedCausalEdges:0},
    spatialWarnings:[
      "Hinds County cancer measures cannot be assigned to Jackson city, a census tract, a household or a person.",
      "Jackson city economic/violence aggregates cannot be assigned to Hinds County cancer cases as individual exposures.",
      "Different spatial units, denominators and source instruments require a validated join and aggregation protocol."
    ],
    temporalWarnings:[
      "The NCI late-stage cancer observations are historical (2018–2022), whereas ACS context is 2020–2024 and 2025 violence reports cover a different time window.",
      "Temporal co-occurrence or a cross-sectional cluster is insufficient to establish a causal direction; violence and diagnosis changes may have distinct drivers.",
      "Publisher reports of Jackson homicides disagree on the 2025 total (74 vs 75). Resolve source jurisdiction, classification, coverage and reporting dates before any precise comparison."
    ],
    questions:[
      "Which connections are directly observed, which are established in other populations, and which are local hypotheses?",
      "What mechanisms plausibly link policy and resource constraints to the beneficiary outcome, and what rival mechanisms remain?",
      "Where do employment, education, food access, housing, public safety, health services, and lived experience interact or oppose one another?",
      "What are the correct geographic boundaries, temporal windows, data instruments, denominator, source independence, and consent requirements?",
      "Which institutional owner can actually change a leverage point, at what burden, and with what equity and unintended effects?",
      "What observation would falsify the leading explanation and cause DIS to revise the mission?"
    ],
    integrationInstructions:[
      "Only ingest official/authorized source-specific interfaces and retain original data meaning, observation time, revision and licensing.",
      "Align each data stream to a declared geography, reference period and denominator; never create a pseudo-patient from area averages.",
      "Keep causal inquiry separate from data-layer interoperability; a linked node is a research question until evidenced otherwise.",
      "Compare macro policy and local lived-experience evidence without assigning political motive or assuming population stereotypes.",
      "Re-test EBI mechanisms and contextual moderators before applying a solution from Jackson to Houston or another site.",
      "Do not treat rankings, model-based PLACES estimates or proprietary scores as a universal truth or personal risk grade."
    ]
  };
}

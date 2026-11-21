/**
 * Neuroinclusive health: ten evidence-to-action EXERCISE inputs for the existing
 * DIS research/implementation journey. Public literature metadata only.
 *
 * The research question is not an individual risk score. No symptom checker,
 * clinical triage, diagnosis, altered screening age, patient record, contact
 * list, alert dispatch, or organization-level clinical approval is created.
 */
import type {ResearchProgramSpec} from "./research-program";

export type NeuroinclusiveTopic = {
  id:string;
  label:string;
  population:string;
  question:string;
  sourceTitle:string;
  sourceDoi:string;
  studyPeriod:string;
  studyFinding:string;
  evidenceClass:"COMPARATIVE_ASSOCIATION"|"CARE_PATHWAY_DISPARITY"|"LONGITUDINAL_ASSOCIATION";
  limitations:string;
  proposedWorkflow:string;
  outcomeMeasure:string;
  denominatorDefinition:string;
  alternativeExplanation:string;
  potentialHarm:string;
  stakeholderOwner:string;
};

export const NEUROINCLUSIVE_TOPICS = [
  {
    id:"autism-constipation", label:"Autism · chronic constipation", population:"Autistic children at a prospective participating clinical setting",
    question:"Can supported recognition, clinician evaluation and bowel-plan follow-through improve meaningful bowel outcomes for autistic children compared with competent existing care?",
    sourceTitle:"High Burden of Constipation Among Autistic Youth: A Nationwide Query Powered by PCORnet",
    sourceDoi:"10.14309/ajg.0000000000003967",studyPeriod:"US healthcare records, analyzed in the 2026 publication",
    studyFinding:"The retrospective healthcare-network analysis reported constipation diagnoses in 22% of autistic versus 9% of comparison youth.",
    evidenceClass:"COMPARATIVE_ASSOCIATION",
    limitations:"Recorded diagnoses and healthcare utilization are not population-onset rates, causes, or proof that reminders improve health.",
    proposedWorkflow:"Accessible concern capture, appropriate clinician assessment, treatment feasibility discussion, follow-up and outcome review.",
    outcomeMeasure:"Clinical-assessment completion plus change in clinician-approved bowel/continence and quality-of-life measures.",
    denominatorDefinition:"Participating eligible symptomatic children; separately count consented contacts, confirmed diagnoses and people completing reassessment.",
    alternativeExplanation:"Medication, diet, physical comorbidity, access, healthcare contact frequency, and different documentation may explain some contrasts.",
    potentialHarm:"Overtesting, false reassurance, missed red flags, unwanted disclosure, stigma and treatment burden.",
    stakeholderOwner:"Pediatric clinical lead and neurodivergent family advisory participants"
  },
  {
    id:"autism-continence",label:"Autism · daytime wetting and bladder–bowel dysfunction",population:"Autistic children and adolescents at a future care site",
    question:"Can accessible bladder and bowel assessment and authorized follow-through improve continence and care experience?",
    sourceTitle:"Associations of Autistic Traits and Autism with Incontinence and Constipation in a UK Birth Cohort",
    sourceDoi:"10.1007/s10803-024-06663-1",studyPeriod:"UK longitudinal birth cohort; study published 2024",
    studyFinding:"Associations were found between autistic traits, autism diagnoses and selected continence outcomes, including daytime wetting.",
    evidenceClass:"LONGITUDINAL_ASSOCIATION",
    limitations:"Different ages and symptom definitions; an association does not diagnose urinary infection, imply delay, or establish a causal mechanism.",
    proposedWorkflow:"Person-preferred urinary and bowel history, clinician-authorized assessment, adaptation to sensory needs, and reassessment.",
    outcomeMeasure:"Clinically validated age-appropriate symptom change, urinary/bowel continence, experience and complete reassessment.",
    denominatorDefinition:"People with an eligible urinary or bowel concern in the participating cohort, distinguishing new from persistent symptoms.",
    alternativeExplanation:"Age, toileting opportunity, anxiety, bowel symptoms, medications and differing symptom recognition and reporting.",
    potentialHarm:"Unnecessary urine tests, pathologizing behavior, inappropriate urgency and alert fatigue.",
    stakeholderOwner:"Pediatric urology/continence clinical owner and participant advisory panel"
  },
  {
    id:"adhd-bowel",label:"ADHD · constipation and fecal soiling",population:"Children and adolescents with ADHD at a proposed participating practice",
    question:"What barriers to appropriate bowel assessment and follow-through can be measured and improved in children with ADHD?",
    sourceTitle:"The Association Between Attention-Deficit Hyperactivity Disorder and Gastrointestinal Symptoms: A Systematic Review and Meta-Analysis",
    sourceDoi:"10.1177/10870547261469626",studyPeriod:"Meta-analysis of studies available through 2026",
    studyFinding:"Pooled association estimates were elevated for constipation (OR 1.97) and fecal soiling/encopresis (OR 4.32).",
    evidenceClass:"COMPARATIVE_ASSOCIATION",
    limitations:"Study heterogeneity is substantial; pooled odds ratios are not prevalence rates, attributable risks or treatment effects.",
    proposedWorkflow:"Accessible bowel assessment integrated with existing ADHD encounters, medication review by clinicians, supported plan follow-through.",
    outcomeMeasure:"Appropriate care evaluation, validated symptom improvement, patient burden and follow-up completion.",
    denominatorDefinition:"ADHD cohort with bowel concerns eligible for clinical review; distinguish assessed from treated and retained cases.",
    alternativeExplanation:"Medication effects, diet, sleep, comorbid autism or intellectual disability, healthcare access and reporting differences.",
    potentialHarm:"Unnecessary treatment, avoidable clinic burden, stigma and poor-fit monitoring instruments.",
    stakeholderOwner:"Pediatric primary-care lead, ADHD care team and family advisory members"
  },
  {
    id:"adhd-urinary",label:"ADHD · lower urinary tract symptoms",population:"School-age children with ADHD in a proposed pediatric care setting",
    question:"Can the existing clinical pathway detect and responsibly resolve urinary concerns among children with ADHD?",
    sourceTitle:"Prevalence of Lower Urinary Tract Symptoms in Children with ADHD: Comparison of Hospital and Population-Based Cohorts of 13,000 Patients",
    sourceDoi:"10.3390/jcm11216393",studyPeriod:"Taiwan hospital and claims cohorts; 2022 publication",
    studyFinding:"Claims-identified significant lower urinary symptoms were 5.79% in ADHD versus 3.36% among matched comparison children.",
    evidenceClass:"COMPARATIVE_ASSOCIATION",
    limitations:"Claims record healthcare-seeking diagnoses, not all symptoms; hospital and insurance estimates have distinct ascertainment.",
    proposedWorkflow:"Accessible symptom questions, clinician review of constipation and urinary conditions, documented follow-through.",
    outcomeMeasure:"Appropriate clinical disposition and validated urinary symptom improvement, including adverse events and workload.",
    denominatorDefinition:"Eligible school-age children with clinically identified urinary concerns, with source and setting definition retained.",
    alternativeExplanation:"Ascertainment, behavioral comorbidity, bowel symptoms, medications and differences in accessing specialist evaluation.",
    potentialHarm:"Unnecessary testing, inappropriate assumptions about infection, embarrassment and missed urgent illness.",
    stakeholderOwner:"Pediatric clinician/continence service and age-appropriate participant representatives"
  },
  {
    id:"id-colorectal-screening",label:"Intellectual disability · colorectal screening follow-through",population:"Adults with intellectual disabilities eligible for guideline-based colorectal screening at a future site",
    question:"Can accessible invitations and reliable positive-result follow-through close an observed screening-to-diagnosis gap?",
    sourceTitle:"Colorectal Cancer Screening Among People With Intellectual Disabilities",
    sourceDoi:"10.1001/jamanetworkopen.2025.57013",studyPeriod:"Danish nationwide register cohort; 2026 publication",
    studyFinding:"90-day stool-sample return was 30.2% versus 56.1% in comparators; follow-up after positive tests was 70.5% versus 90.2%.",
    evidenceClass:"CARE_PATHWAY_DISPARITY",
    limitations:"Danish organized-screening eligibility and time definitions are not US clinic standards; no universal earlier screening age is justified.",
    proposedWorkflow:"Patient-centered supported screening choice, accessible test instructions, positive-result routing and confirmed diagnostic disposition.",
    outcomeMeasure:"Proportion of actionable positive results receiving appropriate documented diagnostic resolution and adequate completion.",
    denominatorDefinition:"Guideline-eligible people with an actionable positive screening test, separate from invitations and completed screening tests.",
    alternativeExplanation:"Different screening eligibility, contraindications, informed refusal, appointment access, bowel preparation and record completeness.",
    potentialHarm:"Unwanted colonoscopy, coercion, unnecessary tests, privacy violation and omission of patient preferences.",
    stakeholderOwner:"Adult GI/primary-care owner, screening service and adults with intellectual disabilities"
  },
  {
    id:"id-bowel-cancer-care",label:"Intellectual disability · bowel cancer diagnostic and treatment pathway",population:"Adults with intellectual disabilities and concerning bowel symptoms at a future clinical partner",
    question:"Where in symptomatic evaluation, diagnostic workup, treatment and follow-through can equitable outcomes improve?",
    sourceTitle:"Bowel cancer care in individuals with an intellectual disability: a population-based cohort study of symptoms, diagnostic pathways, treatment and survival",
    sourceDoi:"10.1186/s12916-026-04906-9",studyPeriod:"English linked primary-care, hospital and cancer records through 2018; published 2026",
    studyFinding:"Among patients with a recorded diagnostic route, emergency diagnoses occurred in 39.0% versus 22.3% among comparators.",
    evidenceClass:"CARE_PATHWAY_DISPARITY",
    limitations:"Observational care-pathway comparison; missing records and clinical appropriateness are not resolved by an apparent delay signal.",
    proposedWorkflow:"Appropriate clinician-led symptom evaluation, accessible referral and testing pathway, treatment review and documented handoff.",
    outcomeMeasure:"Symptomatic patients with clinically appropriate completed evaluation and outcome review, with stage, survival and harms kept separate.",
    denominatorDefinition:"Clinically eligible symptomatic patients requiring evaluation, with indication and time origin defined before comparison.",
    alternativeExplanation:"Comorbidities, symptom features, informed choices, treatment contraindications, care capacity and recording differences.",
    potentialHarm:"Unwarranted invasive testing or screening-age change, failure to honor informed refusal, clinician overload.",
    stakeholderOwner:"Adult clinical and oncology leaders with self-advocate research partners"
  },
  {
    id:"down-multimorbidity",label:"Down syndrome and intellectual disability · multimorbidity",population:"People with Down syndrome or intellectual disability in a proposed longitudinal care program",
    question:"Which condition-specific health priorities and follow-through gaps warrant intervention rather than broad unvalidated risk scoring?",
    sourceTitle:"Multiple morbidity across the lifespan in people with Down syndrome or intellectual disabilities: a population-based cohort study using electronic health records",
    sourceDoi:"10.1016/s2468-2667(23)00057-9",studyPeriod:"Population electronic-health-record cohort published 2023",
    studyFinding:"The population cohort identified distinct multimorbidity patterns by age and intellectual-disability/Down-syndrome group.",
    evidenceClass:"COMPARATIVE_ASSOCIATION",
    limitations:"Disease risks differ by condition and age; no universal diagnostic pathway, mortality forecast or extra test is established.",
    proposedWorkflow:"Clinical owner chooses one guideline-concordant condition-specific gap, then validates monitoring, handoff and treatment response.",
    outcomeMeasure:"Clinical owner-selected condition control, appropriate completed follow-up, participant goals and harm measures.",
    denominatorDefinition:"People eligible for the separately selected condition-specific care process; do not pool all conditions.",
    alternativeExplanation:"Genetic/biologic differences, co-occurring disability, ascertainment and unequal care access.",
    potentialHarm:"Alarm fatigue, discriminatory risk labeling, over-screening and excess participant burden.",
    stakeholderOwner:"Relevant clinical specialist, disability health lead and self-advocates"
  },
  {
    id:"autism-cardiometabolic",label:"Autistic adults · cardiometabolic health",population:"Autistic adults in a potential primary-care or health-plan setting",
    question:"Can equitable use of established cardiovascular/metabolic care pathways reduce uncompleted care without over-screening?",
    sourceTitle:"Cardiometabolic conditions in people with autism: a nationwide prospective cohort study from the Netherlands",
    sourceDoi:"10.1038/s44220-025-00546-9",studyPeriod:"Netherlands nationwide cohort; 2025 publication",
    studyFinding:"A large cohort reported a modest aggregate association with cardiometabolic conditions (HR 1.20), with outcome heterogeneity.",
    evidenceClass:"COMPARATIVE_ASSOCIATION",
    limitations:"Hazard ratio is not prevalence or a causal biological attribution; guidelines remain age- and risk-dependent.",
    proposedWorkflow:"Assess access to existing appropriate blood pressure, metabolic, medication and follow-up pathways with adapted communication.",
    outcomeMeasure:"Completion of guideline-indicated review plus validated condition-specific measures and lived experience.",
    denominatorDefinition:"Adults eligible and due for a defined clinical measurement or follow-up under existing medical guidance.",
    alternativeExplanation:"Medication exposure, co-occurring conditions, social disadvantage, access and observation/case mix.",
    potentialHarm:"Low-value testing, excessive alerts, labeling and inequitable resource diversion.",
    stakeholderOwner:"Adult primary care/health-plan clinical owner and autistic adult advisors"
  },
  {
    id:"neurodevelopment-sleep",label:"Neurodevelopmental conditions · sleep problems",population:"Children and adolescents with defined neurodevelopmental conditions at a future clinical setting",
    question:"Where do appropriate sleep assessment, treatment access and follow-through break down across distinct neurodevelopmental groups?",
    sourceTitle:"Cumulative incidence and relative risk of sleep problems among children and adolescents with newly diagnosed neurodevelopmental disorders: A nationwide register-based study",
    sourceDoi:"10.1111/jsr.13122",studyPeriod:"National register-based cohort; 2020 publication",
    studyFinding:"The nationwide study examined differential recorded sleep problems following neurodevelopmental diagnoses.",
    evidenceClass:"LONGITUDINAL_ASSOCIATION",
    limitations:"Recorded sleep diagnoses may miss unmet need; subgroup effects cannot be collapsed into a universal neurodivergent risk.",
    proposedWorkflow:"Accessible person/family sleep concerns, clinician-led differential assessment, plan and outcome reassessment.",
    outcomeMeasure:"Clinically valid sleep and daytime-function outcome, appropriate follow-up and reduced support burden.",
    denominatorDefinition:"People meeting the specific sleep concern/inclusion definition and reassessment eligibility.",
    alternativeExplanation:"Medication, epilepsy, environmental conditions, sensory needs, family schedules and clinician contact frequency.",
    potentialHarm:"Overmedicalization, inappropriate medication claims, excessive monitoring and privacy loss.",
    stakeholderOwner:"Pediatric sleep/primary-care clinical lead and family and youth representatives"
  },
  {
    id:"id-physical-distress",label:"Intellectual disability · physical illness and changed behavior",population:"People with intellectual disabilities who experience a new physical or behavioral change at a future care site",
    question:"Can an accessible and clinically appropriate physical-health check reduce missed illness without assuming behavior has one cause?",
    sourceTitle:"Temporal associations between incident physical health problems/sensory impairments and challenging behaviours in people with intellectual disabilities: a population-based longitudinal cohort study of primary care in England",
    sourceDoi:"10.1136/bmjopen-2025-111117",studyPeriod:"English primary-care population data; 2026 publication",
    studyFinding:"The longitudinal study observed temporal links between physical or sensory conditions and records of behavior described as challenging.",
    evidenceClass:"LONGITUDINAL_ASSOCIATION",
    limitations:"Temporal association is neither a diagnosis nor proof that the physical illness caused the behavior.",
    proposedWorkflow:"Attend to the person's communication and baseline, assess possible physical, sensory, social and environmental causes with clinical oversight.",
    outcomeMeasure:"Documented appropriate multidisciplinary assessment, person-reported or supported experience and clinical resolution.",
    denominatorDefinition:"Eligible changes in baseline presentation with clinician-confirmed review and safe disposition.",
    alternativeExplanation:"Environmental distress, trauma, unmet communication needs, pain, mental health conditions and recording differences.",
    potentialHarm:"Diagnostic overshadowing in either direction, coercion, unjustified tests and lost personal autonomy.",
    stakeholderOwner:"Intellectual-disability clinical service and people with lived experience"
  }
] as const satisfies readonly NeuroinclusiveTopic[];

export type NeuroinclusiveTopicId = (typeof NEUROINCLUSIVE_TOPICS)[number]["id"];

export function getNeuroinclusiveTopic(id:NeuroinclusiveTopicId):NeuroinclusiveTopic {
  const found:NeuroinclusiveTopic|undefined=NEUROINCLUSIVE_TOPICS.find(topic=>topic.id===id);
  if(!found)throw Error("Unknown research exercise; no case generated.");
  return found;
}

/** The site and clinical population are deliberately unobserved.
 * The published comparison belongs to its original study, never the pilot.
 */
export function neuroinclusiveResearchCase(id:NeuroinclusiveTopicId):ResearchProgramSpec {
  const topic=getNeuroinclusiveTopic(id),sourceUrl="https://doi.org/"+topic.sourceDoi;
  return {
    id:"neuroinclusive-"+topic.id,question:topic.question,site:"general",
    population:{
      targetName:topic.population,
      analysisUnit:"Prospective eligible participants at a future named clinical site — not identified",
      proxyUnit:topic.population,proxyFips:null,equivalence:"NOT_ESTABLISHED",
      notes:"The original study sample is not the pilot population. No site cohort, patient records, current prevalence, results or approvals have been provided."
    },
    problemDefinition:topic.question+" The intended measure: "+topic.outcomeMeasure,
    lastSourceCheck:"Literature review prepared 2026-11-14; source is a retrospective/publication anchor, not a refreshed local baseline.",
    indicators:[],
    dataSources:[{
      id:"source-"+topic.id,name:topic.sourceTitle,url:sourceUrl,owner:"Original research authors and publishing journal",
      granularity:"Original study cohort; NOT a pilot-site population",kind:"PUBLISHED_AGGREGATE",
      observationWindow:topic.studyPeriod,
      legitimateUse:topic.studyFinding+" Limit: "+topic.limitations,
      prohibitedUse:"Inferring an individual's condition, local prevalence, causal mechanism, clinical authorization, treatment effect or site-specific intervention need.",
      connection:"CURATED_REFERENCE_ONLY"
    }],
    strata:[
      {id:"COHORT",dimension:"Age, diagnosis and co-occurring conditions",comparison:"Original study versus partner-site eligibility",
        availability:"REQUIRES_AUTHORIZED_DATA",neededFor:"Confirm the actual eligible group, patient choice and matched comparison.",
        interpretationRisk:"Autism, ADHD, intellectual disability and Down syndrome are not interchangeable cohorts."},
      {id:"ACCESS",dimension:"Communication, access and socioeconomic conditions",comparison:"Designed, operational and experienced care pathways",
        availability:"REQUIRES_AUTHORIZED_DATA",neededFor:"Document actual service gaps and reasonable alternatives with participant input.",
        interpretationRisk:"Observational health differences may reflect access and ascertainment rather than biology."},
      {id:"PATHWAY",dimension:"Recognition through clinical resolution",comparison:"Baseline and ethically comparable care pathways",
        availability:"REQUIRES_AUTHORIZED_DATA",neededFor:topic.denominatorDefinition,
        interpretationRisk:"A referral, appointment or treatment order is not a resolved outcome."}
    ],
    drivers:[
      {id:"PATHWAY-GAP",label:"Care pathway and access hypothesis",
        hypothesis:"Accessible recognition, suitable evaluation or follow-through could be incomplete; no partner-site gap has yet been established.",
        discriminatingTest:"Document onset/report, clinician disposition, authorized referral completion, treatment response and patient experience using a defined eligible cohort.",
        competingExplanation:topic.alternativeExplanation,
        instrumentOrDataNeeded:topic.denominatorDefinition+"; validated outcome instrument and lawful timestamps.",
        evidenceState:"NOT_LOCALLY_TESTED",responsibleReviewers:topic.stakeholderOwner+" and independent evaluation lead"},
      {id:"ASCERTAINMENT",label:"Measurement and alternative-explanation challenge",
        hypothesis:"The original published association may not transport to the new site or population.",
        discriminatingTest:"Audit case definition, comparator, age, co-occurring conditions, source dependence, missingness, confounding and negative controls.",
        competingExplanation:"Recorded diagnoses, service access, patient reporting and clinic selection may account for part or all of the observed comparison.",
        instrumentOrDataNeeded:"Source-linked cohort definition, measure construct and competing model.",
        evidenceState:"NOT_LOCALLY_TESTED",responsibleReviewers:"Independent measurement and research-methodology reviewers"}
    ],
    strategies:[{
      id:"CANDIDATE-FOLLOWTHROUGH",name:"Clinically governed recognition and verified follow-through",
      whereInJourney:topic.proposedWorkflow,basis:"CANDIDATE_TO_EVALUATE",sourceUrl,
      studyTarget:"A prospective implementation hypothesis, not an intervention whose effect is proven by the cited observational finding.",
      localEffect:"NOT_ESTABLISHED",
      measureToVerify:topic.outcomeMeasure+" Denominator: "+topic.denominatorDefinition,
      potentialHarm:topic.potentialHarm
    }]
  };
}

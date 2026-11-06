/**
 * Six-condition comparative research: THREE cancer-stage population measures
 * (NCI/CDC, 2019–2023; 50 states) alongside THREE national self-reported
 * *ever-diagnosed* gynecologic conditions (NSFG, 2022–2023).
 *
 * This is NOT a synthetic six-condition state-level matrix. NSFG does not
 * establish Mississippi/Texas/Colorado condition-specific prevalence.
 * A missing state measure means UNKNOWN, never zero or national imputation.
 * The comparison is over measurement, prevention and system mechanisms;
 * cross-disease numerical correlation is prohibited when constructs differ.
 */
export const WOMENS_HEALTH_NCHS_SOURCE={
 publisher:"CDC National Center for Health Statistics",report:"Health E-Stat 121",
 title:"Endometriosis, Polycystic Ovary Syndrome, and Uterine Fibroids in Women Ages 20–49: United States, 2022–2023",
 url:"https://www.cdc.gov/nchs/data/hestat/hestat121.htm",
 sampleN:4856,observation:"2022–2023",population:"US household population of women age 20–49",
 numerator:"Reported ever having received a diagnosis",denominator:"Survey-weighted population of women ages 20–49",
 inference:"NATIONAL_SURVEY_DIAGNOSIS_NOT_TRUE_DISEASE_PREVALENCE",
 stateEstimates:"NOT_REPORTED_FOR_MISSISSIPPI_TEXAS_COLORADO",
 methodology:"NSFG complex survey, bivariate comparisons; some differences may reflect confounding or access to diagnosis"
} as const;
export type WomensCondition="ENDOMETRIOSIS"|"PCOS"|"UTERINE_FIBROIDS";
export type WomensConditionStats={
 id:WomensCondition;name:string;
 nationalDiagnosedPercent:number;nhBlackDiagnosedPercent:number;nhWhiteDiagnosedPercent:number;
 age20to29Percent:number;age40to49Percent:number;
 diagnosedAmongLowIncomePercent:number;diagnosedAmongHighIncomePercent:number;
 diagnosedWithFertilityDifficultyPercent:number;undiagnosedWithFertilityDifficultyPercent:number;
 diseaseCategory:string;primaryPathwayToTest:string;
};
export const WOMENS_CONDITIONS:readonly WomensConditionStats[]=[
 {id:"ENDOMETRIOSIS",name:"Endometriosis",nationalDiagnosedPercent:6.2,nhBlackDiagnosedPercent:3.7,
 nhWhiteDiagnosedPercent:8.1,age20to29Percent:3.9,age40to49Percent:8.4,
 diagnosedAmongLowIncomePercent:4.4,diagnosedAmongHighIncomePercent:7.1,
 diagnosedWithFertilityDifficultyPercent:33.0,undiagnosedWithFertilityDifficultyPercent:18.6,
 diseaseCategory:"Chronic estrogen-dependent inflammatory disease; NOT established as a classic autoimmune diagnosis",
 primaryPathwayToTest:"Symptom dismissal, access to laparoscopy/imaging, specialist referrals, cumulative endocrine exposures, pain and diagnostic inequity"},
 {id:"PCOS",name:"Polycystic ovary syndrome",nationalDiagnosedPercent:8.7,nhBlackDiagnosedPercent:4.4,
 nhWhiteDiagnosedPercent:9.9,age20to29Percent:7.6,age40to49Percent:9.6,
 diagnosedAmongLowIncomePercent:8.1,diagnosedAmongHighIncomePercent:9.1,
 diagnosedWithFertilityDifficultyPercent:45.2,undiagnosedWithFertilityDifficultyPercent:17.1,
 diseaseCategory:"Endocrine/metabolic disorder; not an autoimmune diagnosis",
 primaryPathwayToTest:"Missed diagnoses, metabolic/insulin resistance pathways, symptom recognition, insurance and differential clinical recording"},
 {id:"UTERINE_FIBROIDS",name:"Uterine fibroids",nationalDiagnosedPercent:7.8,nhBlackDiagnosedPercent:12.5,
 nhWhiteDiagnosedPercent:7.1,age20to29Percent:1.4,age40to49Percent:15.8,
 diagnosedAmongLowIncomePercent:6.4,diagnosedAmongHighIncomePercent:8.5,
 diagnosedWithFertilityDifficultyPercent:25.4,undiagnosedWithFertilityDifficultyPercent:19.0,
 diseaseCategory:"Benign hormone-responsive smooth-muscle tumors; not equivalent to breast cancer or autoimmune disease",
 primaryPathwayToTest:"Earlier age of onset/severity, hormonal and environmental hypotheses, access to imaging/treatment, hysterectomy burden and reproductive outcomes"}
] as const;
export const NATIONAL_WOMENS_RESEARCH_LEADS=[
 {id:"PCOS_MISSED_DIAGNOSIS",url:"https://pubmed.ncbi.nlm.nih.gov/39394785/",
  population:"Boston Medical Center at-risk EHR cohort, 2003–2015, n=23,786",
  observation:"Adjusted missed-PCOS-diagnosis odds: Black vs NH White OR 1.69 (95% CI 1.28–2.24); Medicaid vs private OR 1.90 (1.47–2.46)",
  limit:"Single health-center historical observational study. Not proof of statewide prevalence or racial biological difference."},
 {id:"ENDO_DIAGNOSIS_ROUTE",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC13267626/",
  population:"Clinical cohort n=9,258 with diagnostic routes and socioeconomic vulnerability considered",
  observation:"Endometriosis differences depended on diagnosis mode; laparoscopy diagnosis less likely for African-ancestry than European-ancestry patients (adjusted OR 0.57, 95% CI 0.38–0.85).",
  limit:"Clinical sample and ancestry are not national race categories; cannot automatically transport to state-level incidence."},
 {id:"ENDO_DELAY_SYSTEMATIC_REVIEW",url:"https://pubmed.ncbi.nlm.nih.gov/39418593/",
  population:"International scoping review of 23 studies",
  observation:"Reported average endometriosis diagnostic delay 6.8 years across included studies, with substantial setting/definition variability.",
  limit:"Pooled context is not a state estimate; recall bias, time definition and geographic variation matter."},
 {id:"FIGO_ENVIRONMENTAL_REVIEW",url:"https://doi.org/10.1002/ijgo.70547",
  population:"FIGO 2025 committee opinion synthesizing gynecologic environmental-health literature",
  observation:"Environmental toxicant and endocrine-disruption hypotheses apply to hormonal/reproductive conditions and prevention across life course.",
  limit:"Mechanistic plausibility and narrative synthesis are not a proven pollutant-to-condition causal effect in Mississippi, Texas or Colorado."}
] as const;
export const STATE_WOMENS_CONDITION_STATUS=[
 {state:"Mississippi",code:"MS",stateLevelObservation:"NOT_OBSERVED_IN_NCHS_SOURCE"},
 {state:"Texas",code:"TX",stateLevelObservation:"NOT_OBSERVED_IN_NCHS_SOURCE"},
 {state:"Colorado",code:"CO",stateLevelObservation:"NOT_OBSERVED_IN_NCHS_SOURCE"}
] as const;
export const SIX_CONDITION_MEASUREMENT_RULES=[
 "Cancer dataset: 2019–2023 age-adjusted *late-stage incidence* and share of cases regional/distant among incident cancer diagnoses.",
 "Women’s dataset: 2022–2023 self-reported lifetime clinical diagnosis among women ages 20–49, not incidence, underlying prevalence, stage or state rates.",
 "Cancer rates in female breast use a female denominator. Colorectal/lung use both-sex denominators; never compare unstandardized level differences across sites.",
 "A race/ethnicity contrast in diagnosed cases cannot by itself establish biological predisposition or individual-level incidence, as diagnostic access is part of observation.",
 "Endometriosis is NOT a classical autoimmune disease. Add SLE as a separate true autoimmune sensitivity case only if an appropriate independent source/definition is obtained.",
 "Do not fabricate women’s condition observations for MS/TX/CO; use state sex-specific claims, registry, utilization, health coverage, procedures and carefully assessed instruments when available.",
 "Never equate treatment, screening, procedure or utilization counts with underlying incidence, diagnostic accuracy, environmental exposure or patient benefit."
] as const;
export function threePlusThreeResearchSnapshot(){
 return {schemaVersion:"dis-rplice-six-conditions-v1",cancerSource:"NCI State Cancer Profiles 2019–2023, 50-state public incidence snapshot",
  womensSource:WOMENS_HEALTH_NCHS_SOURCE,conditions:WOMENS_CONDITIONS,stateEvidence:STATE_WOMENS_CONDITION_STATUS,
  linkedEvidence:NATIONAL_WOMENS_RESEARCH_LEADS,
  crossConditionCorrelation:"NOT_ESTIMABLE_FROM_NONCOMPARABLE_NATIONAL_AND_STATE_MEASURES",
  causalContribution:"NOT_ESTABLISHED",independentReplication:"NOT_PERFORMED",methodSelection:"HUMAN_CONTROLLED",
  implementationEffect:"NOT_MEASURED",rules:SIX_CONDITION_MEASUREMENT_RULES};
}

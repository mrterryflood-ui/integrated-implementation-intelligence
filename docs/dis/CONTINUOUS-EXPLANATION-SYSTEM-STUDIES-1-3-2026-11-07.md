# DIS–RPLICE Continuous Explanation System | Research investigations 1–3
**Status:** design and investigation protocol, not validated causal model. **Date:** 2026-11-07. **Owner:** internal DIS research team. No Jeremiah outreach until internal scientific review.

## Mission
Explain *why* a geographic or demographic difference appears, which portion is measurement or ascertainment, which mechanisms are plausible, what data would discriminate them, and whether a proposed correction improves benefit and equity over time. Do not equate an observed disparity, a diagnosis, a correlation, a pathway mechanism, or a proven causal effect.

## The common question
For each outcome and population: (1) What precisely was measured? (2) What did the underlying population experience? (3) What mechanisms could generate this observation? (4) What competing explanation would produce the same pattern? (5) What observation would distinguish them? (6) What decision would change if the explanation is wrong? (7) What would count as a sustained, equitable improvement?

## Core conceptual model (condition-specific paths)
**True underlying disease occurrence → symptoms/biological course → contact and detection opportunity → test and diagnostic completion → recorded diagnosis/stage → treatment → burden, quality of life, mortality.** Context (policy, coverage, staffing, transportation, referral design, socioeconomic resources, structural conditions) modifies each transition. Surveillance completeness and classification methods modify *observed* measures without necessarily modifying true occurrence. For cancer, stage applies to diagnosed incident cases; for endometriosis/PCOS/fibroids, diagnosis status is not a cancer stage. Environmental point locations are exposure hypotheses, not individual doses or causes.

## Engine modules, interfaces, and decisions
| Module | Required input | Product | Stop/reopen condition |
|---|---|---|---|
| 1. Source Registry | URL, publisher, release, retrieval date, archive checksum, license, methods | Pinned, versioned source ledger | Link broken, silent revision, provenance uncertain |
| 2. Measurement Ontology | Disease, construct, numerator, denominator, eligible population, age adjustment, case definition, geography, dates, suppression, uncertainty | Condition-specific comparability decision | Different constructs, time windows, eligibility, methods |
| 3. Geography/Population Crosswalk | County/city/state/catchment boundaries, sex/age/race definitions, migration, population vintage | Valid comparison units | City proxy substituted for county, ecological inference |
| 4. Three-Reality Mapper | Designed policies, operational service data, authorized experienced data | Triangulated system map, missing evidence explicitly marked | Experience inferred from administrative data |
| 5. Mechanism Graph | Directed hypotheses and rivals, temporal ordering, confounders, mediators, ascertainment | Testable causal *hypotheses*, not proof | Unsupported arrow, reverse causation, unmeasured confounding |
| 6. Discriminating Test Planner | Candidate explanations, feasible data, study design and power | Next-best test and expected disconfirming result | No credible way to distinguish hypotheses |
| 7. Design/Causal Audit | Intervention dates, comparator, longitudinal panel, selection, parallel trends, interference, sensitivity | Descriptive, associational or causal *claim tier* | Inadequate panel or unsupported assumptions |
| 8. Decision/Intervention Fit | Evidence strength, beneficiary, resources, alternatives, harms, reversibility | Proposed action with named owner and conditions | No authorization, no local fit, inequity warning |
| 9. Equity and Sustainment | Disaggregated denominators, benefit/harm, uncertainty, costs, time and maintenance | Subgroup outcome and durability report | Subgroup decline, changing case mix, no follow-up |
| 10. Explanation Publisher | All prior receipts and review decisions | Plain-language narrative with evidence links, dissent, unknowns and version history | Any causal wording exceeds supported tier |

**Do not rebuild** the existing DIS evidence-action bridge, RPLICE method selection, GIS, authenticated cases, or learning checkpoints. This specification defines extensions and interoperable adapters. Human reviewers select RPLICE specialist methods; selection is not proof of execution.

## Study 1: Colorectal cancer — why similar late-stage shares conceal different burden
### Known observation and limits
2018–2022 NCI historical county late-stage colorectal measures: Hinds County 63.3% late share, 30.4 age-adjusted late-stage cases per 100,000, 76 average late-stage cases annually; Harris County 63.4%, 23.3, 1,044 respectively. The share is conditional on staged diagnoses; the rate is population standardized; the count is unadjusted. Neither county is its central city. Colorado source vintage differs; do not pool 2019–2023 with 2018–2022.

### Rival explanations and discrimination
- **True incidence:** all-stage age-adjusted incidence differs. Test: aligned county all-stage incidence by age, sex, race and calendar period, source release fixed.
- **Stage/ascertainment:** staged-case completeness, unknown stage, registry coding and diagnostic intensity differ. Test: registry stage unknown fraction, completeness, coding changes and case ascertainment.
- **Screening pathway:** eligible-person uptake differs. Test: eligibility-defined longitudinal screening completion and modality; ecological county screening percentages alone cannot identify individuals.
- **Abnormal-result resolution:** colonoscopy/referral access and time-to-completion differ. Test: source-defined positive test → referral → appointment → diagnostic completion with dates and censoring.
- **Access and treatment:** coverage, specialist capacity, transport and treatment timing differ. Test: linked authorized facility/pathway and patient-experience evidence.
- **Population structure and risk:** different underlying age, exposure, comorbidity and socioeconomic distributions. Test: stratified estimates, standardization and confounder analysis.
- **Environmental causes:** plausible only with credible dose, latency, pathways and competing exposures; EPA ECHO facility proximity alone is insufficient.

**Next discriminating test:** independently retrieve same-vintage all-stage incidence, stage completeness and age-specific late-stage incidence for Hinds and Harris; then determine whether the observed late-stage rate difference persists after suitable stratification. Only then consider a site-specific service pathway study.

## Study 2: Three-cancer national comparison — why correlation changes with the measurement
### Observation
The pinned repository 50-state table produced a colorectal–lung Pearson correlation about 0.735 for late-stage age-adjusted incidence rates and 0.129 for late-stage case shares. These are descriptive ecological associations, not biological mechanisms or causal effects. Two previously reported secondary coefficients do not reproduce exactly from the pinned table; retain discrepancy and original script/data recovery as open.

### Competing mechanisms
- Shared population-level incidence/risk gradients versus independent cancer-specific risks.
- Stage ascertainment, screening intensity, diagnosis and eligibility differences across cancers.
- Age adjustment and denominator transformations producing apparent relationship changes.
- State composition, measurement error, spatial autocorrelation and common registry/source dependence.
- Ecological aggregation masking within-state and within-population differences.

### Mandatory analysis ladder
1. Pin original 50-state dataset and reconstruct both correlation matrices, exact N and exclusion rules, Pearson and Spearman; report discrepancies.
2. Inspect distributions, outliers, missingness, suppression, CI and leverage; use scatterplots and robust sensitivity analyses.
3. Avoid interpreting r-rate minus r-share as a statistical effect without a valid paired/dependent-correlation uncertainty method; bootstrap states only with clear assumptions, consider spatial dependence.
4. Stratify by eligible population and source-compatible age/sex/race where data permit; do not force identical denominators across diseases.
5. Assess ecological confounding and alternative transformations; predefine hypotheses before modeling.
6. Seek independent longitudinal replication and adjudicate cross-cancer pathways; no common-cause claim from pairwise r.

**Next discriminating test:** reproduce all coefficients from an immutable input with code and compare age-specific, sex-appropriate, source-aligned measures and uncertainty before constructing a mechanism graph.

## Study 3: Endometriosis, PCOS and fibroids — why recorded diagnosis is not prevalence
### Observation
NSFG 2022–2023 published ever-diagnosed survey estimates for ages 20–49: endometriosis 6.2%, PCOS 8.7%, fibroids 7.8%; source NCHS. The survey is a weighted, complex sample and 'ever diagnosed' is not current true disease prevalence, stage, incidence or a valid 50-state longitudinal panel.

### Rival explanations
- **True underlying disease burden** versus **probability of recognition** among people with disease.
- Symptom severity, care-seeking, referral access and clinician practice.
- Different diagnostic criteria, imaging, laparoscopy, clinical coding and guideline versions.
- Insurance, cost, geography, specialist availability and treatment preferences.
- Survey recall, sampling/weighting, nonresponse and age/eligibility differences.
- Different timing of diagnosis and symptom onset; diagnostic delay requires separate validated longitudinal or patient-reported measures.

### Disease-specific endpoints
- Endometriosis: symptom-to-recognition and diagnosis interval, validated pain/function measures, care continuity and patient-reported burden; avoid assuming a surgical diagnosis is required in every setting.
- PCOS: explicitly versioned diagnostic criteria and age group, metabolic/reproductive symptom management and longitudinal follow-up; avoid mixing survey ever-diagnosed with clinical phenotype prevalence.
- Fibroids: symptoms and quality of life, imaging diagnosis, treatment access and patient preference; surgery rates are service use, not population prevalence.

**Next discriminating test:** reconstruct the NSFG published percentages using documented complex survey design, weights, denominator and question wording; map independent diagnosis/clinical pathway data and identify whether state-level comparison is even supportable. If not, choose a suitable geographic design instead of manufacturing state estimates.

## Consistent explanation format for every observation
**Observation** — exact estimate, uncertainty, source, geography, population, period and denominator.  
**Interpretation** — what it means mathematically and what it does not measure.  
**Mechanisms** — at least two plausible competing pathways; biological, institutional and ascertainment explanations separated.  
**Discriminating evidence** — which original source or test could reject each explanation.  
**Current claim tier** — OBSERVED_DESCRIPTIVE / ASSOCIATION / MECHANISM_HYPOTHESIS / CAUSAL_DESIGN_CANDIDATE / INDEPENDENTLY_VALIDATED_CAUSAL. The last tier requires qualified independent review, not automatic software promotion.  
**Equity and lived experience** — subgroup estimates, missingness, harms, authorized experiential evidence; never invent testimony.  
**Decision consequence** — what could responsibly change now, what must wait, and who authorizes.  
**Uncertainty/reopen** — alternative interpretation, evidence age, next review trigger, reproducible artifact and version.

## System data contract (proposed, not yet deployed)
Each EvidenceCell: {studyId,condition,construct,numeratorDefinition,denominatorDefinition,value,unit,uncertainty,geographyId,geographyType,populationFrame,eligibility,periodStart,periodEnd,sourceUrl,sourceRelease,retrievedAt,methodVersion,stageOrDiagnosisDefinition,missingness,suppression,provenanceStatus}.
Each Explanation: {claimId,evidenceCellIds,claimTier,observation,limitations,mechanisms:[{hypothesis,alternative,discriminatingTest,neededData,status}],designed,operational,experienced,decisionImpact,ownerRole,reviewerDissent,reopenTriggers,reviewedAt}.
No personally identifiable health data in public modules. All inputs require bounded validation, tenant-safe persistence for authorized private records, and explicit human approval for publication or action.

## Research-to-implementation roadmap
**R0 Evidence lock:** source ledgers and independent extraction for the three investigations; owner = epidemiology/measurement reviewers; proof = two-reviewer reconciliation.
**R1 Explanation prototype:** reuse current research workbench; add three condition-specific adapters, source compatibility and mechanism/rival tests; owner = DIS engineering; proof = source-vintage, wrong-denominator, diagnosis-vs-prevalence and rival-explanation regression.
**R2 Scientific adjudication:** independent methods/clinical review and explicit disconfirmation; owner = research council; proof = decision and dissent record, no causal overclaim.
**R3 Operational inquiry:** authorized pathway and lived-experience data, feasibility and governance; owner = site partners once approved; proof = signed agreements and valid instruments.
**R4 Controlled evaluation:** appropriate prospective or quasi-experimental study, balancing harms, equity and sustainment; owner = approved PI/team; proof = registered protocol and independent outcome analysis.
**R5 Continuous refresh:** source version monitoring, material-change detection, scheduled reanalysis and human review; proof = dated source/analysis/decision receipts and no silent revisions. Do not claim a monitor exists until deployed.

## Open gates
- Current data for all three studies not yet independently re-extracted from source files.
- Original author script/input needed to resolve two national coefficient discrepancies.
- No validated longitudinal person-level pathway evidence, environmental exposure or lived-experience dataset.
- No signed-in production save/reopen/tenant-denial witness for the expanded case record.
- No independent clinical/methods adjudication or measured intervention benefit.
- No actual scheduled data refresh, automated source monitoring or published explanation engine; this document is its implementable specification.

**Decision:** GO source verification and bounded prototype; HOLD causal, prevalence-equivalence, universal generalization, external research claims and stakeholder email pending internal review.

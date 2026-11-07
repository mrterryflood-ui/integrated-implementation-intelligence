# DIS | Three-study investigation and explanation system (internal research v0.1)
**2026-11-07 | Owner: DIS research lead | Scope: investigate, not pitch, submit, or clinically intervene**

## Mission
Explain reproducibly why observations differ, which rival mechanisms are plausible, which evidence could discriminate them, what remains unknown, and what action would be warranted *only after* independent validation. This is a permanent research-to-explanation protocol, not a one-off summary generator. The three studies are: (1) colorectal Hinds/Harris/Colorado; (2) state-level colorectal/lung/female-breast patterns; (3) diagnosis ascertainment for endometriosis, PCOS and fibroids.

## Common causal grammar: seven noninterchangeable layers
1. **Occurrence:** true underlying disease onset/prevalence/incidence (often latent).
2. **Recognition opportunity:** symptoms, eligibility, screening, outreach, healthcare contact.
3. **Ascertainment:** tests, diagnoses, coding, registry completeness and stage assignment.
4. **Resolution:** referral, follow-up, confirmed diagnosis, treatment initiation.
5. **Outcome:** morbidity, stage, mortality, patient-reported experience and burden.
6. **Distribution:** who is reached, missed, harmed or improved; valid subgroup denominators and suppression.
7. **System context:** policies, incentives, insurance, capacity, geography, environment, history, trust, and time.

A measured late-stage **share** conditions on diagnosed/staged cases. A late-stage **rate** is age-standardized per resident population. A **count** is a number of cases in a period. Survey **ever diagnosed** is a self-reported history of recognition and does not estimate underlying prevalence without ascertainment assumptions. A cross-sectional ecological correlation is not an individual-level association or causal mechanism. Every narrative must name its layer and denominator.

## Investigation record contract (no patient data)
Every claim, measurement, or explanation must carry:
- `studyId, condition, geographyType, geographyId, periodStart, periodEnd, releaseVintage, retrievedAt, sourceUrl, tableOrVariable, numeratorDefinition, denominatorDefinition, eligibility, unit, standardization, uncertainty, suppression, missingness, populationFrame, observationStatus, reviewer, independentVerificationStatus`.
- **Evidence status:** source-reported / independently re-extracted / derived-and-reproduced / plausible hypothesis / contradicted / unknown / synthetic. Multiple values from one registry are **not** independent corroboration.
- **Rival hypothesis:** mechanism, directed pathway, expected observations if true, disconfirming evidence, competing causes, timing/latency, known measurement bias, proposed instrument, responsible reviewer and decision gate.
- **Explanation:** what was observed; why simple readings fail; viable rival explanations; what evidence would discriminate; what we can conclude today; what remains unknown; recommended next *research* step; equity and harm consequences.
- **Decision trace:** designed vs operational vs experienced realities, explicit human method selection, source ledger, versioned assumptions, dissent, ownership, test, observed outcome, reopening trigger. A completed task is not a verified benefit.

## Mandatory processing pipeline
`INTAKE → SOURCE PINNING → CONSTRUCT & DENOMINATOR CROSSWALK → QUALITY/BIAS AUDIT → DESCRIPTIVE ANALYSIS → MECHANISM GRAPH → RIVAL-HYPOTHESIS TESTS → EXPLANATION WITH UNCERTAINTY → INDEPENDENT RED TEAM → HUMAN DECISION → FOLLOW-UP/RE-MAP`.

At each gate, a mismatch is a recorded research gap, not a silently imputed or fabricated observation. RPLICE is human-selected as a specialist method; never represent a method recommendation as actual execution. Integrate with existing DIS casework and evidence-action bridge; do not create a parallel tenant database. Source-to-claim-to-explanation-to-decision links must survive case revisions.

## Study 1: colorectal Hinds/Harris/Colorado
**Observed historical NCI county figures, 2018–2022 (source-reported, not independently re-extracted in this protocol):**
| Construct | Hinds County MS | Harris County TX | Interpretation |
|---|---:|---:|---|
| Late-stage percent of staged colorectal cases | 63.3% | 63.4% | -0.1 percentage point; not a resident population rate |
| Age-adjusted late-stage incidence per 100,000 residents/year | 30.4 | 23.3 | Hinds is about 30.5% higher *relative to Harris* on this construct (30.4/23.3 - 1); not a causal contrast |
| Average annual late-stage case count | 76 | 1,044 | Population-size and ascertainment effects prevent direct burden-rate comparison |

**Core paradox to explain:** nearly equal conditional late-stage shares coexist with unequal population-standardized late-stage rates. These can coexist mathematically because their denominators differ. It does not follow that the difference is entirely disease incidence, entirely diagnostic delay, or entirely stage coding. The ratio of age-adjusted late-stage incidence to late-stage percentage must **not** be presented as an independently verified age-adjusted all-stage incidence: standardization and staged-case denominators differ.

**Competing hypotheses and discriminators:**
- H1: Different underlying incidence. Test source-matched all-stage age-adjusted incidence and age-specific rates, identical vintage, stage completeness and registry definition.
- H2: Different screening eligibility/reach or uptake. Test eligible population, invitation, completed test, prior screening, insurance and age/sex mix; ecological county rate cannot supply this.
- H3: Different abnormal-result diagnostic completion. Test time-stamped abnormal result → referral → appointment → completed diagnostic workup, capacity, transportation and affordability.
- H4: Registry ascertainment/staging/coding differences. Test unknown-stage fraction, registry quality, coding changes, age-adjustment definitions and release history.
- H5: Composition, social determinants and historical exposures. Test appropriately time-lagged, population-aligned contextual measures; no facility point or county correlation proves individual exposure or mechanism.
- H6: Distinct treatment/diagnostic trajectories. Test stage-specific treatment, access and mortality separately; late-stage share alone is not a treatment-quality outcome.

**Source reconciliation:** Hinds/Harris late-stage 2018–2022; indexed Colorado late-stage and Texas all-stage tables may be 2019–2023. Until original releases and same-window definitions are pinned, do not pool Colorado or derive cross-vintage all-stage contrasts. County ≠ Jackson or Houston municipal population or clinical catchment.

**Priority analytic products:** three separate maps (late-stage rate, late-stage share, average count); aligned source/uncertainty table; stage-completeness sensitivity analysis; time-series feasibility assessment; competing-hypothesis matrix; explanatory memo with alternatives, not a causal conclusion.

## Study 2: colorectal, lung, female breast across 50 states
**Pinned curated table reanalysis reported previously:** colorectal–lung Pearson correlation of late-stage *rates* ≈0.735, versus late-stage *shares* ≈0.129. These are descriptive ecological associations and require independent source extraction and sensitivity review. The secondary reported/recomputed coefficients conflict: colorectal–breast share Pearson 0.234 vs 0.230670; lung–breast share Spearman 0.413 vs 0.409816. Preserve both with separate source/version status until original analysis files and formulas are reconciled; do not silently choose.

**What could explain the change?** A late-stage rate combines occurrence, detection, staging and age-standardized population denominators; a late-stage share conditions on identified/staged cases. Correlations can change because constructs, standardization, age/sex composition, case ascertainment, eligibility, and underlying spatial factors change. This is not proof of a single mechanism or screening program effectiveness.

**Investigation matrix:**
- Cancer-specific registry case definitions and staging; female breast denominator and sex/age eligibility; lung and colorectal distinct risk and screening pathways.
- 50 states only, excluding US total/DC/PR unless separately justified; verify suppression and rounding.
- Reproduce Pearson and Spearman from immutable original data; uncertainty (bootstrap/sensitivity as suitable), scatterplots, outlier and leave-one-out analyses, and multiple comparisons.
- Examine geography, rurality, deprivation, insurance, smoking prevalence, screening availability, age/sex structure, registry completeness and time-lagged environmental context *as candidate ecological covariates*, not inferred causes.
- Predeclare ecological-fallacy and compositional-bias warnings; do not use a regression-adjusted state association to prescribe an individual clinical action.
- Compare disease-specific models before searching for cross-disease common mechanisms. A shared correlation does not imply shared etiologic exposure.

**Priority products:** pinned raw source and calculation checksums; exact reproducibility notebook/script; construct-separated visualizations; coefficient discrepancy adjudication receipt; disease-specific and common-mechanism diagrams with falsification criteria.

## Study 3: endometriosis, PCOS and uterine fibroids
**Source-reported NCHS NSFG 2022–2023, ages 20–49:** ever-diagnosed endometriosis 6.2%, PCOS 8.7%, fibroids 7.8%, reported sample 4,856 respondents. Confirm original universe, complex survey design, weights, missingness and confidence intervals before independent use. These are *diagnosis-history* measures, not comparable population-based disease incidence or county late-stage measures.

**Distinct explanation pathways:**
- Endometriosis: symptomatic disease → clinical recognition → specialist access → diagnosis; symptom burden and time-to-diagnosis are not interchangeable with coded diagnosis prevalence.
- PCOS: phenotype and diagnostic-criteria variation → recognition and diagnostic practice → recorded diagnosis; reproductive-age eligibility and survey response matter.
- Fibroids: underlying often-asymptomatic disease → imaging/diagnosis → symptom severity → treatment choice; hysterectomy/procedure counts do not equal fibroid prevalence.

**Rival explanations for observed group differences:** actual occurrence, symptom differences, access and affordability, provider recognition, diagnostic criteria, self-report/recall, treatment pathways and sampling. An observed *ever-diagnosed* difference cannot distinguish these without additional data.

**Investigation requirements:** original NCHS variable labels and codebook; complex-survey weights/strata/PSUs, domain restrictions and variance estimation; condition-specific source/construct ontology; separate denominator and missingness audit; patient-reported burden/diagnostic delay instruments where validated; intersectional stratification only where cell precision/privacy permits. Never create 50-state rates from a survey that does not support state-representative estimation.

**Priority products:** three disease-specific DAGs, survey replication report, ascertainment-bias sensitivity, source-to-claim ledger, and explicitly unknown underlying prevalence.

## Consistent explanation template — one page per finding
1. **The observation:** value, unit, denominator, geography, dates, source/version and uncertainty.
2. **What it does *not* mean:** most likely denominator or causal misinterpretation.
3. **Why it can happen:** at least two genuinely different mechanisms and their directed pathways.
4. **How to tell mechanisms apart:** specific discriminating observation, instrument and feasible source.
5. **What we know / infer / do not know:** independent evidence tiers and contradiction ledger.
6. **Whom it affects:** population eligibility, subgroup benefit/harm, missingness, experienced reality.
7. **What we should investigate next:** owner, priority, access/consent, time window, validation test, closure proof.
8. **Reopen conditions:** new source release, coding change, subgroup adverse signal, disconfirming evidence, failed follow-up.
**Output modes:** plain-language explanation; technical methods appendix; map/table with provenance; machine-readable evidence and hypothesis ledger; internal red-team decision note. No recommendation of intervention before a validated mechanism and authorized local context.

## Technical architecture and non-duplication
- **Existing source of truth:** GitHub DIS repo, existing `research-program`, `evidence-action-bridge`, authenticated `/api/cases` and longitudinal case events. No new persistence/auth/tenant layer.
- **New logical module:** `ExplanationCase` as a versioned, condition-specific schema in existing case report. Evidence registry keyed by source+vintage+construct+population+period; no source fields silently combined.
- **Adapters:** NCI State Cancer Profiles and original registry releases; NCHS NSFG original data/codebook; scholarly discovery leads. Adapter retrieval != independent scientific verification.
- **Reasoning engine:** descriptive statistics with exact construct checks; mechanism/DAG library; counterfactual preflight; competing-hypothesis discriminators; contradiction detection; subgroup and harm audit; confidence/uncertainty narrative.
- **UI:** Study selector → source ledger → compare compatible measurements → explanation alternatives → evidence-to-discriminate → council dissent → approved research actions → longitudinal verification. Visually separate verified evidence, hypotheses, synthetic teaching examples and unresolved data.
- **QA:** contract tests for wrong vintage, denominator, sex/eligibility, disease, unknown stage, suppressed cells, ecological fallacy, survey weight omission, numerical discrepancies, invented cause, duplicate source and fake completed intervention; browser and authenticated RLS tests; human methodological adjudication.
- **Governance:** research owner selects specialist methods, approves each external source/data transfer and reviews draft claims; no automatic RPLICE execution or outreach. Preserve original studies and append corrections, do not overwrite.

## Current decision and next execution gates
**GO:** original-source extraction, coefficient discrepancy reproduction, three mechanism maps, survey design feasibility and schema/UX design within existing DIS. **CONDITIONAL:** statistical adjustment, causal comparisons and geography transfer after validity and permission review. **HOLD:** clinical causal claims, policy blame attribution, pooled multi-disease effect sizes, live interventions, external email or Jeremiah submission.

**Closure criteria for research iteration 1:**
- Two independently checked source rows for each published figure; stable source vintage and explicit denominator.
- All reported coefficients regenerated from a pinned original input, with discrepancies explained or explicitly unresolved.
- Each of the seven disease modules (colorectal, lung, female breast, endometriosis, PCOS, fibroids—six distinct conditions) has a falsifiable mechanism map and source limitations; three study-level explanations remain distinct.
- Every generated narrative carries a rival explanation and a disconfirming test; no causal promotion from ecological or diagnosis-history data.
- At least one blinded internal reviewer can reconstruct the explanation without consulting its author.
- Real signed-in case save/reopen and tenant isolation witnessed separately before claiming operational completeness.

**Status:** This file is the investigation specification and first-pass analysis, not evidence that original-source re-extraction, survey replication, causal analysis or full system implementation has occurred.

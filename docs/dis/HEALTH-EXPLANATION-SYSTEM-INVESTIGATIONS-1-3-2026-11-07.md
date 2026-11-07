# DIS Health Explanation System — Investigations 1–3
**Internal research specification v0.1 | 2026-11-07 | Not an external briefing**

## Purpose
Turn a surprising population-health observation into a **reproducible, falsifiable, intelligible explanation** and a defensible next investigation. The system must never equate pattern with mechanism, diagnosis with disease, program completion with benefit, or ecological association with individual causation. Build on existing DIS Research Studio, evidence-action bridge, RPLICE human-selected specialist methods, existing case history, and approved source adapters. No new standalone app or duplicate persistence.

## The common explanatory unit
Every question produces one versioned `ExplanationCase` with:
- **Question**: condition, phenomenon, decision use, population, geographic boundary, comparator, years, intended beneficiary, primary outcome.
- **Measurement ledger**: each numerator, denominator, unit, stage/diagnosis definition, age adjustment, sampling weights, uncertainty, suppression, source URL, source release, access date, geographic and temporal coverage; provenance and independent re-extraction state.
- **Phenomenon map**: disease occurrence → clinical recognition/ascertainment → screening/testing → abnormal finding → diagnostic resolution → stage/severity → treatment → morbidity/mortality. Use condition-specific graph; absent stages must not be invented.
- **Context map**: Designed (policy and intended service), Operational (actual delivery and capacity), Experienced (authorized observations from affected people), with an explicit UNKNOWN state for unavailable evidence.
- **Hypothesis registry**: alternative mechanism, causal pathway, predicted observable pattern, rival explanation, disconfirming evidence, source, strength, responsible reviewer, test status.
- **Comparison audit**: same construct? compatible source releases? matched years? population and geographic exchangeability? confounding? ecological fallacy? missingness? sensitivity and negative controls?
- **Explanation record**: What is observed; what can be inferred; what remains unknown; rival mechanisms; discriminating test; what finding would change the conclusion; potential harms of premature action.
- **Decision trace**: GO for additional measurement, CONDITIONAL for candidate study, HOLD for unsubstantiated causal or intervention claims; selected RPLICE method requires explicit HIL choice and actual execution receipt.
- **Follow-through**: named owner only after acceptance; evidence acquisition, milestones, versioned review, implementation choice, fidelity and subgroup benefit/harm if a real pilot is authorized.

Each narrative sentence must link to source-cell IDs or be explicitly labeled a hypothesis. Scientific conclusions require independent reviewer adjudication; AI-generated narrative is a draft.

## Investigation 1: colorectal Hinds–Harris–Colorado
**Observed source-reported 2018–2022 county aggregates** (NCI State Cancer Profiles, not yet independently re-extracted):
| Site | Late-stage share | Age-adjusted late-stage incidence /100k/year | Average annual late-stage count |
| Hinds County MS | 63.3% | 30.4 | 76 |
| Harris County TX | 63.4% | 23.3 | 1,044 |
| Colorado comparison | UNALIGNED | UNALIGNED | UNALIGNED |

**Exact interpretation:** the conditional late-stage shares differ by only 0.1 percentage point; the age-adjusted late-stage incidence rate is 7.1 per 100,000 higher in Hinds (about 30.5% relative to Harris). Hinds's rate is ~1.305 times Harris's; the annual counts are not rates. The comparison cannot tell us whether the difference arises from underlying incidence, case mix, detection, stage classification, access or follow-up. The two percentages may share an underlying registry lineage; not independent replications.

**Tempting but invalid shortcut:** `late-stage rate / late-stage share = all-stage age-adjusted incidence`. Age-standardized rates and a conditional share of staged cases have different weighting and potentially different stage denominators; direct division does not recover a verified all-stage standardized rate.

**Competing hypotheses and discriminating observations:**
1. Higher underlying colorectal incidence in Hinds: obtain source-matched all-stage age-adjusted incidence, age-specific rates, registry completeness and relevant risk distribution.
2. Different detection/ascertainment: compare eligible screening, testing modality, abnormal-result diagnostic resolution, missing/unstaged cases and time to diagnosis in authorized comparable clinical cohorts.
3. Different stage distribution from pathway delays: examine time-stamped referral and colonoscopy completion, interval cancers, symptom presentation and stage-specific rates, adjusting for ascertainment.
4. Case-mix/geographic confounding: examine age, sex, race/ethnicity, insurance, rural/urban catchment, geography mismatch, calendar years and available contextual factors without assuming demographic traits explain biology.
5. Registry coding/version differences: audit stage definitions, suppression, reporting lag, period and denominator methodology.

**Immediate next data**: matched Hinds/Harris all-stage and late-stage county NCI extracts pinned to same years and release; original CI/methodology; Colorado county selection and same release; source-defined age-specific and stage-unknown proportions. Clinical pathway questions are hypotheses until authorized records exist.

## Investigation 2: colorectal–lung–female breast, 50-state ecology
**Previously computed from pinned curated table, not re-extracted from original registry**:
- Colorectal vs lung late-stage incidence rate Pearson r≈0.735.
- Colorectal vs lung percentage-late-stage Pearson r≈0.129.
- Two secondary results need reconciliation against original script/input: colorectal–breast late-stage share r=0.230670 vs earlier 0.234; lung–breast late-stage share Spearman rho=0.409816 vs earlier 0.413.

**Meaning:** changing the construct changes the cross-state association. Correlation between rates could reflect shared population risk, age-standardization/case mix, smoking and other exposures, healthcare access, registry practices or unmeasured state-level conditions. Similar ecological correlations do not imply a common individual cause. The share metric is conditional on detected and staged cases, and can move differently when ascertainment changes.

**Required design**: one row per state × cancer × year/source release × measure; use cancer-specific eligibility/staging definitions, female breast denominator, uncertainty, missingness and spatial autocorrelation; distinguish crude, age-adjusted, stage share and mortality; avoid multiplying correlated measures into false independent evidence. Recalculate Pearson/Spearman from verified source extracts, inspect scatterplots/outliers, robust and leave-one-out estimates, and compare source vintages. Use multilevel/spatial models only when assumptions and data warrant; do not imply causal effects from state ecological regression.

**Critical falsification**: if an apparent shared rate pattern disappears after harmonizing source windows or case ascertainment, reopen the explanation rather than attributing it to a universal barrier. If a proposed shared mechanism predicts a diagnostic-follow-up pattern but no such pattern is observed, downgrade it.

## Investigation 3: endometriosis, PCOS, uterine fibroids
**Source-reported NSFG 2022–2023 estimates**: ever-diagnosed endometriosis 6.2%, PCOS 8.7%, fibroids 7.8% among women ages 20–49; survey sample n=4,856. These are not population biological prevalence, not three independent state-specific incidence estimates, and not directly comparable to cancer stage shares.

**Observation equation (conceptual, not an estimator)**:
`Recorded diagnosis = underlying condition × symptom/encounter opportunity × recognition/testing pathway × diagnostic criteria/coding × survey recall/reporting`.
This is a conceptual decomposition, not a literal product of independent probabilities. Diagnosis may be incidental, and pathways differ sharply by condition.

**Distinct condition modules**:
- Endometriosis: symptom onset and diagnostic delay, symptom burden, care-seeking, clinical and surgical/imaging diagnostic standards, quality of life; not all disease is diagnosed surgically.
- PCOS: diagnostic criteria/version, age, symptom and metabolic presentation, clinician recognition, comorbidities and survey ascertainment; distinguish recognition from underlying prevalence.
- Fibroids: imaging and incidental detection, symptoms, treatment choice, procedural access and burden; hysterectomy or other procedure counts are not a prevalence denominator.

**Critical tests**: survey design weights and confidence intervals, item wording and recall, eligibility and missingness; distinguish never diagnosed from confirmed absent; compare age, access, geography and subgroup patterns only where sampling precision supports them. No 50-state claim from an inadequately powered national sample. Triangulate with condition-specific clinical studies, claims/EHR where legally authorized, and lived experience rather than assuming a single mechanism.

## How the system explains findings to a nontechnical user
Every case produces the same five-pane view:
1. **What we see:** a compact chart/table with units, population, dates and uncertainty.
2. **What it does not mean:** common denominator traps, ecological fallacy and unverified causal assertions.
3. **What could explain it:** competing mechanisms, each labeled supported, contradicted or untested.
4. **What would settle the disagreement:** one prioritized measurement or test per rival mechanism, feasibility, owner role and evidence threshold.
5. **What changes next:** next evidence task, stop rule, review date and versioned history. No clinical recommendation until separately authorized.

**Example user-facing explanation**: “In the historical county tables, Hinds and Harris have nearly the same percentage of colorectal cases diagnosed late, but Hinds has a higher population-standardized rate of late-stage disease. These figures answer different questions. We do not yet know whether underlying disease occurrence, detection, diagnosis timing, population differences or data definitions explain the contrast. The next discriminating evidence is a matched-year all-stage incidence and diagnostic-pathway audit.”

## Implementation architecture: reuse, don't rebuild
1. Existing Research Studio receives a question and disease module, creates `ExplanationCase` as a **proposed, unverified** object.
2. Source adapters fetch or accept approved **public aggregates** with pinned releases; adapters must preserve source identity, retrieve time, licensing, geography and uncertainty. Do not use source snippets as validated datasets.
3. Measurement crosswalk refuses pooling on incompatible construct, denominator, window or method; no silent conversion.
4. Hypothesis registry runs rival-mechanism checks and records both positive and disconfirming evidence. RPLICE method is human-selected, not auto-invoked.
5. Explanation composer renders the five panes, attaching evidence-cell IDs to factual sentences; missing evidence displays UNKNOWN, never an inferred zero.
6. Existing authenticated casework stores snapshots, review decisions and longitudinal corrections; signed-in persistence and tenant isolation still require live witness.
7. Tests exercise denominator traps, source drift, ecological attribution, survey weights, diagnosis/condition confusion, subgroup harm, and changed evidence reopening.
8. Later, only after internal validation, selectively transfer condition-specific insights into existing healthcare platforms. No patient-level data movement in this research build.

## Evidence acceptance and closure gates
**G1 Source**: authoritative original data, release ID, exact unit, method, CI, numerator/denominator, independent reproduction.  
**G2 Comparability**: matched construct/period/population, explicitly documented limitations, no unsupported pooling.  
**G3 Explanation**: ≥2 competing mechanisms and a feasible disconfirming test; independent dissent.  
**G4 Experience**: actual authorized stakeholder evidence or explicit UNKNOWN; no invented quotes.  
**G5 Action**: human-selected intervention with theory of change, alternatives, balancing harms and authority.  
**G6 Outcome**: witnessed fidelity plus beneficiary-level improvement, subgroup effects, uncertainty and sustainment, when a real intervention exists.  
**G7 Portability**: new condition must pass its own ontology and evidence tests; do not copy a colorectal causal story.

**Current status:** G1–G4 open for all three studies at publication quality; engineering baseline and synthetic falsification checks exist. This document specifies the next system; it does not claim an automated explanation service or completed causal analysis. Do not send to Jeremiah until internal understanding and source verification are mature.

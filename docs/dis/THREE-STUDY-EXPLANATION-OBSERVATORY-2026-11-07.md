# DIS Explanation Observatory — Studies 1–3
**Internal research design v0.1, 2026-11-07.** This is an investigation system, not a clinical inference engine. No email or external submission is authorized.

## Mission
Explain, repeatedly and reproducibly, why *observed* population measures differ, without confusing measurement, mechanism, policy, implementation and experience. Every explanation is an evidence-linked, falsifiable hypothesis until independently adjudicated.

### The universal record
A claim requires: study ID; condition; exact construct; numerator; denominator; eligibility; population frame; geography and boundary; period; source URL and release; estimate and uncertainty; suppression/missingness; measurement method; source lineage; evidence class; plausible mechanisms; rival explanations; discriminating tests; independent reviewer; confidence and unresolved gaps. Store an immutable original snapshot and subsequent decisions. A new data vintage reopens the conclusion; never overwrite the old source or reinterpret a previous period silently.

### Six-layer explanation process
1. **OBSERVE:** What is the literal observation and its instrument? Distinguish observed, modeled, self-reported and missing.
2. **NORMALIZE:** Are the same constructs, populations, denominators, periods, standards and geographies being compared? Reject unmatched measures rather than force an estimate.
3. **DECOMPOSE:** Which algebraic or ascertainment components can change the observed value? Explicitly distinguish age-specific from age-adjusted quantities.
4. **HYPOTHESIZE:** Specify mechanisms across biological risk, prevention, exposure, care access, diagnosis, reporting, policy and lived experience. Include rival explanations and a discriminating test for each.
5. **TEST:** Triangulate source-stable quantitative data, actual service process data and authorized stakeholder evidence. Include uncertainty, negative controls, missingness, equity and sensitivity checks. Correlation and source metadata are not causation.
6. **EXPLAIN / REOPEN:** Publish a bounded internal claim: observation → candidate mechanisms → tested/refuted/unknown → consequences → next evidence → owner. Reopen on new source releases, changed definitions, subgroup harm, changed policy or contradictory evidence.

## Study 1 — Hinds and Harris late-stage colorectal
Source-reported NCI State Cancer Profiles county, 2018–2022, all races, both sexes: Hinds late-stage share 63.3%, age-adjusted late-stage incidence 30.4/100k, 76 annual cases; Harris 63.4%, 23.3/100k, 1,044 annual cases. These represent three different constructs; Hinds County is not Jackson city and Harris County is not Houston city. Their age-adjusted late-stage incidence difference is 7.1/100k (Hinds minus Harris), a descriptive contrast only. Rate ratio approximately 1.305, not a causal or risk-adjusted comparison. Case counts reflect population size and cannot be compared as rates.

**Critical mathematical caveat:** An age-adjusted late-stage incidence rate divided by an *unadjusted* late-stage case share does **not** produce a valid all-stage age-adjusted incidence rate. Stage share conditions on staged incident cases, whereas adjusted incidence uses standard-population age weights. Even the unadjusted late-stage share may exclude unstaged cases. Do not estimate all-stage burden from 30.4/0.633 or 23.3/0.634.

**Testable rival mechanisms:** underlying age-specific cancer incidence; screening uptake and early detection; abnormal-screen diagnostic resolution; stage ascertainment/unstaged fraction; differential eligibility and comorbidity; migration and catchment; policy/insurance/capacity; environmental and behavioral risks. Evidence: original registry extraction with stage completeness and age-specific rates, population denominators, local eligibility-to-resolution cohorts, clinical service capacity and ethically authorized lived-experience data. Colorado is an independent source-vintage reconciliation, not an automatic third matched unit.

## Study 2 — Three-cancer ecological measurement divergence
Pinned repository state table previously yielded colorectal–lung Pearson r approximately 0.735 for late-stage incidence rates and 0.129 for late-stage case shares. These are **different variables**, not conflicting estimates of the same construct. Their difference may reflect underlying cancer occurrence, screening and stage ascertainment, denominator effects, age structure, or correlated context; it cannot establish a common exposure or policy cause. The two earlier secondary coefficients (colorectal–breast share Pearson 0.234 vs recalculated 0.231; lung–breast share Spearman 0.413 vs recalculated 0.410) remain a reproducibility issue pending exact source/transform reconciliation.

**Protocol:** Pin a 50-state × 3-condition × construct × period table; exclude U.S. aggregate, DC and Puerto Rico from the 50-state correlation while separately reporting them. Verify each original row, staging rules and standard population. For each construct compute Pearson and Spearman separately, uncertainty/sensitivity, state deletion, missingness, and source vintage. Compare correlations with appropriate dependent-correlation statistical methods and uncertainty, not simply subtraction of coefficients. Examine age/sex-specific incidence, all-stage burden, stage completeness, socioeconomic and service-pathway indicators; do not imply ecological person-level causation. Report the strongest disconfirming result.

## Study 3 — Recognition of endometriosis, PCOS and fibroids
NCHS Health E-Stat 121 (July 2026), 2022–2023 NSFG: women aged 20–49, 4,856 respondents; weighted *ever-diagnosed* estimates: endometriosis 6.2% (95% CI 5.2–7.2), PCOS 8.7% (7.7–9.8), fibroids 7.8% (6.8–8.9). These are not independently diagnosed biological prevalence, and survey weights/design matter. Published strata include PCOS 4.4% among non-Hispanic Black women and fibroids 12.5% among non-Hispanic Black women; these do not establish biology or access as the cause. Original source: https://www.cdc.gov/nchs/data/hestat/hestat121.htm . Public-use data and methods: https://www.cdc.gov/nchs/nsfg/nsfg-2022-2023-puf.htm .

**Recognition funnel (conceptual, not an observed decomposition):** underlying condition → symptoms/clinical presentation → opportunity to access care → clinician recognition/testing → diagnosis → recall/report to survey. Each transition is a separate construct with selection and measurement biases. Survey 'ever diagnosed' cannot independently estimate the undiagnosed reservoir. For fibroids, an imaging-defined cohort may capture asymptomatic cases missed by clinical diagnosis; for endometriosis, surgical confirmation can introduce verification bias; PCOS case definitions vary. These require condition-specific method reviews, not one universal instrument.

**Tests:** replicate survey-weighted prevalence and 95% intervals with NSFG public-use weights/design; check question wording and missingness; compare age, insurance and socioeconomic strata with uncertainty and multiple-comparison caution; find independent validated population ascertainment and diagnostic-delay studies; distinguish fertility-service selection from disease consequence. Never infer state-level prevalence from national cross-sectional data.

## Engineering contract v0.1
`apps/dis-platform/lib/three-study-explanation.ts` implements source-aware construct and range validation and returns separate observation, permissible interpretation, prohibited inference, competing explanations and discriminating evidence. It is a **pure bounded reasoning contract**, not an autonomous data extractor, statistical estimator, source verifier, survey-weighted analyzer, patient-level system, or verified causal explanation. It intentionally returns open gates when inputs are incomplete.

## Repeated operating cycle and acceptance
- **Daily/source-change:** register new releases; detect period, denominator, instrument and suppression drift; never silently overwrite.
- **Per investigation:** generate an evidence matrix and rival-mechanism register; require explicit tests before selecting a correction.
- **Monthly:** rerun source and reproducibility checks, compare new findings, subgroup harms and policy changes.
- **Quarterly:** independent red-team, operational and lived-experience triangulation, owner decisions and documented adaptation.
- **Annual:** compare conclusions and predicted observations with actual outcomes; assess whether decisions improved, cost, maintenance and transfer.

**Acceptance gates:** (1) independently source-reproduced data; (2) matched measurement ontology; (3) rival explanations with evidence that could falsify them; (4) statistical design and uncertainty review; (5) actual local operational and authorized experiential evidence before local mechanism claims; (6) no causal statement without identification; (7) no intervention approval without accountable human authorization; (8) longitudinal evidence and independent harm/benefit review. Open gates are not a failure to execute; they are scientific unknowns that must be investigated.

## Next research actions (not completed)
1. Independently retrieve original Hinds/Harris age-specific all-stage and late-stage registry tables for one matched vintage; adjudicate age adjustment and stage completeness.
2. Reconstruct the pinned 50-state source and scripts; reconcile 0.234/0.231 and 0.413/0.410; document any selection/transform differences.
3. Download and reproduce NSFG design-weighted condition estimates, with original codebook, design variables and uncertainty.
4. Build a source-refresh and discrepancy queue linked to the authenticated research case; do not mark a source lead verified automatically.
5. Only after (1)–(3), prioritize mechanism discrimination and a prospective test of whether DIS improves decisions compared with competent established methods.

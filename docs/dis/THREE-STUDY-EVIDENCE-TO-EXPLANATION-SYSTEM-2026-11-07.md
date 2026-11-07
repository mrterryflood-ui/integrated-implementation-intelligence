# DIS Evidence-to-Explanation Engine — Three-Study Research Specification
**Status:** Investigation design, not verified causal inference or completed research. **Scope:** 1 county colorectal contrast; 2 national colorectal/lung/female breast patterns; 3 endometriosis/PCOS/fibroids diagnosis ascertainment. **No Jeremiah outreach.**

## Mission and central scientific problem
Explain why observed differences appear, separate differences in the underlying phenomenon from differences in measurement, recognition and delivery, test rival explanations, identify which levers could plausibly improve outcomes, and continuously revise the explanation when new evidence arrives. Do not infer causes from ecological correlations. Complement existing epidemiologic, implementation-science and clinical methods.

## Reusable explanation contract (one record per claim)
- Claim ID, question, condition, geography unit and boundaries, population/eligibility frame, time and source release/version.
- Observed construct: true incidence (if identifiable), diagnosed incidence, age-adjusted incidence, stage share, count, prevalence, ever-diagnosed prevalence, symptoms, diagnostic delay, process completion, mortality, harm. Never conflate.
- Exact numerator/denominator, age/sex/race stratification, weights/standardization, uncertainty, suppression, missingness, provenance and independence of sources.
- Descriptive observation vs mechanistic hypothesis vs causal estimate vs intervention proposal; each carries evidence status, confidence/uncertainty and falsification test.
- Designed, Operational, Experienced realities: normative pathway, observed capacity/follow-through, authorized lived experience. Absence of experienced data remains UNKNOWN, not an invented quote.
- Rival mechanisms and DAG/causal pathway: underlying risk, prevention, detection, access, capacity, referral, coding, treatment, competing policies, environmental exposures, time lag and selection.
- Discriminating test: required data, identifying assumptions, competing model, reviewer, result, uncertainty, unresolved gaps.
- Action selection: target mechanism, scale (individual/clinic/system/policy), core function, alternatives, costs, feasibility, equity, harms, fidelity, owner and authority.
- Follow-up: repeated measures, subgroup effects, external validity, sustainment, review trigger, versioned decision and independent adjudication.

## Study 1 — Hinds vs Harris vs Colorado: why similar stage shares differ in burden
**Reported source baseline, 2018–2022 NCI county late-stage colorectal:** Hinds share 63.3%, age-adjusted late-stage incidence 30.4/100,000, 76 average annual cases; Harris share 63.4%, incidence 23.3/100,000, 1,044 average annual cases. Share difference Hinds–Harris = -0.1 percentage points; age-adjusted late-stage rate difference = +7.1/100,000; rate ratio approximately 1.305. Counts differ with populations and cannot be compared as rates. Neither county equals its central city. Do **not** divide an age-adjusted late-stage rate by the raw case share to assert an all-stage age-adjusted rate: differing weighting and underlying denominators invalidate that shortcut.
**Question decomposition:**
1. Does the source-period and case-definition match? Same release, stage definition, age adjustment, registry quality and completeness?
2. Is overall invasive incidence different, or is late-stage incidence different mainly through detection/staging? Obtain separately observed all-stage rate from the *same* period and compatible standardization.
3. Which factors explain the gap: risk-factor distribution, screening eligibility and uptake, abnormal-result resolution, appointment availability, insurance/cost, treatment, coding, socioeconomic composition and migration? Use explicit rival hypotheses, not presumed causal explanations.
4. How do changes vary by age, sex, race/ethnicity, rurality and deprivation with appropriate suppression, uncertainty and ecological caution?
5. What is an actionable bottleneck and which authority can modify it? Do not default to awareness.
**Source alignment gate:** Hinds/Harris 2018–2022 late-stage; Colorado 2019–2023 source vintage is **not matched**. Texas all-stage 2019–2023 is **not matched** to late-stage 2018–2022. Preserve distinct cells until harmonized.
**Output:** county measurement card, difference decomposition, rival explanation matrix, source compatibility and uncertainty report, action-readiness verdict.

## Study 2 — National three-cancer correlations and the denominator paradox
**Reported prior 50-state pinned-table reanalysis:** colorectal–lung late-stage age-adjusted incidence Pearson r ≈ 0.735; colorectal–lung late-stage case-share Pearson r ≈ 0.129. These describe different constructs, not contradictory estimates of one quantity.
**Formal reasoning:** for a common unadjusted population/time/case definition, late-stage incidence rate = all-stage invasive incidence rate × fraction of cases late-stage. For independently age-standardized rates, or differing registry denominators, this identity cannot be applied by simply multiplying a reported standardized rate by a crude stage fraction. The conditional share also depends on who is diagnosed, staging completeness and detection intensity. Disease-specific screening eligibility and natural history differ.
**Hypothesis candidates:** shared geographic risk/SDOH factors; ascertainment and diagnostic follow-up; case mix; registry completeness; age/sex standardization; disease-specific screening effects; spurious ecological correlation; spatial clustering. A correlation across states cannot establish an individual-level mechanism.
**Tests:** source-reextract same vintage and 50 states, re-run Pearson and Spearman with code and CI/bootstraps as appropriate, scatterplots and outliers, uncertainty sensitivity, state population and spatial-dependence diagnostics, sex/age stratification, missing/suppression rules, multiple testing correction, robustness to removing named states. Resolve old vs new secondary coefficients before citing them: colorectal–breast case share 0.234 previously vs 0.230670 reanalysis; lung–breast case share Spearman 0.413 previously vs 0.409816. Do not average or quietly replace; identify source/script version.
**Output:** reproducible multiconstruct correlation atlas and mechanism hypotheses, not causal maps or uniform interventions.

## Study 3 — Endometriosis, PCOS and fibroids: diagnosis is a filtered observation
**Reported NCHS NSFG 2022–2023 ever-diagnosed percentages (women 20–49):** endometriosis 6.2%, PCOS 8.7%, fibroids 7.8%. These are weighted survey estimates of ever receiving a diagnosis, not directly measured biological prevalence, incidence or state-level disease burden.
**Observation model:** observed diagnosed prevalence is influenced by underlying disease, symptoms, care-seeking, access, provider recognition, diagnostic criteria, imaging/procedure availability, reporting/recall, and survey inclusion. No simple inversion from ever-diagnosed percentage to true prevalence is identified without additional assumptions/data.
**Separate pathways:**
- Endometriosis: symptom onset → help-seeking → recognition → referral/testing → diagnosis; delays, pain/function and alternative diagnoses. Avoid equating surgery-coded cases with total disease.
- PCOS: diagnostic criteria/version, age, symptom presentation, clinician recognition, metabolic/reproductive comorbidity, care continuity and recall.
- Fibroids: asymptomatic vs symptomatic, imaging availability, diagnosed disease, bleeding/pain burden, procedures and treatment preferences. Procedure rates are not prevalence.
**Tests:** retrieve NSFG technical documentation, survey weights/strata/PSUs and denominators, replicate confidence intervals; evaluate condition-specific validated instruments, diagnosis-delay studies, sensitivity to underrecognition, stratified care access and survey recall. Do not fabricate state-specific estimates or apply colorectal stage constructs.
**Output:** three condition-specific observation/diagnostic pathway models, evidence and ascertainment uncertainty, possible intervention leverage points only after mechanism tests.

## The explanation cycle (MAP–GAP operationalized)
1. ORIENT: articulate question and beneficiary, outcome and intended decision.
2. AUDIT: original source and measurement validation; preserve release version and denominators.
3. MAP: draw observation process and plausible causal pathways; Designed/Operational/Experienced layers.
4. GAP: identify unknown mechanisms, measurement artifacts and inequitable experience; rank importance and testability.
5. CHALLENGE: competing explanations and negative controls; record what would disprove favored story.
6. ALIGN: decide what additional evidence to obtain before selecting any intervention.
7. ACT: only authorized reversible tests with owners, capacity, equity/harm balancing and stop rules.
8. TRACK: repeat source-compatible measures, subgroup and lived-experience observations, fidelity and costs.
9. ADAPT: reopen when evidence, denominator, method, context or outcomes change.
10. SHARE/RE-MAP: evidence-graded explanation for researcher, practitioner, policymaker and public; no unsupported causal language.

## System architecture: use existing services, no parallel datastore
**Ingest** original NCI/CDC/NSFG source metadata and approved public aggregate data → **Normalize** condition-specific construct, population, time, source vintage, uncertainty → **Crosswalk** comparable vs incompatible measures → **Explain** descriptive contrasts plus hypotheses and discriminating tests → **Challenge** negative controls, alternative mechanisms, subgroup harms and independent review → **Decide** evidence needs and context-fit intervention candidates → **Track** existing authenticated DIS case/event history → **Render** layered explanation for public and expert readers. Human-selected RPLICE specialists may support an explicitly chosen task, but no automatic invocation or inferred execution receipt. Keep original sources immutable, record source lineage and calculation code, preserve dissent and retractions.

## Product outputs
A. **What happened?** visual contrast, correct unit, numerator/denominator and time, confidence/uncertainty.
B. **Why might it happen?** ranked *hypotheses*, not asserted causal explanations, with evidence for/against.
C. **What would distinguish them?** feasible next dataset, design, cost, reviewer and falsification.
D. **What should change?** only after evidence and authority gates; alternatives and risks.
E. **Did it help, for whom, and for how long?** process, downstream outcome, equity, harms and maintenance.
Every public explanation has a concise narrative and expandable reproducible technical appendix; UNKNOWN is a first-class answer.

## Acceptance criteria and evidence gates
- Study 1: original-source re-extraction with matching definitions and source-period compatibility; no city/county or age-adjustment denominator errors; cross-check by independent reviewer.
- Study 2: executable pinned data and analysis, exact secondary-coefficient reconciliation, sensitivity and spatial/ecological caveats.
- Study 3: survey-weighted replication with technical documentation and condition-specific diagnosis models; no inferred true prevalence or invented state rates.
- Common: 18 adversarial exercises; 3 designed/operational/experienced layers; rival hypothesis disconfirmation; subgroup harm detection; source changes trigger reopen; full evidence survives save and read-back with tenant authorization; no self-certified outcome.
- Scientific review: compare the system's explanations with competent standard epidemiology/implementation-science practice; predefine incremental value and harms; a null result is valid.
- External communications remain unsent until user reviews the evidence and specifically approves.

## Immediate prioritized work
P0 research: original NCI/CDC/NSFG table extraction, period/construct/weight audit and coefficient reconciliation.
P0 engineering: implement a typed reusable explanation record and condition modules on top of existing research program and casework, not another database; regression for wrong denominator, mismatched periods, suppressed groups, cross-condition leakage and false causal promotion.
P1 methods: prespecified rival hypothesis tests and independent challenge council.
P1 interface: explanatory story and expandable evidence appendix with explicit unknowns.
P2 field: authorized operational/experienced data and intervention follow-through.

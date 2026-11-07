# DIS–RPLICE Comparative Health Intelligence and Explanation System
**Research architecture v0.1 | 2026-11-07 | Internal investigation only**

## Mission
Investigate three related but nonexchangeable scientific problems: (1) Hinds–Harris–Colorado colorectal comparisons; (2) national colorectal, lung, and female breast cancer patterns; (3) endometriosis, PCOS and uterine fibroid diagnosis/ascertainment. Build a repeatable research-to-explanation capability that distinguishes observations from explanations and explanations from tested mechanisms. This is NOT an external presentation package, a clinical intervention or a claim of causal benefit.

### The fundamental unit: an explanation dossier, not a dashboard number
Each dossier has a stable ID, version, condition, site, target geography, population/eligibility frame, time window, decision question, intended beneficiaries, claim state, methods and reviewer. It contains:
- **Measurement ledger:** source URL and issuing authority, exact release date/vintage, retrieval date, source table/row, geography and boundary, numerator, denominator, rate standardization, unit, stage/diagnostic definition, missingness, suppression, confidence interval or survey variance, provenance and independent re-extraction receipt. Missing or mismatched cells are explicit, not zero.
- **Comparison graph:** what can be compared, what cannot, why (different outcome constructs, denominator, case mix, time, ascertainment, age/sex eligibility, geography or survey weights). Do not pool until a reviewer explicitly accepts a harmonization protocol.
- **Mechanism register:** candidate explanations, plausible pathway, temporal order, necessary evidence, rival hypotheses, falsifying observations, relevant Designed/Operational/Experienced realities, ecological-fallacy warning, adjudication status and human reviewer.
- **Decision and action record:** no-change and alternative responses; appropriateness rationale, affected groups, expected benefits/harms, owners, resources, authorization, fidelity, balancing measures, cost, sustainability, and reopen triggers. No recommendation is automatically authorized.
- **Explanation output:** one-paragraph plain-language finding, what the data actually measure, what they cannot prove, 2–4 plausible mechanisms, decisive missing evidence, next test, implications, and uncertainty label. Every numerical sentence must link to ledger cells; each proposed causal sentence must link to mechanism tests and design review.

## Reusable analysis pipeline (MAP–GAP)
1. **ORIENT:** formulate a falsifiable question and decide whether it concerns disease occurrence, case identification, diagnostic delay, treatment, mortality, lived burden or an implementation outcome.
2. **AUDIT:** ingest source snapshots and methods, pin versions, reproduce every published cell, record CI/variance, missingness, suppression and sampling. Reject incompatible cells.
3. **MAP:** compare Designed guidance, Operational capacity/pathways and Experienced evidence from authorized actual people. Unknown experience is UNKNOWN, never generated testimony.
4. **GAP:** show absolute/relative differences with uncertainty and denominators; investigate within-group trends, composition, detection intensity, age adjustment, ecological context and subgroup harms.
5. **HYPOTHESIZE:** build a directed mechanism sketch and a competing-explanations table. Label observational associations separately from causal claims.
6. **TEST:** predefine the decisive observation for each hypothesis. Select descriptive, repeated cross-section, cohort, interrupted series, DID or other method only when assumptions and source data permit; RPLICE methods require explicit HIL selection.
7. **EXPLAIN:** generate evidence-linked narratives with counterarguments, uncertainty, population caveats and specific falsification tests. An explanation without a discriminating test remains a hypothesis.
8. **ALIGN/ACT:** propose—not execute—site-appropriate corrections, no-change alternative, resources, policy and stakeholder dependencies, safety, equity, costs and implementation protocol.
9. **TRACK/ADAPT:** record independent outcomes, subgroup benefit and harm, implementation fidelity, counterfactual uncertainty, follow-up period and sustainment; reopen when source or context changes.
10. **SHARE/RE-MAP:** internal human review and reproducibility receipt first. Any outreach or external transfer needs separate explicit authorization.

## Investigation 1: colorectal Hinds–Harris–Colorado
**Known historical source-reported contrast:** Hinds County MS and Harris County TX, NCI late-stage colorectal county tables 2018–2022: late-stage share 63.3% vs 63.4%; age-adjusted late-stage incidence 30.4 vs 23.3 per 100,000; average annual late-stage counts 76 vs 1,044. These are three denominator constructs, not three independent studies. Hinds is not Jackson city; Harris is not Houston city. The data do not prove why the rates differ.

**Question tree:** 
A. Is the underlying all-stage invasive colorectal incidence different? Obtain same-year age-adjusted all-stage incidence with exact stage completeness, source releases and uncertainty. Do not derive all-stage rate by dividing the late-stage rate by the late-stage percentage without a source-validated common frame.
B. Is the stage share different after compatible case definition and staging completeness? Compare source-defined conditional percentages and uncertainty, not population rates.
C. Is screening uptake different among *eligible* people? Requires eligible-person denominator and completed test records, not only program outreach.
D. Are abnormal results resolved differently? Measure time from abnormal finding to diagnostic colonoscopy and confirmed resolution; referral is not completion.
E. Could age, ascertainment, access, registry practices, competing risks, population change, rural/urban catchment, treatment or environmental context explain variation? Each is a candidate hypothesis, not a causal conclusion.
F. Does Colorado have same-year county/state data? Currently source vintage differs; mark NONCOMPARABLE until re-extraction and period match.

**Decision product:** a county-comparison explanation with at least three rival mechanism scenarios and explicit evidence needed to distinguish them; no intervention selection until the bottleneck is identified.

## Investigation 2: national three-cancer patterns
**Question:** Which correlations are properties of the underlying phenomenon, which reflect outcome choice and which reflect geography, composition or ascertainment? Keep colorectal, lung and female breast distinct; harmonize common geographic unit and source vintage only where legitimate.

**Minimum reproducibility protocol:** pin original CSV and code hash; include exactly 50 states or state an alternative cohort explicitly; verify DC, Puerto Rico and national rows are excluded from 50-state inference; compute Pearson and Spearman independently, report N, confidence intervals or appropriate sensitivity uncertainty, influential observations, rank/linear disagreement, outliers, missingness and correction for exploratory multiplicity. Compare late-stage *population incidence* versus late-stage *case share* as separate analyses. No ecological correlation is individual risk or shared cause.

**Open numerical reconciliation:** previously reported colorectal–breast case-share Pearson 0.234 vs recalculated 0.230670 (~0.231); lung–breast case-share Spearman 0.413 vs recalculated 0.409816 (~0.410). These are unresolved until original exact input/script and source table revision are reconciled. The earlier 0.735 colorectal–lung late-stage-rate and 0.129 case-share pattern is a reproducibility lead, not a mechanistic conclusion.

**Mechanism tests:** site-level smoking/exposure and lung eligibility; colorectal screening/diagnostic follow-up; breast screening and diagnostic access; age/sex composition, race/ethnicity stratification where source-valid, deprivation and insurance, stage completeness, source-vintage changes, urbanicity and spatial autocorrelation. Environmental facility maps are contextual exposure hypotheses, not measured individual exposure or cancer attribution.

**Decision product:** three-disease comparative explanation, measurement-switch sensitivity report, falsifiable mechanisms, and no pooled clinical intervention across cancers without evidence.

## Investigation 3: endometriosis, PCOS, fibroids
**Question:** How much observed variation is attributable to underlying disease, symptom burden, care-seeking, access, clinical recognition, diagnostic criteria and coding? A reported diagnosis is not biological prevalence.

**Source-reported NSFG anchor:** 2022–2023 National Survey of Family Growth, 4,856 respondents in relevant source analysis; ever-diagnosed endometriosis 6.2%, PCOS 8.7%, fibroids 7.8% among women 20–49 as source defined. Reproduce survey estimates with design weights, strata and clusters; obtain standard errors, confidence intervals, eligible denominators and missingness. Do not treat raw respondent count as a simple random sample or assign a survey point estimate to a state.

**Condition-specific pathways:**
- Endometriosis: symptom onset, first care, referral, recognition, diagnostic criteria, delay, treatment and patient-reported pain/function. Diagnosis can lag disease; operative confirmation practices vary.
- PCOS: diagnostic criteria (age and guideline vintage), hormonal/metabolic features, ultrasound use, care access, recorded diagnosis and treatment continuity. Criteria changes can alter estimates.
- Fibroids: asymptomatic versus symptomatic burden, imaging availability, diagnosis, anemia, treatment preference, procedure access and follow-up. Surgery counts are not disease prevalence.

**Do not assume:** common screening denominators, common onset dates, identical measurement instruments, comparable state-by-state rates or that lower diagnosis rates imply lower burden. Experiences require authorized validated patient-reported data, not synthetic anecdotes.

**Decision product:** three separate recognition-to-care pathway diagrams, ascertainment-bias assessment, feasible measurement inventory and data-availability decision (GO/CONDITIONAL/HOLD) for geographic comparison.

## Consistent explanation contract
Every case explanation MUST answer in order:
1. **What did we observe?** Source, number, unit, uncertainty, people, place and time.
2. **What is being compared?** Numerator, denominator, eligibility, stage/diagnosis and harmonization.
3. **What else could produce this observation?** At least two serious rival explanations, including ascertainment/measurement.
4. **What would distinguish the explanations?** Test, required data, expected result under each rival, limitations.
5. **What can we conclude now?** Verified/source-reported/inferred/hypothesis/unknown/contradicted labels.
6. **What could we do, and why?** Only mechanism-matched, human-reviewed candidate actions, no automatic authorization.
7. **How would we know it helped and did not harm?** Independent beneficiary outcome, subgroup equity and harms, time horizon, costs, fidelity, maintenance and review trigger.
8. **What would change our mind?** Source changes, disconfirming evidence, intervention drift or observed adverse signal.

## Proposed software composition; reuse, do not rebuild
- Existing `research-program` and `evidence-action-bridge`: study identity, measurement crosswalk, gap register and bounded causal-design screen.
- Existing authenticated `/api/cases`, event history and tenant RLS: persistent explanation dossier and audit trail, with signed-in live persistence still unverified.
- Existing outcome-equity assurance: descriptive aggregate/subgroup warning, not causal or clinical outcome adjudication.
- Existing OpenAlex discovery: metadata leads only; independent original-study extraction needed.
- RPLICE specialist methods: explicit human-selected invocation and method receipts; no implicit execution.
- Add **condition ontology registry** (condition, construct, eligible denominator, ascertainment, time frame, standardization and instrument version); **source snapshot adapter**; **comparison compatibility graph**; **mechanism and disconfirmation register**; **explanation composer with cell-level citations**; **research QA/reopen ledger**. Each adapter must have deterministic tests and reject incompatible inputs. Prefer source-grounded public data first and no PHI.

## Concrete acceptance scenarios
- Same late-stage share with different population incidence -> distinguish measures and refuse equivalence.
- Hinds county called Jackson city -> reject boundary substitution.
- Texas 2019–2023 all-stage mixed with 2018–2022 late-stage -> block composite estimate.
- Colorado incompatible vintage -> explicit NONCOMPARABLE.
- State cancer correlations with DC/national rows -> reject silent population change.
- Recomputed coefficient differs by 0.003 -> report discrepancy, preserve both versions and demand source reconciliation.
- Two different disease pathways with similar headline outcome -> retain different mechanism tests.
- NSFG unweighted raw counts presented as national prevalence -> reject survey design misuse.
- Diagnosis absence interpreted as disease absence -> reject ascertainment conflation.
- Process improvement with subgroup deterioration -> adverse-signal review, not equitable success.
- An invented causal explanation from cross-sectional ecology -> reject causal promotion.
- Changed instrument or source release -> preserve prior narrative and reopen its conclusion.
- A missing experienced-reality source -> UNKNOWN, not a generated interview.
- An apparent successful intervention without downstream outcome -> PROCESS ONLY.
- Evidence source not independently verified -> DISCOVERY/SOURCE-REPORTED, not VERIFIED.

## Work plan and ownership gates
**Phase 1 — Evidence audit:** source/epidemiology reviewer pins exact NCI and NSFG releases, independently extracts and reconciles numerical conflicts; data lead produces machine-readable measurement ledger.
**Phase 2 — Investigation:** epidemiology/methods lead maps rival mechanisms and prespecified tests for all three investigations; clinical content reviewers inspect disease-specific constructs; community-experience evidence remains unknown until ethically obtained.
**Phase 3 — System implementation:** DIS engineering builds condition registry, source adapters, comparison graph, explanation composer and audit trail on GitHub; synthetic negative tests plus browser/mobile tests; no Copilot/paid agents without explicit approval.
**Phase 4 — Internal validation:** independent red-team reviewers challenge each explanation and compare it with competent conventional analysis; authenticated owner witnesses case save/reopen and tenant denial.
**Phase 5 — Decision:** user reviews scientific findings and system outputs before any Jeremiah email, partnership, submission or dissemination.

**Current disposition:** GO internal analysis and implementation; HOLD causal claims, clinical outcome claims, cross-condition pooling and external dissemination. This specification is a proposed architecture, not proof the new components are built.

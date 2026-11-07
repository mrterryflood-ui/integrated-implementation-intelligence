# DIS Explanation Observatory — Sustainable Scientific Architecture and Acceptance Contract
**2026-11-07 | Internal architecture specification v0.1 | Not a completion claim**

## End state
A sustained, versioned research service that can repeatedly identify, measure, explain, challenge, and monitor population-health differences across three initial study families, without confusing similarity with equivalence, ecological association with individual causation, or recorded diagnosis with biological prevalence. Reuse the existing DIS research studio, RPLICE human-selected specialist methods, Clerk/Neon casework and GitHub source governance. Do not create a competing data store or automatically migrate unvalidated findings into clinical platforms.

## Three distinct scientific units
- **CRC counties:** cancer incidence, stage ascertainment, conditional stage share, age-standardized rates, and diagnostic pathway. Hinds vs Harris, with Colorado only after source-period and geography reconciliation. All-stage incidence and stage completeness require independently re-extracted original sources.
- **Three cancers:** 50-state colorectal, lung, female breast site-specific rates and shares; separate sex/age/stage denominators, registry release, ecological correlations and uncertainty. Do not infer shared causal mechanisms from common state patterns.
- **Gynecologic diagnoses:** endometriosis, PCOS and fibroids; NSFG survey-weighted ever-diagnosed responses, not biological prevalence; condition-specific diagnostic opportunity, symptom, access, ascertainment and recall. Reproduce published weights, variance estimation and question definitions before estimating new contrasts.

## Architecture: nine services with explicit contracts
1. **Source registry and acquisition:** official source manifest (owner, URL, parameters, release, access method, licensing, retention); scheduled refresh only for authorized public sources; immutable original bytes, content digest, retrieval time, checksum, fetch error, and schema/version.
2. **Data provenance and conflict queue:** append-only source events; same indicator changed value, geography, denominator, period, source release or definition creates an unresolved review item; no automatic baseline replacement. Missing/suppressed and revised cells remain visible.
3. **Measurement ontology:** condition, outcome construct, numerator, denominator, unit, eligibility, population frame, age/sex/race strata, stage definition, geographic boundary, observation period, standard population, weights, confidence interval, missingness and uncertainty. Compatibility gate precedes arithmetic.
4. **Reproducible analysis runners:** pinned code/environment and frozen data; age-specific and age-standardized rates; survey-design-weighted estimates; within-construct correlations; uncertainty, missingness, sensitivity, spatial dependence and multiple comparisons. No unsupported all-stage incidence back-calculation.
5. **Mechanism graph:** directed *hypothesized* relations (biological, environmental, care access, diagnosis, policy, recording, incentives and lived experience). Each edge carries evidence class, competing explanation, confounders, disconfirming observation, temporal order, domain and reviewer. An edge is not automatically causal.
6. **Investigation workbench:** Designed/Operational/Experienced evidence matrix, rival-hypothesis tests, negative controls, stakeholder authorization, mixed-method triangulation and structured dissent. Different populations with similar aggregate values may require different explanations and interventions.
7. **Independent adjudication:** reviewer identity, expertise, conflicts, original-source access, decision date, claim scope, approved/rejected/unknown outcome, dissent, immutable version and reopen triggers. A self-entered checkbox does not independently verify evidence.
8. **Implementation experiment service:** conditional human-approved theory of change, comparator, site feasibility, ethics/data-use assessment, owner, resources, protocol fidelity, adaptations, safety stop rules, subgroup benefit and harm, costs and sustainment; no autonomous clinical actions.
9. **Monitoring and explanation publication:** source drift alerts, reproducibility checks, outcome trajectories, public-facing bounded claims, uncertainty, what could change the conclusion, and next review date. External partner briefings require approved release and independently checked sources.

## Canonical objects and lineage
`SourceSnapshot -> MeasurementDefinition -> Observation -> Comparison -> Hypothesis -> DiscriminatingTest -> Adjudication -> Decision -> Intervention -> Outcome -> Reassessment`.
Every derived object links to exact source hashes and analysis revision. An explanation must not cite only an aggregate report when the underlying measurement definition is unknown. Preserve superseded source versions and negative findings.

## Release gates, in order
**G0 Mission:** named research question, population, time, decision authority and intended beneficiary.
**G1 Source:** original source bytes, stable query, provenance, license, reproducible extraction and independent recheck.
**G2 Measurement:** complete ontology, denominators, weights, geographic/period alignment, suppression and uncertainty.
**G3 Reproduction:** independent re-run matches original published or source-reported results within prespecified tolerance; discrepancies adjudicated, never overwritten.
**G4 Mechanism:** rival explanations, discriminating evidence, confounders, temporality, negative controls, plausible alternative mechanisms and domain expert review.
**G5 Statistical validity:** prespecified estimand, design, uncertainty, sensitivity, multiple testing, spatial/selection bias; causal effect only when identification supports it.
**G6 Human evidence:** operational and experienced reality obtained lawfully with authorized partners; no invented interviews or presumed service access.
**G7 Intervention:** human authorization, feasibility, comparator, fidelity, stop rules, resources, owner and equity/balancing measures.
**G8 Outcome:** verified beneficiary outcomes and adverse effects over adequate follow-up, not merely process completion.
**G9 Sustainment:** post-success monitoring, source/model drift, cost, handoff, governance, adaptation, independent replication and transferability.
A gate can be NOT_STARTED, IN_PROGRESS, EVIDENCE_INSUFFICIENT, VERIFIED or REOPENED. Do not treat an uncompleted gate as a blanket hold on unrelated investigation.

## Simulation and statistical test plan — only after G1–G3
- **Measurement stress tests:** source revisions, altered denominators, age mix, stage completeness, suppression, missingness, survey weight/design, swapped county/city, mismatched periods.
- **Mechanism stress tests:** same headline result from different underlying processes; same mechanism yielding different observed results; measurement artifact masquerading as intervention effect; Simpson's paradox and ecological fallacy.
- **Inference stress tests:** null effects, positive and negative controls, correlated observations, selection bias, time-varying confounding, multiple comparisons, spatial autocorrelation, incomplete pretrends and effect heterogeneity.
- **Implementation stress tests:** high fidelity to wrong intervention, improvement in average with subgroup harm, adaptation changing core function, increased cost, staffing turnover, benefit decay and adverse events.
- **Governance stress tests:** missing reviewer, wrong tenant, stale approval, unapproved export, data leakage, source tampering, version conflict, restart and failed scheduled refresh.
Each simulation must be labeled SYNTHETIC, carry an expected response, a test receipt and a named reviewer; simulations do not substitute for field outcomes.

## Current known scientific conflicts
1. NCI Harris County 2018–2022 source values: earlier internal 23.3/100k and 1,044 cases versus later table 23.9/100k and 1,098. Resolve exact release/query before publication. Similar stage share remains descriptive, not mechanistic proof.
2. Two secondary 50-state correlation coefficients differ between prior and re-run calculations; reconstruct original rows, script and ranking/tie policy.
3. NSFG published ever-diagnosed estimates require independent design-weighted replication; cannot quantify undiagnosed biological disease from diagnosis responses alone.
4. No verified clinical-site service funnel, independent human mechanism adjudication, causal identification, or sustained beneficiary outcome in this workstream.

## Sustainability: operating roles and cadence
- **Evidence steward:** source refresh and hash verification on scheduled runs, failures visible and retry bounded.
- **Epidemiologist / survey statistician:** definitions, analysis, uncertainty, release adjudication.
- **Condition specialist:** ascertainment, diagnosis pathways, biological plausibility and alternative explanations.
- **Implementation scientist:** context, intervention fit, comparative design, fidelity, adaptation and sustainment.
- **Community/experience reviewer:** authorized lived-experience interpretation, unintended consequences and accessibility.
- **Security/data steward:** tenant isolation, data minimization, privacy, source rights and event integrity.
- **Independent challenge reviewer:** dissent, falsification and closure decisions.
Daily or release-triggered acquisition; monthly discrepancy and reproducibility audit; quarterly cross-disciplinary challenge; annual outcome and transfer review. Named people and institutions are proposed roles until they accept.

## Next execution sequence
1. Inventory existing source acquisition, scheduled workflow, snapshot storage, auth and evidence models before changing architecture. Avoid duplicate pipelines and paid agents.
2. Reproduce the NCI county extraction with exact queries and source versions; register the Harris discrepancy and resolve it through independent source inspection.
3. Reproduce the national three-cancer dataset, calculate within-construct Pearson/Spearman with documented uncertainty and resolve secondary discrepancies.
4. Reproduce NSFG weighted ever-diagnosed estimates using the official data dictionary and survey design; inspect missingness and condition-specific ascertainment.
5. Connect the already developed explanation and discrepancy modules to a **durable**, authorized review queue with complete lineage and negative tests.
6. Freeze a prespecified simulation corpus; run the test battery, red-team failures and independent adjudication.
7. Only then design a comparative implementation study and external scientific package. Do not claim that ACS or any other institution is wrong without inspecting its actual methods.

## Proof required for completion
Exact-head CI, immutable source receipts, independent data re-extraction, reproducible analytic outputs, case-linked discrepancy events, reviewer decision/history, real signed-in persistence and cross-tenant denial, documented simulation results, external scientific critique and prospective outcome follow-up. No one test suite or green deployment substitutes for the full evidence chain.

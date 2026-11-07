# DIS–RPLICE Evidence Observatory — Architecture and scientific acceptance specification
**Design baseline v0.1 | 2026-11-07 | INTERNAL / DRAFT.** This document is a proposed system architecture, not an assertion that every component is deployed. GitHub source is authoritative. No external submissions, clinical interventions or paid agents authorized.

## Mission and nonnegotiable distinctions
Build a sustainable, independently auditable research-to-action service for three investigations: (1) Hinds–Harris–Colorado colorectal, (2) national colorectal/lung/breast comparative measurement, and (3) endometriosis/PCOS/fibroid recognition. The service must separate: source truth, measured construct, descriptive pattern, plausible mechanism, identified causal effect, decision, implementation fidelity, beneficiary outcomes, and sustainment. A claim may advance only through evidence-specific gates. Similarity does not establish equivalence; correlation does not establish mechanism; fidelity does not establish intervention appropriateness.

## System boundaries and interfaces
1. **Source registry (proposed durable store):** source_id, owner, license/rights, URL and exact query, geography/FIPS, population, vintage, published_at, retrieved_at with timezone, byte SHA-256, parser version, immutable raw snapshot locator, derived dataset checksum, acquisition error. Public and protected sources separated by access policy. GitHub may hold public source metadata and synthetic fixtures, not confidential clinical records.
2. **Acquisition workers:** NCI State Cancer Profiles and CDC/NSFG source-specific adapters. Bounded HTTPS allowlist, content type/size, retries with budgets, checksum, no silent fallback. Existing draft `research/three_study_cycle/acquire.py` and PR CI are the first *candidate*, not a production scheduler. A successful HTTP fetch is not scientific verification.
3. **Measurement ontology:** canonical construct ID; numerator; denominator; eligible population; unit; geography level; age/sex/race definitions; diagnostic/stage definition; adjustment standard; period; missingness/suppression; design weights; uncertainty and sampling frame. Versioned comparability rules return EXACT_MATCH / CONDITIONALLY_COMPARABLE / NOT_COMPARABLE with reason and reviewer. Prohibit age-adjusted-rate divided by crude stage-share, weighted survey vs raw count, county vs city, cross-cancer stage pooling.
4. **Statistical workbench:** reproducible, version-pinned Python analysis in isolated jobs, with predeclared estimands, uncertainty, diagnostics and sensitivity analyses. Results stored as derivations linked to raw hashes and code commit. Never overwrite results after a source refresh.
5. **Mechanism graph:** distinct observed measurements, latent phenomena, biological/contextual causes, detection, selection, confounding, mediation, policy, operational pathways, and lived experience. Edges are typed (measures / associated / proposed causal / confounds / selects into) with rival hypotheses and falsification tests. Graph traversal is not causal identification.
6. **Evidence adjudication:** independent human reviewers, conflicting sources, accepted/rejected explanations, reviewer identity, time, dissent, supersession and reopen triggers. Source reconciliation cannot be auto-closed by a model or its own author. Two-reviewer resolution required for publication-grade changes.
7. **Implementation casework:** reuse existing Clerk/Neon authenticated DIS workspace and case-event history, subject/tenant isolation, version conflict protection. Map only explicitly approved public evidence or appropriately governed protected data; no automatic private transfer. Human-selected RPLICE methods with actual execution receipts, not selection labels.
8. **Outcomes and surveillance:** reach, adoption, appropriateness, fidelity, cost, patient/service benefit, subgroup harms, unintended effects, sustainability and transferability. Record follow-up windows and who maintains monitoring after initial success.
9. **Explanatory interface:** for every claim show 'What was measured / what differs / what it could mean / what it does not mean / competing explanations / discriminating evidence / what changed / who reviewed / next observation'. Accessible desktop/mobile. Provide a source-diff timeline and exportable reproducibility packet.
10. **Governance:** owners, least-privilege access, audit retention, data-use agreements, ethics/IRB determinations where applicable, publication and outreach approvals, versioned release gates, cost ceiling and service-level monitoring. No claim of partner endorsement without receipt.

## Research pathway A — colorectal
- **Stage A1:** independently reproduce source-reported 2018–2022 Hinds and Harris late-stage rates/shares/counts with exact original query and source bytes. Explicitly reconcile Harris 23.3 vs 23.9 per 100k and 1,044 vs 1,098 cases. Preserve both.
- **A2:** independently extract matched all-stage and late-stage age-specific incidence, staging completeness, uncertainty, population denominator, stage definitions, calendar vintage and missingness. County/city/catchment differences remain visible.
- **A3:** construct candidate causal diagrams distinguishing underlying incidence, screening, detection, abnormal-result follow-up, stage assignment, care capacity, selection and exposure. Specify testable predictions for each.
- **A4:** obtain ethically authorized service and experiential data before attributing local mechanisms; triangulate registry with diagnostic pathway. Predefine analysis, negative controls, lag, confounding, equity and selection.
- **A5:** only if evidence warrants, compare feasible intervention options against competent practice and no-change, with clinical owners and harm measures.

## Research pathway B — national three cancers
- **B1:** reconstruct all 50 state rows directly from original NCI tables, source-release pinned; distinguish DC, Puerto Rico and national aggregates.
- **B2:** independently reproduce both Pearson and Spearman matrices for age-adjusted late-stage incidence and conditional late-stage share, with explicit missingness, ties, precision and uncertainty. Reconcile 0.234/0.231 and 0.413/0.410 before claiming exact reproducibility.
- **B3:** test sensitivity to influential states, period selection, age/sex population definition, spatial dependence and cancer-specific stage completeness. Do not use a difference between correlations as causal evidence.
- **B4:** assess rival mechanisms with age-specific all-stage incidence, mortality, tobacco/exposure indicators, screening eligibility, access and diagnostic follow-up. Ecological controls do not remove person-level inference limitations.
- **B5:** document findings and nonfindings separately by cancer and measure; never pool incompatible constructs for an impressive headline.

## Research pathway C — gynecologic diagnosis
- **C1:** retrieve original NSFG public-use questionnaire, codebook, weights and design variables; replicate NCHS weighted ever-diagnosed percentages and confidence intervals for ages 20–49. Explicitly distinguish published report verification from independent microdata reproduction.
- **C2:** model distinct disease → symptoms → care opportunity → clinical ascertainment → recorded diagnosis → survey recall pathways for endometriosis, PCOS and fibroids. Do not treat the diagnosis funnel as directly observed without transition-specific data.
- **C3:** examine age, insurance, socioeconomic and racial/ethnic strata with design-based uncertainty, sample suppression, multiple testing and intersectional feasibility. Avoid unsupported biological or discrimination causal attribution.
- **C4:** evaluate independent validation cohorts, diagnostic criteria, selection bias and underdiagnosis hypotheses; identify which transitions cannot be identified from cross-sectional survey alone.
- **C5:** develop condition-specific service interventions only after mechanism discrimination and safety/clinical governance.

## Statistical and simulation plan — sequential, not premature
**First** validate source rows, ontologies, and observed estimands. **Then**:
- Exact recomputation and perturbation tests: missing values, suppressed cells, duplicate source lineage, unit swap, denominator drift, source vintage drift, age-standardization changes, survey-weight omission, stage completeness.
- Monte Carlo *synthetic* scenarios with known ground truth: equal stage shares but different true incidence; differential staging missingness; changing diagnostic access with constant disease prevalence; Simpson's paradox from age composition; common-cause ecological correlations without individual causal link; intervention improving average while subgroup worsens.
- Quantify false attribution rate, source-conflict detection sensitivity, coverage of rival hypotheses, calibration of uncertainty, review time, false closure rate and subgroup harm detection; record failure cases as first-class results.
- Use bootstrap/appropriate design-based intervals and simulation power only after estimands and sampling designs are specified. For state correlations consider spatial autocorrelation and dependence; for NSFG use survey-design-based variance, not naive i.i.d. bootstrap.
- Prospective blinded evaluation of DIS–RPLICE against competent established methods with matched evidence packets, adjudication rubric, independent analysts, no post hoc superiority scoring. No superiority or clinical impact claim until observed.

## Evidence-state machine
`DISCOVERED → ACQUIRED → PARSED → REPRODUCED → SOURCE_ADJUDICATED → MEASUREMENT_COMPATIBLE → DESCRIPTIVE_VALIDATED → MECHANISM_TESTED → CAUSAL_DESIGN_REVIEWED → IMPLEMENTATION_AUTHORIZED → OUTCOME_VERIFIED → SUSTAINMENT_REVIEWED`.
Every transition requires a receipt, source revision, owner, timestamp, pass/fail criteria and explicit limitations. Branch to `CONFLICT`, `INSUFFICIENT`, `CONTRADICTED` or `REOPENED` without erasing previous states. A study can legitimately remain descriptive without being marked failed. Mechanism testing does not imply a causal effect was identified; the causal gate can remain unmet.

## Deployment and operating model
- Existing GitHub repo holds typed code, tests, scientific methods, synthetic fixtures and public provenance manifests; reviewed PR and exact-head CI precede merge.
- Existing Vercel DIS application hosts the research interface and authorized casework; Neon remains the private tenant-safe persistence layer. Do not create a parallel identity or database merely to demonstrate the concept.
- Separate read-only scheduled acquisition jobs from the authenticated private workspace. No recurring production job is enabled until budget, rate limits, source terms, observability, alerting and retention are reviewed.
- On source change, write a new immutable snapshot and discrepancy event; require an owner to reconcile and decide whether prior conclusions must be reopened. Never auto-update a publication-grade estimate.
- Monitoring: source freshness and acquisition failure, parser drift, unmatched denominators, unresolved discrepancy age, job latency/cost, auth denial, audit integrity, reviewer backlog and sustained outcome coverage. Set thresholds after baseline measurement rather than inventing service levels.
- Recovery rehearsal: upstream outage, bad source revision, invalid schema, tenant isolation failure, duplicate events, failed database write, interrupted job, budget ceiling, reviewer absence. Record proof of recovery and no false successful state.

## Scientific and operational release gates
| Gate | Evidence of completion | Current assessment |
|---|---|---|
| G0 source inventory and licensed retrieval | exact original source, hash, query, timestamp and rights | PARTIAL; draft source cycle exists |
| G1 original-source replication | independent source-cell re-extraction; Harris conflict reconciled | OPEN |
| G2 ontology and comparability | condition-specific denominators, stage/survey designs and negative tests | PARTIAL code; human review OPEN |
| G3 statistical reproducibility | frozen scripts, results, CI/uncertainty, discrepancies resolved | OPEN |
| G4 mechanism discrimination | rival hypotheses, observable tests, disconfirmation, confounding | PARTIAL schema; empirical testing OPEN |
| G5 secure durable workflow | authenticated real create/reload/update, tenant denial, audit history | OPEN production witness |
| G6 simulation and red-team | preregistered synthetic truth sets, false attribution metrics, failures | OPEN |
| G7 independent scientific review | epidemiology, survey methods, clinical, community and methods reviewers | OPEN |
| G8 authorized implementation | actual site, protocol, approvals, owners, comparator and stop rules | OPEN |
| G9 longitudinal benefit | prespecified patient/service outcome, harms, costs, repeated follow-up | OPEN |
| G10 sustainable operations | scheduled source service, monitoring, alerts, recovery and owner handoff | OPEN |

## Decision and immediate next actions
**GO** on source reproducibility, source-discrepancy investigation, ontology design and bounded synthetic falsification. **CONDITIONAL** on method selection and a future field pilot. **NO CLAIM** of causal identification, superiority, ACS error, clinical effect or sustainable operation until independently demonstrated.

Immediate owner roles (proposed, not accepted assignments): data epidemiologist for A/B source audit; survey statistician for C reproduction; DIS engineer for typed ingestion/persistence; independent method reviewer for falsification; clinical and community partners for authorized operational/experiential validation; Terry for research scope and external communications. Deliverable sequence: (1) immutable original source receipt, (2) reconciled measurement ledger, (3) three condition-specific explanatory graphs, (4) preregistered synthetic challenge corpus, (5) secure longitudinal dashboard, (6) independent evaluation and implementation protocol. No Jeremiah/ACS outreach yet.

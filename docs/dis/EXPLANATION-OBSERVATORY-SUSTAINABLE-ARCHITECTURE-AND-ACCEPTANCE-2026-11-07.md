> Design history. The controlling integration specification is [DIS RPLICE System Specification v1.0](DIS-RPLICE-SYSTEM-SPECIFICATION-v1.0.md). Preserve historical claims and corrections; use current exact-revision receipts for status.

# DIS Explanation Observatory — sustainable system architecture and staged scientific acceptance
**Status:** design baseline v0.2; 2026-11-07. Not a completed scientific result or production-ready continuous service.

## Mission and boundary
Sustain a source-to-explanation-to-intervention learning system that distinguishes: (1) the phenomenon, (2) the observation process, (3) the mathematical estimand, (4) the candidate mechanism, (5) the test of that mechanism, (6) the appropriateness of a proposed response, and (7) the downstream benefit, harms and sustainment. The existing DIS authenticated casework is the system of record for authorized human decisions; RPLICE remains a human-selected specialist, not an automatic universal dependency. Do not replace established registry or statistical systems.

## As-built inventory (verified in source, not field-certified)
- Existing DIS research program, casework, event history and source-aware evidence-to-action bridge; production release history separate from scientific acceptance.
- PR #73 draft: three-study construct validation, stage completeness and age-standardization demonstrations, ecological correlation gate, mechanism ledger, source discrepancy detector and falsification tests.
- Source acquisition: `research/three_study_cycle/acquire.py` and `.github/workflows/dis-research-evidence-cycle.yml` acquire official-source bytes, hash original files, parse tables, attempt NSFG weighted estimates and upload a bounded 14-day GitHub artifact. No recurring schedule yet. No permanent immutable evidence store proven.
- First workflow 42410279305: 8/10 sources ORIGINAL_BYTES_RETAINED, two ACQUISITION_FAILED (NSFG codebook PDF, NCHS published report HTML). The workflow's success means the job completed; **source coverage is incomplete**. Inspect `acquisition_receipt.json`, `nsfg_reproduction.json` and `survey_schema.json` before any replication claim. The artifact is not a durable long-term archive.
- Source conflict: Harris County 2018–2022 previously 23.3/1,044 versus subsequently inspected NCI 23.9/1,098; neither may silently supersede the other without matched query/release and original table confirmation.

## Target architecture: explicit contracts and handoffs
| Component | Inputs | Output and provenance | Failure state | Owner role |
|---|---|---|---|---|
| 1. Source registry | Approved origin, URL/query, license, source cadence, version | Immutable source identity, original bytes, SHA-256, fetch timestamp, license and source metadata | FETCH_FAILED / PARTIAL / SOURCE_CHANGED | Data steward |
| 2. Acquisition scheduler | Registry and budget | Bounded retries, source snapshots, event ID, no secrets in artifacts | RUN_FAILED distinct from SOURCE_INCOMPLETE | Platform operator |
| 3. Schema and quality audit | Raw source and original codebook | Data dictionary, column/coding map, missingness, suppression, weighted design | SCHEMA_DRIFT / CODEBOOK_MISSING | Measurement specialist |
| 4. Measurement ontology | Disease, construct, population, period, eligibility, geography | Explicit numerator/denominator, age/sex adjustment, stage/diagnosis rules | NONCOMPARABLE / NOT_ESTIMABLE | Epidemiologist / survey statistician |
| 5. Reproducible statistics | Frozen analytic panel and versioned code | Estimates, intervals, sensitivity, unit tests, independent reproduction receipt | REPRODUCTION_FAILED / DISAGREEMENT | Statistician |
| 6. Mechanism graph | Source-qualified observations and context | Competing causal pathways, confounders, discriminating tests, contradictory findings | HYPOTHESIS_UNTESTED | Domain scientist and lived-experience reviewer |
| 7. Design and simulation laboratory | Prespecified DAG/estimand, mechanism priors, parameter ranges | Synthetic stress tests, negative controls, power, measurement error and selection sensitivity | ASSUMPTION_UNTESTED | Independent methods reviewer |
| 8. Human adjudication | Evidence ledger, analysis receipts, dissent | Signed decision with scope, claims allowed, rejected claims, next tests | REVIEW_PENDING / REOPEN | Authorized council |
| 9. Implementation experiment | Approved partner site, comparator, ethics/data-use decision | Fidelity, reach, costs, benefits, harms, equity and monitoring | NOT_AUTHORIZED / NOT_MEASURED | Implementation owner |
| 10. Longitudinal learning | Outcomes, revisions, source drift, policy changes | Reassessment, transfer conditions, sustainability, retirement or correction | OUTCOME_PENDING / SUSTAINMENT_UNKNOWN | Evaluation and governance owners |

**Never conflate:** GitHub job success; source retrieval; statistical reproduction; source authenticity; independently validated causal inference; actual implementation; measured benefit.

## Scientific investigation packages
### Study 1: county colorectal
1. Freeze Hinds and Harris matched NCI query and 2018–2022 release; reconcile Harris discrepancy with original raw tables.
2. Obtain age-specific all-stage and late-stage incidence, standard weights, stage completeness and uncertainty. Never divide adjusted late-stage rate by unadjusted stage share to derive adjusted all-stage rate.
3. Separate registry data from actual eligible-screening cohorts, positive-test follow-up, diagnostic resolution and clinical service capacity.
4. Compare causal diagrams: true incidence difference; stage ascertainment; screening and detection; diagnostic bottlenecks; geography/age/catchment and contextual confounding. Design discriminating tests and identify negative controls.
5. Only with appropriate longitudinal panel and intervention timing consider quasi-experimental inference.

### Study 2: national three-cancer
1. Reproduce original 50-state × condition × construct × vintage table directly from authoritative source and freeze it.
2. Reconcile previous 0.234 vs 0.231 and 0.413 vs 0.410 coefficient differences, including exact source rows, tied ranks and code.
3. Analyze Pearson and Spearman within each measurement construct, with uncertainty and dependent-correlation comparison where warranted.
4. Evaluate age/sex standardization, cancer-specific staging, spatial dependence, ecological fallacy, outliers, missingness and multiple tests. Do not pool cancer-specific rates.
5. Test shared exposure/context explanations against negative controls and independent data, never infer individual-level cause from state correlations.

### Study 3: women's-health recognition
1. Reconcile acquired NSFG microdata schema with original codebook, weighted denominator, female age 20–49 domain and valid diagnosis codes.
2. Reproduce NCHS estimates and survey-design-correct uncertainty; compare CI methodology before claiming exact replication.
3. Treat ever-diagnosed as a recognition/recording outcome, not biological prevalence. Evaluate age, insurance, socioeconomic, utilization and reporting pathways with prespecified models.
4. Seek independent clinically ascertained condition-specific populations to test the undiagnosed-reservoir hypothesis; preserve verification bias and definition differences.
5. Investigate actual symptom-to-diagnosis journeys through appropriately authorized clinical and patient-partner evidence.

## Mechanism audit schema
Each mechanism: `mechanism_id, study_id, claim_id, source_ids, DAG_revision, exposure, outcome, mediators, confounders, colliders, effect_modifiers, selection_process, measurement_process, rival_mechanisms, discriminating_test, disconfirming_result, uncertainty, evidence_class, reviewer, review_time, status, reopen_trigger`.
Do not represent a mechanistic hypothesis as an established fact merely because it appears in a graph. Record why each edge is believed and which observations would refute it.

## Simulations and statistical tests: ordered, not premature
- Phase S0: source snapshot/hash and deterministic schema validation.
- S1: exact reproducibility on official published tables, survey design, code and periods.
- S2: synthetic denominator and missingness stress tests, including stage incompleteness and diagnosis recognition.
- S3: Monte Carlo measurement error, selection bias, differential sensitivity/specificity and unmeasured-confounder scenarios; parameters labeled assumptions, not observed truth.
- S4: ecological/spatial correlation robustness, multiple comparisons, bootstrap/design-aware intervals, state deletion, negative controls.
- S5: prospective intervention feasibility/power and design selection only after a mechanism and endpoint are defensibly specified.
- S6: actual authorized comparative implementation and longitudinal independent evaluation.
A successful simulation only validates the algorithm under its assumed data-generating process. It does not prove a real-world mechanism.

## Operating cadence and costs
- Daily *lightweight* source metadata/version checks after a bounded cost and failure policy is approved; avoid full microdata downloads on every poll.
- On meaningful source change: full acquisition and hash/version audit; preserve immutable originals in an approved durable repository/object store. Do not rely on 14-day Actions artifacts for scientific retention.
- Monthly: reproduction, discrepancy triage, subgroup and measurement-quality report.
- Quarterly: independent review of falsified mechanisms, new data, harms, relevance and stakeholder experience.
- Annual: external methods comparison, outcomes and sustainment assessment.
Scheduling, storage, alerts and owner permissions are **target design**. Do not call them operational until their actual authenticated receipts exist.

## Explicit acceptance matrix
| Gate | Closure evidence | Current state |
|---|---|---|
| Code compiles and targeted negative tests pass | Exact-head CI receipts | Passed on prior PR revisions; reverify final head |
| Official source coverage | 10/10 original bytes or documented authorized alternate sources | PARTIAL: 8/10 in first run |
| NSFG published estimate reproduction | Weighted estimates, correct domain/codes, CIs and independent audit | NOT YET VERIFIED |
| NCI county value reconciliation | Pinned original table and explanation of conflicting values | OPEN |
| National correlation reproduction | Reconstructed 50-state table, code, intervals and resolved discrepancies | OPEN |
| Permanent evidence retention | Durable immutable storage, integrity and restore test | NOT IMPLEMENTED |
| Recurring operations | Scheduler, cost guard, retries, alerts, signed source-drift events | NOT IMPLEMENTED |
| Human adjudication | Real authenticated reviewer workflow, disagreement and reopen | NOT WITNESSED |
| Field implementation benefit | Authorized site, comparator, outcomes, harms, longitudinal assessment | NOT STARTED |

## Communications
Potential ACS, Dartmouth and other external review should receive a defensible methods challenge and evidence of benefit over existing practices, not accusations or unsupported claims. No external email or publication until approved. No Copilot or paid Replit agent without explicit opt-in.

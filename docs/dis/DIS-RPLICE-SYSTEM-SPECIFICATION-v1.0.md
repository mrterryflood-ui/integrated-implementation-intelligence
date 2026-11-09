# DIS RPLICE Research and Implementation System Specification

Version 1.0 | November 7 2026 | Owner Terry Flood | Scientific specification for pilot calibration

Triage: L4 GREEN. Evidence: retained public sources, published methods, executed code and explicit synthetic assumptions. Scientific and clinical acceptance remain requirement specific.

## Purpose and end state

Connect research science, implementation science and relevant domain expertise so users can understand a problem, select suitable instruments, test competing explanations, implement appropriate responses and learn from outcomes. The medical objective is earlier appropriate discovery and action, less avoidable late discovery, and better health and function. Validation of the pilots precedes wider disease, setting and geographic expansion.

DIS coordinates questions, evidence, context, decisions, accountable action, outcomes and learning. RPLICE supplies specialist methods chosen explicitly by a human for the question and setting. Existing clinical, navigation, data and implementation systems remain the delivery foundation. This specification does not assert a universal diagnostic algorithm or validated subject matter expertise across medicine.

This is the controlling architecture index for the three-study program. Earlier evidence/explanation observatory architecture drafts and sustainable architecture v0.2 remain preserved as design history. Source-specific corrections, immutable execution receipts and later owner decisions take precedence over historical draft assertions. The double-helix protocol supplies comparison and falsification detail; it is subordinate to this scope and evidence contract.

## Current pilots and expansion rule

| Pilot | Question | Current evidence supports | Next discriminating test |
|---|---|---|---|
| Hinds and Harris colorectal | Why can similar diagnosed-case stage shares accompany different population burdens? | Matched-period descriptive rates and arithmetic; county evidence | Age/stage/sex/race-specific extracts, staging completeness, historical screening and polypectomy, diagnostic follow-up and contextual confounding |
| Fifty-state colorectal lung and female breast | Does the measured construct change the apparent pattern? | Separate ecological associations and ranking sensitivity | Dependence-aware uncertainty, sex/age-aligned panels, negative controls and held-out settings |
| NSFG endometriosis PCOS and fibroids | How do reported diagnoses vary across available groups? | Survey-weighted recognition estimates and exploratory age sensitivities | Time-aligned symptom, recognition, access and clinical ascertainment data; authorized detail for groups unavailable in public recodes |
| Early discovery and action | Which connected mechanisms could reduce late discovery? | Explicit synthetic pathway and missing-data rehearsals | Independent clinical instrument review, feasible silent-mode study, then appropriately authorized comparative implementation |

Qualify measurement and source fidelity, reproduce the calculation, examine uncertainty and rivals, and test the whole workflow before extending the clinical claim. Missing evidence narrows a claim and creates the next experiment. It does not stop unrelated analyses, literature synthesis, bounds, sensitivity analyses, synthetic rehearsal or protocol preparation.

## One connected research and delivery loop

Question and beneficiary → source and instrument → compatible observation → analysis and rival explanations → human methodological decision → setting-specific implementation → appropriate completed action → benefit harm equity and cost → reassessment.

Each connection retains an owner, evidence, scope, clock, failure state and test. Ideal reality records the intended intervention and outcome. Operational reality records what can actually be delivered with the available workforce, tools, capacity and resources. Experienced reality records authorized patient, community and implementer experience. Generated perspectives can suggest questions but cannot substitute for testimony.

The platform must help a user answer: What is happening? What does this evidence measure? What else could explain it? What can we do here? Who owns the next action? What changed afterward? It should expose the decisive answer first and provide methods and provenance on demand. Usability and accessibility require testing with intended users; they are not established by this document.

## Measurement contract and instrument fit

Every measure declares condition, construct, numerator, denominator, population, eligibility, unit, time window, geography, missingness, suppression, adjustment standard, uncertainty method and permitted decision use. A renamed field cannot make different constructs comparable. A source report, biological occurrence, recorded diagnosis and patient experience remain distinct.

For CRC, always carry all-stage incidence, late-stage incidence per population, stage distribution, mortality and emergency presentation, with an explicit unavailable reason when absent. Preserve the owner's early-versus-late objective. The November 8 owner adjudication requires jointly interpreted outcome domains, including early/late measures, burden, mortality, emergency presentation, timing, function, experience, equity, harms, capacity and durability. It supersedes the earlier either/or mission question in ledger R03. Individual experiments still require prespecified statistical estimands, multiplicity handling and power; those choices do not remove other mission outcomes. See ../../research/fragmentation-harm/OWNER_ADJUDICATION_MULTIDIMENSIONAL_OUTCOMES_2026-11-08.md. An improving ratio alone does not prove benefit. Prevention can lower both early and late incidence while leaving their ratio unchanged.

Endometriosis requires its own outcome contract: appropriate completed action, time to evaluation and diagnosis where relevant, pain, function, fertility goals, harms and patient experience. Do not impose cancer-stage endpoints. Further conditions require a separately qualified contract.

Assess instrument sensitivity, specificity, positive predictive value, calibration, thresholds, population fit, failure modes and burden separately from delivery reliability. A stool test, imaging result, genomic model, symptom report, survey or environmental measure has its own intended population and blind spots. Low-burden access does not remove the need for clinically appropriate confirmation or follow-up.

## Clinical pathways and time

Keep asymptomatic risk-adapted prevention/screening separate from symptomatic or abnormal-result evaluation. Warning signs can warrant appropriate clinical assessment at any age; no universal age threshold suppresses them. A research-derived risk-equivalence age is not a clinical recommendation or proof of net benefit.

The longitudinal dictionary follows risk/eligibility, patient-reported onset, first recorded signal, first actionable information, recognition, planned response, due date, completed response, result, reassessment and outcome. Keep recalled onset, first-ever contact and first captured encounter distinct. Diagnosis cannot retrospectively manufacture an earlier actionable signal. Preserve alternative diagnoses, justified observation, declined/paused care and loss to follow-up in the appropriate denominator.

Clinical code lists, action appropriateness, urgency, reassessment and safety margins require qualified review against the source and local workflow. No illustrative exercise date becomes a clinical deadline. Record follow-up timing continuously; a guideline time target must retain indication, modality, population and source version. A sent referral, test order or attended visit alone is not clinical resolution.

## Geography social determinants and availability

Retain individual, household, service area, ZIP/postal area, Census ZCTA, tract, county, state and national units as different scopes. ZIP Codes are not interchangeable with ZCTAs, cities or counties. Any crosswalk requires its source, version, coverage, allocation method and uncertainty; no finer geography is inferred from a coarser observation.

Link social determinants as temporally appropriate context and candidate mechanisms: affordability and coverage, transport, language, housing, food security, work/care obligations, trust, exposure, service capacity and policy. Do not convert an area characteristic into a person's exposure or a causal explanation. Measure community reach separately from clinical follow-through so people outside care remain visible as a research need. Community estimates, voluntary reports and observed clinical records retain separate denominators and privacy rules.

## Evidence states and continuing through gaps

Keep source-reported, reproduced, synthesized, hypothesis, simulated, independently reviewed and outcome-measured records distinct. Record confidence dimensions separately: source fidelity, statistical precision, causal credibility, clinical appropriateness, implementation reliability, transportability and equity. Do not compress them into an unvalidated percentage.

For a missing empirical input, preserve the failed acquisition or unavailable definition, synthesize the available evidence, state the untested mechanism and construct a discriminating observation or justified parameter range. Report bounds or scenario results only at that evidence level. Do not impute missingness as zero, invent restricted detail, or label a model as a patient outcome. An uncertain clinical consequence remains human governed while research continues.

## Methods and reproducibility

Reuse the original-source cycle, retained-file admission, source-period checks, survey design code, mechanism graph, DIS casework and human-selected RPLICE adapter. Existing source admission, tenant isolation and clinical authority are independent of method selection. SALP is not automatically placed on HOLD because an empirical input is missing.

County decomposition is arithmetic, not causal attribution. Include preventive polypectomy as a rival pathway alongside underlying risk, detection intensity, diagnostic delay, case mix and staging ascertainment. Standardized-rate intervals cannot be derived by scaling total counts as if they were crude Poisson rates.

National coefficients are finite-state descriptive quantities. IID Fisher intervals and exchangeable permutations are conditional sensitivities; regional deletion is an influence check, not a spatially valid test. Dependence-aware inference requires an explicit population/model and data. Diagnosis survey estimates require full-sample PSU construction, valid weights, group covariance and reliability review. Equal-band standardization remains sensitivity analysis; public recode 4 cannot identify an Asian-specific group.

The RAP benchmark checks published-parameter arithmetic before any proposed extension. Preserve mismatches and the stated tolerance. A downstream transformation does not reproduce the original fitted cohort model; separate-model RAPs are not freely additive. A target-trial or policy analysis requires prespecified eligibility, time zero, strategies, comparator, follow-up, estimand, confounders, censoring and assumptions. A pretrend diagnostic cannot certify the untreated post-intervention counterfactual.

## Visual explanation and interoperability

Every graph, chart, map, timeline or individual view must expose source, period, unit, denominator, geography, uncertainty and evidence class. Link plotted values to retained inputs and executable analysis. Realistic imagery can orient a user only when its origin, rights and relevance are clear; generated imagery cannot substantiate a clinical, geographic or scientific claim. Do not decorate unavailable evidence with a plausible-looking image.

Provide geographic trends only at observed resolution. Individual longitudinal views require authorized individual records and validated time definitions; a national survey or state correlation cannot populate them. Show unavailable, suppressed, stale and conflicting states visibly. Intended-user comprehension and accessibility are acceptance measures alongside statistical correctness.

Reuse DIS ecosystem and RPLICE adapters for API/MCP interoperability; do not add another invoker or identity service. Portable research objects must preserve schema/version, source and code hashes, constructs, units, population/geography, clocks, uncertainty, evidence state, permissions and review/approval status. An external consumer must not turn a scenario into a clinical record or a successful API response into evidence of effectiveness. Registered routes, authenticated exchange, tenant denial, version compatibility and downstream comprehension require separate exercised receipts.

## Evidence retention review and release

Retain original bytes or governed extract descriptions, hashes, request/response scope, source dates, code revision, dependency versions, execution environment, protocol, random seed, outputs, failures, corrections and reviewer dispositions. Preserve old results when corrected. CI retention is a recovery buffer, not durable archiving. Save accepted snapshots outside expiring CI and test restoration. A DOI or preregistration publication is a separate authorized external action; no public deposit is implied.

Every review item has an ID, disposition, corrective action, owner role, evidence, next test and closure condition. Builder tests and AI review do not become independent clinical or scientific acceptance. Actual human reviewer roles remain proposed until accepted. Feedback is implemented only after the changed analysis/protocol/code is tested and rechecked.

Source acquisition and synthesis can proceed now. Institutional data agreements, restricted data access, clinical studies, external contact, public claims and production effects require the applicable authority. A failed public download is not automatically a need to reauthorize a connection. No institutional affiliation or agreement is invented.

## Acceptance and sustainment

| Layer | Acceptance evidence | Owner role |
|---|---|---|
| Source and construct | Retained originals, scoped definitions, periods, denominator and correction record | Data steward and measurement reviewer |
| Numerical reproduction | Executable replay, independent calculations, matched inputs and declared tolerances | Research engineer and independent checker |
| Mechanism | Rival predictions, discriminating data, appropriate identification and null/adverse findings | Domain and causal-methods reviewers |
| Delivery | Appropriate action completed under qualified judgment; real persistence, handoff, failure/recovery and accessibility tests | Clinical and implementation leads |
| Benefit and scale | Comparator, patient outcomes, harms, equity, cost, maintenance and transportability | Accepted scientific and community reviewers with owner |

Validate one end-to-end pilot before scaling up depth or scaling out conditions and settings. Expand only where the new population, instrument and workflow are qualified. Reassess source definitions and inherited practices over the prior decade, present evidence, the day after success and the next decade. Preserve successor ownership, resources, training, drift/rollback triggers and retirement criteria. New empirical findings can revise the question as well as the answer.

## Baseline stewardship and repeated evidence review — November8 clarification

Reuse the same sequence across diseases: define the decision and population; qualify the condition-specific construct, instrument and timeline; retain/reproduce sources; test competing and interacting explanations; qualify a setting and comparator; implement under appropriate authority; measure benefit, harms, equity, burden and cost; adapt and review. A common process does not make a cancer-stage endpoint valid for endometriosis, a reported diagnosis into biological prevalence, or a new disease instrument automatically qualified.

Separate three baselines: the immutable historical source snapshot; the versioned measurement/analytic specification; and the actual implementation-cohort baseline. Source reproduction is established for the retained pilots, while final intended-use qualification, causal mechanisms, operating baselines and field benefit remain open. Do not claim a universal diagnostic formula has been validated.

New articles, corrections/retractions, guidance and data vintages enter a dated candidate-evidence ledger. Record publication, observation, retrieval and decision clocks; DOI/PMID/source lineage; applicable population/indication; construct/instrument; outcome; uncertainty; setting; and what decision the evidence would change. Deduplicate common underlying studies and datasets. Compare each addition with the named baseline version without changing earlier observations or methods. A material contradiction triggers review; an accepted methodological change creates a new version, affected-analysis replay and a retained decision record. Never silently replace the baseline or freeze an invalid claim against later evidence.

A ChatGPT monthly literature review was created and enabled for the first morning of each month in America/Chicago, beginning December1,2026. Its receipt is retained privately. Scheduling is not a completed review, automated app ingestion, a production refresh job or an authorization to deploy new evidence. The first execution and candidate-ledger write require their own receipts. Female/male healthcare platforms use the same source/timeline/evidence-state contract only through independently inspected, scoped and exercised connections; a repository listing, catalog label or configured credential is not proof of exchange or patient-data entitlement.

## Current implementation references

- `research/three_study_cycle/`: source acquisition, replay, review follow-up, synthetic early discovery and RAP benchmark.
- `apps/dis-platform/lib/three-study-explanation.ts`: source-aware descriptive explanation contract.
- `apps/dis-platform/lib/evidence-action-bridge.ts`: counterfactual and action evidence review.
- `apps/dis-platform/lib/evidence-action-pretrend.ts`: bounded numerical pretrend diagnostics.
- `apps/dis-platform/lib/pilot-calibration-supplement.ts` and `crc-marginal-supplement.ts`: separately scoped retained evidence, construct checks and exact known-reference content matching.
- `apps/dis-platform/lib/saved-research-evidence.ts`: saved-version recovery, source-bound council excerpts and nonrecursive preservation through reassessment.
- `apps/dis-platform/lib/case-history-pagination.ts`: response-byte-bounded, exact-time cursor history transport; stored records remain intact.
- `docs/dis/RESEARCH-RECONCILIATION-LEDGER-2026-11-07.csv`: requirement-specific builder dispositions; independent recheck remains separate.
- `docs/dis/DOUBLE-HELIX-RESEARCH-IMPLEMENTATION-PROTOCOL-2026-11-07.md`: internal comparator and falsification protocol.

> Design history. The controlling integration specification is [DIS RPLICE System Specification v1.0](DIS-RPLICE-SYSTEM-SPECIFICATION-v1.0.md). Preserve historical claims and corrections; use current exact-revision receipts for status.

# DIS–RPLICE: sustainable research architecture v0.2
Working integration baseline | November 7, 2026 | INTERNAL DRAFT | Studies 1–3

## 1. Authority, scope and current decision
This is the consolidated integration index for the earlier EVIDENCE-OBSERVATORY-SUSTAINABLE-ARCHITECTURE, EXPLANATION-OBSERVATORY-SUSTAINABLE-ARCHITECTURE-AND-ACCEPTANCE and EXPLANATION-OBSERVATORY-SUSTAINABLE-ARCHITECTURE-AND-GATES drafts. Those documents remain design history; conflicting source windows and readiness claims are superseded by this index, the revised source-discrepancy ledger and exact execution receipts. Do not create another platform, parallel identity provider or unowned dashboard. Follow IRON-ENG-001 v1.0.0 and the existing DIS evidence and decision contracts.

The scope is county colorectal differences; national colorectal/lung/female-breast measurement patterns; and endometriosis/PCOS/fibroid diagnosis ascertainment. It is not a clinical intervention, an ACS performance finding, a claim that all mechanisms are known, or authorization to contact collaborators. Terry retains scope and consequence authority. Named outside reviewers, sites, budgets and institutional commitments are unconfirmed.

End state: a repeated source-change → measured phenomenon → competing explanations → justified decision → accountable action → measured benefit/harm → reassessment cycle, with inspectable evidence and a maintained owner. A successful job or a recorded association is not that end state.

## 2. What exists versus what must be built
| Function | Existing component to reuse | Verified extent / remaining obligation |
|---|---|---|
| Public acquisition | research/three_study_cycle/acquire.py; existing research evidence workflow | One downloaded run retained 8/10 requested originals. Codebook and report HTML failed in that run. This does not establish permanent storage or a recurring service. |
| Retained-file admission | verify_retained.py; test_verify_retained.py | New bounded byte/path/format/revision checks connected before downstream analysis. Eighteen local behavior checks passed; exact pushed-revision CI must be checked separately. |
| Measurement and source differences | three-study-explanation.ts; source-discrepancy-review.ts; evidence-action-bridge | Draft contracts and targeted negative tests. Full geography/condition pairing and added/deleted/partial-record lifecycle still need closure. |
| Study analysis | Existing three_study_cycle analysis and replay code | Reuse, pin inputs and inspect every assumption. Execution, numerical agreement and independent scientific validation remain separate. |
| Mechanism inquiry | STELLAR 1, ChainWeb, mechanism graph, human-selected RPLICE | Keep rival explanations and falsifying tests. Graph traversal or method selection is not a demonstrated mechanism or executed specialist call. |
| Case decisions and follow-through | Existing authenticated DIS casework, source-linked reports and event history | Extend the existing authorized workflow. Real signed-in create/reload/update, cross-tenant denial and durable source-to-review linkage remain explicit live gates. |
| Sustained operations | Existing hosting and job infrastructure | Permanent evidence retention, repeat cycles, budgets, recovery and accepted reviewer/maintainer assignments are not yet established. No recurring schedule is enabled. |

The next delivery is one complete public-source-to-reviewed-case workflow, not more disconnected modules.

## 3. Evidence model: preserve meaning, lineage and time
The linked records are SourceSnapshot → MeasureDefinition → Observation → AnalysisPlan/Run → Mechanism/Claim/Review → Decision/Action/Outcome/ReopenEvent. Reuse the existing case and evidence identifiers rather than introduce competing stores.

A SourceSnapshot retains source owner and permitted use, exact request, response bytes and SHA-256, provider release, retrieval timestamp/timezone, format, parser version, completeness and error state. A hash detects byte changes; it does not establish source truth. Accepted original snapshots must leave expiring CI storage for an approved durable store with restore receipts.

A MeasureDefinition retains condition, construct, numerator, denominator, eligibility, diagnosis/stage rules, sex/age/race scope, adjustment standard, geography/catchment, period, missingness/suppression and uncertainty method. A shared label or unit does not establish equivalence. A county cannot stand in for a city without a documented use-specific justification.

An Observation is immutable and bound to its original row/cell. Unknown, suppressed, inapplicable, not collected and observed zero are separate values. Source copies are not independent replications. The same source URL may expose different releases.

An AnalysisPlan declares the quantity to estimate, paired units, method, exclusions, weights/design, missingness, multiplicity, dependence, robustness, stopping criteria and interpretation limits before additional result-driven searching. A Run records immutable input hashes, code/environment, random seed where relevant, outputs, failures and execution identity. Retain both event/merge SHA and actual checked-out code SHA; do not silently substitute one for the other.

Keep five clocks separate: observation window; provider release/submission; page/report rendering; retrieval; analysis/decision. Eligibility also needs its own reference event: age at screening and age at interview are not interchangeable. Knowledge obtained later must not silently justify an earlier decision.

## 4. Source-period correction and audited observations
Our earlier ledger mislabeled Harris 23.9 per 100,000 as 2018–2022. The source window is 2019–2023. The mixed-window Hinds 30.4/Harris 23.9 ratio and 6.5 difference are withdrawn as matched-period comparisons. This was our labeling error, not evidence of an NCI error.

| Period | County | Late-stage rate / 100,000 | Published late-stage share | Annual late-stage cases |
|---|---|---:|---:|---:|
| 2018–2022 | Hinds | 30.4 | 63.3% | 76 |
| 2018–2022 | Harris | 23.3 | 63.4% | 1,044 |
| 2019–2023 | Hinds | 29.9 | 63.7% | 75 |
| 2019–2023 | Harris | 23.9 | 63.4% | 1,098 |

The newer acquired all-stage colorectal tables report 46.4 for Hinds and 38.0 for Harris per 100,000. These direct all-stage observations avoid reconstructing an adjusted rate from an unadjusted percentage. They represent recorded diagnoses, not independently observed biological occurrence. The five-year windows overlap by four years; they are not independent replications or a valid two-point causal trend.

Originals audited: GitHub run 42411186460; artifact 13589422990; archive SHA-256 2d5fba3dbff2ab294f1dd2a79612081f0da06e358e539358928d34b404119b6c. The download matches the provider digest and all 18 manifest entries match. Eight requested original files pass size/hash/format checks. The acquisition script blob a21c038476807262db6122d09593afcdb2387205 is identical at recorded merge candidate bf14c3a84ceba0b5b3cf7fce07ee54802274dc56 and artifact head ff50e85106e8c12319dcf8895725aa84d28ab0d9. The old receipt's revision labeling is retained rather than rewritten; future acquisition now reads the actual checkout SHA in the child process.

Historical 2018–2022 transcriptions and newer acquired source bytes remain separate evidence classes. Exact published percentage-denominator treatment, including unknown stage, requires source-method adjudication; the synthetic 'late among staged' example does not prove the NCI rule.

## 5. Study 1: county colorectal investigative pathways
Ask first how source-compatible all-stage incidence, late-stage incidence, stage share, uncertainty and staging completeness differ. Preserve at least these alternatives:

- Occurrence versus detection: age-specific all-stage incidence and ascertainment intensity, not just diagnosed-case shares.
- Screening eligibility/invitation/completion versus abnormal-result follow-up: eligible cohorts, modality, communication, referral and confirmed diagnostic resolution have different denominators.
- Capacity versus preferences/access: waiting time, staffing, cost, transportation and actual authorized accounts of barriers and choices.
- Stage/coding differences versus true distribution: stage definitions, unknown-stage fractions, registry rules and revisions.
- Structural/exposure context versus confounding/selection: temporally appropriate individual or area-level evidence, latency, catchment and explicit alternative pathways; facility proximity is not exposure or causation.

Designed evidence describes intended policies and protocols. Operational evidence measures actual delivery and capacity. Experienced evidence comes from real authorized participants, not generated personas. No one of these replaces the others. Keep prevention of occurrence, prevention of invasive disease, early detection, diagnosis, treatment and mortality distinct. Selecting an intervention requires mechanism-specific evidence and local feasibility, not a familiar headline statistic.

## 6. Study 2: national three-cancer measurement
Build one source-qualified state × condition × construct × window matrix. Every required cell must have a value or explicit missing/suppressed status; no national total, DC or Puerto Rico is silently counted among the 50 states. Preserve the female breast population definition and cancer-specific staging.

Reconstruct prior Pearson/Spearman outputs from their exact inputs before attributing differences to new science. Resolve the prior secondary 0.234/0.231 and 0.413/0.410 discrepancies using source rows, tied ranks, precision and code. New-vintage outputs are not replacements for old-vintage outputs. No new coefficient is endorsed by this architecture document.

Specify unweighted versus population-weighted estimands, influential-unit sensitivity, geographic/spatial dependence, overlapping windows, multiple comparisons and the meaning of uncertainty for the finite set of states. A difference between dependent correlations requires an appropriate comparison; do not treat each coefficient or leave-one-state run as independent evidence.

Common context, disease occurrence, detection, composition and reporting can all generate associations. Opposite patterns do not rule out a common mechanism, and similar patterns do not prove one. Ecological associations cannot identify person-level effects.

## 7. Study 3: diagnosis recognition and the eligibility boundary
NCHS Health E-Stat 121 reports 4,856 female respondents in its age-20–49 analysis. The acquired public-use file has 4,855 under a literal AGER 20–49 filter. Including the single age-50 interview record gives 4,856. CDC's official recode specifications state that age-50 interview respondents were 49 at household screening. This is a source-supported candidate explanation, not confirmation of the authors' analytic rule; retain both domain diagnostics and obtain original syntax or qualified adjudication rather than tune a filter to a target.

Under the original literal domain and the draft 1=yes/5=no coding, weighted percentages reproduced locally are 6.1591876, 8.7089788 and 7.8002863 for endometriosis, PCOS and fibroids. These round to 6.2%, 8.7% and 7.8%; rounding agreement does not establish an identical domain, missing-data policy, CI method or source validation. Existing t-logit intervals are not represented as the NCHS publication interval procedure.

Variable-to-question map: ENDO/PCOS/UF describe ever-reported diagnoses; ENDOCURR/UFCURR current reported status; UFSONO reported ultrasound confirmation; ENDODIAG/UFDIAGNOS elapsed time since diagnosis, NOT symptom-to-diagnosis delay; ENDOLIM/UFLIMIT functional limitation; treatment fields reported care, not treatment effectiveness. AGER, HISPRACE2, USUALCAR and MED_COST need coding, routing and time-frame review. Use WGT2022_2023 with VEST and VECL; preserve the full survey design for subpopulation estimation.

Investigate disease → symptoms → access/opportunity → recognition/testing → diagnosis → reporting separately for each condition. The transitions are hypotheses unless measured. Current access cannot automatically explain a lifetime diagnosis. Different subgroup directions do not establish either a universal cause or wholly independent causes. Condition-specific external validation and authorized symptom-to-diagnosis evidence are needed for underdiagnosis or delay claims.

## 8. Claim transitions and reopening
Source discovery, file acquisition, admissible measurement, descriptive reproduction, mechanism support, causal identification, action authorization and sustained benefit are separate dimensions—not a single confidence score. A legitimate descriptive result need not become causal to be useful. Method selection remains human-controlled and separate from privacy or tenant permissions.

Bind claims to exact source and analysis versions. A period, definition, source value, eligibility rule or harm change creates a review event. Preserve the old claim, explain the conflict, identify every downstream dependent claim/action, and request a new scoped decision. Do not silently overwrite a baseline or turn textual reviewer names and checkboxes into independent review.

Review records need authenticated identity, actual source and analysis revision, scope, findings, dissent and disposition. Human authority and field evidence are required before operational action or outcome closure. Missing evidence should create an actionable investigation assignment, not an invented zero or an automatic ban on exploratory work.

## 9. Ordered tests and simulations
1. Validate source bytes, retrieval failures, query scope, header/row periods, eligibility, definitions and completeness.
2. Reproduce official descriptive targets with exact inputs and appropriate survey/registry methods; separately record code replay and independent reproduction.
3. Test known-truth measurement scenarios: denominator substitution, stage missingness, diagnosis opportunity, age composition, source duplication, spatial/temporal dependence, invalid pooling and improved average with subgroup harm.
4. For Monte Carlo work, prespecify data-generating assumptions, plausible ranges, seeds, estimands and metrics: bias, coverage, false attribution, false closure, detection failure and reviewer burden. Synthetic truth is not evidence of the real mechanism.
5. Test added value against competent existing practice with matched evidence, time and resources, independent evaluators and acceptable null/adverse findings.
6. Only then conduct an authorized implementation experiment with a valid comparator, fidelity, benefit/harm, cost, equity and follow-up.

Engineering safety tests continue throughout. Scientific simulation/calibration is not evidence of clinical effectiveness. Twelve coverage families remain tracked: source/time; meaning; missingness; provenance; exact reproduction; survey design; statistical robustness; simulation validity; scientific comparison; operational continuity; equity/implementation; reopening/sustainment. 'Complete' means adequate coverage for a defined decision with explicit residual uncertainty, not all possible mechanisms known.

## 10. Sustainable operations and release gates
Use source-release cadence rather than constant full downloads. Proposed low-cost metadata checks and full refresh on meaningful change require an approved operator and budget. Keep raw-content and semantic hashes separate so banner changes do not masquerade as epidemiologic change. Bound requests, redirects, retries, timeouts and storage; honor provider terms and do not route around access restrictions.

Jobs need stable source/content/parser/measure identities, idempotency, locks, atomic receipts, partial-batch handling, retry exhaustion and a recoverable queue. Reuse approved DIS persistence; separate public-source and protected-record zones, role/tenant access, revocation and secrets. No public CI artifact may become a destination for protected operational or experiential records.

Retain accepted original bytes, code, dependencies, analysis plan, full results, reviews and lineage in a durable archive with tested restore and retention policy. The inspected GitHub artifact expires November 21, 2026; a 14-day artifact is not long-term sustainability. Rebuild a complete accepted run in a clean environment; do not rely on a successful notebook session.

Monitor source coverage, semantic drift, unresolved high-impact discrepancies, stale downstream claims, failed reproductions, review backlog, cost per accepted run, harms, outcome follow-up and source retirement. Set numerical service levels from an operational baseline and owner agreement, not invented targets. Exercise outage, malformed data, revision mismatch, partial write, duplicate event, restart, revoke, restore, reviewer absence and budget exhaustion.

| Gate | Closure evidence | State |
|---|---|---|
| G0 Architecture | Scope, records, reuse, owners, exclusions, risks and acceptance matrix | Specified; independent agreement open |
| G1 Evidence admission | Original bytes, exact window/scope/denominator, completeness and reviewer adjudication | Eight originals checked; methodological and source-channel gaps open |
| G2 Reproduction | Exact original inputs, code, estimates/uncertainty and discrepancy decisions | Partially progressed; age boundary and prior coefficients not fully adjudicated |
| G3 Mechanisms | Rival predictions, discriminating evidence and valid identification where causal | Candidate pathways only |
| G4 Full workflow | Authorized source change → durable evidence → review/reopen → case/history; recovery | Not witnessed end to end |
| G5 Implementation | Authorized site, capacity, comparator, safety, benefit/harm and evaluation | Not established |
| G6 Sustained service | Repeated accepted cycles, affordable resources, maintained ownership and restore | Not established |

Required roles: source steward; measurement/registry lead; survey statistician; causal-methods reviewer; implementation lead; affected-community reviewer; service maintainer. These are proposed roles, not involuntary assignments to Dartmouth or any other organization. Document responsible people, available effort, successor, funding and escalation before service acceptance. Reassess historic definitions over the prior decade, the day after a successful release and future maintenance/transfer over the next decade.

## 11. Proof, next action and limits
The immediate next acceptance target is a complete retained-source-to-reviewed-claim workflow with one public source and a real authorized reviewer, followed by recurrence and restore. Complete the NCI percentage-denominator rule, NSFG eligibility/CI reproduction and original national inputs before stronger scientific claims. Route each missing item to an owner, discriminating test and closure receipt.

New file-admission checks are connected to the existing workflow, not a new service. They preserve existing analysis code and the prior readiness record in a separate verified_readiness.json. A changed file, unexpected path/format or wrong revision cannot be promoted as accepted input. A missing source remains visible and does not erase unrelated study evidence.

Pushed code, exact-head CI, independent review, merge, deployment, actual exchange and beneficiary outcomes remain separate. No new recurring schedule, production promotion, clinical action, external email or partner commitment was initiated by this architecture work. Do not represent these exploratory findings as proof that a named organization has used invalid methods.

## Primary references
- NCI State Cancer Profiles incidence-table methods: https://statecancerprofiles.cancer.gov/help/about/incidence_rates.html
- NCI source data-use restrictions: https://statecancerprofiles.cancer.gov/help/data-use.html
- NCI Texas colorectal late-stage source window: https://statecancerprofiles.cancer.gov/incidencerates/index.php?age=001&areatype=county&cancer=020&race=00&ruralurban=0&sex=0&stage=211&statefips=48&type=incd
- NCHS Health E-Stat 121, July 2026: https://www.cdc.gov/nchs/data/hestat/hestat121.htm
- NSFG female recode specifications, page 1: https://www.cdc.gov/nchs/data/nsfg/recodespecs/2022-2023-NSFG-FemResp-RecodeSpecs.pdf
- NSFG design and weights: https://www.cdc.gov/nchs/data/nsfg/varest/2022-2023-NSFG-DesignandWeightVariables.pdf
- Downloaded original-source run: https://github.com/mrterryflood-ui/integrated-implementation-intelligence/actions/runs/42411186460

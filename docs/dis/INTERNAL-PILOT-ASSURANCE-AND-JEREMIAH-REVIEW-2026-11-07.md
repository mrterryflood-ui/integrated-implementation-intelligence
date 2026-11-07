# DIS × RPLICE | Internal pilot-by-pilot assurance and Jeremiah review readiness
**Version:** 0.1 internal exercise; 2026-11-07  
**Authority:** DIS governing baseline, MAP–GAP, human-selected RPLICE methods.  
**Audience:** Internal research team only. **No external outreach, submission, patient recruitment, or intervention approval.**

## Mission and evidence classes
Mission: establish whether DIS–RPLICE improves the *appropriateness* of problem identification and intervention selection, not merely the fidelity of executing a chosen action. Compare Designed, Operational, Experienced realities, and independently examine alternative explanations. Every claim must carry a source, instrument, geography, population, observation period, status and reviewer. Use labels VERIFIED / SOURCE-REPORTED / INFERRED / SYNTHETIC / UNKNOWN / CONTRADICTED. Never infer a health benefit from a green CI job.

**Baseline engineering receipt:** GitHub main `f7a81299c8de77969b08a97b5e4b5f10e7667eaf`; PRs #62–63 merged; exact-head typecheck, automated tests, candidate browser and public mobile checks passed. This does not prove a signed-in real database save, field efficacy, research superiority or causal impact.

## Pilot inventory: keep scientific units distinct
| ID | Study or component | Actual state and research question | Decision |
|---|---|---|---|
| A | **ChainWeb / DIS–RPLICE methods comparison** | Study protocol and casebook exist. Does it identify critical problems, avoid erroneous causal attribution, and select context-specific actions better than competent contemporary implementation science? No prospective blinded superiority result. | GO: freeze casebook, comparator and rubric; HOLD superiority claims |
| B1 | **Colorectal cancer: Hinds/Jackson–Harris/Houston–Colorado and national** | Source-reported historical Hinds and Harris late-stage county aggregates. Need matched all-stage/late-stage measures, uncertainty, population definitions, time series, diagnostic follow-through, context. No causal intervention evaluation. | GO: descriptive/source audit; HOLD causal claims |
| B2 | **Lung cancer** | Distinct condition, separate incidence, stage and mortality constructs; national/state/county source and ascertainment alignment not complete in this workstream. No colorectal extrapolation. | CONDITIONAL: source-qualified protocol |
| B3 | **Female breast cancer** | Distinct sex/eligibility/stage definitions and detection pathways; do not reuse colorectal numerator, denominator or causal mechanism. | CONDITIONAL: source-qualified protocol |
| B4 | **Endometriosis** | Different disease ascertainment, diagnostic latency, symptoms, clinical pathways and denominator; no reliable comparable 50-state longitudinal outcomes established. | HOLD cross-state effect claims; GO methods feasibility |
| B5 | **PCOS** | Condition definitions, diagnostic practice and sampling differ; NSFG or survey estimates require design weights and measurement review. | HOLD comparative outcome claims; GO feasibility |
| B6 | **Uterine fibroids** | Condition and procedure coding, asymptomatic disease, diagnosis and treatment vary; denominator and sampling require review. | HOLD comparative outcome claims; GO feasibility |
| C | **HerHealth Bridge: pregnancy-related hypertension/postpartum care continuity** | Separate sponsored review/application concept. Measure understandable information, follow-up confirmation, clinical continuity and safety. No live benefit demonstrated by the DIS cancer pilot. Jeremiah's sponsorship of this concept does not transfer automatically to Study B. | Separate review track; do not conflate |
| D | **Gun-violence / veteran-suicide prevention and National Guard prevention concepts** | Dartmouth funding-collaboration domains, including prevention implementation; no verified common dataset or prospective evaluation in this code release. Distinct safety and governance review. | Separate scoping tracks; not automatically part of six-condition study |

**Important:** B1–B6 are condition modules of an exploratory epidemiologic comparison, **not six completed clinical trials**. A is a methodology study, not a cancer treatment. C and D are separately scoped opportunities/concepts, not completed studies.

## Common study protocol: ten required steps
1. ORIENT: specific research question, target beneficiary, outcome construct, intended end state, jurisdiction, time horizon and decision owner.
2. AUDIT: original authoritative sources, retrieval date, release/version, denominator, numerator, eligibility, stage/diagnosis definition, uncertainty, suppression and missingness. Separate independent corroboration from multiple fields in one source.
3. MAP: Designed (policies/guidelines), Operational (services/records/capacity), Experienced (authorized real stakeholder data); identify mechanisms and constraints, not fabricated interviews.
4. GAP: compare baseline with intended and experienced outcomes, stratify equity, register competing explanations and evidence that would disconfirm each.
5. ALIGN: choose mechanism-specific intervention **only if** plausible, feasible, reversible and authorized. Compare no-change and alternative actions; cost, unintended consequences, spillover and sustainment.
6. ACT: owner, consent/data-use authority, resources, protocol, fidelity core functions and allowed local adaptations, stop rules, monitoring cadence.
7. TRACK: reach, adoption, fidelity, timeliness, burden, costs, subgroup benefit and harm, downstream outcome with defensible follow-up window. Process completion != clinical effect.
8. ADAPT: test whether new evidence overturns the theory of change; preserve historical decisions and independent dissent.
9. SHARE: only human-approved, scope-limited scientific communication with evidence ledger, limitations and unresolved gates.
10. RE-MAP: post-success and ten-year durability, policy/resource handoffs, reversibility, context change triggers.

## Internal falsification cases (synthetic unless explicitly source-reported)
| Case | Deliberately wrong conclusion | Required detection and corrective response |
|---|---|---|
| F01 | Equal 63.3%/63.4% late-stage shares imply equal colorectal disease burden | Reject: conditional stage share vs age-adjusted late-stage incidence and count are different constructs |
| F02 | Hinds 76 and Harris 1,044 are comparable rates | Reject: average annual case counts lack population adjustment |
| F03 | Combine Texas all-stage 2019–2023 and late-stage 2018–2022 into one burden estimate | Reject incompatible period and construct; require pinned source releases |
| F04 | Colorado 2019–2023 may be pooled with Hinds 2018–2022 | Reject vintage mismatch; maintain UNKNOWN until aligned |
| F05 | A county 5-year snapshot establishes DID causal effect | Reject missing time panel, intervention timing, valid controls and pretrends |
| F06 | Higher screening completion means fewer incident cancers | Reject outcome substitution; require appropriate disease incidence, follow-up and latency |
| F07 | Better overall result while underserved subgroup worsens is equitable success | Report both, inspect absolute/relative disparity, denominators and harm; no unqualified success |
| F08 | Two sites with same headline measure should receive the same awareness campaign | Require competing mechanisms: invitation vs diagnostic follow-up vs access/capacity; choose only evidence-matched action |
| F09 | An EPA ECHO facility point proves individual carcinogenic exposure | Reject geographic proximity as dose, temporality or causation |
| F10 | A receipt with string "false" proves fidelity and outcome closure | Reject nonboolean flags, self-report and missing independent witness |
| F11 | A source DOI appears twice, providing independent replication | Deduplicate provenance; require independent study and methods |
| F12 | Breast/lung/endometriosis inherit colorectal source assumptions | Reject cross-condition leakage; condition-specific ontology and review |
| F13 | A new gap not in the six-item handoff list can be ignored | **OPEN CODE GAP:** current handoff prioritizes six fixed IDs; design dynamic, evidence-linked, tenant-safe gap transfer |
| F14 | Research case saved automatically with pasted external study or PHI | Reject; existing handoff intentionally transfers only curated public aggregate and explicit user-approved case creation |
| F15 | A CI browser denial test proves a real signed-in, RLS-protected database save | **OPEN LIVE GATE:** witness signed-in create, baseline event, update/version conflict, history read and tenant isolation |
| F16 | A selected RPLICE method means the specialist executed it | Reject; require separate tool receipt and reviewer-selected method |
| F17 | Program fidelity equals intervention appropriateness | Require independent problem-selection and downstream benefit checks; a perfectly delivered wrong intervention is not success |
| F18 | An outcome improved once and therefore will endure | Require repeated observations, costs, maintenance owner, adaptation triggers and harm monitoring |

## Pilot-specific end points and causal constraints
- **A methods comparison:** blinded cases; same evidence packets and reviewer expertise; comparator = competent CFIR/PRISM/RE-AIM/FRAME-IS use; prespecified primary endpoints (critical problem identification, erroneous causal attribution, context-fit of proposed action), adjudication rubric, inter-rater reliability, training/familiarity and contamination control; prospective, not a post hoc victory declaration.
- **B1 colorectal:** distinguish underlying incidence, detection, stage classification, screening eligibility, abnormal-result follow-up, diagnostic resolution, treatment and mortality. County vs city and clinical catchment mismatch cannot be erased. DID only if intervention dates and longitudinal comparable controls exist.
- **B2 lung:** distinguish smoking/exposure-related incidence, eligibility-based lung screening, diagnosis, stage and mortality; avoid environmental point-source causal leaps.
- **B3 breast:** sex/age/eligibility-specific screening and stage, diagnostic follow-up and treatment pathways; distinguish detection shifts from underlying incidence.
- **B4 endometriosis:** diagnosis delay and patient-reported burden need validated instruments and clear symptomatic/eligible denominator; absence of coded diagnosis does not mean absence of disease.
- **B5 PCOS:** use original diagnostic criteria, ascertainment and design-weighted survey methods; distinguish prevalence, identification and treatment continuity.
- **B6 fibroids:** distinguish prevalence, symptomatic burden, diagnostic imaging and procedure utilization; surgery is not a prevalence denominator.
- **C HerHealth:** pregnancy-related hypertension and postpartum continuity; separate patient understanding, confirmed clinical follow-up, blood-pressure safety and longitudinal outcomes; clinical oversight before intervention.
- **D violence/suicide:** incident ascertainment, exposure to prevention, service reach, harm and ethics/privacy governance; no unapproved person-level risk inference or automatic action.

## Verified findings versus unexecuted exercises
**Engineering verified:** baseline branch merged and post-merge automated checks passed. Negative tests exist for condition leakage, unknown DID construct, malformed receipt flags, duplicated source lineage and Colorado vintage mismatch.  
**Scientific source-reported:** Hinds/Harris NCI county 2018–2022 late-stage percentage 63.3%/63.4%, age-adjusted late-stage rate 30.4/23.3, annual counts 76/1,044. These are not causal effects and require independent re-extraction for publication.  
**Not yet witnessed:** all F01–F18 end-to-end against real authorized records; all six B condition-specific full pipelines; signed-in case persistence; independent human council adjudication; true causal design; partner consent; pilot delivery; measured equity outcomes.

## Gaps and acceptance owners
| Priority | Gap/root cause hypothesis | Responsible review role | Closure proof |
|---|---|---|---|
| P0 | Case handoff is fixed to colorectal and six prioritized gap IDs | DIS engineering + measurement owner | Dynamic condition-aware, provenance-linked gap record survives create/reopen/edit; regression for an unforeseen gap |
| P0 | Corrective receipt audit not an authenticated outcome adjudication workflow | Implementation/evaluation lead | Authorized case-linked evidence, independent reviewer identity, audit event, verified vs disputed closure states |
| P0 | No signed-in production case create/read/update witness | Authorized workspace owner + security reviewer | Actual event IDs, version history and cross-tenant denial, without exposing secrets or PHI |
| P0 | Current comparative source windows are not fully harmonized | Registry epidemiologist | Independent two-reviewer source ledger for each cell, version and uncertainty |
| P1 | Condition-agnostic claim not established for six conditions | Methods and disease specialists | Separate instrument/denominator ontology and synthetic negative tests for each |
| P1 | Equity harms and distributional outcomes not first-class closure conditions | Equity measurement lead + community reviewer | Subgroup-appropriate denominator, missingness/suppression review, benefit/harm and disparity tests |
| P1 | No demonstrated incremental benefit of ChainWeb | Independent methods/statistics reviewers | Frozen, blinded prospective comparative study with adjudicated endpoints |
| P1 | No intervention outcome or sustainment observation | Authorized pilot owner | Repeated source-qualified observations, fidelity, balancing measures, maintenance and cost receipts |

## Jeremiah review package — assemble AFTER internal exercise
Separate documents: (1) 2-page decision brief, (2) Study A protocol and blinded casebook/rubric, (3) Study B six-condition methods and measurement/source ledger, (4) reproducibility/test and source-vintage report, (5) gaps and independent dissent log, (6) proposed team/governance/data-use/authorship/funding questions, (7) optional HerHealth Bridge track as **separate** sponsored work. Do not imply Jeremiah approved Study B or A. The requested role is scientific critique, prioritization, feasibility and collaborator advice, not ratification of clinical effectiveness. No email or attachments sent under this exercise.

## Decision
**GO** internal protocol and synthetic regression; **CONDITIONAL** original-source harmonization and live authorized case verification; **HOLD** causal/superiority/clinical-impact claims, clinical rollout, multi-condition transfer, external dissemination. This is an internal working document; its existence is not proof that any outstanding task was executed.

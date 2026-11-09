# DIS–RPLICE: Early Recognition, Proportionate Action, and Diagnostic Closure
**Internal research protocol v0.2 — updated November 8, 2026 (America/Chicago).** Prepared for independent specification review and local clinical acceptance. No patient implementation or clinical-effect acceptance has occurred. This is not an autonomous clinical pathway.

## Scientific question
When an actionable risk or symptom signal first becomes available, how much avoidable delay and harm arises before appropriate evaluation, support, diagnostic resolution and follow-through? Does a guideline-concordant, clinician-governed, closed-loop pathway improve meaningful outcomes compared with competent existing care without increasing unnecessary tests, overdiagnosis, inequity or workload?

This extends the three-study measurement observatory into an action-and-outcomes investigation. The scientific claim is *not* that normalization proves a causal mechanism, that all late-stage cancer is preventable, or that the system has demonstrated clinical benefit.

## Source-grounded endometriosis case
- Current U.S. guidance: ACOG Clinical Practice Guideline No. 11, March 2026 (PMID 41712950; DOI 10.1097/AOG.0000000000006181), covers clinical, imaging and surgical evaluation in reproductive-aged adults and adolescents. ACOG's February 20, 2026 announcement supports clinician-made presumptive diagnosis and appropriate empiric care while evaluation continues. This update does not make surgical confirmation a prerequisite for every care action. The guideline abstract and official announcement were retrieved; the full ACOG guideline returned an access restriction and requires qualified review before local adoption.[C1,C2]
- A 2024 scoping review (PMID 39418593; DOI 10.1080/07399332.2024.2413056) reported average diagnostic delay of 6.8 years across included studies, range 1.5–11.4; these are heterogeneous observational populations and definitions.
- A 2025 systematic review (PMID 39373298; DOI 10.1111/1471-0528.17973) reported 0.3–12 years across 17 studies; time origins and diagnostic endpoints vary.
- ESHRE 2022 guideline (DOI 10.1093/hropen/hoac009) recommends ultrasound or MRI in work-up while noting negative imaging does not rule out endometriosis, especially superficial disease; biomarker testing is not recommended for diagnosis; laparoscopy may be considered where imaging is negative or empirical treatment fails/is inappropriate.
- NICE NG73, updated 2024, https://www.nice.org.uk/guidance/ng73/chapter/Recommendations , recommends investigation/referral alongside initial pharmacological management and referral for persistent/recurrent symptoms or functional impact; normal imaging does not exclude disease.
These sources do not authorize DIS to diagnose, order imaging, prescribe or decide surgery. Individual circumstances and differential diagnoses remain with qualified clinicians.

## Two interdependent mechanisms
1. **Underlying phenomenon:** disease occurrence, progression, symptom burden, risk and natural history.
2. **Recognition-and-response process:** first symptom/signal → patient interpretation and ability to seek help → clinical presentation → recognition and differential → guideline-appropriate investigation → working diagnosis → symptom management and referral → completion and reassessment → confirmed diagnosis where needed → functional outcomes.

A delay can occur in any transition. Different causes require different corrections; some delays may be appropriate watchful waiting or diagnostic uncertainty. Do not equate all time elapsed with preventable harm.

## Event contract for an authorized, privacy-protected implementation pilot
For each event, record pseudonymous case ID, source/consent/authorization, role, event type, event timestamp and capture timestamp, symptoms and functional impact where permitted, guideline version, differential status, action offered, action accepted/declined, completion, reason for deferral, follow-up due date, ownership, accessibility and preference constraints, and outcome evidence. Preserve patient-reported onset separately from first recorded clinical contact; missing onset is unknown, not zero.

Time intervals (prespecify definitions and censoring):
- Symptom onset → first presentation (recall-sensitive)
- First presentation → documented consideration of relevant differential
- First presentation → first guideline-concordant evaluation
- First presentation → appropriate symptom relief or other initial action
- Abnormal/concerning finding → indicated referral and completed evaluation
- First presentation → working diagnosis and, separately, confirmed diagnosis where appropriate
- Unresolved symptoms → re-evaluation, plus loss to follow-up
- Intervention → patient-reported pain/function, safety, satisfaction and costs

Denominators: all eligible symptomatic presentations; those meeting prespecified escalation criteria; referred patients; completed referrals; people with ongoing symptoms; and those ultimately diagnosed. Do not restrict delay estimates only to confirmed cases without evaluating verification/selection bias. Report interval censoring, left truncation, missing data, competing diagnoses, and adverse events.

## Proposed non-autonomous clinical decision-support states
SIGNAL_RECORDED → CLINICAL_REVIEW_NEEDED → EVALUATION_IN_PROGRESS → ACTION_AND_FOLLOWUP_PLANNED → COMPLETION_VERIFICATION_PENDING → RESOLVED / REASSESS / LOST_TO_FOLLOWUP / DECLINED / TRANSFER_PENDING.
Only authorized clinicians select tests, treatments, urgency, referral and disposition. Patient choices, contraindications and access barriers must be recorded without interpreting refusal as failure. Never use a negative ultrasound to automatically close suspected endometriosis. Emergency presentations require existing clinical triage, not this research workflow.

`RESOLVED` requires an explicit scope: an action completed, a diagnostic question resolved, or a clinical episode resolved. These are separate fields. A closed referral task or successful export does not establish clinical resolution. A transfer remains pending until an authorized receiving party accepts ownership and the required result or follow-up evidence is reconciled. Declining an offered action is a recorded patient decision; it is not coded as completed diagnostic evaluation or observed harm. Record reassessment and contact preferences without coercion.

## Mechanism discrimination
| Candidate mechanism | Rival | Discriminating evidence |
|---|---|---|
| Symptoms not recognized | Symptoms initially nonspecific or alternative diagnosis more likely | Blinded chart review against contemporaneous guidance and actual symptom chronology |
| Testing access delays | Appropriate testing deferred due to clinical assessment or patient preference | Indication-specific referral and scheduling timeline with documented decision rationale |
| Negative imaging leads to premature closure | Appropriate negative imaging reduces probability of specific disease subtype | Follow-up and re-evaluation of persistent symptoms, imaging expertise and subsequent adjudication |
| Repeated referrals fail to close | Care completed outside the observable system | Cross-system referral reconciliation with permission and patient confirmation |
| Delayed treatment worsens function | Disease severity or confounding affects both delay and outcomes | Longitudinal validated function measures, credible comparator, prespecified adjustment and sensitivity |
| More testing improves outcomes | Increased false positives, invasive procedures, burden and inequity | Compare net benefit, appropriate action, harms, cost and patient experience—not test counts |

## Study designs, in order
A. Retrospective process map with consented/authorized records and lived-experience triangulation; separately report what is designed, operational and experienced.
B. Independent guideline-concordance adjudication and chart review; assess inter-rater reliability and ascertainment of onset and diagnosis.
C. Prospective feasibility with human-reviewed prompts and closed-loop follow-up; measure reach, burden, completion and safety. Do not automatically order or recommend individual clinical interventions.
D. Controlled comparative implementation (stepped-wedge, cluster trial, or credible quasi-experiment only after feasibility and assumptions review), with independent outcome and equity evaluation.
E. Transfer tests for colorectal screening/diagnostic closure, lung and breast cancer, PCOS and fibroids; reuse the **process investigation contract**, not disease-specific thresholds or interventions.

## Evaluation endpoints and safety
The comparative primary endpoint is time from the prespecified eligible index event to *independently verified appropriate completed action*. Each track must lock its index event, action definition, follow-up horizon and time-to-event estimand before enrollment; do not choose them after viewing results. Patient-reported function is a separately prespecified secondary endpoint. Other secondary endpoints include completion by a fixed horizon, time to working/confirmed diagnosis, referral closure, repeated unproductive visits, pain, patient trust, missed alternative diagnoses, overtesting, avoidable procedures, time burden, resource costs and differential impact by age, race/ethnicity, insurance, disability and geography where lawful and statistically appropriate.
Track sensitivity, specificity, positive predictive value and calibration only for a clearly defined prediction target with verified labels; do not turn a mechanism-hypothesis confidence rating into a diagnostic probability. Evaluate safety and benefit on held-out sites and periods.

## Sustainability and authority
Integrate into existing DIS casework, versioned evidence and source-change ledger, HerHealth patient journey only after scoped authorization, and human-selected RPLICE methods. No new disconnected service. Clinical practice guidance requires local qualified governance, legal/privacy review, participant consent where applicable, institutional review/IRB determination, approved data-use agreements, training, alert-fatigue monitoring, and rollback. No external messages, clinical decision automation, publication, or production release without owner approval.

## Evidence state
GUIDELINE-SUPPORTED: early clinical evaluation and appropriate management can proceed without universal surgical confirmation.
OBSERVED IN LITERATURE: heterogeneous multi-year diagnostic delays.
HYPOTHESIS: a closed-loop, guideline-concordant early-action workflow can reduce avoidable delays and improve function.
UNTESTED: DIS's incremental benefit, net clinical effect, site transferability, predictive accuracy and cost-effectiveness.

## v0.2: Two initial clinical evaluation tracks

The purpose is to identify and reduce avoidable delay from the first actionable risk or symptom signal through verified appropriate care. The initial tracks reuse the event and accountability contract; they retain different clinical rules, eligibility, endpoints and denominator definitions. HerHealth and mental-health support remain supporting components where locally authorized, with patient preference and confidentiality preserved. A symptom narrative is evidence of lived experience, not automatic proof of a disease or of a clinician's error.

| Decision | CRC screening and diagnostic follow-through | Suspected endometriosis / HerHealth |
|---|---|---|
| Entry populations | Separate (a) asymptomatic people assessed as eligible for a chosen screening guideline; (b) people with symptoms or higher-risk features requiring clinician assessment; (c) people with an abnormal screening result. Never use screening eligibility to dismiss symptoms. | Consecutive eligible presentations with symptoms suggestive of endometriosis, including people not ultimately diagnosed. Adolescents require age-appropriate clinical and consent arrangements. |
| First usable signal | Retain eligibility recognition, patient-reported symptom onset, first recorded presentation, specimen collection, result finalization and result availability to the responsible team separately. | Retain patient-reported onset and its uncertainty, first recorded presentation, functional impact and first documented clinical consideration separately. |
| Initial rule source | USPSTF 2021 applies to asymptomatic average-risk adults, with screening from 45 through 75 and selective screening at 76–85. ACS 2026 provides a newer additional guideline; the local clinical owner must select and version the applicable rule rather than mix recommendations silently.[C3,C4] | ACOG 2026 provides the current U.S. diagnostic framework. NICE NG73 offers corroborating guidance: assessment and appropriate management may proceed in parallel; normal ultrasound does not exclude endometriosis.[C1,C2,C5] |
| Bounded initial measurement pathway | An abnormal noncolonoscopy screening result through appropriate completed colonoscopy and communicated findings. ACS 2026 specifies timely follow-up, preferably within six months of the initial test. Six months is an outer preferred benchmark, not a universal safe waiting period or substitute for patient-specific urgency. Keep this guideline clock separate from process intervals beginning when a result became available to the responsible team.[C4] | First eligible clinical presentation through independently adjudicated appropriate completed evaluation or initial care action, with ongoing symptom/function reassessment. Working diagnosis and surgical/histologic confirmation remain different endpoints. |
| Failure to avoid | A mailed kit, positive result, referral order, appointment booking or repeat negative stool test cannot by itself verify completion of the indicated diagnostic evaluation. Symptoms and urgent concerns follow the site's clinical triage. | Do not require surgery before any appropriate care, let a normal scan automatically close persistent symptoms, or label all pelvic pain as endometriosis. Preserve differential diagnoses and patient goals. |
| Verified action closure | Source-linked procedure/completion evidence, documented interpretation and communication, and an accountable next action where indicated. An outside-system procedure remains unverified until reconciled through authorized evidence. | Evidence that the clinician-selected action actually occurred, patient communication, a defined reassessment plan and separately recorded change in function/symptoms. Persistent symptoms reopen review under local clinical governance. |

### Designed, operational and experienced realities

The designed pathway assigns an owner, appropriate urgency and a closure rule. The operational map must then verify result routing, referral acceptance, appointment capacity, authorization steps, scheduling, preparation support, transport, records exchange and coverage during absences. The experienced map asks whether the person understood the plan, could afford and reach it, felt heard, and could obtain help after a failed handoff. A patient-reported barrier and an administrative timestamp should be reconciled, not used to erase one another.

Before attributing delay to fragmentation, consider competing explanations: clinically appropriate observation; unresolved differential diagnosis; disease biology; patient choice after an accessible offer; insufficient capacity; incomplete documentation; care completed elsewhere; measurement error; and changing eligibility or case mix. The same number of days can represent different processes. Record multiple contributing barriers where supported, along with evidence source and certainty. Do not turn a provisional barrier code into a causal finding.

### Minimum implementation record

Use the existing governed casework and event history after authorization. A patient-level pilot requires a separately approved data boundary; the current public research workspace must not receive clinical identifiers. The proposed minimal event dictionary is [clinical_pathway_event_dictionary.csv](clinical-pathway-evaluation/clinical_pathway_event_dictionary.csv). It defines fields, permissible missing states and verification evidence, not a new production clinical database.

Clinical owner, operational owner and data steward must be named and accept their roles before enrollment. Every open action requires a responsible person, a due date derived from the locally approved clinical rule, evidence needed for completion, and a covering role. A care team may use its established EHR/registry while DIS supports aggregate investigation and review. Existing product casework must not be described as an accepted clinical record system merely because engineering tests pass.

Verification that an action occurred and independent adjudication that it was appropriate are different records. An authorized staff member may reconcile a procedure report or appointment outcome. A qualified adjudicator, independent of the originating care decision where feasible and with conflicts recorded, applies the frozen appropriateness rubric. The primary endpoint requires both completion evidence and that adjudication, plus the prespecified communication or follow-through components. Capture reviewer identity, rule version, decision, reason, disagreement and resolution; an administrative checkbox cannot supply clinical appropriateness.

**Current implementation boundary:** the dedicated typed research-case builder is CRC-specific. Its retained CRC baseline must not be attached to an endometriosis case. The endometriosis specification can be reviewed now; software support for an authorized endometriosis clinical workflow remains unimplemented and unaccepted. Generic deliberation features do not establish condition-specific clinical safety. See `apps/dis-platform/lib/research-workflow.ts` at the accepted integration revision.

## Evaluation plan and estimands

### Phase A: local diagnosis and adjudicator calibration

Map an authorized consecutive case series, including unresolved cases and care received outside the observable system where authorized. Compare time-stamped records with patient and staff accounts. An independent qualified clinical pair first adjudicates action appropriateness using a frozen guideline and structured rubric; document disagreements and their resolution. Estimate missingness and inter-rater agreement with uncertainty. A representative may help interpret lived experience but does not replace clinical adjudication.

Lock the primary endpoint, eligibility, time origin, follow-up horizon, clinically worthwhile improvement, analysis unit, feasible accrual and safety limits **before** evaluating a comparative intervention. These choices require local baseline and capacity evidence; no numerical power claim or final sample size is currently justified. The 24-slot methodological decision register is a separate study and is not a clinical sample-size calculation.

### Phase B: prospective feasibility

Enroll only after local authorization. Use clinician-reviewed prompts within existing care. Measure eligible people reached, action completion verified, unverified transfers, unresolved symptoms, due actions without an owner, workload minutes, patient burden, alert burden and safety. Include patient goals and a suitable validated function measure for the endometriosis track; record instrument version, language, licensing where applicable and missingness. Rehearse failed referrals, staff absence, wrong recipient, wrong version and rollback before clinical use.

Report the full denominator flow: eligible → offered → accepted → initiated → completed → independently verified → followed up. People who decline, transfer, die, lose contact or remain unresolved retain explicit categories; do not delete them to improve completion. Distinguish administrative censoring, competing events and unknown outcomes. Report time-to-completion with the prespecified approach to each competing event; the median among completers alone is not an estimate for the eligible population.

Transfer alone does not preclude an appropriate action occurring elsewhere and must not automatically become a competing clinical event. Seek authorized follow-up evidence. If observation ends, use the prespecified censoring approach and assess informative missingness rather than silently count a failure or successful closure. Link every action to its episode and clinical question; keep their closure statuses separate when parallel actions are in progress. Record when eligibility became knowable separately from when it was actually assessed.

### Phase C: comparative decision and clinical evaluation

The counterfactual is a specified, competently delivered existing-care process, with its own resources and fidelity measured. Use randomization where feasible or a justified controlled design with a prespecified analysis. Additional staffing, protected scheduling capacity, outreach intensity and extra contact must be balanced or identified as intervention components. Blind outcome adjudication where feasible and measure spillover. Do not attribute the benefit of an entire package to its navigation component or to DIS reasoning alone.

The clinical primary endpoint is time from the locked track-specific eligible index event to **independently verified appropriate completed action** in the eligible population, using the prespecified time-to-event estimand and horizon. Completion by a fixed horizon is secondary. Report clinical resolution, patient-reported function, missed alternative diagnoses, complications, unnecessary testing, workload, patient time and cost separately. Report subgroup reach and outcomes with denominators and uncertainty; small strata require privacy-preserving interpretation, not unsupported rankings. A favorable process measure does not by itself establish reduced late-stage disease, mortality or cost-effectiveness.

## Acceptance, resources and stop rules

The machine-readable status is [clinical_pathway_acceptance.json](clinical-pathway-evaluation/clinical_pathway_acceptance.json). Unsigned fields remain null. The current allowable step is specification review and local protocol preparation. Actual clinical enrollment, clinical use and effectiveness acceptance are not authorized by this document.

| Gate | Accountable role to be accepted | Required evidence | Current disposition |
|---|---|---|---|
| Specification correctness | Independent clinical reviewers and patient/community representative | Current full guidance reviewed; differential, urgency, accessibility and closure criteria reconciled; recorded dissent resolved | Prepared for independent review; no qualified clinical approval |
| Local authority and data boundary | Site clinical lead, institutional research/privacy authority, data steward | Site acceptance; IRB/research or quality-improvement determination; consent/waiver and data-use requirements; approved location, roles and retention | Not established |
| Capacity and ownership | Operational lead plus receiving services | Named owners and cover; actual diagnostic/referral capacity; funding and staff time; language/transport/access support; handoff acknowledgement | Not established |
| Measurement freeze | Independent methods lead and clinical adjudicators | Eligible denominator and time origin; locked comparator; validated instrument; analysis/censoring plan; acceptable reliability and sample-size rationale | Draft specification; local inputs and human acceptance absent |
| Workflow rehearsal | Clinical/operational lead and engineering verifier | Authorized representative end-to-end cases, failed-handoff recovery, access controls, audit trail, exact software revision and rollback witness | Engineering evidence is bounded; clinical rehearsal not executed |
| Feasibility release | Site clinical lead and independent safety reviewer | Above gates accepted; monitoring cadence; prospective safety/quality thresholds; stop and restart authority | Not accepted |
| Comparative clinical benefit | Independent outcome adjudicators and study oversight | Prespecified comparison, complete denominator, benefit and harms with uncertainty, patient experience, equity and sustainable resources | Not measured |
| Transfer and sustainment | Receiving site and operational owner | New-site calibration, ongoing staffing/budget, quarterly or risk-triggered review, source/guideline change monitoring and reacceptance | Not measured |

Immediately suspend the affected research-enabled action and route to the site's established clinical process for a misrouted result, unauthorized access, unowned urgent action, unsafe guidance, unexplained evidence loss, or a serious unexpected safety signal. Maintain appropriate care while investigating; do not turn off ordinary care. The local safety owner decides restart after corrective evidence and independent review. Numerical deterioration thresholds and monitoring frequency must be set from local baseline and capacity before enrollment. Guidance changes, drift in missingness, worsening backlog or disproportionate exclusion trigger re-mapping and a new decision.

### Resource and sequencing contract

Terry remains the project sponsor; this is not a clinical delegation. The first operational decision is to secure one willing clinical site and named clinical, operational, data and independent review leads. A role named in this protocol has not accepted an assignment. No partner, capacity, budget or appointment is represented as secured.

Sequence: (1) accept the research/engineering evidence within its scope; (2) populate and independently freeze the separate decision study; (3) obtain local clinical acceptance and run the pathway rehearsal; (4) assess feasibility; (5) decide whether the controlled clinical study is warranted. Local clinical preparation can proceed while denominator and method-effect questions remain unresolved, provided no unresolved ecological inference is used to direct individual care. Timeline commitments begin when owners, access and resources are accepted.

## v0.2 guidance references and retrieval limits

C1. American College of Obstetricians & Gynecologists' Committee on Clinical Practice Guidelines–Gynecology; Kaneshiro B, Kallen AN, Witkop CT. Diagnosis of Endometriosis. *Obstet Gynecol.* 2026;147(3):432-448. doi:[10.1097/AOG.0000000000006181](https://doi.org/10.1097/AOG.0000000000006181). [PubMed PMID 41712950](https://pubmed.ncbi.nlm.nih.gov/41712950/). Abstract and source identity verified; full guideline access restricted in this session.

C2. American College of Obstetricians & Gynecologists. ACOG publishes new endometriosis clinical guidance, aiming to shorten time to diagnosis and improve access to care. Published February 20, 2026. [Official announcement](https://www.acog.org/news/news-releases/2026/02/acog-publishes-new-endometriosis-clinical-guidance-aiming-shorten-time-diagnosis-improve-access-care). Retrieved from the search-indexed official page; direct open returned an access restriction. Used only for the stated general clinical-diagnosis principle.

C3. US Preventive Services Task Force. Colorectal cancer: screening. Published May 18, 2021. [Recommendation and practice considerations](https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/colorectal-cancer-screening). Direct official text retrieved November 8, 2026.

C4. Wolf AMD, Hoffman RM, Walter LC, et al. Colorectal cancer screening: an update to the American Cancer Society guideline, 2026. *CA Cancer J Clin.* Published online May 27, 2026. doi:[10.3322/caac.70083](https://doi.org/10.3322/caac.70083). Direct publisher full text retrieved November 8, 2026; recommendations and rationale checked. The locally selected guideline must account for its scope and exceptions.

C5. National Institute for Health and Care Excellence. Endometriosis: diagnosis and management. NG73. Recommendations 1.5.1–1.5.5, amended 2024. [Official guideline PDF](https://www.nice.org.uk/guidance/ng73/resources/endometriosis-diagnosis-and-managementpdf-1837632548293). Relevant current official PDF text retrieved through search; direct recommendations page returned an access restriction. Local reviewers must review the complete applicable version.

These primary-source checks do not constitute Google Scholar verification, qualified clinical approval or a legal/privacy determination. References identify evidence; they do not confer clinical authority on the platform.

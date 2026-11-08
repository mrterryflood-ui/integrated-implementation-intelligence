# DIS–RPLICE: Early Recognition, Proportionate Action, and Diagnostic Closure
**Internal research protocol v0.1 — 2026-11-07. NOT an autonomous clinical pathway or validated intervention.**

## Scientific question
When an actionable risk or symptom signal first becomes available, how much avoidable delay and harm arises before appropriate evaluation, support, diagnostic resolution and follow-through? Does a guideline-concordant, clinician-governed, closed-loop pathway improve meaningful outcomes compared with competent existing care without increasing unnecessary tests, overdiagnosis, inequity or workload?

This extends the three-study measurement observatory into an action-and-outcomes investigation. The scientific claim is *not* that normalization proves a causal mechanism, that all late-stage cancer is preventable, or that the system has demonstrated clinical benefit.

## Source-grounded endometriosis case
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
SIGNAL_RECORDED → CLINICAL_REVIEW_NEEDED → EVALUATION_IN_PROGRESS → ACTION_AND_FOLLOWUP_PLANNED → RESOLVED / REASSESS / LOST_TO_FOLLOWUP / DECLINED.
Only authorized clinicians select tests, treatments, urgency, referral and disposition. Patient choices, contraindications and access barriers must be recorded without interpreting refusal as failure. Never use a negative ultrasound to automatically close suspected endometriosis. Emergency presentations require existing clinical triage, not this research workflow.

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
Primary endpoint to prespecify with clinical/community partners: time from first eligible presentation to *appropriate completed action* and/or improvement in validated patient-reported function. Secondary: time to working/confirmed diagnosis, referral closure, repeated unproductive visits, pain/function, patient trust, missed alternative diagnoses, overtesting, avoidable procedures, time burden, resource costs and differential impact by age, race/ethnicity, insurance, disability and geography where lawful and statistically appropriate.
Track sensitivity, specificity, positive predictive value and calibration only for a clearly defined prediction target with verified labels; do not turn a mechanism-hypothesis confidence rating into a diagnostic probability. Evaluate safety and benefit on held-out sites and periods.

## Sustainability and authority
Integrate into existing DIS casework, versioned evidence and source-change ledger, HerHealth patient journey only after scoped authorization, and human-selected RPLICE methods. No new disconnected service. Clinical practice guidance requires local qualified governance, legal/privacy review, participant consent where applicable, institutional review/IRB determination, approved data-use agreements, training, alert-fatigue monitoring, and rollback. No external messages, clinical decision automation, publication, or production release without owner approval.

## Evidence state
GUIDELINE-SUPPORTED: early clinical evaluation and appropriate management can proceed without universal surgical confirmation.
OBSERVED IN LITERATURE: heterogeneous multi-year diagnostic delays.
HYPOTHESIS: a closed-loop, guideline-concordant early-action workflow can reduce avoidable delays and improve function.
UNTESTED: DIS's incremental benefit, net clinical effect, site transferability, predictive accuracy and cost-effectiveness.

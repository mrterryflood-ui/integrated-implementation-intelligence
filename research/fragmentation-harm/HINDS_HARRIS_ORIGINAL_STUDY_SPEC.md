# Hinds–Harris original empirical study specification
Status: protocol and access specification, NOT a completed patient-level study. Version 0.1, 2026-11-08. Issue #81.

## Target question
For patients with an abnormal colorectal screening test, does a verified, accountable cross-system evidence-to-action workflow improve timely diagnostic resolution compared with usual care? Separately, what fraction of screening, referral, and diagnostic events are lost when translating raw records into standardized datasets?

The public Hinds/Harris 2019–2023 county cancer incidence comparison is ecological calibration only. It cannot identify the patient-level counterfactual.

## Minimum approved data dictionary
| Field | Purpose and qualification |
| --- | --- |
| pseudonymous_person_key, site_key | Controlled linkage; steward retains identity crosswalk |
| source_system, source_table, extraction_version | Raw EHR versus common data model versus registry provenance |
| event_type, event_date, recorded_date | Distinguish clinical occurrence from documentation |
| index_test_type, result_code, result_interpretation | Abnormal FIT/FOBT and eligibility definitions |
| screening_eligibility_version, prior_screening | Eligibility at the time, not today's guidelines |
| referral_order_date, referral_receipt_date | Detect handoff, but absence in one source does not prove no care |
| outreach_attempt_date, outreach_outcome | Capture attempts, responses and refusal distinctly |
| colonoscopy_scheduled, colonoscopy_completed, outside_care | Verified diagnostic resolution and cross-system care |
| pathology_date, diagnosis_date, registry_stage | Clinical endpoints and source-specific stage definitions |
| payer, access_barriers, geography_band | Confounding and lived experience with privacy safeguards |
| staffing, GI_capacity, referral_queue | Test competing capacity explanations |
| intervention_start, accountable_owner, workflow_version | Exposures and implementation fidelity |
| migration, death, censoring | Avoid falsely assuming disappeared patients are disease-free |

## Executable research sequence
1. **Source/construct audit:** align numerator, denominator, population, eligibility, stage, time and provenance. Preserve accepted baseline.
2. **Measurement validation:** compare raw EHR, standardized CDM, referral, claims and registry records within the same adjudicated eligible cohort. Quantify capture sensitivity, positive predictive value, missingness and subgroup variation with uncertainty. An imperfect reference standard must be disclosed.
3. **Pathway audit:** prespecify sampling of abnormal results and trace result notification, referral, scheduling, diagnostic completion, and patient experience. Use separate codes: not documented; confirmed not performed; performed elsewhere; unknown.
4. **Counterfactual:** if rollout and controls exist, preregister eligibility, time zero, intervention, usual-care comparator, follow-up, confounders, competing events and outcome. Prefer cluster randomization or a defensible controlled interrupted time series/target trial emulation; verify pretrends and exchangeability.
5. **Outcome assessment:** primary outcome timely documented diagnostic resolution, with prespecified window; secondary outcomes delay, stage, burden, equity and patient experience. No mortality claim without adequate data and follow-up.
6. **ChainWeb transfer:** only test a mechanism in another disease after establishing its validity and relevant differences in natural history, eligibility, access and workflows.

## Temporal counterfactual guard
Record observation-period end, first publication date, earliest availability to the decision owner, actual decision date, revision date, and whether the source is retrospective. A 2024 dataset cannot be presented as information available for a 2023 decision without evidence of an earlier contemporaneous source.

## Competing explanations and falsification
Test underlying incidence, case mix, registry completeness, selection into EHR, out-of-network care, referral capacity, patient preference, insurance, transportation, and differential documentation. The fragmentation mechanism is weakened if the missing signal was unavailable at decision time, the action was impossible due to capacity, external records show completed care, or harmonized measurements remove the apparent discrepancy.

## Governance and completion
Before any patient-level linkage: written steward permission, IRB/privacy determination, minimum-necessary data agreement, secure access, validated identity matching, and patient/community input. No PHI or outside-system messages are authorized by this specification.

**Not yet completed:** actual local pathway records, site-specific linkage validation, prospective intervention evaluation, and causal harm assessment. Close this research gate only with source receipts, reproducible analyses, explicit null findings, independent review, and accountable follow-up.

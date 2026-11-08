# Cross-condition pressure test 01 — endometriosis and autoimmune diagnostic trajectories
2026-11-08. **Evidence extraction level: scholarly metadata/abstracts, not independently verified full texts.** This is an initial transferability test of the DIS–RPLICE *method*, not evidence of a successful intervention or validated general-purpose clinical risk model.

## First-signal and diagnosis interval constructs
CRC's stage distribution cannot be used as the outcome measure for endometriosis or most autoimmune disorders. Common research state machine: first patient-experienced symptom -> first documented clinical encounter -> recognition/interpretation -> diagnostic evaluation/referral -> definitive or working diagnosis -> appropriate treatment -> patient-centered function. Each transition has separate timestamps, missingness, attribution and ownership; distinguish patient-reported onset from chart-recorded onset.

## Evidence — endometriosis
[Fry24] Fryer et al., Health Care for Women International (2024), doi:10.1080/07399332.2024.2413056, scoping review. Four databases through September 2023; 403 studies found, 23 included. Reported average diagnostic delay across included studies 6.8 years, range 1.5–11.4 years. Highly heterogeneous, mainly high-income-country studies. **Do not infer a population-average delay for all patients or a causal effect of delayed diagnosis**. Key mechanisms to test: symptom normalization, primary-care interpretation, imaging/specialist access, diagnostic criteria, gendered experience, and inconsistent first-symptom definitions.

## Evidence — autoimmune
[Kap21] Kapsala et al., Clinical and Experimental Rheumatology (2021), doi:10.55563/clinexprheumatol/x3s9td, observational study of 275 patients with systemic lupus erythematosus, duration <6 years. Median symptom-onset-to-diagnosis delay 24 months (reported IQR 54 months); 28.4% diagnosed within 6 months; 55.6% after 12 months. Distinguishes patient symptom onset -> first physician visit -> rheumatology assessment -> final diagnosis. Observational association between delays and damage; selection and recall/recording bias remain.
[Slo26] Sloan et al., eClinicalMedicine (2026), doi:10.1016/j.eclinm.2026.104259, international patient-reported cross-sectional survey, n=6,607 autoimmune participants (91.2% women, 87.8% White, 69.7% UK). Adjusted odds of self-reported psychiatric misdiagnosis for women vs men OR 1.46 (95% CI 1.14–1.87), psychosomatic misdiagnosis OR 1.74 (1.31–2.32). Strong self-selection, self-report and representativeness limitations. This is an **Experienced reality** source not a registry or causal comparison.

## Transfer falsification matrix
| Construct | CRC | Endometriosis | Autoimmune |
| --- | --- | --- | --- |
| Earliest signal | bleeding, anemia, bowel changes, family risk | menstrual/pelvic pain, associated symptoms; onset often self-reported | joint pain, rash, fatigue, systemic symptoms; heterogeneous by disease |
| Screening vs symptomatic workup | separate screening and diagnostic pathways | often symptomatic diagnostic pathway; no analogous population CRC stage screening | condition-specific diagnosis, no universal cancer screening threshold |
| Time-zero validity | first signal known at historical decision | patient-experienced onset vs recorded first consultation | onset vs first physician/rheumatologist visits |
| Outcome | early/late stage, incidence, mortality, diagnostic interval | diagnostic delay, pain/function, fertility and quality of life | delay, organ damage, function and patient experience |
| Main confounders | age, healthcare access, testing, exposure, case mix | symptoms severity, access, prior gynecologic history, diagnosis method | disease subtype, symptom severity, referral patterns, specialist access |
| Negative controls | signals first recorded after diagnosis; unrelated labs | retrospective symptom reports not contemporaneously documented; symptom clusters without disease | nonspecific symptoms and unconfirmed disease labels; differential specialist attendance |
| Transfer status | method in calibration | **hypothesis only** | **hypothesis only** |

## Proposed test
For each condition, extract a comparable **pathway-interval schema** but never impose common clinical cutoffs. Require prospectively available timestamp, patient-reported onset and chart onset separately, symptom construct, action, capacity, eventual diagnosis, patient-centered harm, and sensitivity analysis for missingness. Evaluate whether a connected evidence view materially changes *appropriate* decisions relative to fragmented records, then test outcome effects in authorized cohorts.

## Scientific decision
Evidence supports studying prediagnostic delay and unequal patient experience across conditions. It does **not** show that DIS–RPLICE prevents harm, that all delays are avoidable, or that earlier labeling always improves patient outcomes. Independent review, original full texts, and access-governed prospective evaluation are required.

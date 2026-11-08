# ChainWeb empirical research addendum: ascertainment loss, follow-up and defensible intervention effects
**As-of:** 2026-11-08. **Scope:** independent arithmetic audit of published empirical aggregate data plus full-text critical extraction; no new Hinds/Harris patient records, no clinical outcome claims. Complements `EMPIRICAL_MECHANISMS_2026-11-08.md`; advances issue #81 and scientific PR #85.

## Scientific finding: three distinct failures can look like the same "patient didn't receive care" outcome
1. **Measurement or source-coverage error**: a service occurred but the operational analytic source did not record it. This must be separated from incomplete care.
2. **Pathway failure**: a positive result is recorded but the follow-up process does not demonstrably reach a referral, procedure or result. This can involve capacity, patient access, workflow or clinician decisions, not merely interoperability.
3. **Population selection**: an EHR cohort captures a subset of regional patients and cannot be assumed to represent the county's cancer population.

The sources below triangulate these mechanisms but do not establish a causal effect on cancer stage or mortality. No numerical effect is transportable to Hinds County, MS, or Harris County, TX without a local measurement audit and a valid comparison group.

## Original denominator-by-denominator audit of published observations

| Study/setting | Source population/denominator | Observed numerator | Independently reproduced quantity | Interpretation and prohibited inference |
|---|---:|---:|---|---|
| Hoopes et al. 2021, 68 CHCs/328 sites, CA/OR/WA [Hoo20b] | 51,977 registry-positive cancers among 1,512,312 linked patients | 23,616 registry-positive without EHR cancer-history evidence | 23,616 / 51,977 = **45.4% not identified in CHC EHR**; paired EHR sensitivity 28,361 / 51,977 = **54.6%** | Cancer history ascertainment relative to a registry, **not** a 45.4% failure to provide care. Patients may have been diagnosed/treated elsewhere; linkage/coding and migration matter. |
| Hoopes et al. 2021 [Hoo20b] | CHC patients with vs without assigned PCP | Reported sensitivity: 61.1% vs 29.2% | **31.9 percentage-point difference** in registry-case capture | Association with continuity; **not** causal benefit of PCP assignment or proof that patients without PCP received worse cancer care. |
| Petrik et al. 2023, rural clinics [Pet23b] | 5,616 claims-derived candidates across three plans; 15 intervention clinics asked to review | 34%, 43%, 50% of respective plan lists removed by clinic review | **Substantial list attrition**, not a measured false-positive rate | Exclusions included wrong clinic attribution, screening up-to-date, medical ineligibility; no independent gold standard and **no false-negative audit**. |
| Petrik et al. 2023 [Pet23b] | 28 surveyed clinics | 8 reportable FIT-specific counts; 9 abnormal-FIT/follow-up counts | 8 / 28 = **28.6%**, 9 / 28 = **32.1%** reporting capability | Clinic reporting capacity, **not** actual clinical completion. |
| Escaron et al. 2022, 15-clinic FQHC [Esc22] | 324 abnormal FITs after 4,638 returned tests (2018) | 93 EHR-identified completed colonoscopies; 108 by 12 months after multi-source ascertainment | 93 / 324 = **28.7%** vs 108 / 324 = **33.3%**; increase **15/324 = 4.6 percentage points** | Under-ascertainment by automated EHR-only query. **Not** 15 procedures caused by record retrieval; these procedures had already happened. Author's 12-month EHR count is less explicit in Figure 1 than text; see ambiguity below. |
| Escaron et al. 2022 [Esc22] | Same 324 abnormal FITs | 122 total identified over up to 34 months, with 14 after month 12 | 122 / 324 = **37.7%**, 14 / 324 = **4.3% additional late procedures** | Extended follow-up **cannot** be substituted for 12-month endpoint. 93 initial EHR + 6 chart + 23 claims = 122, but timing by source was not reported. |
| Escaron et al. 2022 [Esc22] | 231 records with no EHR-query colonoscopy | 96 without documented outcome after GI referral/consultation; 79 without documented GI referral | 96 / 231 = **41.6%**; 79 / 231 = **34.2%** | **Documentation categories**, not adjudicated proof of non-referral or failure to obtain care. |
| Subramanian et al. 2024, CDC CRCCP sites [Sub24] | Five recipient-level completed/referral observations | 224/927, 37/49, 48/100, 50/87, 19/55 | **24.2%, 75.5%, 48.0%, 57.5%, 34.5%**; equal-recipient mean **47.9%** | Recipient averages are **not** population-weighted rates and sources/periods differed. A naive sum is 378/1,218 = **31.0%**, **not an appropriate comparable pooled effect estimate**. |
| Coronado et al. 2025 PRECISE randomized trial [Cor25] | 967 modified-ITT patients: 479 navigation; 488 usual care | Reported county-adjusted 1-year colonoscopy: 55.1% vs 42.1% | Difference **+13.0 pp** (95% CI **+6.5 to +19.4 pp**); adjusted OR **1.69** (95% CI **1.30–2.19**) | Randomization supports benefit of **assignment to the multicomponent navigation package** in study context, not EHR data exchange alone. CRC stage/mortality not assessed; subgroup receipt is not a randomized comparison. |

Published numerator checks are shown explicitly; all arithmetic in this table is derived from published reported counts or estimates, not recovered patient-level data. Cross-study percentages must not be pooled because populations, reference standards, outcome clocks and measurement levels differ.

### Published-paper inconsistencies flagged, not silently corrected
- **Escaron 2022:** explicit 108 completed within 12 months and 122 total over extended follow-up, but Table 2's "within 1 year" column reports n=122; abstract vs Results differ on the time-to-colonoscopy IQR (68–176 vs 64–143 days). Figure 1 gives 93+6+23, but not timing by source. Preserve both time horizons and request author clarification before meta-analysis.
- **Subramanian 2024:** six-month completion range includes printed 69.3% while a recipient cell reports 63.3%; six-month time origin inconsistently described as abnormal-test versus referral date. Until clarified, measure times from a single prespecified origin and do not pool time-to-follow-up.
- **Sharma 2020:** qualitative 12-case root-cause analysis offers no quantitative prevalence of each cited barrier; abstract/results disagree about a count of advanced adenomas. Do not use that disputed count [Sha20b].

## Designed / Operational / Experienced triangulation
- **Designed:** registry, EHR and claims systems are intended to support accurate cancer history, screening eligibility and closed-loop diagnostic follow-up.
- **Operational observed:** registry–EHR discordance [Hoo20b]; list removal and unmeasured false negatives [Pet23b]; EHR-only under-capture of completed colonoscopies [Esc22]; incomplete reporting of referral and timing [Sub24].
- **Experienced observed:** Sharma's patient interviews described transportation, work/childcare, preparation and fear barriers; Escaron's chart categories are not direct patient interviews. Neither study establishes that data interoperability alone resolves those barriers.
- **Counterweight:** the PRECISE RCT suggests navigation and practical problem-solving can improve recorded completion [Cor25]. Whether the gain persists, translates to stage/mortality, or transfers to Hinds/Harris remains untested.

## Required Hinds/Harris empirical study design and falsification criteria
**Primary measurement validation estimand:** proportion of independently verified, guideline-eligible *positive FIT episodes* for which the local EHR indicator falsely classifies (a) follow-up referral status or (b) follow-up colonoscopy completion by 180/365 days, versus a multisource adjudicated reference including outside GI facilities and permitted claims/registry linkage. Estimate sensitivity, specificity, PPV/NPV and 95% CIs; report unknowns separately and sample EHR-negative cases so false negatives are observable.

**Primary process estimand:** risk difference in independently verified colonoscopy completion by 365 days after positive FIT for an assigned closed-loop navigation/referral intervention versus usual care, ideally randomized at clinic level with prespecified ethical and pragmatic constraints. Measure 90-/180-/365-day completion, signal-to-contact, referral-to-procedure, false-alert burden, patient transport and interpreter barriers, and costs.

**Counterfactual and bias controls:** define index date from the positive FIT *result availability* (not a retrospective referral date); adjust for screening indication, age, comorbidity, payer, GI capacity, patient mobility, clinic affiliation, and calendar period; independently adjudicate outside procedures. Avoid immortal-time bias from post-result entry and crossover. Negative controls: patients with verified prior colonoscopy/no indication and records with the same external-facility footprint but no abnormal result. Use stratified audit of EHR-positive, EHR-negative and discordant records. Hinds/Harris county-level incidence is a contextual outcome, not the patient denominator for this estimand.

**Cascading ChainWeb claims:** only propose downstream evaluation once validated source loss -> operational alert/assignment -> verified procedure -> clinically relevant outcome has evidence at each link. Pre-register intermediate and final outcomes separately. If no linked record and no plausible counterfactual exists, the scientific output is a bounded measurement study with an explicit "causal effect not identified" statement.

## Public contextual-data candidate: suitable as a *covariate*, not intervention evidence
CDC PLACES 2025 county screening estimates are model-based and use **2022 BRFSS** for colorectal screening. CDC explicitly warns this small-area model cannot detect changes due to local program interventions. The county PLACES estimates, even if retrieved and compared, **cannot establish patient-level follow-up or causal changes** and must not be merged with 2019–2023 county cancer incidence as a shared numerator/denominator. Source: https://data.cdc.gov/500-Cities-Places/PLACES-Local-Data-for-Better-Health-County-Data-20/swc5-untb ; method: https://www.cdc.gov/places/tools/data-portal.html . Exact Hinds/Harris screening model estimates have **not** been retrieved in this audit.

## Evidence classification and closure gate
- **VERIFIED from peer-reviewed full text:** documented cross-source ascertainment/representation errors; observed follow-up documentation gaps; navigation RCT process endpoint effect in another setting.
- **RECALCULATED from published counts:** percentages and numeric differences above; numbers are not new primary measurements.
- **UNKNOWN:** actual Hinds/Harris positive-FIT patient cohort, percent missed by local EHR, patients undergoing procedures elsewhere, time-to-follow-up and cause-specific attrition, mortality or stage effects.
- **NOT ESTABLISHED:** EHR fragmentation caused the 2019–2023 Hinds/Harris late-stage rate difference; a data-integration intervention prevents mortality or transfers reliably across counties.
- **Closure requirements:** approved privacy/ethics governance, reproducible raw-to-analysis lineage, independent source verification, sensitivity/falsification analyses, results with uncertainty, review by epidemiology, informatics, implementation science and community/patient representatives. No clinical claims or project "research complete" label before those gates.

## References (full text extracted in Undermind workspace)
[Hoo20b] Hoopes M et al. *J Natl Cancer Inst.* 2021;113(7):924–932. doi:10.1093/jnci/djaa210.
[Pet23b] Petrik AF et al. *J Am Board Fam Med.* 2023;36:118–129. doi:10.3122/jabfm.2022.220216R1.
[Esc22] Escaron AL et al. *J Prim Care Community Health.* 2022. doi:10.1177/21501319221138423.
[Sub24] Subramanian S et al. *Cancer Causes Control.* 2024;35:1467–1476. doi:10.1007/s10552-024-01898-w.
[Cor25] Coronado GD et al. *Ann Intern Med.* 2025;178:645–654. doi:10.7326/ANNALS-24-01885.
[Sha20b] Sharma A et al. *J Patient Saf.* 2020. doi:10.1097/PTS.0000000000000718.
[Con22b] Conderino S et al. *BMC Med Inform Decis Mak.* 2022. doi:10.1186/s12911-022-01831-8.
[Tho20] Thompson C et al. *Cancer Epidemiol Biomarkers Prev.* 2020. doi:10.1158/1055-9965.EPI-19-0882.

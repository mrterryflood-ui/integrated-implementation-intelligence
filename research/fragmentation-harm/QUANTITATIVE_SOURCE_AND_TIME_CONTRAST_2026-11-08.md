# ChainWeb empirical research audit: non-equivalent metrics, evidence availability, and contested timing inference
**Version:** 2026-11-08-1 | **Status:** independent arithmetic reanalysis of accepted archival county summary; critical literature triangulation; **not** a new patient cohort or effect estimate.
**Protocol:** [GitHub issue #81](https://github.com/mrterryflood-ui/integrated-implementation-intelligence/issues/81). **Scientific purpose:** test the integrated-evidence prevention question while avoiding the false assumption that similar index statistics, comparable measurement constructs, equivalent populations, and identical prevention priorities are the same thing.

## Finding 1 — two different estimands can create the appearance of a shared baseline

The retained 2019–2023 Hinds County, MS / Harris County, TX county summaries show:

| Measure | Hinds | Harris | Difference (Hinds–Harris) | Ratio Hinds/Harris |
|---|---:|---:|---:|---:|
| Age-adjusted *all-stage* CRC incidence, per 100,000/year | 46.4 | 38.0 | +8.4 | 1.2211 |
| Age-adjusted *late-stage* CRC incidence, per 100,000/year | 29.9 | 23.9 | +6.0 | 1.2510 |
| *Percent of cases* with late stage, % | 63.7 | 63.4 | +0.3 percentage points | not an incidence-rate ratio |

**Independent calculation:** Hinds late/all age-adjusted rate ratio is 29.9/46.4×100 = **64.4397%**, not the reported 63.7%; Harris is 23.9/38.0×100 = **62.8947%**, not the reported 63.4%. This is **not itself an error**: incidence rates are independently age-adjusted rates, while *percent of cases with late stage* is a count-derived proportion. The NCI's State Cancer Profiles explains these as distinct constructs ([interpretation](https://www.statecancerprofiles.cancer.gov/incidencerates/index.php?age=001&areatype=county&cancer=047&datatype=01&graph=1&output=2&race=00&ruralurban=0&sex=0&sortOrder=desc&sortVariableName=cirank&stage=211&type=incd)). Different standardized age weights can make a ratio of rates differ from the unstandardized stage percentage.

**Rounding-only falsification:** if all one-decimal printed incidence rates conceal up to ±0.05 per 100,000, the ratio intervals are Hinds **64.2626%–64.6170%** and Harris **62.6807%–63.1094%**; neither overlaps the corresponding one-decimal stage-share interval (Hinds 63.65%–63.75%; Harris 63.35%–63.45%). Therefore simple one-decimal rate rounding **cannot fully explain** the discrepancy. Different estimand construction is indicated; the full registry age-specific numerator/denominator audit is still required to attribute it to age standardization alone.

**Interpretive correction:** these two county measures are generated from a shared surveillance lineage, not proof of two independent instruments or two independent health-system datasets. The 0.3-point descriptive stage-share difference does **not** establish statistical equivalence: no predefined equivalence margin or stage-share uncertainty test has been performed. The 25.1% *relative* late-stage incidence difference is not a 25.1% prevented-case opportunity, risk attributable to data fragmentation, or intervention effect.

**Time/source limitation:** county numbers above are from the project's previously accepted and replayed 2019–2023 archival baseline in issue #81 and the comparability contract. This audit performs an **independent arithmetic check**, not a newly retrieved registry refresh or independent adjudication of the raw case files. Do not replace the baseline with NCI pages whose footnotes reference 2018–2022 or other submission cycles.

## Finding 2 — a clinically consequential counterfactual remains disputed even with large cohorts

Grancher et al.'s 2025 France nationwide retrospective cohort conditioned its analysis on **374,113 FIT-positive people who ultimately underwent colonoscopy within 24 months**. The reported adjusted odds ratio for *advanced-stage CRC* at 12 months vs the 2–3-month group was **1.04 (95% CI 0.85–1.25)**; this analysis found no increased detected risk through 24 months *within its selected study population*. High fecal hemoglobin was a much stronger risk marker. [Grancher et al.](https://doi.org/10.1136/gutjnl-2025-336036).

A published 2026 scientific exchange disputes what that null implies:
- **February 13:** Brenner et al. questioned whether counting only cancers found at post-FIT colonoscopy excludes symptomatic cancers diagnosed earlier outside the screening pathway; this could obscure harms of waiting. [DOI](https://doi.org/10.1136/gutjnl-2025-337926).
- **July 21:** Hsu et al. independently argued that self-selection in who completes colonoscopy could produce an apparently null timing association. The letter is a methodological critique, **not an independently demonstrated bias magnitude**. [DOI](https://doi.org/10.1136/gutjnl-2026-339594).
- **July 24:** Grancher et al. defended the completeness of the French regional screening-center follow-up process and contested the claim that missing interval cancers explained their result. [DOI](https://doi.org/10.1136/gutjnl-2026-339212).
- Other earlier cohort studies and the 2020 Forbes systematic review found associations between longer delays and worse CRC outcomes, but these are not randomized causal timing effects. [Forbes et al.](https://doi.org/10.1016/j.cgh.2020.09.048).

**Adjudication: MIXED / unresolved.** The French result is not proof that waiting is harmless; the correspondence is not proof that its result is invalid. Restriction to completed colonoscopy and missing non-screening diagnoses are **testable selection and ascertainment threats**, not verified causes of bias in the French analysis. Do **not** design ChainWeb around a fixed mortality benefit per month of shorter delay. Completion of appropriate diagnostic evaluation and clinically meaningful outcome ascertainment remain more defensible endpoints; timing should be prespecified and assessed as a separate estimand, not abandoned.

## Finding 3 — a sequence of process effects is not a demonstrated chain of clinical effects

- **Standardization loss, observed:** Conderino et al. found 15.9% of colorectal screening records in raw EHR health-maintenance fields were not in coded CDM fields. This is record-level capture, not patient-level missed screening [Con22b](https://doi.org/10.1186/s12911-022-01831-8).
- **Population selection, observed:** Thompson et al. reported 10,659/41,165 (25.89%) cancer cases from the region in its selected episode-care EHR group, and heterogeneous county coverage. This is a defined analytic selection fraction, not the registry's sensitivity [Tho20](https://doi.org/10.1158/1055-9965.EPI-19-0882).
- **Cancer history ascertainment, observed:** Hoopes et al. report 23,616/51,977 = 45.4% registry-confirmed cases without corresponding EHR cancer history in linked CHC EHRs, not 45.4% failures of clinical service [Hoo20b](https://doi.org/10.1093/jnci/djaa210).
- **Follow-up documentation, observed:** Escaron et al. identified more completed procedures after chart/claims review than EHR-only query. The source reports internally inconsistent timing and period details, so this result supports additional **ascertainment review** but not a pooled 12-month effect estimate pending clarification [Esc22](https://doi.org/10.1177/21501319221138423).
- **Navigation improves follow-up in one trial:** Coronado et al.'s PRECISE RCT reported 55.1% vs 42.1% colonoscopy completion by one year, an adjusted 13.0-percentage-point effect (95% CI 6.5–19.4). The causal claim concerns **assignment to the navigation package**, not code harmonization alone, cancer stage, mortality, or transport to the counties [Cor25](https://doi.org/10.7326/ANNALS-24-01885).

These findings are deliberately kept at their own units (record, EHR cohort, cancer case, screening episode, randomized patient), denominators, and observation times. They **cannot be aggregated** into a single local estimate of preventable harm.

## Full ChainWeb prevention interpretation

**Designed:** screening metrics, diagnosis stages and EHRs are intended to help make timely, equitable prevention decisions.

**Operational:** standardization may lose valid records; selected EHR cohorts omit people from the jurisdiction's true disease population; referral responsibility can fail at institutional and cross-facility handoffs; process timing can be measured from incompatible clocks; existing datasets may arrive **after** a historical action window.

**Experienced:** patient-reported barriers (preparation, fear, transport, work, childcare) and provider-reported system failures coexist; information completeness does not create GI capacity or address every access barrier [Sha20b](https://doi.org/10.1097/PTS.0000000000000718).

**Research synthesis:** Integrated intelligence has a plausible near-term function in identifying when measurements, populations, capacities and experiences disagree and which decisions require revisiting. It is **not established** that integration alone prevents cancer, shortens diagnostic delay, or changes the stage distribution.

## Prespecified discriminating studies and counterfactuals (not executed)

1. **Measurement concordance audit:** raw EHR vs CDM vs external GI records, same eligible FIT-positive episodes and 365-day observation window, stratified by EHR-positive/EHR-negative and external-facility status. Count chart-adjudicated misclassification, unknowns, false alerts and confidence intervals. A zero or negligible false-negative rate locally would weaken the local ascertainment-loss hypothesis.
2. **Population inclusion audit:** registry-defined county cancer universe vs clinical-system cohort by year, age, race/ethnicity, insurance and site. Compare observed coverage and reweighting sensitivity; independent data lineage prevents treating joined copies as corroboration.
3. **As-of integrated prevention decision study:** lock the *actual* prior recommendation or a clearly labeled scenario and decision date. Compare conventional competent baseline versus integrated evidence **available at that date** for all relevant prevention domains (disease occurrence, biologic and life-course risk, social/environmental determinants, capacity, lived experience, evidence on feasible intervention). Blindly adjudicate the *warranted* decisions, including justified nonchange, rather than number of changed recommendations.
4. **Clinical pathway evaluation:** if an ethical partner exists, compare closed-loop navigation/referral plus validated data quality with standard care, with independent ascertainment of all diagnostic resolutions, including symptomatic diagnoses, outside-facility procedures, deaths and nonattendance. Prespecify 90/180/365-day completion, time origin, censoring/competing events, harms, GI capacity and equity. An RCT/cluster rollout is preferable to naive pre/post if feasible.
5. **Connected-effect claim:** only after robust direct effects, evaluate spillover to adjacent pathways and sustainment with mediators/capacity recorded. A source-level correction or more alerts **does not count** as a downstream prevented clinical event.

**Critical data access gate:** no patient-level Hinds/Harris FIT results, referral/workflow logs, EHR–registry linkage, independent completed-procedure adjudications, or site authorization were available here. Obtain data stewardship, patient/community governance and IRB/privacy assessment before any private-data linkage. No external outreach has been sent.

## Outcome and limitation status
| Claim | Status | Result | Evidence |
|---|---|---|---|
| Stage shares are interchangeable with ratios of age-adjusted incidence rates | VERIFIED *as a counterexample* | CONTRADICTED by retained arithmetic | Accepted 2019–2023 baseline; NCI definitions |
| Stage shares establish statistical equivalence | UNTESTED | INCONCLUSIVE | No margin, uncertainty or equivalence design |
| CDM extraction can omit recorded screening | VERIFIED in cited setting | SUPPORTED | Conderino 2022 |
| EHR cancer cohorts can be unrepresentative | VERIFIED in cited setting | SUPPORTED | Thompson 2020, Hoopes 2021 |
| Longer FIT-to-colonoscopy delay has no harmful effect | INFERRED from selected observational data | MIXED / DISPUTED | Grancher 2025 and 2026 correspondence; earlier studies |
| Navigation improves one-year completion in PRECISE setting | VERIFIED published randomized estimate | SUPPORTED | Coronado 2025 |
| Integration itself improves *local* Hinds/Harris prevention decision quality | UNTESTED | INCONCLUSIVE | No historical decisions / case comparisons |
| Integration averts local clinical harm or cascading morbidity | UNTESTED | INCONCLUSIVE | No patient-level counterfactual outcomes |

**Research complete? NO.** This is a completed, versioned analysis of measurable discrepancies and contested evidence, not a completed prospective prevention evaluation or Hinds/Harris individual causal investigation. The purpose of the current output is to improve the target estimand and avoid clinical claims based on incompatible input measures.

## Source access & reproducibility
- Previous county baseline: [issue #81](https://github.com/mrterryflood-ui/integrated-implementation-intelligence/issues/81) and `comparability-contract.v0.1.json`.
- NCI construct definitions: [State Cancer Profiles interpretation](https://www.statecancerprofiles.cancer.gov/incidencerates/index.php?age=001&areatype=county&cancer=047&datatype=01&graph=1&output=2&race=00&ruralurban=0&sex=0&sortOrder=desc&sortVariableName=cirank&stage=211&type=incd).
- Run `python research/fragmentation-harm/published_metrics_audit.py` and `python -m unittest discover -s research/fragmentation-harm -p 'test_published_metrics_audit.py'` from the repository root. Numeric results are deterministic reanalysis of published aggregates, not patient records.

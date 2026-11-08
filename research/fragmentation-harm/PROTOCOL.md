# DIS–RPLICE research protocol: fragmented evidence and missed intervention opportunities
Status: proposed scientific protocol, not a finding of causality. Issue: #81. Version: 0.1 (2026-11-08).

## Mission and testable hypotheses
**H1 (measurement):** In otherwise comparable geographies and periods, reliance on conditional late-stage share alone can conceal clinically and operationally meaningful differences in population late-stage incidence.
**H2 (information):** Linking provenance-compatible cancer, clinical access, screening, referral, and contextual evidence will identify additional actionable signals relative to isolated datasets.
**H3 (process):** When such signals are available to accountable decision owners, decision-to-action intervals may shorten relative to current workflows.
**H4 (outcomes):** Shorter intervals may improve diagnostic resolution and eventually outcomes, subject to confounding, unintended harms, and independent evaluation.

H1 is testable using currently accepted aggregate pilot data. H2–H4 require additional linked data, process logs, stakeholder input, and an evaluation design; they are not established by H1.

## Constructs and estimands
- **All-stage incidence rate:** age-adjusted cases per 100,000 population, with source-defined case definition and standard population.
- **Late-stage incidence rate:** age-adjusted late-stage cases per 100,000 population, with identical comparability checks.
- **Late-stage share:** fraction of diagnosed cases classified as late-stage, where source methodology permits. It is not a risk among all residents and cannot substitute for the late-stage incidence rate.
- **Signal-to-action interval:** elapsed time between a predefined evidence trigger and an auditable decision or intervention; missing timestamps are missing, not zero.
- **Missed opportunity:** predefined actionable signal for which a feasible, accountable response was available but not taken within a prespecified window. Requires process evidence, not simply a high incidence rate.
- **Potentially preventable harm:** patient-relevant adverse outcome under a defensible intervention counterfactual, not inferable from aggregate geographic correlations alone.

## Baseline anchor (descriptive; 2019–2023)
| Geography | All-stage CRC rate | Late-stage CRC rate | Late-stage share |
| --- | ---: | ---: | ---: |
| Hinds County, Mississippi | 46.4 | 29.9 | 63.7% |
| Harris County, Texas | 38.0 | 23.9 | 63.4% |

Rates per 100,000; retain the archived source definitions and footnotes. Difference in late-stage rates = 6.0 per 100,000, versus late-stage share difference = 0.3 percentage points. Do not divide age-adjusted rates to reconstruct the conditional share. This contrast motivates H1 but is not proof of fragmentation-caused harm.

## Source comparability contract
For each pair of sources record: steward and canonical URL; source bytes and SHA-256; extraction timestamp; version and registry submission; geography and population; numerator, denominator, exclusions, age adjustment; case and stage definitions; period; subgroup coding; suppression and uncertainty; data latency; quality checks; decision owner and actionability. Classify each dimension as PASS, CONDITIONAL, FAIL, or UNKNOWN and record a reason. A comparison is **approved** only if all essential dimensions pass, or if conditional differences are addressed with documented sensitivity analysis. A FAIL or UNKNOWN essential field blocks a causal or rank-order claim, not descriptive display with warnings.

## Counterfactual identification plan
Define a target decision and time zero **before** inspecting outcome differences. Specify exposure (integrated evidence vs existing workflow), eligible population, intervention, comparator, outcome, follow-up, confounders, selection and missingness, negative controls, and falsification tests. Prefer prospective stepped-wedge/cluster evaluation where feasible; otherwise carefully justified quasi-experimental interrupted time series or difference-in-differences with pretrend tests. Patient-level claims require lawful access, linkage validation, privacy review, and appropriate ethics determination.

### Competing explanations to investigate
Underlying incidence; differences in screening eligibility and uptake; insurance and access; stage coding and registry completeness; population age structure; urbanicity and clinical catchment; referral completion; data publication latency; socioeconomic and environmental exposure; treatment availability. Never treat geographic correlation as an individual causal effect.

## Decision chain
Source signal -> provenance/comparability gate -> corroboration -> accountable owner -> referral or policy decision -> documented action -> diagnostic resolution -> outcome -> audit and adaptation. Record handoff time, failure mode, evidence, human approval, and outcome at each step. Explicitly distinguish Designed, Operational, and Experienced pathways.

## Pilot execution and expansion gates
1. Reproduce Hinds/Harris baseline independently from immutable accepted originals and check subgroup direction, uncertainty, suppression, and footnotes.
2. Apply source comparability contract to Colorado candidates before selecting a comparator; reconcile NPCR/SEER submissions and age/stage definitions.
3. Construct a signal ledger and a process-gap interview/record collection protocol; do not invent unavailable referral or patient records.
4. Test whether additional integrated sources change a predefined decision; register false positives, burden, and equity effects.
5. Only then adapt the measurement contract to women's health, lung and breast cancer, and other diseases. Preserve disease-specific denominators and natural history.
6. Evaluate interventions with oversight and publish null or contradictory results.

## Acceptance tests
- Every quantitative claim points to source hash, code revision, extraction timestamp, denominator and uncertainty where available.
- Reproduction independently recalculates published descriptive outputs and fails closed on missing originals.
- No accepted baseline is replaced by a failed or partial acquisition cycle.
- No ecological estimate is described as a patient-level causal effect.
- Any clinical-benefit statement has a stated design, comparator, outcome, confidence interval, and ethics/data governance record.
- Release integration requires separate software QA, scientific review, and production identity acceptance.

## Responsibility
Scientific protocol owner: DIS–RPLICE research workstream (Issue #81). Application integration owner: separate implementation agent; no modification to production authentication or deployment in this branch. Closure requires documented independent review and reproducing scripts, not merely a merged document.

# DIS Three-Study Observatory — Reproducible Investigation Receipt 001
Date: 2026-11-07. Status: INTERNAL RESEARCH, not independent publication validation.
## Exact input lineage
Pinned GitHub historical commit `59ceb6f9decc14fd19f5c0994fa9bc7afa6f103b`, `apps/dis-platform/lib/national-three-cancer-reference.ts`. This file returned 404 on the then-current main branch, so it must **not** be represented as a live integrated main-branch source. It contains a manually transcribed NCI State Cancer Profiles 2019–2023 all-races state reference. Excluded US aggregate, DC and Puerto Rico; 50 states analyzed. Breast is female-specific; colorectal and lung include both sexes. All numbers below are recomputed from this snapshot, not freshly re-extracted from NCI.
## Recomputed Pearson r
| Pair | Age-adjusted late-stage incidence rates | Late-stage case percentages |
|---|---:|---:|
| Colorectal–lung | 0.7345106353 | 0.1287547897 |
| Colorectal–breast | 0.4485790881 | 0.2306703353 |
| Lung–breast | 0.2910300155 | 0.4456337035 |
Computed as centered cross-product divided by the square root of the product of centered sums of squares, using all 50 state rows for each pair. No significance tests, CIs, age/sex adjustment beyond the input rate, spatial dependence or causal identification are asserted.
## Sensitivity exercises
Colorectal–lung late-stage incidence leave-one-state-out Pearson range: 0.707003972 (West Virginia excluded) to 0.751122639 (Massachusetts excluded). Late-stage case-share range: 0.060923279 (Alabama excluded) to 0.234690898 (Hawaii excluded). Excluding Mississippi, Texas and Colorado together (47 states): rate r=0.729372211; stage-share r=0.138311545.
## Interpretive decision
A strong rate association and weak stage-share association are **not** two estimates of the same phenomenon. They use different denominators and, for breast cancer, different sex populations. The stable rate correlation supports a descriptive cross-state pattern in the pinned table, not a shared mechanism. The weaker stage-share relationship is more sensitive to which states are included. The prior report's colorectal–breast share 0.234 differs from this snapshot's 0.230670; the earlier lung–breast share Spearman 0.413 versus 0.409816 is a separate metric and must not be confused with the Pearson 0.445634 reported here.
## Open verification and explanatory gates
1. Obtain original NCI machine-readable exports, release/version, stage definitions, suppression flags, standard population and time window. Independently compare all 150 condition-state cells and three measures per cell with pinned table. Record source checksum and extraction receipt.
2. Recover exact original analysis script, input revision, rounding and exclusion criteria for earlier secondary-coefficient discrepancies.
3. Compare age-specific incidence, staging completeness, all-stage incidence and detection pathways. Model population, exposure, healthcare and reporting mechanisms separately. Account for sex-specific breast denominator and spatial dependence.
4. Report uncertainty, missingness, negative controls, subgroup heterogeneity and robustness without causal language.
5. For colorectal Hinds/Harris, obtain harmonized all-stage/late-stage age-specific rates, stage completeness and county-specific service process data before mechanistic attribution.
6. For NSFG, reproduce survey-weighted estimates with public-use design variables and instrument definitions before estimating diagnostic recognition differences.
## Implementation learning
The Observatory must pin input releases and hashes, detect missing source artifacts on main, record a discrepancy ticket rather than silently falling back to a prior commit, and retain the distinction between source verification, arithmetic reproducibility, mechanism testing, intervention selection and field outcome verification. No automatic transfer of provisional claims to clinical platforms.

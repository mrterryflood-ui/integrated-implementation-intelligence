# CRC original-source trend comparability pressure test — 2026-11-08
**Evidence:** original retained public NCI State Cancer Profiles HTML and CSV, GitHub Actions artifact 13589404488, ZIP SHA256 `ddee039ad52fbe27b694e3e64a01d7d5ec2b0e9cb24b535fce47b8434dba727a`. **Executed:** locally opened ZIP, rehashed outer ZIP, validated all 18 manifest entries and directly parsed all four original county CSV rows. All checks passed. No patient data.

## Source-bound observations
| Measure | Hinds County MS | Harris County TX |
| --- | --- | --- |
| All-stage incidence 2019–2023, age-adjusted/100k (95% CI) | 46.4 (42.6–50.5) | 38.0 (37.2–38.9) |
| Late-stage incidence 2019–2023, age-adjusted/100k (95% CI) | 29.9 (26.8–33.2) | 23.9 (23.3–24.6) |
| Late-stage share of cases | 63.7% | 63.4% |
| All-stage 'Recent Trend' category | falling | rising |
| Reported recent 5-year AAPC (95% CI) | −2.1%/yr (−2.7 to −1.5) | +2.1%/yr (+0.3 to +3.4) |
| All-stage average annual case count | 118 | 1,732 |
| Late-stage average annual case count | 75 | 1,098 |

**Critical qualification newly verified from the original HTML footnotes:** The reported AAPC is based on joinpoint APC segments, and the *time period used in joinpoint regression may differ for selected counties due to data availability*. The site further states rates and trends can be computed using different standards for malignancy. Therefore, the two county trend figures **cannot yet be treated as matched-window causal or even fully comparable trend estimates**. The 2019–2023 label governs the incidence table, but does not establish identical years underlying AAPC. Avoid computing a formal cross-county trend-difference inference from these two displayed CIs alone.

## Hypotheses that need independent testing
H1: The divergent all-stage AAPCs remain after exact joinpoint-year and malignancy-standard harmonization.
H2: They persist after age/race/sex stratification and common ascertainment/case-definition adjustments.
H3: Stage-specific time series and screening uptake help distinguish prevention, detection and progression mechanisms.
H4: Patient-level first-warning-sign data identify actionable windows before diagnostic or stage progression. No public county aggregate can test H4.

## Immediate falsification gates
- **G1 source integrity PASS** for the retained ZIP; raw current-source reacquisition NOT DONE.
- **G2 same-window trend comparability OPEN** pending exact joinpoint input years and standards.
- **G3 subgroup mechanism OPEN** pending registry age/race/sex-specific series.
- **G4 causal mechanism OPEN** pending patient-level longitudinal data and a specified identification design.
- **G5 intervention benefit OPEN** pending prospective or defensible causal comparison.
- **G6 independent scientific review OPEN** for this new trend inference.

## Why this matters to ChainWeb
This is a direct example of the user's measurement thesis: two estimates displayed under the same apparent 'recent five-year' heading may conceal different model windows and standards. **The system must compare the measurement instruments before interpreting the trend**, rather than presenting divergence as established policy or clinical causality.

## Next executable step
Acquire and archive county-specific joinpoint source metadata and matched annual incidence series; if inaccessible, mark cross-county AAPC comparison conditional. Separately extract subgroup counts/rates and test whether stage-share convergence persists. Preserve original input hashes and timestamp validity. Do not advance a causal edge until the source comparison and identification strategy pass.

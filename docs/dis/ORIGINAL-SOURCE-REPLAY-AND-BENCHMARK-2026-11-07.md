# Original-source replay and external numerical calibration
Date: 2026-11-07. Internal descriptive research. No external outreach or clinical action.

## Reuse and scope
Reuse the existing acquisition cycle, analyze.py, verify_retained.py and authenticated DIS research infrastructure. Add reference_audit.py as a second computational implementation, consuming the same retained originals and comparing 24 scalar outputs with the existing analysis. Both implementations are assistant-authored; their agreement is not independent human scientific review. The official NCHS published benchmark supplies a separate numerical calibration target.

## Evidence chain
Input artifact: dis-research-cycle-42411939810, GitHub artifact ID 13589404488. ZIP SHA-256 ddee039ad52fbe27b694e3e64a01d7d5ec2b0e9cb24b535fce47b8434dba727a. Provider binds the run to head 312577b8e43efadaceb4b834dc524dc11368d3fe. All 18 entries in its original manifest verified locally. Eight of ten original source downloads succeeded; codebook and published report downloads returned 403. Accessible official documentation was separately inspected through web retrieval; this does not convert those two failed byte acquisitions into successes. The original acquisition receipt declared the synthetic merge SHA 73455a439f950ffa0644d5714843b06b173f029a; preserve this mismatch. The current workflow now measures the checked-out revision with git rev-parse HEAD and independently checks it.

## County correction
All seven retained NCI report headings are 2019-2023. Matched county estimates: Hinds all-stage rate 46.4 (42.6-50.5), late-stage rate 29.9 (26.8-33.2), late share 63.7%, annual late count 75; Harris all-stage rate 38.0 (37.2-38.9), late rate 23.9 (23.3-24.6), late share 63.4%, annual late count 1098. Rates are annual age-adjusted cases per 100,000. Late-rate ratio 1.251046 and difference 6.0; all-stage rate ratio 1.221053; case-share difference 0.3 percentage points. Earlier use of Hinds 30.4 with Harris 23.9 mixed periods; withdraw that 27.2% contrast. Historical 2018-2022 values remain historical, not overwritten.

NCI Interpretation of Incidence Rates defines percent late as late-stage cases relative to cases for all stages. Our prior staged-only label was unsupported and requires source-specific correction; it must not be treated as an empirically established exclusion of unstaged cases. CDC stage tables may use distinct denominator options. This is a correction to our own crosswalk, not evidence of an external organization's error. Unknown-stage handling, source-specific staging conventions and age strata remain research obligations.

## National reproduction
All 450 state x cancer x measure cells in the prior pinned 2019-2023 CSV match direct extraction from the retained original NCI HTML. This includes 50 states, three cancers and rate/share/count; US, DC and Puerto Rico are excluded from 50-state correlations. Colorectal-lung Pearson r: rate 0.7345106353, case share 0.1287547897. Secondary corrected values: colorectal-breast case-share Pearson 0.2306703353; lung-breast case-share Spearman 0.4098159974. Earlier 0.234 and 0.413 do not reproduce from this matched table. The original author script for those earlier coefficients remains unavailable; do not attribute a definitive cause without it.

## NSFG sample and variance calibration
Official recode specification (page 1): respondents aged 50 at interview were 49 at the household screener. Strict interview ages 20-49 yield n=4855; retaining the documented upper-bound eligible record yields n=4856, matching the published report. Both domains remain in the audit. Diagnosis percentage (Taylor SE, percentage points) with that boundary: ENDO 6.158021 (0.485585), PCOS 8.707328 (0.508420), UF 7.798809 (0.532409). All three round to published points and SEs. This does not prove the exact unpublished author program was recovered.

A separate NCHS SAS/STATA oral-contraceptive-use example provides six age-group percentages and SEs. All six are reproduced to the published four-decimal precision, with 20 strata, 80 PSUs and 60 design degrees of freedom. This calibrates the Taylor ratio/domain implementation. It does not reproduce the gynecologic confidence-interval algorithm, establish biological prevalence, quantify underdiagnosis, or identify a mechanism.

Primary references:
- NCHS female recode specifications: https://www.cdc.gov/nchs/data/nsfg/recodespecs/2022-2023-NSFG-FemResp-RecodeSpecs.pdf (page 1)
- NCHS variance examples: https://www.cdc.gov/nchs/data/nsfg/varest/2022-2023-NSFG-VarEst-all.pdf (pages 1-3)
- Nugent CN, Lochner KA. NCHS Health E-Stat 121. 2026. https://www.cdc.gov/nchs/data/hestat/hestat121.htm
- NCI source query URLs and original response hashes are retained in acquisition_receipt.json.

## Executed checks and remaining gates
Local: 53 research tests passed; ten new reference-audit tests cover period headings, source tampering, duplicates, exact geography, suppression, domain variance, singleton strata, invalid weights and alignment. Actual retained-source replay passes six external benchmarks and 24 numerical parity checks against analyze.py. A concurrency update already repaired the workflow-shape test; retain that stronger current test rather than replacing it with an older assertion.

The integrated CI step must pass on the final revision before acceptance. Keep PR #73 draft. Permanent retention beyond 14-day artifacts, recovery and authorized review decisions remain open. No scheduler, external correspondence, clinical implementation, causal conclusion or comparative superiority is claimed. Public-use microdata are used only for aggregate statistical purposes; no respondent identification or record linkage.

# Denominator and age-partition adjudication

**Decision date:** November 8, 2026. **Reviewer:** `/root/diagnostic_evidence`, an independent agent reviewing the pinned science work. **Scope:** DEN01, DEN02, DEN03 and DEN06; public aggregate research only. New audit code authored here still requires a distinct integration review. No clinical pathway, intervention effect, deployment or patient-data access is accepted by this report.

## Decision

**The bounded descriptive result survives independent replay. The exact unknown-stage denominator and empirically harmonized county rates remain unidentified.** This is a completed adjudication of what the available sources can establish, with specific remaining acquisition gates rather than an undifferentiated OPEN label.

| Gate | What this review resolves | What remains unresolved | Disposition |
|---|---|---|---|
| DEN01: source-specific denominator | Exact archived report scope and rounded measurements; current interpretation links embedded in those reports explicitly describe late-stage cases relative to all-stage cases; all 336 counties' current core measurements match the archive | Unknown/unstaged, death-certificate-only and autopsy-only membership in the exact share denominator; unrounded totals; whether today's interpretation wording was available at the original release/decision cutoff | PARTIALLY RESOLVED; do not label the denominator staged-only or claim exact membership |
| DEN02: age partition | Source-reported 19/20-group difference, all 19 common standard weights, 20-to-19 aggregation rule and signed sensitivity algebra | County age-specific late-stage counts and matched person-years; equivalent selection and interval methods; empirical corrected county rates | COMMON PARTITION SPECIFIED; EMPIRICAL HARMONIZATION UNIDENTIFIED |
| DEN03: county frame and suppression | All 336 county identities in the archived frame, 254 complete comparisons, 82 incomplete comparisons; exact state/rural/urban suppression patterns; current export FIPS alignment | Population-, patient- or case-weighted coverage; missing outcomes behind suppression; geographic boundary vintage; magnitude or direction of selection bias | ARCHIVED-FRAME MISSINGNESS ADJUDICATED; broader coverage unknown |
| DEN06: within-state/count sensitivity | Independent replay matches pinned results; full count-threshold and share-window sensitivity; distinct counties underlying overlapping pairs | Mechanism attribution, independent effect estimates, equivalence, county-ranking validity and causal outcome effects | DESCRIPTIVE SENSITIVITY ADJUDICATED; no causal closure |

The existing W2/W4/W8 decisions are not automatically closed by these narrower dispositions. DEN04 temporal/runtime provenance remains outside the resolved scope; its known receipt inconsistency is retained below. The mission remains earliest risk and warning evidence through appropriate completed action across conditions. Post-FIT is a tractable initial measurement pathway, not a replacement mission.

## 1. Exact source and code identity

The canonical ZIP is read-only throughout this audit:

`/workspace/scratch/757b435145c4/dis-research-reconciled/.git/research-integration-2026-11-08/county-originals-ddee039a.zip`

**SHA-256:** `ddee039ad52fbe27b694e3e64a01d7d5ec2b0e9cb24b535fce47b8434dba727a`; **2,692,160 bytes**. All 18 manifest entries and the exact archive membership matched. Independent HTML parsing matched **4,368 cells** in the archived extracted county tables. There are 672 county rows across two stage tables for 336 counties, not 672 independent counties. The ZIP was originally acquired at `2026-11-07T20:37:41.234665+00:00`.[1]

Pinned science code is commit `18823969ffee9f6eb393891f65e00941e102b9d6`. Its `denominator_age_sensitivity.py` Git blob is `5e7fa288bb93b71f183d870bab27722604b39e03`; `expanded_county_test.py` is `a5fa9481f63fbbcee380ab96afa9df0846679d78`. Exact retrieved copies and URLs are in `pinned/source_receipt.json`. The new independent audit has its own hashes in `VALIDATION_RECEIPT.json` and the final manifest. It does not substitute generated fixtures for original data.[2]

The archived reports concern **colorectal cancer, 2019–2023, all races including Hispanic, both sexes, all ages, county geography**. Hinds is source marker 2, NPCR 2025 submission; Harris is marker 7, SEER November 2025 submission. The incidence footnote describes 19 NPCR versus 20 SEER age groups. The separate CI*Rank footnote describes 19 groups for both; a rank column cannot silently substitute for a harmonized rate.[1]

| County | All-stage rate | Late-stage rate (95% CI) | All-stage annual count | Late-stage annual count | Late-stage share |
|---|---:|---:|---:|---:|---:|
| Hinds, Mississippi | 46.4 | 29.9 (26.8–33.2) | 118 | 75 | 63.7% |
| Harris, Texas | 38.0 | 23.9 (23.3–24.6) | 1,732 | 1,098 | 63.4% |

Rates are age-adjusted cases per 100,000 residents per year. Shares condition on diagnosed cases under the source definition. The 0.3 percentage-point share difference and 6.0 per 100,000 late-stage rate difference describe different quantities. They do not demonstrate equal performance, an individual risk difference, prevented harm or a fragmentation mechanism. Do not divide a standardized rate by a crude share to reconstruct an incidence rate.[1,2]

## 2. DEN01: the report-specific retrieval barrier was overcome

The prior science memo relied on an indexed definition and reported failed live access. This review extracted the interpretation and export links embedded in the original HTML and retrieved them successfully using public GET requests. Interpretation responses were captured at approximately 23:47 UTC on November 8; exports at approximately 23:51 UTC. The two interpretation pages identify the matching 2019–2023 CRC population and describe the percentage as late-stage cases relative to all-stage cases. They still do not explicitly specify unknown/unstaged, DCO or autopsy membership.[3]

The four current exports match **3,696 core measurement cells** across all 336 retained counties: rural/urban status; rate and its two interval limits; average annual count; and late-stage share where applicable. Suppressed values also match. This comparison did not audit trend or rank cells. The exports supply unique, consistent county FIPS across all/late tables. `independent/current_report_alignment.json` records the hash-bound comparison; `current_export_county_identity.csv` is a contemporaneous identity supplement.[4]

**Temporal boundary:** the embedded URL establishes that an interpretation resource was linked from the archive. Today's successful retrieval and matching printed values establish report-specific meaning now. They do not establish that the same wording or selection logic was available at an earlier release or decision cutoff. The original archive and the current response remain separate evidence objects. No historical dictionary was located in the retained material.

Rounding cannot settle exact denominator membership. Under five years, nearest-integer annual means, nearest 0.1-point shares and a common numerator, all **254 complete counties** admit at least one all-case denominator compatible with the printed values. Hinds admits three such count pairs; Harris admits 25. None is identified as the true count pair.[2]

The independent audit also constructs arithmetic examples with and without a hypothetical denominator exclusion that both fit the Hinds/Harris displays. These are labeled **nonidentification witnesses**, not recovered counts or estimated unknown-stage cases. Under those restrictive arithmetic assumptions, the maximum compatible exclusion is six cases for Hinds and 12 for Harris. That conditional mathematical result is not an empirical bound on registry unknown stage: the assumptions could fail if the numerator, source selection, period or rounding rule differs. Suppressed county counts were never reconstructed. The witnesses belong in the technical result, not an executive claim of recovered clinical data.[2]

**Closure evidence needed:** an authoritative, release-specific State Cancer Profiles selection statement, SEER*Stat session or equivalent source algorithm that specifies the numerator and every denominator inclusion/exclusion; its release/availability date; and privacy-compatible unrounded aggregate reconciliation. Rules for a different CDC visualization or different report release do not meet this requirement.

## 3. DEN02: a complete common partition is specified; the county inputs are absent

The retained/current official standards permit a common 19-group partition: age 0; 1–4; five-year groups 5–9 through 80–84; and 85+. The exact 2000 U.S. Standard Population, Census P25-1130, totals **274,633,642**. Ages 85–89 contribute **2,678,567** and ages 90+ **1,580,606**, summing to the 19-group 85+ value **4,259,173**. All younger standard groups match. The full source-derived mapping and weights are in `independent/common_age_partition_spec.json`. It uses the actual standard-population column, not rounded Standard Million weights.[5]

To collapse a county's 20 groups, **add 85–89 and 90+ event counts and matched person-years first**, then calculate the combined rate and apply the 85+ weight. Averaging the two published rates would be wrong. Every younger age band's contribution, stage selection, population revision, geographic definition and period must also align. A valid uncertainty interval requires the appropriate agency method and underlying inputs.

For the same county, holding those other features constant:

`R20 − R19 = W × (q − p) × (r85 − r90)`

Here W is the 85+ standard weight, q the standard proportion aged 85–89 within 85+, p the corresponding observed person-time proportion, and r85/r90 the age-specific rates. Exact rational-number fixtures independently verify positive, negative and zero effects. A 20-group method does not uniformly raise or lower the rate.[2]

To account for the entire printed 6.0 contrast by changing one county's age partition alone, the absolute top-age rate difference must be at least **615.180375 per 100,000** under the stated fixed-method assumptions. Allowing a rounding-envelope infimum of 5.9 gives **604.927369**. These are necessary rather than sufficient conditions; they are neither observed age-specific differences nor estimated county corrections. They do not reject the age-partition explanation as implausible.[2]

The archive has all-age aggregates, not county age-specific late-stage numerators and matched population person-years. No empirical harmonized Hinds/Harris rate can therefore be calculated from it. Those data were not located in the retained local source material or the retrieved report endpoints; this is not a claim that the quantities do not exist elsewhere. The next acquisition specification is precise: authorized, nonidentifying age-band late-stage counts, matching person-years and population revision, source selection/denominator metadata, suppression flags and interval method for the same county/source/period. No access request, clinical data stream or new data-use agreement was initiated.

Different pipeline labels are documented; different clinical classifications for 2019–2023 are not proved. The SEER expansion of certain regional codes concerns pre-2018 records and cannot by itself explain this window. Direct versus derived stage equivalence, exceptions and ascertainment remain untested; do not replace that uncertainty with a presumed classification conflict.[2]

## 4. DEN03: missingness is observed, heterogeneous and consequential

The archived HTML/CSV frames join completely. Every incomplete comparison below corresponds to source suppression, not a failed join or an observed zero.[1,2]

| State/group | Eligible counties | Complete | Incomplete | Incomplete fraction | Both all/late suppressed | Late only suppressed |
|---|---:|---:|---:|---:|---:|---:|
| Mississippi: all | 82 | 75 | 7 | 8.5% | 2 | 5 |
| Mississippi: rural | 62 | 57 | 5 | 8.1% | 2 | 3 |
| Mississippi: urban | 20 | 18 | 2 | 10.0% | 0 | 2 |
| Texas: all | 254 | 179 | 75 | 29.5% | 60 | 15 |
| Texas: rural | 168 | 103 | 65 | 38.7% | 50 | 15 |
| Texas: urban | 86 | 76 | 10 | 11.6% | 10 | 0 |

There are 254 complete and 82 incomplete county comparisons. Texas has a pronounced rural coverage loss; Mississippi does not show the same direction of rural/urban missingness in this frame. Pooling states would hide that distinction. These fractions weight counties equally, not residents, patients or cases. The gap does not establish inequitable care or absence of services. It does identify a limitation in what the measurement system can see. Source suppression must remain missing, with original tokens retained.[2]

The source suppresses fewer than 16 records **over the whole reporting period**. The analysis's later filter requiring at least 16 average annual late-stage cases is a different and much stronger precision sensitivity. With nearest-integer annual rounding, a displayed 16 can correspond to 78–82 cases over five years; it is not the source disclosure threshold.[1–4]

## 5. DEN06: both the residual pattern and the changing sample must be retained

Using a share-distance window of at most 0.5 percentage points and a late-stage rate gap of at least 5 per 100,000, independent calculations reproduce the pinned within-state results. Selected thresholds are shown below; the JSON contains thresholds 0, 4, 8, 10, 16, 25 and 50 and share windows 0.3, 0.5 and 1.0.[2]

| State | Annual late-count minimum | Counties retained | Rural retained | Near-share pairs | Large-rate-gap pairs | Distinct counties in those pairs |
|---|---:|---:|---:|---:|---:|---:|
| Mississippi | 0 | 75 | 57 | 130 | 65 | 58 |
| Mississippi | 8 | 52 | 36 | 84 | 37 | 32 |
| Mississippi | 16 | 15 | 6 | 4 | 0 | 0 |
| Mississippi | 25 | 7 | 1 | 1 | 0 | 0 |
| Texas | 0 | 179 | 103 | 844 | 377 | 153 |
| Texas | 8 | 119 | 51 | 496 | 199 | 97 |
| Texas | 16 | 72 | 16 | 207 | 63 | 48 |
| Texas | 25 | 49 | 2 | 119 | 24 | 26 |

Mississippi's 16-annual-count result concerns only 15 retained counties and four near-share pairs. Zero qualifying large gaps in that small selected set is not evidence of equivalence, no disparity or no underlying mechanism. Texas retains 63 qualifying pairs, but those involve 48 counties; they are not 63 independent replications. Its sample is increasingly weighted toward larger/urban counties. At the same threshold, 51 Texas pairs are robust to the specified worst-case rounding perturbation and 33 have disjoint marginal rate intervals. Disjoint intervals do not resolve dependence, multiplicity or causality.[2]

| Rival explanation | What distinguishes it | What this review establishes |
|---|---|---|
| Rounded displays create the apparent count inconsistency | Exact unrounded counts and share selection reproduce the percentage | Ordinary rounding permits multiple compatible counts; inconsistency is not proved |
| Stage-denominator exclusions alter case shares | Release-specific stage/unknown/DCO/autopsy selection plus stage-completeness aggregates | Current all-stage wording verified; exact membership unidentified |
| Age partition creates some/all cross-source rate contrast | Same-county matched age-band cases and person-years recomputed under both partitions | Formula and normative common partition verified; empirical correction unavailable |
| Small counts/selection account for the pattern | State-specific sensitivity with fixed definitions, retained-sample composition and missingness displayed | Large changes in sample composition; MS and TX differ; no common mechanism proved |
| Differences in disease incidence, prevention, access or follow-up drive observed rates | Authorized longitudinal exposure, screening, stage, referral and completion data with a defensible comparator | Aggregate county data do not distinguish these mechanisms |

## 6. Verification, policy and remaining acceptance

`VALIDATION_RECEIPT.json` records the exact commands, Python environment, timestamps, source/code/output hashes and retained logs. **13 tests passed, zero failed, zero skipped**, using the real archive. Checks include tampered archive rejection, suppressed-versus-zero handling, malformed inputs, period/annual threshold distinction, prohibition on suppressed-count reconstruction, nonunique denominator examples, signed/null age effects, state-specific sample selection and independent agreement with the pinned implementation. The current-export comparison also exited zero. These are scientific/software reproducibility checks, not patient outcome trials.

`POLICY_ADOPTION_RECEIPT.json` records six loaded instruction/source-contract files, their SHA-256 and Git blobs at integration reference `039761a706534e8d21ffdbe71c616646ee9ef539`. This includes IRON-ENG-001 v1.0.0, the stakeholder standard v1.1, federated evidence standard, session/agent contract, AGENTS and the scientific protocol's source-comparability requirements. The root reviewer must acknowledge the scoped inapplicability of browser, database/auth and deployment checks, since this work changed only isolated research artifacts. They are not represented as passing checks.

The archive receipt reports revision `73455a439f950ffa0644d5714843b06b173f029a`; the existing science investigation documents runtime checkout/environment `312577b8e43efadaceb4b834dc524dc11368d3fe`. Merge ancestry and matching acquisition-code blobs do not explain that runtime receipt binding. This review preserves the contradiction and does not rewrite original evidence. Hash integrity permits descriptive replay; it does not authenticate every claim in the acquisition receipt.[2]

| Remaining action | Proposed accountable role | Acceptance evidence | Review trigger |
|---|---|---|---|
| Exact DEN01 source-selection semantics | Registry/source-methods reviewer | Release-bound original selection/session and explicit unknown/DCO/autopsy handling | Before exact-denominator or cross-source rank/causal claims |
| DEN02 empirical harmonization | Registry epidemiology/data-methods reviewer | Nonidentifying age-specific cases/person-years; reproduced common-partition rates and valid intervals | Before corrected county rates or partition-attributed explanation |
| Missingness/generalizability assessment | Epidemiology/equity reviewer | Prespecified target population and population-weighted coverage; sensitivity without disclosing suppressed cells | Before generalizing beyond the observed county frame |
| Final changed-code and report review | Root integration owner plus a distinct reviewer | Exact final commit, output/claim reconciliation and retained review finding | Before accepting integration of this audit |

These are proposed responsibilities and measurable closure criteria, not evidence that an outside reviewer has accepted an assignment. There has been no external correspondence or private clinical data collection.

## 7. Integration handoff

All deliverables are in `/workspace/scratch/ad20f6f1a514/denominator_adjudication/`. Recommended code/report location after root review: `research/fragmentation-harm/denominator_adjudication/`, preserving relative `pinned/`, `independent/` and `source_retrieval/` paths where needed. Retain the ZIP in the authorized evidence store; do not republish the archive or assume it is durable merely because it exists locally. Root controls final repository integration and durable storage.

From this directory, the core replay is:

```sh
python adjudicate_denominators.py /path/to/county-originals-ddee039a.zip --out independent
DIS_NCI_ARCHIVE_PATH=/path/to/county-originals-ddee039a.zip python -m unittest -v test_adjudicate_denominators.py
python compare_current_exports.py /path/to/county-originals-ddee039a.zip --sources source_retrieval --out independent
```

Set `CHAINWEB_ARCHIVE` and `DIS_NCI_ARCHIVE_PATH` to the same original ZIP for root's broader suite. The retrieval script deliberately obtains **new** current-response receipts; rerunning it into the existing evidence directory would change temporal evidence. Use a new destination for later retrievals and compare versions rather than overwrite the retained snapshots.

### Sources and retained evidence

1. Hash-verified original ZIP and its `MANIFEST_SHA256.json`; four county HTML tables and corresponding extracted CSVs. Per-file hashes and acquisition identity: `independent/independent_denominator_results.json`, `provenance`.
2. Science commit and exact code: `pinned/source_receipt.json`; independent calculations: `independent/independent_denominator_results.json`; scope/validation: `VALIDATION_RECEIPT.json`. Prior S1c ledger remains attributable to its original author and version.
3. National Cancer Institute. State Cancer Profiles interpretation linked from the retained 2019–2023 colorectal reports: [Mississippi](https://statecancerprofiles.cancer.gov/incidencerates/index.php?age=001&areatype=county&cancer=020&datatype=1&race=00&ruralurban=0&sex=0&stage=211&statefips=28&type=incd&year=0&sortVariableName=name&sortOrder=asc&output=2&referrer=table) and [Texas](https://statecancerprofiles.cancer.gov/incidencerates/index.php?age=001&areatype=county&cancer=020&datatype=1&race=00&ruralurban=0&sex=0&stage=211&statefips=48&type=incd&year=0&sortVariableName=name&sortOrder=asc&output=2&referrer=table). Accessed November 8, 2026. Exact retained bytes/URLs/hashes: `source_retrieval/retrieval_receipt.json`.
4. NCI. Four State Cancer Profiles report exports linked from the original HTML, accessed November 8, 2026. Exact URLs, times and hashes: `source_retrieval/export_and_standard_retrieval_receipt.json`. Match proof: `independent/current_report_alignment.json`.
5. NCI. [Standard Populations—19 Age Groups](https://seer.cancer.gov/stdpopulations/stdpop.19ages.html) and [20 Age Groups](https://seer.cancer.gov/stdpopulations/stdpop.20ages.html). Accessed November 8, 2026. Hash-bound snapshots and derived full mapping: `source_retrieval/` and `independent/common_age_partition_spec.json`.

No statement in this report claims Google Scholar verification of these agency tables or local computations. The earlier separate clinical review also did not obtain exact-match Scholar verification and must retain that limitation.

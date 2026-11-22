# CRC comparability correction and reporting-accountability record

Date: November 21, 2026 (America/Chicago). Owner: Terry Flood. Scope: retained Hinds County, MS (28049), and Harris County, TX (48201), colorectal cancer, 2019–2023, all races including Hispanic, both sexes, all ages. County figures do not become Jackson-city, Houston-city, or FQHC patient estimates.

## Decision and evidence boundary

The source investigation and public-data reanalysis are completed. The retained late-stage shares remain **63.7% and 63.4%**, but their small difference is not identified independently of the original denominator choices. Exact enumeration gives **0.234569165–0.371621225 percentage points** when each site's late-stage denominator equals its all-stage table count. Allowing compatible denominator exclusions and expressing both shares as late/all-stage-table cases gives **−0.425906676–0.371621225 percentage points**. These are conditional identification bounds, not confidence intervals, recovered stage counts, or an equivalence finding.

A separate, supported descriptive comparison now uses CDC's common publication and processing framework: **589 versus 8,661 recorded primary CRC cases** in 2019–2023, with age-adjusted all-stage incidence **46.4 versus 38.0 per 100,000**. Both rates use the same 19-group 2000 U.S. standard. Hinds's published rate is approximately **22.1% higher**, calculated from rounded rates; Harris has more recorded cases. The proposal uses this population-level evidence and qualifies the late-stage finding. Neither comparison measures FQHC patient burden, screening effectiveness, equal access, system performance, or causation. [7,8]

The existing exact-stage claim gate remains **UNKNOWN / not established** because release-specific mapping does not identify every original processing choice. This is the completed analysis's finding, not a code defect to override. The available public records do not contain the exact county-stage inputs needed for an exact harmonized estimate. The engineering correction continues to prevent a note, passing test, or invented count from substituting for that evidence.

This is an AI-assisted engineering and source-document review. No qualified human scientific acceptance, agency response, clinical validation, or patient benefit is asserted. Terry authorized remediation and merge after testing and independent review; no agency correspondence is authorized by this record.

## Before → change → reason → verification → limits

Before: PR #122 merged at `c24a6fb0ec95afce69ab32ec769b87ac0950b29b`. Its strict check accepted different stage variables when any nonempty equivalence note was present; matching names also bypassed differences in definitions or versions. Existing CI ran the advisory validator and ten legacy controls without exercising that strict path. The real record printed PASS in advisory mode although its stage variables were undisclosed. The record also conflated the case-share denominator with the population-rate denominator and described hypothetical count ratios too precisely.

Change: extend the existing validator, claim-admission CLI and CI regression suite; retain descriptive inspection; remove name/note-only acceptance; require source-bound stage specifications and complete category mapping, reproducible count arithmetic, and an independently supplied accepted-review digest for a comparative-claim gate. Inputs declared synthetic are rejected at that gate; verifying the truth of source and reviewer declarations remains the operator's responsibility. The record explicitly retains unresolved science and separates the two denominators. The current dossier and FQHC brief receive a measurement qualification.

Reason: validation of a document's structure, consistency of an evidence package, operator acceptance of a reviewed artifact, and scientific truth are different decisions. A digest binds bytes to the operator's selected review; it is not a digital signature, identity verification, or proof that the review's assertions are correct.

The CLI requires an explicit `--require-comparable` request before accepting a review digest. A digest cannot silently promote a structure-only inspection into claim admission. A contract with validation errors cannot emit a successful per-record claim gate, even when the record's declared arithmetic and review binding are internally consistent.

For an evidence record submitted to the claim gate, `late_stage_share_percent` identifies the recalculated case share and must reconcile with the exact declared counts. An original published share that uses another denominator or rounding belongs in the explicitly separate `published_late_stage_share_percent` field. The assessment returns the calculated comparison and its descriptive scope. The unresolved real record retains the publisher's original values for inspection and cannot pass the claim gate; no harmonized result is invented.

Verification: test commands and results are retained below and in the resulting pull request. Independent final review is bound to the candidate commit; a historical passing run cannot substitute. Actual source checks cover the six retained November 8 supplements listed in the current contract and their original receipts. Original source bytes are preserved.

Limits: this boundary governs this research CLI and its CI tests. It does not certify every application export, retroactively validate prior reports, or enforce other agents' behavior. Authentication, database, clinical workflow, production deployment and field outcomes are outside this headless research change. The completed analysis and the evidence conditions for any future stronger claim are distinguished below.

## Measurement corrections

The retained exports display Hinds/Harris late-stage shares of **63.7% / 63.4%**, all-stage annual counts **118 / 1,732**, and late-stage annual counts **75 / 1,098**. These are rounded published values. The displayed difference is **0.3 percentage points**. No exact difference or confidence interval is recovered from those displays.

The existing [November 8 denominator audit](W2_S1C_DENOMINATOR_AGE_PROVENANCE_LEDGER_2026-11-08.md) identifies three compatible Hinds count pairs and 25 Harris pairs under specified rounding assumptions. `375/589` and `5490/8660` are two illustrative compatible choices, not identified registry counts. The PR #122 calculation of `0.2723134290` percentage points and its one-/two-case sensitivity are therefore hypothetical demonstrations. They must not be cited as observed precision. Rounding alone is not evidence of an agency error. The 0.5-pp share/rate margin is not an approved equivalence margin.

Both report-specific interpretation pages define late stage broadly as regional or distant, and the percentage as late-stage cases relative to all-stage cases. They do not enumerate unknown/unstaged, blank/unclassifiable, death-certificate-only, or autopsy-only denominator membership. Population denominators in the rate footnote do not answer this case-denominator question. CDC's separate USCS display conventions must not be imported without source-specific evidence.

Different pipeline labels do not demonstrate incompatible stage classifications. The completed release-specific crosswalk documents directly assigned SS2018, NAACCR item 764, as the NPCR input and Derived SS2018, item 762, as the SEER default for diagnoses from 2018 onward. Both map codes 2/3/4/7 to regional-or-distant disease. NCI's expanded regional recode concerns pre-2018 records. A documented aggregate reconciliation could resolve the remaining original-extract questions without requiring patient-level data. [1,2,9,10]

The publisher's release history establishes that data through 2023 were added in September 2026 from November 2025 submissions. It also records the February 2026 change from 19 to 20 age groups for SEER incidence, with NPCR incidence unchanged. This resolves broad chronology, not all column-specific calculation details. Age standardization concerns the population rates, not the crude case shares. [3]

## Completed source work and reproducible results

### Retained evidence and cohort definition

The recovered original archive has SHA-256 `ddee039ad52fbe27b694e3e64a01d7d5ec2b0e9cb24b535fce47b8434dba727a`; all 18 internally manifested members were verified. The archive contains unrelated survey material, so the repository retains a clearly labeled **CRC-only derived package**, not a renamed replacement for the whole archive. Its four HTML originals and four extracted CSV tables retain their original bytes. The derived package's SHA-256 is `39b339425f7bbba4dac5e4278d8ae43dd289b4fd74a9e3eec2d41ccae8578e66`. The original acquisition/workflow revision discrepancy remains visible in the provenance; matching source bytes do not erase it.

The [machine-readable crosswalk](source_reconciliation/stage_selection_crosswalk.json) specifies the malignant CRC cohort, exact site and histology selections, primary-cancer case unit, stage categories, unknown/invalid handling, and a separately labeled common-CDC stage specification. Site Recode ICD-O-3/WHO 2008 includes appendix and excludes anus; malignant behavior 3 defines the invasive cohort. Codes 0 and 8 are outside its intended stage categories, but a discordant stage code on a selected invasive case must be accounted for rather than silently removed. [9,10]

| SS2018 code | Target classification | Treatment |
| --- | --- | --- |
| 1 | Localized | Known stage, not late |
| 2, 3, 4 | Regional | Late |
| 7 | Distant | Late |
| 9 | Unknown/unstaged/unspecified, including DCO category | Enumerate separately; not observed late |
| 0, 8 | In situ or benign/borderline | Outside intended invasive stage categories; review discordance |
| 5, 6, blank | Invalid SS2018 code or missing value | Account for explicitly; do not silently recode |

These are NAACCR item codes, not an assumption about a software wrapper's numeric encoding. The November 2025 SEER transmission specification accepts Derived SS2018 and its EOD inputs **when available for Texas 2018–2021**, overlapping three study years. That exception neither proves missing data nor identifies the fallback actually used. It prevents treating a general default dictionary as an execution trace. [11]

### Late-stage reanalysis

The calculation enumerates integer five-year counts compatible with annual counts rounded to integers and percentages rounded to one decimal. It assumes the same late-case numerator and underlying case universe within each paired all-stage/late-stage source. It reports every compatible configuration and extreme witness; it never selects a hypothetical configuration as the observed count. [12]

| Model | Hinds configurations | Harris configurations | Joint combinations | Hinds minus Harris, percentage points |
| --- | ---: | ---: | ---: | ---: |
| Published-percentage rounding only | — | — | — | Greater than 0.20 and less than 0.40 |
| Same all-case denominator within each source | 3 | 25 | 75 | 0.234569165 to 0.371621225 |
| Allow compatible denominator exclusions; express both as late/all-stage-table cases | 18 | 200 | 3,600 | −0.425906676 to 0.371621225 |

For concise reporting, the last interval is rounded outward to **−0.43 to 0.38 percentage points**. Its inclusion of zero shows that the direction of this small contrast is not identified under those denominator alternatives. This interval does not account for every possible classification error, sampling variation, or unverified cohort difference. No formal equivalence margin or test was specified.

Two distinct unknown-stage sensitivity models are also calculated: removing unknown cases from the denominator, `p_known = p_all / (1 − u)`, and assigning an unknown fraction to late disease, `p_complete = p_all + z*u` when shares are proportions. With independent hypothetical unknown fractions from 0% to 1%, their percentage-rounding envelopes are respectively approximately **−0.441 to 1.044** and **−0.8 to 1.4 percentage points**. These scenarios use a chosen sensitivity range and percentage rounding; they are separate from the count-constrained enumeration and are not county missingness estimates. [12]

### Common-source all-stage comparison

The independently extracted records come from CDC's June 2026 USCS release, November 2025 submissions, `BYAREA_COUNTY.TXT`. Selection requires incidence, Colon and Rectum, All Races, Male and Female, 2019–2023, and the exact state/county/FIPS. The official ZIP SHA-256 is `291765c997e59cddc7bc9bdd5852ea18f52696a58e2c212f5eb6b72c680b6df7`. The [retained rows](source_reconciliation/uscs_exact_allstage_county_rows.json) preserve every selected field. [7,8]

| Measure | Hinds County | Harris County |
| --- | ---: | ---: |
| Recorded primary CRC cases, five years | 589 | 8,661 |
| Pooled annual population estimates | 1,111,243 | 23,887,940 |
| Crude annual incidence per 100,000, calculated | 53.0037 | 36.2568 |
| Published age-adjusted incidence per 100,000 | 46.4 | 38.0 |
| Published 95% confidence interval for that rate | 42.6–50.5 | 37.2–38.9 |

The crude rate is `100000 * cases / summed annual population estimates`, a person-year approximation rather than a cohort of unique residents followed individually. The age-adjusted contrast is **8.4 per 100,000**, with a ratio of **1.22105**, calculated from published rounded rates. No interval for that contrast is invented. CDC documents a common 19-group standard and presents dual-funded registry data as submitted to CDC; Texas is not described as exclusively NPCR-funded. The portals share registry systems and are not independent epidemiologic replications. The CDC exact all-stage totals are **not substituted into the old SCP late-stage ratios**, because identical case universes have not been established. [8,13]

### Access finding and closure scope

CDC's release-specific public-use documentation, page 66, says county-level records are excluded under state data-sharing agreements and identifies the restricted-access Research Data Center route. The public county aggregate table contains no stage field; the inspected public stage endpoint contains state-level records and no Hinds or Harris county records. Thus the available release cannot supply the exact county-stage categories for a new uniform-stage calculation. This is a verified source boundary, not an assumed website problem. [14]

The authorized public-source investigation, category crosswalk, bounded reanalysis, common-source all-stage comparison, study correction, and reproducibility implementation are complete. An exact newly harmonized late-stage estimate would be a **new analysis requiring additional source evidence**: a documented aggregate extraction/reconciliation or authorized restricted data. It is neither claimed complete nor needed to use the corrected, narrower descriptive finding. No agency response or human scientific attestation has been fabricated.

Reproduce the committed result without a network request:

```bash
python research/fragmentation-harm/reconcile_crc_sources.py --check
python -m unittest discover -s research/fragmentation-harm -p 'test_reconcile_crc_sources.py' -v
```

Supply `--cdc-archive /path/to/USCS-1999-2023-ASCII.zip` to also verify the official ZIP and re-extract the two CDC records. An explicitly supplied bad archive is rejected without fallback.

The first command validates the retained CRC subset, replays its source tables, calculates the bounded findings and separate CDC contrast, and checks the deterministic [result file](source_reconciliation/results.json). CI runs this source replay on every affected change. The complete original archive was also supplied to the legacy source-dependent tests locally; the CRC-only subset is not misrepresented as that full-archive replay. Exact integrated test totals and reviewed commit identities are recorded in the pull request.

## Agency reporting accountability

State Cancer Profiles is a joint NCI–CDC service. The initial requested clarification owner is its publishing/methods team; the publisher can identify whether a question belongs to SEER, NPCR, or an individual registry. These are requested responsibilities, not accepted agency commitments. [4]

| ID | Finding and evidence | Consequence | Required clarification or correction | Closure evidence |
| --- | --- | --- | --- | --- |
| AGENCY-META-01 | Two retained 2019–2023 interpretation pages describe an all-stage case denominator but omit exact unknown-stage and DCO/autopsy membership. | An independent reader cannot reproduce every case-selection decision. | Publish the exact numerator/denominator inclusion and exclusion rules. | Release-bound authoritative specification and a privacy-compatible reconciliation to the displayed values. |
| AGENCY-META-02 | Reports name default stage fields but permit alternate variables without identifying whether they were used here. | Exact executed stage lineage is unresolved. | Identify field, version, derivation, fallback rules and exception disposition for both extracts. | Source-supported code/category mapping, or a substantiated identity mapping. |
| AGENCY-META-03 | Rate footnotes distinguish 19 NPCR/20 SEER age groups; the CI*Rank footnote refers to 19 for both. | Readers may infer that displayed rates and rank calculations use identical methods. | Explain column-level rate/rank linkage and applicable standard population. | Explicit method linkage and reproducible calculations where available. Different calculations may be legitimate; an erroneous rate has not been demonstrated. |
| AGENCY-META-04 | The source query uses moving `year=0` and the portal publishes successive releases. | An unchanged URL does not identify immutable observations. | Identify stable versioned exports, dictionaries and analysis sessions. | Release identity reproducing the same population, period and method. This is a reproducibility improvement request, not a proven outage or data error. |
| AGENCY-META-05 | The Mississippi 2021 manual's SS2018 allowable-values heading includes code 5, while its own following code table omits 5; NAACCR v25's allowed values exclude it. | A version-specific public instruction is internally inconsistent. No affected patient record is identified. | Registry manual owner should reconcile the heading/table and publish an erratum or versioned clarification. | Corrected public manual or authoritative clarification identifying the affected version. |

Our responsibility is to preserve source bytes, dates and uncertainty, avoid importing another interface's methods, and correct our own false precision. The publisher's reporting responsibility is to make its methods sufficiently specific for its published comparisons. AGENCY-META-05 is a demonstrated documentation inconsistency in a named version. No erroneous patient record, incompatible staging, negligence, or misconduct has been established. [15]

### Technical clarification request — prepared, not sent

Proposed route: the official [State Cancer Profiles contact form](https://statecancerprofiles.cancer.gov/contact/). [5]

**Subject: Release-specific stage and denominator documentation for Hinds and Harris CRC estimates, 2019–2023**

We are conducting a reproducibility review of your Hinds County, Mississippi (28049), and Harris County, Texas (48201), colorectal estimates for 2019–2023, all races including Hispanic, both sexes, and all ages. Our retained November 8, 2026 exports display late-stage case percentages of 63.7% and 63.4%. The reports define late stage as regional or distant and describe its percentage relative to all-stage cases.

Please provide or identify the release-specific evidence resolving these questions:

1. Which exact stage fields, versions and derivation rules generated each extract? Were alternate-variable or fallback rules applied? What maps each source code to localized, regional, distant, or unknown stage?
2. Which unknown/unstaged, blank/unclassifiable, death-certificate-only and autopsy-only cases enter the numerator and denominator? What primary-site, histology and malignant-behavior selections apply, and do they match the all-stage table?
3. Is a release-specific SEER*Stat session or executable selection specification available? Where disclosure rules permit, can you supply aggregate totals or perform a reconciliation of the published percentages and rounded annual counts? Patient-level records and suppressed cells are not requested.
4. Which age partitions and standard-population versions generated the displayed incidence rates and CI*Rank calculations? Are their rate inputs identical? Is a common-partition aggregate comparison available?
5. Which immutable release identifier and method revision should researchers cite? If a reporting error is identified, which outputs and corrected versions are affected?

Our completed source review also identifies the Texas 2018–2021 transmission exception in the November 2025 SEER requirements. Please identify its disposition in this extraction. Separately, the Mississippi 2021 manual's SS2018 heading includes code 5 while its code table does not; please route that version-specific inconsistency to the manual owner for clarification.

We have identified documentation questions and a specific manual inconsistency; we have not established that the county values are wrong. A public clarification linked from the exports would help researchers reproduce the results and avoid unsupported equivalence or health-system-performance claims.

## Learning and closure ownership

| Responsibility | Corrective action | Owner and review trigger |
| --- | --- | --- |
| Engineering | Every reproduced bypass becomes a behavioral regression; CI executes the actual strict/admission path, with successful and denied cases. | ISS repository maintainer; exact candidate review and every affected change. |
| Scientific record | Completed: preserve source scope and values; replace unsupported implications with the bounded late-stage result and supported all-stage comparison in the current dossier and FQHC brief. | Terry as research owner; review on new source evidence or proposed stronger use. |
| Source clarification | Completed evidence record and unsent technical request distinguish demonstrated manual inconsistency from unresolved execution details. | Terry authorizes any dispatch; proposed publisher methods team responds if contacted. No response deadline or accepted agency commitment is presumed. |
| Reanalysis | Completed: source-documented mapping, exhaustive compatible-count enumeration, separate unknown-stage scenarios, and common-source all-stage extraction. Exact original stage processing is a stated identification limit. | Research-methods analyst and independent AI reviewer; a new exact-stage claim requires additional documented inputs and qualified acceptance. |
| Claim approval | Keep document validity, evidence consistency, calculation reproduction and scientific acceptance separate. | Accountable human reviewer; no accepted review digest exists for the real county comparison. |
| Sustainment | Changes in source version, definition, denominator, population, mapping or calculation invalidate prior review bindings. Preserve earlier failures and corrections. | ISS maintainer and research owner; triggered by a changed source or proposed claim. |

Rollback: revert the bounded validator/CLI/workflow change through a reviewed commit if it fails its intended contract; retain the source snapshots and this correction history. A rollback must not silently reinstate a scientific approval claim for unresolved data.

## Verification record

The baseline false passes were reproduced on `c24a6fb0ec95afce69ab32ec769b87ac0950b29b`; PR #124 merged the engineering correction at `9be8298b08c18608984de5e70adb12f22ac77ef3`. The subsequent source investigation and bounded reanalysis extend that accepted code. Final integrated candidate test counts, independent review and merge identity are recorded in the follow-up pull request rather than guessed before execution. Passing tests reproduce the stated calculations and guards; they do not convert unidentified source processing into an exact scientific estimate.

Final local integration executed **315 research tests and 13 denominator-adjudication tests: 328 passed, zero skipped**, with both legacy archive environment variables pointing to the verified original. Ten shipped positive/rejection fixtures also passed. The retained CRC subset and the original CDC ZIP both replay successfully; the actual v0.2 inspection succeeds while the unsupported exact-stage claim is denied. The [execution summary](source_reconciliation/verification/execution_summary.json) binds source/code hashes, commands, outputs and historical checkpoints. Independent review separately reproduced the calculations and challenged the source/scope checks.

Independent review of the first correction identified stronger claims admitted by a descriptive review, conflicting published and recalculated shares, and malformed metadata exceptions. Hosted review identified a review-digest flag interaction; a follow-up independent check also found successful per-record output inside an invalid contract. These reproduced failures are retained as regressions and reviewed at the replacement commit. A passing earlier test suite did not close the later findings.

## Primary and retained sources

1. NCI. [Localized/Regional/Distant Stage Adjustments, November 2022 and later releases](https://seer.cancer.gov/seerstat/variables/seer/yr1975_2020/lrd_stage/index.html). Inspected November 21, 2026.
2. CDC. [Cautionary Notes: Stage](https://www.cdc.gov/united-states-cancer-statistics/public-use/cautionary-notes.html). Updated June 1, 2026; inspected November 21, 2026.
3. NCI–CDC. [State Cancer Profiles release history](https://statecancerprofiles.cancer.gov/about/history.html). September and February 2026 entries; inspected November 21, 2026.
4. NCI–CDC. [About State Cancer Profiles](https://statecancerprofiles.cancer.gov/about/). Inspected November 21, 2026.
5. NCI–CDC. [Contact](https://statecancerprofiles.cancer.gov/contact/). Inspected November 21, 2026; no submission made.
6. Retained exact report supplements: [interpretation-page receipt](denominator_adjudication/source_retrieval/retrieval_receipt.json) and [CSV-export receipt](denominator_adjudication/source_retrieval/export_and_standard_retrieval_receipt.json). The six relevant source bytes match their original November 8 digests; the current contract lists each exact source and digest.
7. CDC. [USCS downloadable data tables](https://www.cdc.gov/united-states-cancer-statistics/dataviz/data-tables.html); [1999–2023 ASCII archive](https://www.cdc.gov/cancer/uscs/USCS-1999-2023-ASCII.zip). June 2026 release. Exact selected rows and archive receipt are retained in `source_reconciliation/`.
8. CDC. [USCS Data Visualizations Tool Technical Notes, 2025 Submission, 1999–2023](https://www.cdc.gov/united-states-cancer-statistics/technical-notes/pdf/uscs-data-visualizations-tool-technical-notes-2023-june-508-final.pdf). Released June 2026. Pages 6, 12 and 16 cover source pathway, population denominators and common age standard.
9. NCI. [SEER Research Plus Data Description, November 2025 submission](https://seer.cancer.gov/data-software/documentation/seerstat/nov2025/TextData.FileDescription-nov2025.pdf). April 2026; page 42. [SCP FAQ](https://statecancerprofiles.cancer.gov/faq.html) and [site recode](https://seer.cancer.gov/siterecode/icdo3_dwhoheme/).
10. NAACCR. Version 25 data dictionary: [item 764](https://apps.naaccr.org/data-dictionary/data-dictionary/version=25/data-item-view/item-number=764/) and [item 762](https://apps.naaccr.org/data-dictionary/data-dictionary/version=25/data-item-view/item-number=762/). Use explicit allowed values and category tables.
11. NCI. [SEER November 2025 Data Items](https://seer.cancer.gov/tools/seer.nov25.dataitems.pdf). September 10, 2025; physical page 5, Texas exceptions for items 762/772/774/776.
12. Completed calculations: [numeric implementation](denominator_age_sensitivity.py), [retained-source consumer](reconcile_crc_sources.py), and [deterministic results](source_reconciliation/results.json). Independent integer/Fraction enumeration verified the configurations, extrema and witnesses.
13. NCI. [Calculating Age-Adjusted Rates, Step 2](https://seer.cancer.gov/seerstat/tutorials/aarates/step2.html). Summed population denominator for matching selected years.
14. CDC. [USCS Public Use Database Technical Documentation, November 2025 submission, 2001–2023](https://www.cdc.gov/united-states-cancer-statistics/public-use/pdf/uscs-public-use-database-technical-documentation-2001-2023-final-508.pdf). Physical page 66. The stage endpoint retrieval receipt is retained in `source_reconciliation/cdc_stage_data_receipt.json`.
15. Mississippi Cancer Registry. [Reporting Manual, Revised 2021](https://www.umc.edu/CancerInstitute/Cancer-Research/Cancer-Registries/Mississippi%20Cancer%20Registry/Resources1/MCR-Manuals/2021.html), Summary Stage 2018 item 764 heading and following code table. Exact source hash and excerpt are retained in the [method-source manifest](source_reconciliation/evidence_manifest.json) and [located excerpts](source_reconciliation/evidence_excerpts.json).

Raw primary documents and the original CDC downloads are retained in `CRC_Source_Reconciliation_Evidence_2026-11-21.zip` (SHA-256 `78411793014ab0cfae96c36ad81c3682ca4d310916b3974727b8949f18c43e56`). The existing FQHC Word and PDF are saved as version 3; both retain 14 pages, with only the comparison and reference pages changed. Artifact hashes and render checks are in the [artifact verification receipt](source_reconciliation/artifact_verification.json). Failed historical URLs remain failures in the manifest; an inaccessible Texas brief is not treated as recovered full-text evidence.

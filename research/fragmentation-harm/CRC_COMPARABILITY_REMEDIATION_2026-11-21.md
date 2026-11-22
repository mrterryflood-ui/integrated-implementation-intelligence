# CRC comparability correction and reporting-accountability record

Date: November 21, 2026 (America/Chicago). Owner: Terry Flood. Scope: retained Hinds County, MS (28049), and Harris County, TX (48201), colorectal cancer, 2019–2023, all races including Hispanic, both sexes, all ages. County figures do not become Jackson-city, Houston-city, or FQHC patient estimates.

## Decision and evidence boundary

The engineering correction prevents missing, inconsistent, stale, or merely asserted staging evidence from authorizing a comparative claim through the v0.2 research CLI. The retained comparison remains **UNKNOWN / descriptive inspection only**: broad regional-or-distant stage is documented, while extract-specific derivation, alternate-variable exceptions, exact case-denominator membership, unrounded counts, and a harmonized recalculation remain unresolved. Code acceptance does not close those scientific questions.

This is an AI-assisted engineering and source-document review. No qualified human scientific acceptance, agency response, clinical validation, or patient benefit is asserted. Terry authorized remediation and merge after testing and independent review; no agency correspondence is authorized by this record.

## Before → change → reason → verification → limits

Before: PR #122 merged at `c24a6fb0ec95afce69ab32ec769b87ac0950b29b`. Its strict check accepted different stage variables when any nonempty equivalence note was present; matching names also bypassed differences in definitions or versions. Existing CI ran the advisory validator and ten legacy controls without exercising that strict path. The real record printed PASS in advisory mode although its stage variables were undisclosed. The record also conflated the case-share denominator with the population-rate denominator and described hypothetical count ratios too precisely.

Change: extend the existing validator, claim-admission CLI and CI regression suite; retain descriptive inspection; remove name/note-only acceptance; require source-bound stage specifications and complete category mapping, reproducible count arithmetic, and an independently supplied accepted-review digest for a comparative-claim gate. Inputs declared synthetic are rejected at that gate; verifying the truth of source and reviewer declarations remains the operator's responsibility. The record explicitly retains unresolved science and separates the two denominators. The current dossier and FQHC brief receive a measurement qualification.

Reason: validation of a document's structure, consistency of an evidence package, operator acceptance of a reviewed artifact, and scientific truth are different decisions. A digest binds bytes to the operator's selected review; it is not a digital signature, identity verification, or proof that the review's assertions are correct.

For an evidence record submitted to the claim gate, `late_stage_share_percent` identifies the recalculated case share and must reconcile with the exact declared counts. An original published share that uses another denominator or rounding belongs in the explicitly separate `published_late_stage_share_percent` field. The assessment returns the calculated comparison and its descriptive scope. The unresolved real record retains the publisher's original values for inspection and cannot pass the claim gate; no harmonized result is invented.

Verification: test commands and results are retained below and in the resulting pull request. Independent final review is bound to the candidate commit; a historical passing run cannot substitute. Actual source checks cover the six retained November 8 supplements listed in the current contract and their original receipts. Original source bytes are preserved.

Limits: this boundary governs this research CLI and its CI tests. It does not certify every application export, retroactively validate prior reports, or enforce other agents' behavior. Authentication, database, clinical workflow, production deployment and field outcomes are outside this headless research change. Remaining source and scientific questions are owned separately below.

## Measurement corrections

The retained exports display Hinds/Harris late-stage shares of **63.7% / 63.4%**, all-stage annual counts **118 / 1,732**, and late-stage annual counts **75 / 1,098**. These are rounded published values. The displayed difference is **0.3 percentage points**. No exact difference or confidence interval is recovered from those displays.

The existing [November 8 denominator audit](W2_S1C_DENOMINATOR_AGE_PROVENANCE_LEDGER_2026-11-08.md) identifies three compatible Hinds count pairs and 25 Harris pairs under specified rounding assumptions. `375/589` and `5490/8660` are two illustrative compatible choices, not identified registry counts. The PR #122 calculation of `0.2723134290` percentage points and its one-/two-case sensitivity are therefore hypothetical demonstrations. They must not be cited as observed precision. Rounding alone is not evidence of an agency error. The 0.5-pp share/rate margin is not an approved equivalence margin.

Both report-specific interpretation pages define late stage broadly as regional or distant, and the percentage as late-stage cases relative to all-stage cases. They do not enumerate unknown/unstaged, blank/unclassifiable, death-certificate-only, or autopsy-only denominator membership. Population denominators in the rate footnote do not answer this case-denominator question. CDC's separate USCS display conventions must not be imported without source-specific evidence.

Different pipeline labels do not demonstrate incompatible stage classifications. CDC documents SS2018 as the NPCR merged-variable input for diagnoses from 2018 onward; NCI documents Derived SS2018 for its corresponding years. NCI's expanded regional recode concerns pre-2018 records. An identity mapping may be sufficient once tied to the actual extracts; a new patient-level dataset is not automatically required. [1,2]

The publisher's release history establishes that data through 2023 were added in September 2026 from November 2025 submissions. It also records the February 2026 change from 19 to 20 age groups for SEER incidence, with NPCR incidence unchanged. This resolves broad chronology, not all column-specific calculation details. Age standardization concerns the population rates, not the crude case shares. [3]

## Agency reporting accountability

State Cancer Profiles is a joint NCI–CDC service. The initial requested clarification owner is its publishing/methods team; the publisher can identify whether a question belongs to SEER, NPCR, or an individual registry. These are requested responsibilities, not accepted agency commitments. [4]

| ID | Finding and evidence | Consequence | Required clarification or correction | Closure evidence |
| --- | --- | --- | --- | --- |
| AGENCY-META-01 | Two retained 2019–2023 interpretation pages describe an all-stage case denominator but omit exact unknown-stage and DCO/autopsy membership. | An independent reader cannot reproduce every case-selection decision. | Publish the exact numerator/denominator inclusion and exclusion rules. | Release-bound authoritative specification and a privacy-compatible reconciliation to the displayed values. |
| AGENCY-META-02 | Reports name default stage fields but permit alternate variables without identifying whether they were used here. | Exact executed stage lineage is unresolved. | Identify field, version, derivation, fallback rules and exception disposition for both extracts. | Source-supported code/category mapping, or a substantiated identity mapping. |
| AGENCY-META-03 | Rate footnotes distinguish 19 NPCR/20 SEER age groups; the CI*Rank footnote refers to 19 for both. | Readers may infer that displayed rates and rank calculations use identical methods. | Explain column-level rate/rank linkage and applicable standard population. | Explicit method linkage and reproducible calculations where available. Different calculations may be legitimate; an erroneous rate has not been demonstrated. |
| AGENCY-META-04 | The source query uses moving `year=0` and the portal publishes successive releases. | An unchanged URL does not identify immutable observations. | Identify stable versioned exports, dictionaries and analysis sessions. | Release identity reproducing the same population, period and method. This is a reproducibility improvement request, not a proven outage or data error. |

Our responsibility is to preserve source bytes, dates and uncertainty, avoid importing another interface's methods, and correct our own false precision. The publisher's reporting responsibility is to make its methods sufficiently specific for its published comparisons. Accountability remains evidence-based: no erroneous registry data, incompatible staging, negligence, or misconduct has been established.

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

We have identified documentation questions and are not alleging that the published values are wrong. A public clarification linked from the exports would help researchers reproduce the results and avoid unsupported equivalence or health-system-performance claims.

## Learning and closure ownership

| Responsibility | Corrective action | Owner and review trigger |
| --- | --- | --- |
| Engineering | Every reproduced bypass becomes a behavioral regression; CI executes the actual strict/admission path, with successful and denied cases. | ISS repository maintainer; exact candidate review and every affected change. |
| Scientific record | Preserve raw values, UNKNOWN state, source periods, county scope, denominator distinction and hypothetical-count labels. | Terry as research owner; review before each proposal/publication use and on new source evidence. |
| Source clarification | Reconcile the four publisher questions and retain response/version evidence without inventing agency commitments. | Terry authorizes any dispatch; proposed publisher methods team responds if contacted. No response deadline or acceptance is presumed. |
| Reanalysis | Apply a supported mapping, calculate from sufficiently precise authorized aggregates, report uncertainty and sensitivity. | Research-methods analyst; begins when source prerequisites exist. Qualified scientific adjudicator remains unassigned. |
| Claim approval | Keep document validity, evidence consistency, calculation reproduction and scientific acceptance separate. | Accountable human reviewer; no accepted review digest exists for the real county comparison. |
| Sustainment | Changes in source version, definition, denominator, population, mapping or calculation invalidate prior review bindings. Preserve earlier failures and corrections. | ISS maintainer and research owner; triggered by a changed source or proposed claim. |

Rollback: revert the bounded validator/CLI/workflow change through a reviewed commit if it fails its intended contract; retain the source snapshots and this correction history. A rollback must not silently reinstate a scientific approval claim for unresolved data.

## Verification record

The baseline false passes were reproduced on `c24a6fb0ec95afce69ab32ec769b87ac0950b29b`. Final candidate test counts, independent review and merge identity are recorded in the pull request rather than guessed before execution. Passing code checks establishes the corrected engineering boundary only. Source clarification and harmonized reanalysis remain open until their own evidence exists.

## Primary and retained sources

1. NCI. [Localized/Regional/Distant Stage Adjustments, November 2022 and later releases](https://seer.cancer.gov/seerstat/variables/seer/yr1975_2020/lrd_stage/index.html). Inspected November 21, 2026.
2. CDC. [Cautionary Notes: Stage](https://www.cdc.gov/united-states-cancer-statistics/public-use/cautionary-notes.html). Updated June 1, 2026; inspected November 21, 2026.
3. NCI–CDC. [State Cancer Profiles release history](https://statecancerprofiles.cancer.gov/about/history.html). September and February 2026 entries; inspected November 21, 2026.
4. NCI–CDC. [About State Cancer Profiles](https://statecancerprofiles.cancer.gov/about/). Inspected November 21, 2026.
5. NCI–CDC. [Contact](https://statecancerprofiles.cancer.gov/contact/). Inspected November 21, 2026; no submission made.
6. Retained exact report supplements: [interpretation-page receipt](denominator_adjudication/source_retrieval/retrieval_receipt.json) and [CSV-export receipt](denominator_adjudication/source_retrieval/export_and_standard_retrieval_receipt.json). The six relevant source bytes match their original November 8 digests; the current contract lists each exact source and digest.

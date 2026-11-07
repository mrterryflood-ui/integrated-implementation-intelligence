# DIS–RPLICE internal exercise: evidence integrity and correction receipts

**Date:** November 7, 2026. **Owner:** Terry Flood. **Scope:** internal engineering and research rehearsal only. No outreach, participant recruitment, private RPLICE execution, clinical action or field outcome is authorized or claimed.

## Baseline and reuse

The earlier PR #62 is merged. This exercise uses current main `84b195c52c9774e1e8927f8705c79861a3a1d9c7`, not the older PR head. Existing STELLAR 1, research cases, RPLICE method selection, case persistence, equity checks and the separate draft explanation observatory are preserved. No parallel platform, authentication provider or database is introduced.

Authority: IRON-ENG-001 v1.0.0 (Git blob `00e0b3d8583c4248743518e403bc5d4598c1cfe4`), current AGENTS.md, and the owner's authorization to test, repair, push and merge completed reviewed work before external discussion. Existing Vercel/GitHub automation may run; no paid agent is manually requested and no billing claim is made.

Local snapshot integrity was checked against GitHub's Git-blob SHA-1: core `009dc4c5410527627bac4dafef07aa517c68bd59`, facade `12e7be71e786c519edb0d19d3e3dea2ebf7cad39`, CI workflow `0b8615e6275eccf17df2ac4d7fad9b39c563160f`. Local execution used Node 22.16.0 and TypeScript 5.8.3. The source was copied through the authorized connector because direct GitHub network access was unavailable in the local container. Hash equality was verified before executing it.

## Before → changed → proof

Nineteen deliberately adversarial/positive scenarios were executed against the exact baseline: **5 passed and 14 failed** the desired contract. These are selected synthetic probes, not a random sample or a claim that 14/19 of production use fails. After the local repair, **19/19 passed**. A separate repository-format regression file adds **33 tests**, all of which passed in the local transpiled runtime. Full-application typechecking, build, existing suite, desktop/iPhone journeys and independent exact-head review remain separate CI/release evidence, to be recorded on the PR rather than assumed from these local results.

| Finding family | Reproduced defect | Correction and regression obligation |
| --- | --- | --- |
| EAI-01: source identity and snapshot | Missing IDs could be admitted; conflicting duplicates retained the first row; caller mutation could rewrite admitted evidence. | Require explicit IDs; quarantine all conflicting versions; exact identical duplicates count once; copy bounded fields into detached records. |
| EAI-02: aggregate input boundary | Unexpected person-shaped fields, caller-supplied trust flags and credential-bearing source URLs survived admission. | Strict aggregate field allowlist and credential-free HTTPS references; reject without echoing prohibited values. This is not comprehensive privacy detection: permitted free text still requires responsible curation. |
| EAI-03: scale integrity | `140 percent` was rejected but `140 %` or other recognized aliases could pass; panel checks had the same hole. | Normalize recognized aliases for validation only, retaining the reported units; percentage 0–100 and declared fraction/probability 0–1 checks. Unknown units are not silently converted. |
| EAI-04: actual delivery time/counts | JavaScript normalized February 30; missing timezone, future delivery, and counts beyond exact integer representation could appear complete. | Validate real calendar dates, explicit zones, review-as-of ordering and safe integer counts. Complete metadata remains provisional, never independently verified delivery. |
| EAI-05: finite arithmetic | Large finite panel values could overflow, yielding a passing NaN result. | Refuse non-finite derived arithmetic and reopen investigation of units/scale; do not manufacture zero or a causal estimate. |
| EAI-06: gap closure after quarantine | Removing an invalid screening/all-stage/diagnostic measure did not reopen the corresponding missing-evidence obligation. | Recompute condition-specific missing-measure gaps from accepted measurements after quarantine. Test numeric and ambiguous-binding cases for all three constructs. |

No scientific causal claim, source-authenticity assertion or human-independent approval is introduced. A returned candidate design means only that a declared structure passed this preliminary screen.

## Protocol exercise: the colorectal comparison

Reuse the historical Hinds/Harris source exercise in `COLORECTAL-HINDS-HARRIS-INTERNAL-SOURCE-EXERCISE-2026-11-07.md`; do not present it as a newly acquired longitudinal panel. Its three measurement layers are (a) a stage share among cancer cases, (b) a standardized resident-population incidence rate and (c) annual service-volume counts. Similar stage shares do not imply identical disease occurrence, care performance or resource demand.

**New source-definition challenge:** the current `jackson-cancer-case.ts` describes the percentage denominator as "all staged" cases, while NCI's published interpretation describes cases across all stages. The unknown-stage inclusion rule must be reconciled against the original source methods before final analysis. Do not silently assume a known-stage-only denominator or revise historical numbers without evidence. The existing source exercise already preserves this unknown; the implementation label still needs a source-authorized correction. Owner role: registry measurement reviewer. Closure: archived original definition and reproduction of the denominator, then a targeted source-data regression and propagation through the case/crosswalk/export.

**Recorded incidence is not the whole underlying phenomenon.** All-stage registry incidence measures recorded new diagnoses under its methods; it cannot alone reveal undiagnosed disease or attribute differences to biology, policy, access or exposure. Prevention, screening/detection, diagnostic resolution, recording and downstream outcomes must remain separate, connected hypotheses.

**Counterfactual challenge:** three preperiods and two postperiods are a conservative software input screen, not a theorem establishing causal validity or adequate power. A non-significant pretrend test is not proof of parallel trends. Annual treatment-year aggregates also need a justified transition-year rule and exact intervention timing. The current calculator remains descriptive and has no empirical intervention estimate.

**Implementation challenge:** simulate better screening completion alongside unchanged diagnostic closure, increasing burden, or worsening subgroup outcomes. A passing source/receipt contract cannot close those operational or experienced-outcome gaps. Preserve the existing benefit/harm, subgroup and sustainment checks; do not replace them with an aggregate success percentage.

### Original-source references inspected for this protocol challenge

1. National Cancer Institute. State Cancer Profiles: Interpretation of Incidence Rates Data. The late-stage percentage is described relative to cases across all stages; incidence is annualized and age-adjusted. Accessed November 7, 2026. `https://www.statecancerprofiles.cancer.gov/incidencerates/index.php?age=001&areatype=county&cancer=035&datatype=01&displayCI=false&graph=2&output=2&race=00&ruralurban=0&sex=2&sortOrder=desc&sortVariableName=cirank&stage=211&statefips=49&type=incd&year=0`
2. Centers for Disease Control and Prevention. Incidence and Death Rates. Updated June 1, 2026; accessed November 7, 2026. Crude, age-specific and age-adjusted rates have distinct calculation and interpretation. `https://www.cdc.gov/united-states-cancer-statistics/technical-notes/incidence-death-rates.html`

The source-definition reference is the agency's shared table-interpretation documentation, not an independent reproduction of the Hinds/Harris case counts. Exact county source release snapshots and all-stage/late-stage period alignment remain required.

## Internal walkthrough and remaining obligations

Start at the existing evidence-to-action page. Repeat the percent-alias, conflicting-source, forged-trust-field and impossible-calendar challenges in desktop and iPhone browsers. Inspect the rejected-record reasons and the reopened gap ledger. Then work through a legitimate source and a complete synthetic receipt: both should be usable without being promoted to verified causality or actual impact.

The next Terry-led discussion should separate three questions: what phenomenon we are trying to change; which measurement would reveal it; and what observation would falsify our preferred explanation. Named external people are not assigned duties by this document.

Unclosed: original denominator verification; matched source vintages and genuine intervention panels; independent scientific design adjudication; live authenticated create/reload/update and cross-tenant denial; real recipient acknowledgment, benefit/harms, costs, equity and sustainment. Separate draft research work remains separate and is not merged under the identity of this repair.

**Release discipline:** merge only after exact-candidate engineering checks and review; a merge is not a production deployment or clinical-validation receipt. No external engagement before the owner's internal walkthrough and disposition of material scientific and operational gaps.

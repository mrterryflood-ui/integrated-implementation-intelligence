# ChainWeb Cycle 2 — source-verified pilot translation and research-overlay receipt
**Date:** 2026-11-08. **Owner:** DIS–RPLICE research lane. **Status:** source-grounded draft pending independent review; no clinical/site acceptance. **Base:** PR85 `5fd243d745f19486d34955c6e36fbad4779cfdd9`. This is an isolated branch for the owner-designated reconciler, not a merged release. Do not supersede PR86 judge, PR87 lifecycle, or RPLICE PR118.

## Specific answers from the approved calibration
- The retained archived NCI Hinds/Harris 2019–2023 CRC tables give late-stage case shares **63.7% / 63.4%** (difference **0.3pp**) while age-adjusted late-stage population incidence is **29.9 / 23.9 per 100k** (difference **6.0/100k**). Rates and stage shares are nonexchangeable constructs, and county aggregates cannot establish a particular organization's causal responsibility or a prevented death.
- Reuland 2024, randomized NC FQHC mailed FIT + navigation offer vs usual care, six-month screening **+20.29pp (CI17.85–22.73)**; Atlas 2023 mixed-cancer four-arm cluster trial, 120-day diagnostic follow-up **+8.5pp (4.8–12.0)** for full reminder+outreach+navigation vs usual, but **+0.4pp (−3.6–4.2)** for adding navigation to reminder+outreach. Source populations, estimands and stages cannot be pooled.
- Kruse 2024 four-FQHC stepped wedge: CRC screening adjusted marginal **+1.4pp (0.3–2.3)** without established connected SDOH-screening gain. Chima 2025 CDS cluster trial: guideline follow-up **+2.6pp (−2.8–7.9)**, null-compatible. Virdee/BLOODTRACC 2026 external prediction validation: C-statistic 0.73 men/0.74 women; not a trial of early action, with subgroup underprediction and low sensitivity at top-1% alert threshold. Mann 2026 observational regional MCED spillover: **+3.4pp (1.9–5.0)** >28-day diagnostic delay association during initial six months; residual confounding remains.
- Replayed unchanged original private archive locally, SHA256 `ddee039ad52fbe27b694e3e64a01d7d5ec2b0e9cb24b535fce47b8434dba727a`: **18 manifest files, four county HTML↔CSV row pairs and 26 cells** verified. Six Atlas Table2 adjusted comparisons arithmetically reconciled with displayed arm marginal percentages (not model re-estimation).

## Concrete changes to evaluate
1. Hinds/Harris: source- and denominator-safe paired population-rate/case-share view with versioned time/age/stage/suppression/uncertainty, plus independent source-method adjudication.
2. Earliest risk/warning: preserve onset, record, clinician availability, risk/exposure, decision/action/outcome clocks; symptomatic diagnostic evaluation is not constrained by average-risk screening start age. Independently test against competent equal-time practice.
3. Abnormal FIT follow-through: track accepted referral, scheduling, completed colonoscopy, result and next action, outside care, declined and unresolved states. Test incremental navigation vs *actual* outreach practice, including cost and capacity.
4. Spillover/sustainability: measure workload, neighboring pathway queues, costs, patient experience, harms and equity in recipients and nonrecipients. Retain condition-specific endometriosis/RA clinical criteria and avoid universal thresholds.

## Executed original 24-slot development allocation
Original 24-slot source register SHA256 `9cba813fb4dfcf2b1e38c7bcd3fefe15e7e26583104defcf345051239594f147`. **12 development + 12 judge reserved unchanged**. Existing four source-grounded development drafts are untouched. Two *new DEVELOPMENT-ONLY* source-grounded overlays: `CRC-M-D` county measurement/provenance, and `CRC-S-D` BLOODTRACC earlier-signal prediction boundary. **6/12 development drafted; 6 unfilled; 0 independently accepted.** Judge-reserved contents were not included in the output; reserved-allocation canonical hash `fbaec6686fe9ec1c4831bd5c326db2953233c0e664ad4b45d0a71d07ca7b25bb`.

## Code and local proof available to reconciler
Full research-only machine-readable source-bound overlay, validator, **27 normal and 27 optimized Python checks passing**, prior failed stronger-rule assertion and corrected expectation, exact replay outputs and nine-file SHA256 manifest packaged in conversation as `DIS_RPLICE_ChainWeb_Cycle2_Pilot_Checkpoint_2026-11-08.zip` (20,833 bytes; SHA256 `c1b995bec418e3d6cccd57edfd383305bb6ef7792ab9d5fc2d1fb2b4b2db5330`). Full report `CHECKPOINT_PILOT_TO_HEALTHCARE_2026-11-08.md` SHA256 `e2bb073fb8f60a7f86c3e49f6de05205164a46ad8597f2d76c9957a21356f547`. Original private archive and judge-controlled cases are NOT included. File package in this conversation is **not** a GitHub build/release. No hosted CI is claimed for the packaged Python.

## Scientific and operational gates
**GO**: offline data/semantic harmonization, source re-extraction and matched decision research. **CONDITIONAL**: site workflow changes after real ownership, protocol, data permissions, population/setting, capacity and patient-community review. **HOLD**: assertion that Hinds/Harris difference is caused by named local institutions, that ChainWeb has reduced late-stage burden/mortality, or that source trial results predict local effect sizes.

PR86 is a separate judge branch based on older PR85 revision and currently reports mergeable=false: reconcile independently reviewed corrections (timezone-aware review date, Python -O integrity, Kapsala/Sharma qualifications) against latest research first. PR87 still needs authorized live signed-in Clerk/Neon save/reopen/revise/restore/planning/export acceptance. RPLICE PR118 must be integrated without duplicate comparator rules. No remote authenticated execution, site enrollment, external outreach, clinical data or production change is claimed.

### Primary-source entry points
- Reuland: https://doi.org/10.1001/jamanetworkopen.2024.46693
- Atlas: https://pmc.ncbi.nlm.nih.gov/articles/PMC10565610/
- Kruse: https://doi.org/10.1007/s11606-024-08654-5
- Chima: https://pubmed.ncbi.nlm.nih.gov/39567181/
- Virdee: https://doi.org/10.1186/s12885-026-16179-9
- MCED spillover: https://pubmed.ncbi.nlm.nih.gov/42217468/

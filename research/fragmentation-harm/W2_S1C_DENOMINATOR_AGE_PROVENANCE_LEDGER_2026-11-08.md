# DIS–RPLICE Health — S1c denominator, age-partition and provenance adjudication

Date: November 8, 2026. Research continuation after explicit owner approval. Base: `c4d949812e9facdfda8a08c0a1af1698a08143ca`, PR #85. This is the science lane, not the Dartmouth partnership accelerator. Mission charter and unified program plan remain governing. Scope: W2 source/measurement reconciliation, with a correction to interpretation of S1b; no clinical intervention or narrowed post-FIT mission.

## Executed evidence, not inferred completion

Opened the actual retained artifact at `/mnt/data/github-actions-artifact-13589404488.zip`, 2,692,160 bytes. Outer SHA256 `ddee039ad52fbe27b694e3e64a01d7d5ec2b0e9cb24b535fce47b8434dba727a` matched. All 18 manifest-listed entries matched. An independent implementation in `denominator_age_sensitivity.py` parsed the four original county HTML rows, compared every data cell against corresponding archived CSV rows, and performed rounding/sensitivity calculations. No new source acquisition, patient records, external correspondence, authentication work, deployment or merge occurred. Container network cloning failed; authenticated GitHub reads/writes remained available and were used. This did not prevent original-source replay.

## 1. Denominator audit: arithmetic compatibility is not identification

The archived 2019–2023 table reproduces Hinds all-stage rate 46.4, late-stage rate 29.9, average annual counts 118 and 75, and late share 63.7%; Harris rates 38.0 and 23.9, annual counts 1,732 and 1,098, late share 63.4%. Rates are age-adjusted per 100,000 residents per year; the share is case-conditioned, not a resident rate.

Under the explicit assumptions of five observation years, nearest-integer rounding of annual means, nearest-0.1-percentage-point rounding, and the same all-case denominator:

| County | Compatible five-year (late, all) count pairs | What follows |
|---|---|---|
| Hinds | (375,589), (376,590), (377,592) | **Three** pairs fit all three displayed quantities; none is identified as the true pair. |
| Harris | Every pair in late 5,488–5,492 × all 8,658–8,662 | **25** pairs fit; exact totals are not recoverable from these displays. |

This is a deterministic compatibility calculation, not recovered registry microdata or a reconstructed confidence interval. Agency tie-breaking conventions have not been established; no half-boundary ambiguity affects these listed pairs. The result weakens any claim that the rounded-count discrepancy alone proves an erroneous denominator. It does not decide whether unknown-stage cases, death-certificate-only cases or autopsy-only cases enter the exact State Cancer Profiles denominator.

NCI's indexed State Cancer Profiles interpretation describes late-stage cases relative to all-stage cases [1]. Its current interpretation URL was inaccessible to the browsing tool during this sprint; the four retained report HTMLs do not explicitly mention unknown-stage membership. CDC's separate USCS visualization supports both with-unstaged and known-stage-only distributions and excludes death-certificate/autopsy-only cases from that analysis [2]. **Do not transfer those interface-specific rules to the archived State Cancer Profiles output without proof.** Exact local source-selection logic remains open.

## 2. Correction/refinement: different stage-variable names do not establish different clinical classifications

S1/S1b correctly recorded the archived NPCR/SEER source labels and different variable names. This does not establish a demonstrated staging disagreement for 2019–2023.

CDC's NPCR documentation uses Summary Stage 2018 for diagnosis years 2018 onward [3]. NCI's current Combined Summary Stage with Expanded Regional Codes uses Derived Summary Stage 2018 for 2018 onward; the extra regional detail introduced with November 2024 applies to **pre-2018** Regional NOS codes [4]. Therefore that particular pre-2018 enhancement is **not an explanation for the 2019–2023 pilot contrast**. Recorded versus derived stage, case-level exceptions, ascertainment and quality can still differ; equivalence is not established either. The correct label is **different pipeline labels with potentially aligned broad stage constructs; implementation equivalence untested**. This paragraph supersedes any reading of S1b as proof of a substantively different 2019–2023 stage classification.

## 3. Age-partition sensitivity: an executable necessary-condition test

NCI confirms the change from 19 to 20 groups splits 85+ into 85–89 and 90+, retaining the 2000 standard [5]. Standard populations [6,7]: total 274,633,642; ages 85–89 = 2,678,567; ages 90+ = 1,580,606. Their combined standard weight is 0.01550856249432107.

For the *same county*, with identical case definitions, period, younger-age contributions and Census P25-1130 weights, let p be the fraction of observed 85+ person-years in ages 85–89, q = 2,678,567 / 4,259,173, W = 4,259,173 / 274,633,642, and r85/r90 the corresponding age-specific rates per 100,000. Then:

`R20 - R19 = W * (q - p) * (r85 - r90)`

Consequences verified algebraically and by tests: the difference can be positive, negative or zero. It is zero if the two old-age rates are equal or if observed and standard top-age mixtures match. A universal bound over unknown p is:

`abs(R20 - R19) <= max(w85,w90) * abs(r85-r90)`.

To shift **one county's rate by the entire printed 6.0/100,000 contrast solely by this partition change**, the absolute 85–89 versus 90+ rate difference would need to be at least **615.180375/100,000**, and potentially much greater given the actual age mix. Allowing for rounding of both reported rates gives a contrast envelope with infimum 5.9, corresponding to **604.927369/100,000**. These are necessary, not sufficient, conditions under fixed-method assumptions, **not observed age-specific rates, an estimated bias, a confidence interval, a causal effect, or evidence that the explanation is impossible**. Do not apply to simultaneous changes in stage definitions, standard-weight versions or both county rates.

The archive has all-age county aggregates, not the necessary age-specific late-stage numerators and matched person-years. Thus a corrected Hinds or Harris rate remains **unidentified**. We also reproduced NCI's separate worked example (Black female breast cancer, SEER21, 2018–2022): its 19-/20-group rate difference rounds to 0.064/100,000 [8]. This checks implementation and illustrates context dependence; it is **not transportable to these CRC counties**.

## 4. Provenance investigation: revision identity partly explained, receipt binding still inconsistent

The original receipt identifies `73455a439f950ffa0644d5714843b06b173f029a`; workflow head identifies `312577b8e43efadaceb4b834dc524dc11368d3fe`.

New evidence:
- GitHub commit metadata confirms `73455a4` is a merge of `312577b` into `6b5cc192b6635fe5995b8313b9c4c852a08d2e5a`, not an unrelated revision [9].
- Original job **128521759514**, run **42411939810**, explicitly checks out `312577b` at 2026-11-07T20:37:24Z; `git log -1 --format=%H` prints the same SHA at 20:37:24.332542Z. The acquisition step's displayed environment also sets `GITHUB_SHA: 312577b...` at 20:37:37.237270Z [10].
- `research/three_study_cycle/acquire.py` records `os.getenv('GITHUB_SHA','local')`. Its whole-file Git blob is **a21c038476807262db6122d09593afcdb2387205 in both commits** [11,12]. Thus acquisition-source contents are equivalent across these two versions, but why the archived receipt reports the merge SHA despite the displayed acquisition environment is not established.

Disposition: reject the simple explanation that this job **checked out** the merge SHA; preserve the plausible event-versus-checkout identity distinction as a hypothesis, not a completed root-cause finding. Equal code blobs and a matching ZIP digest do not constitute full runtime attestation. Archive bytes remain valid for descriptive replay; the narrower receipt-to-executed-revision gate remains open. No tampering allegation follows.

## 5. Claim ledger

| ID | Claim | Grade and evidence | Acceptance consequence |
|---|---|---|---|
| S1C01 | Four original HTML/CSV county rows match; manifest intact | VERIFIED byte/measurement replay | Source integrity subcheck passes, not W2 overall |
| S1C02 | Printed counts uniquely identify exact late-share denominator | CONTRADICTED under stated rounding; 3/25 compatible pairs | Do not fabricate exact totals or share uncertainty |
| S1C03 | Unknown-stage/exclusion convention established for this exact report | NOT VERIFIED; generic NCI description and different CDC presentation only | W2 denominator gate remains open |
| S1C04 | Expanded regional codes prove different classification for 2019–23 | CONTRADICTED as inference; added expansion concerns pre-2018 | Refine earlier wording; direct/derived stage equivalence still untested |
| S1C05 | Age split explains the 6.0 gap | UNTESTED; new necessary-condition bound only | Obtain matched age-band counts/person-years; no corrected county rate |
| S1C06 | Default merge checkout fully resolves the revision mismatch | CONTRADICTED by job checkout; merge ancestry and identical acquisition blob VERIFIED | Receipt runtime binding still open; no archive mutation |
| S1C07 | Reproducible measurements imply prediction, causation or prevented harm | NOT ESTABLISHED | Keep all three separate from measurement findings |

## 6. Validation receipts and scope

Run from `research/fragmentation-harm`:

```sh
python denominator_age_sensitivity.py /path/to/github-actions-artifact-13589404488.zip
DIS_NCI_ARCHIVE_PATH=/path/to/github-actions-artifact-13589404488.zip python -m unittest -v test_denominator_age_sensitivity.py
```

Actual local result: **18 passed, 0 failed, 0 skipped**, including real-archive integration. Unit fixtures are labeled, and the archive integration test skips explicitly when original bytes are unavailable. SHA256 receipts:
- Script: `5a3370679c80318360b8ce59d93a410d8108bcd3b2c7d59f96a09626ee4e7f70`
- Tests: `474e37561777f83fbc26b7342a6d3f23de2b1736bd8ece96c9717b8cfe38ebae`
- Full deterministic audit output: `119749b24ec2c3323d171e6beca55f2f466769c1c6836439e2592cb57eae3c6c`
- Local verbose test log: `4f2cbe0ead5dffffdd16703dedd73d9a98b18fe44fe5771573e4813e0344dde9`

Machine-readable summary: `S1C_VALIDATION_RECEIPT_2026-11-08.json`. These receipts precede the commit; final GitHub CI must be inspected separately. Source/hash checks, unit tests and author's second implementation are **not independent-agent scientific acceptance**.

## 7. Independent-agent handoff, gaps and next 15-minute unit

**Judge/scientific reviewer:** independently challenge S1C01–07 using pinned archive and primary definitions. Recompute the rounding sets and age identity without copying author outputs; test the opposite-sign/null age effects; verify that the pre-2018 recode detail cannot explain this window. Review code-blob equivalence and the contradictory runtime receipt. Leave signed/dated adjudication and dissent. This is a prepared handoff, not a launched agent or completed independent review.

**Source-methods lead:** next unit retrieves the exact State Cancer Profiles selection statement/session or equivalent authoritative release-specific metadata, including unknown stage, death-certificate/autopsy exclusions, and unrounded denominator. Acceptance requires source-specific evidence, not importing another dashboard's rule.

**Research/data lead:** seek public, nonidentifying 2019–2023 late-stage counts and matching person-years for ages 85–89/90+ in the same source release; respect suppression. If unavailable, record access path and distinguish data not retrieved from data nonexistent. No PHI or new account/data-use commitments authorized.

**Reproducibility lead:** preserve original bytes unchanged; investigate event SHA versus actual Git HEAD with separately named fields and a no-network test. Do not rewrite the archived receipt. Institutional durable storage and independent restore remain open; artifact expiry is November 21, 2026, 20:37:41 UTC.

**Acceptance delta: zero. W2 PARTIAL; W4 unchanged PARTIAL; W8 NOT ACCEPTED.** Last reported overall count was 1/10; this sprint does not recertify every other package or inflate completion. No claim of prediction performance, local causal prevention effect or prevented harm. The mission remains earliest risk/warning evidence through justified completed action and tested equitable outcomes across conditions. Dartmouth accelerator remains separate.

## Primary sources and exact audit locations

1. NCI. State Cancer Profiles: Interpretation of Incidence Rates Data. Indexed description; live fetch failed November 8, 2026. https://www.statecancerprofiles.cancer.gov/incidencerates/index.php?age=001&areatype=county&cancer=047&datatype=01&graph=1&output=2&race=00&ruralurban=0&sex=0&sortOrder=desc&sortVariableName=cirank&stage=211&type=incd
2. CDC. Stage at Diagnosis. Updated June 1, 2026. https://www.cdc.gov/united-states-cancer-statistics/technical-notes/stage-at-diagnosis.html
3. CDC. Cautionary Notes, Stage section. Updated June 1, 2026. https://www.cdc.gov/united-states-cancer-statistics/public-use/cautionary-notes.html
4. NCI. Localized/Regional/Distant Stage Adjustments, November 2022 and later releases, footnote a. https://seer.cancer.gov/seerstat/variables/seer/yr1975_2020/lrd_stage/index.html
5. NCI. Standard Populations for Age-Adjustment. https://seer.cancer.gov/stdpopulations/
6. NCI. Standard Populations—20 Age Groups. https://seer.cancer.gov/stdpopulations/stdpop.20ages.html
7. NCI. Standard Populations—19 Age Groups. https://seer.cancer.gov/stdpopulations/stdpop.19ages.html
8. NCI. Calculating Age-adjusted Rates, Step 3. https://seer.cancer.gov/seerstat/tutorials/aarates/step3.html
9. GitHub merge object: https://github.com/mrterryflood-ui/integrated-implementation-intelligence/commit/73455a439f950ffa0644d5714843b06b173f029a
10. Original acquisition job: https://github.com/mrterryflood-ui/integrated-implementation-intelligence/actions/runs/42411939810/job/128521759514
11. Acquisition source at head: https://github.com/mrterryflood-ui/integrated-implementation-intelligence/blob/312577b8e43efadaceb4b834dc524dc11368d3fe/research/three_study_cycle/acquire.py
12. Same source at merge: https://github.com/mrterryflood-ui/integrated-implementation-intelligence/blob/73455a439f950ffa0644d5714843b06b173f029a/research/three_study_cycle/acquire.py

All external methods pages were inspected November 8, 2026; none was assumed available to a decision-maker in 2019–2023. Archived observation period, source submission, methodological publication and retrieval date remain distinct.

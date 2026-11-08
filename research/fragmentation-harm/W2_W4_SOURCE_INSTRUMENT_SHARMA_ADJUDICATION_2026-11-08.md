# DIS–RPLICE Health | W2/W4 Source-instrument adjudication and Sharma full-text exception
**Execution:** 2026-11-08, research continuation S1b (local 11:26 CST / 17:26 UTC verification). **Authority:** approved mission charter and accelerated evidence gates, interpreted with current unified program handoff. **Scientific scope:** original archived Hinds/Harris CRC measurement, registry instruments, paper denominator reconciliation; *not* a Dartmouth partnership accelerator deliverable, not a clinical outcome study.

## Mission, estimands and decision
Question: do apparently comparable county metrics derive from equivalent sources and instruments, and what can be known about upstream missed preventive action? The correct answer from this archive is **partly yes at the report-interface and broad constructs, no at source lineage and age grouping, and unresolved for complete stage and patient-level comparability**. Instrument differences are observable; the magnitude/direction of any induced numerical bias is not.

Preserve three distinct target quantities:
1. **Resident population incidence rate**, per 100,000 person-years, *age-adjusted* to the 2000 U.S. standard; not a percent of diagnosed patients.
2. **Late-stage case share**, percent late cases divided by reported all-stage cases, a *case-conditioned* quantity. The [State Cancer Profiles incidence interpretation page](https://www.statecancerprofiles.cancer.gov/incidencerates/index.php?age=001&areatype=county&cancer=047&datatype=01&graph=1&output=2&race=00&ruralurban=0&sex=0&sortOrder=desc&sortVariableName=cirank&stage=211&type=incd) describes late-stage cases / cases for all stages; the archived specific footnotes do not independently resolve unknown-stage membership, exclusions, the exact unrounded case numerator or the share's CI.
3. **Actionable prevention opportunity at historical decision time**, which requires contemporaneously available risk and symptom evidence, eligible person denominator, decision capacity, actual actions and outcomes. The 2019–2023 series from 2025 submissions is retrospective, not itself historical decision-time evidence.

## Actual source archive and replay receipt
Original retained public aggregate GitHub Actions artifact **13589404488**, source-acquisition run [42411939810](https://github.com/mrterryflood-ui/integrated-implementation-intelligence/actions/runs/42411939810), expires 2026-11-21T20:37:41Z. ZIP length 2,692,160 bytes, SHA-256 **ddee039ad52fbe27b694e3e64a01d7d5ec2b0e9cb24b535fce47b8434dba727a**. Downloaded anew through authenticated connector and checked digest in local runtime. Verified **18 of 18** entries against `MANIFEST_SHA256.json`; ZIP contains 20 entries total. Original report HTML and extracted CSV source rows matched the replay constraints. The original acquisition receipt revision is `73455a439f950ffa0644d5714843b06b173f029a`, while workflow head SHA is `312577b8e43efadaceb4b834dc524dc11368d3fe`; **revision-binding mismatch remains open** rather than silently resolved.

| Retained original 2019–2023 county observation | Hinds County, MS | Harris County, TX |
| --- | ---: | ---: |
| All-stage incidence, age-adjusted / 100,000/yr (95% CI) | 46.4 (42.6–50.5) | 38.0 (37.2–38.9) |
| Late-stage incidence, age-adjusted / 100,000/yr (95% CI) | 29.9 (26.8–33.2) | 23.9 (23.3–24.6) |
| Late-stage **share of incident cases** | 63.7% | 63.4% |
| Rounded average annual all-stage cases | 118 | 1,732 |
| Rounded average annual late-stage cases | 75 | 1,098 |
| Original row source marker | **2 (NPCR, 2025 submission)** | **7 (SEER, November 2025 submission)** |
| Original footnote age bands | **19** | **20** |
| Stage coding variable named in footnote | **Merged Summary Stage** | **Combined Summary Stage with Expanded Regional Codes (2004+)** |

**Arithmetic:** 29.9 − 23.9 = **6.0/100,000/yr** reported late-stage incidence contrast; 63.7 − 63.4 = **0.3 percentage points** case-share contrast; 46.4 − 38.0 = **8.4/100,000/yr** all-stage rate contrast. Neither the 0.3 percentage point difference nor wide/narrow rate CIs are an equivalence test for cancer risk, screening performance or patient experience. `75/118 = 63.5593%` and `1098/1732 = 63.3949%`; these quotients do not exactly reproduce every printed case share. Annual case counts are rounded, making rounding a plausible explanation, but exact full-period numerators and denominator definitions are not supplied; the cause of the discrepancy is not adjudicated. Dividing stage-specific age-adjusted rates is **not** an estimator of the observed case share.

**Novel substantive correction:** All **four archived original HTML footnotes**, including those used in S1, say: "SEER areas use 20 age groups and NPCR areas use 19 age groups". Hinds and Harris both use the 2000 US age-standard population but **not identical age-band partitioning in the respective source pipeline**. The [SEER April 2025 release history](https://seer.cancer.gov/data/data-changes.html) independently explains the switch from 19 groups to 20 via an older-age split beginning November 2024 submission. [CDC USCS technical notes](https://www.cdc.gov/united-states-cancer-statistics/public-use/cautionary-notes.html) describe the merged NPCR variable and late reporting revision effects. This refines original ledger C02: common dashboard and nominal standard do not prove a harmonized input instrument. **No evidence here quantifies the effect of the age split, differences in staging or ascertainment on the 6.0 rate gap.** A common-band re-standardization is a *proposed falsification*, not an executed adjustment.

## Full-text challenge: Sharma et al. (2022 journal issue)
Primary manuscript: [Sharma et al., *Journal of Patient Safety*, doi:10.1097/PTS.0000000000000718](https://pmc.ncbi.nlm.nih.gov/articles/PMC7688501/) (abstract, Results, Table 1, Discussion); final issue *J Patient Saf*. 2022;18(1):e163–e171, PMID 32467445; five safety-net systems, **12 delayed pathway cases from a convenience sample**, **11 PCP interviews**, **5 patient interviews**, completed over recruitment/interviews in 2018. Eligibility allowed colonoscopy scheduled or completed more than 180 days after a positive FOBT; all 12 cases are not 12 completed procedures. Qualitative root-cause findings are conditional on this sample and interview process.

| Paper section | Reported patient/procedure count | Reported adenoma findings | Adjudication |
| --- | --- | --- | --- |
| Abstract | **8 patients** | **3 advanced adenomatous findings** | Direct text, descriptive |
| Results first sentences | **8 / 12 patients**; later same paragraph **9 colonoscopies done** | **4 clinically significant for advanced adenomas** | Unresolved patient-versus-procedure denominator; no adjudicated patient/procedure crosswalk |
| Discussion | **8 patients** | **4 of 8 clinically concerning adenomatous findings** | Potentially differing clinical classification from abstract's 3 'advanced' |

**Disposition:** Preserve 8 patients versus 9 procedures as an **unresolved patient-versus-procedure denominator discrepancy**. Different units need not conflict: a repeat procedure is possible but not established. Do not label this a proved paper error. The 3 advanced vs 4 concerning/significant descriptions are **unadjudicated construct/terminology discrepancy**, *not proved to represent the same histopathologic endpoint*. Do **not** divide 3 or 4 by an assumed denominator and report a clinical detection rate, causal risk or population prevalence. Table 1 reports aggregate demographics and finding descriptions; it is not a patient/procedure crosswalk and does not reconcile all outcomes. Underlying patient-level research records were not accessed. Qualitative themes—referral ownership, PCP/GI interoperability, capacity, accommodation and patient-reported barriers—remain **reported mechanisms** and cannot be extrapolated as causes of county incidence differences or measured harm.

## Updated auditable claim ledger — S1b
| ID | Claim / construct | Evidence and independent challenge | Grade | Decision / closure |
| --- | --- | --- | --- | --- |
| D01 | Four archive county rates and stage shares reproduce | Original HTML/CSV source rows, manifest and outer SHA, replay script | **VERIFIED archived measurement** | Preserve exact 2025 release; not historically actionable |
| D02 | Two county late-stage rates are built from fully identical population instruments | Original superscript 2/7 and stage-variable notes, **19 vs 20 age bands** | **CONTRADICTED as stated** | Restore comparability via same age bands/stage codebook, age-stratum counts |
| D03 | Age-band or staging differences explain the 6.0/100k difference | Neither measured harmonized sensitivity nor cell-level counts | **UNTESTED hypothesis** | Common-variable re-standardization and stage crosswalk; quantify magnitude/CI |
| D04 | 63.7 and 63.4 demonstrate equally effective prevention or share equivalence | Cases vs resident denominators, rounding, no share CI or equivalence margin | **CONTRADICTED inference** | Prespecify margin, variance, unknown-stage handling; avoid equivalence claim |
| D05 | Percent late is divided by all-stage case count | State Cancer Profiles interpretation page; archived report uses share column | **SUPPORTED reporting construct** | Exact stage exclusions/unknown status still requires source-specific denominator metadata |
| D06 | Sharma supplies a reconciled patient/procedure denominator for completion | Abstract/Results/Discussion report 8 patients and 9 procedures; Table 1 is aggregate | **UNRESOLVED denominator** | Obtain participant/procedure linkage or author clarification; do not infer a contradiction or calculate an unadjudicated adenoma rate |
| D07 | Sharma '3 advanced' vs '4 concerning' necessarily conflict | Distinct clinical labels, no case adjudication | **UNRESOLVED construct** | Obtain classification rule and per-case pathology table |
| D08 | Hinds/Harris 2019–23 archived reports demonstrate missed/averted patient harm | Public ecological data, 2025 source vintage | **NOT ESTABLISHED** | Historical decision record and eligible contemporaneous longitudinal data with approved access |
| D09 | ChainWeb enables cross-disease benefits already observed in these records | No implemented comparison or outcome observation | **NOT ESTABLISHED** | Test mechanism by disease, with negative controls and adverse effects |
| D10 | Source integrity equals reproducible provenance lineage | Receipt revision differs from workflow head | **PARTIAL provenance** | Reconcile why embedded code revision differs; preserve both hashes until resolved |

## Validation, ownership and acceptance
Executed in local runtime using the **actual pinned ZIP**, not only synthetic data:
```sh
sha256sum github-actions-artifact-13589404488.zip
python audit_archived_registry_instruments.py github-actions-artifact-13589404488.zip
DIS_NCI_ARCHIVE_PATH=github-actions-artifact-13589404488.zip python -m unittest -v test_audit_archived_registry_instruments.py
```
**Receipt:** SHA matched `ddee039a…27a`; manifest 18/18; county records four/four; source note marker and 19/20 groups confirmed in all four HTMLs; **6 tests passed, 0 failed, 0 skipped** with archive supplied. Without the externally retained archive, the optional integration test explicitly **skips** rather than falsely reporting source replay. GitHub CI for this commit must be checked independently; local tests are not a CI receipt. Software validation does not establish external scientific replication.

Commits introduced in this continuation: script `a57c8180eaedf465bf21748fabfc5c442458c018`; test `28b7f7489ba7db25b8225730f50b512ab41f65e1`; S1 original claim-ledger correction `1b3debc3970fa578a8b035833a59cd96b575e4d3`; empirical paper correction `d63953961bfc118713d3793f30a72c17372ef31f`. See PR #85 current HEAD for this document commit.

**W2 = PARTIAL**: original-source replay and key instrument contrast now verified, but harmonized rate comparison, stage denominators, revision binding and independent judge missing. **W4 = PARTIAL**: primary text exception now captured/corrected; Conderino and Thompson prior cautions remain; independent full-text adjudication and source-specific barrier inference still pending. **W8 scientific acceptance remains open**. The historical **1/10** package count requires fresh governance reconciliation and is not a current percentage derived from this audit; no change to package denominator or acceptance authority. No PHI, new data access request, external communication, spending, deployment, branch merge or authentication modification.

## Independent scientific judge handoff (request, NOT a claim of agent execution)
Use pinned source artifact and script, not author-supplied numeric transcriptions alone. Independently:
1. Check raw ZIP digest/manifest; challenge four HTML source markers and their exact 19-versus-20 age-group note; recompute county row arithmetic and count-rounding envelope.
2. Decide whether NCI State Cancer Profiles late-stage share uses unknown-stage cases in its denominator for **this 2025 release**. Do **not** assume CDC's different reporting interface is identical. Retrieve source-specific denominator metadata and audit codebook definitions.
3. Develop a comparability sensitivity plan using matched age partitions, stage recodes, 2019–2023 periods, CI calculation and release vintages. Identify whether current data access is adequate before promising an adjusted rate.
4. Inspect [Sharma full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC7688501/) and any corrigendum/case table to adjudicate 8 vs 9 and clinical classification 3 vs 4; record dissent rather than accepting author framing.
5. Review D01–D10 with **independent signed/dated evidence and explicitly refute at least one favored causal explanation** where justified. Reserve acceptance sign-off to judge/owner. This document is an **independent-review task handoff**, not independent clearance or a launched agent.

**Next 15-minute research unit:** First retrieve source-specific late-stage denominator and 2019–2023 staging variable metadata; if unavailable, mark blocked with exact missing resource. Next attempt common-19-group vs SEER-20-group standardization bounds with public age-band data (or establish irreducible aggregation). Only then advance W2 acceptance or test upstream decision impacts; separately search formal Sharma correction/supplement. The long-term aim remains earliest risk/warning sign → justified completed action → tested prevention outcome across diseases, not a post-FIT-only intervention.

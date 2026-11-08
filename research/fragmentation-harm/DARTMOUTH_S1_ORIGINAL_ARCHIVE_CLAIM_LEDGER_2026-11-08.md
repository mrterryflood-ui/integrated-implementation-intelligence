# Dartmouth ChainWeb Sprint S1 — primary-source archive replay and empirical claim adjudication
**Date:** 2026-11-08. **Mission alignment:** fixed integrated PREVENTION question in issue #81, charter and approved sprint plan. **Work packages:** W2 source/construct reconciliation, W4 independent primary-paper verification. **Not** a new local patient cohort, decision effect, or clinical outcome.

## What was actually inspected
1. Downloaded the **retained original GitHub Actions source ZIP**, workflow run [42411939810](https://github.com/mrterryflood-ui/integrated-implementation-intelligence/actions/runs/42411939810), artifact **13589404488**, size 2,692,160 bytes; GitHub digest `sha256:ddee039ad52fbe27b694e3e64a01d7d5ec2b0e9cb24b535fce47b8434dba727a`. Locally recomputed ZIP SHA-256 and it **matched**.
2. Inspected `MANIFEST_SHA256.json` and independently SHA-checked **all 18 manifest-listed entries** against actual ZIP bytes. An additional `readiness.json` is included but **not listed in the internal manifest**; it is covered by the whole-ZIP digest, not misreported as a manifest-checked entry.
3. Inspected the four retained **original HTML** responses `originals/{hinds_all,hinds_late,harris_all,harris_late}.html` and their corresponding extracted CSVs. All four displayed `Colon & Rectum`, appropriate stage selector and **2019–2023** report heading. County HTML table cells independently matched the extracted CSV rows.
4. Checked `acquisition_receipt.json`: **8/10** listed original sources retained, with `nsfg_codebook` and `nsfg_published` marked `ACQUISITION_FAILED`. County originals were among retained records. Acquisition receipt declares revision `73455a439f950ffa0644d5714843b06b173f029a`, while artifact workflow head was `312577b8e43efadaceb4b834dc524dc11368d3fe`. **Source/commit binding mismatch remains unresolved**; byte authenticity and revision provenance are separate tests.
5. Independently read the published full-text HTML of [Conderino et al. 2022](https://doi.org/10.1186/s12911-022-01831-8), especially Methods/Results screening indicator definition and separate analytic populations, and [Thompson et al. 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC8208472/) Methods and Tables 1–2. Conderino claim wording corrected directly in `EMPIRICAL_MECHANISMS_2026-11-08.md`.

## Primary county rows — directly replayed, 2019–2023
All incidence rates are **annual, age-adjusted per 100,000 residents**; confidence intervals are rate CIs. Case shares have a **different denominator** and no share CI supplied by the retained row.

| Original HTML row | Incidence rate (95% CI) | Average annual count | Percent of *cases* late-stage |
| --- | ---: | ---: | ---: |
| Hinds, all stages | 46.4 (42.6–50.5) | 118 | not applicable |
| Hinds, late stage | 29.9 (26.8–33.2) | 75 | **63.7%** |
| Harris, all stages | 38.0 (37.2–38.9) | 1,732 | not applicable |
| Harris, late stage | 23.9 (23.3–24.6) | 1,098 | **63.4%** |

**Reproduced arithmetic, not causal effects:**
- Age-adjusted late-stage rate gap Hinds minus Harris: `29.9 - 23.9 = 6.0` per 100,000/year.
- Late-stage rate relative excess: `(29.9/23.9 - 1)*100 = 25.104603%`.
- All-stage rate gap: `46.4 - 38.0 = 8.4` per 100,000/year.
- **Case-share** difference: `63.7 - 63.4 = 0.3 percentage points`; close numerically does **not** establish statistical equivalence.
- Quotients of age-adjusted rates `29.9/46.4*100 = 64.439655%` (Hinds), `23.9/38.0*100 = 62.894737%` (Harris); **neither quotient is the observed case-share**.
- Ratios of **rounded** average annual counts are `75/118*100 = 63.559322%`, `1098/1732*100 = 63.394919%`, not guaranteed to recover the full-case share because annual counts are rounded and denominator specification requires source footnote review. Do not infer exact five-year case numerators or stage unknowns from displayed rounded counts.

## W2/W4 empirical claims — claim-by-claim ledger
| ID | Exact proposition | Evidence source, population and time | Status/result | Discriminating gap / independent challenge |
| --- | --- | --- | --- | --- |
| C01 | Retained NCI county HTML reports show near-equal 2019–2023 CRC late-stage case shares and different standardized late-stage rates | Four archived 2019–23 NCI county HTML files, ZIP/manifest SHA verified | **VERIFIED archived descriptive claim** | Independent reviewer to reproduce four rows; validate NCI stage/unknown-stage denominators and suppression/revision |
| C02 | Hinds/Harris use identical source instruments and staging pipelines—or conversely differences necessarily cause the observed rate gap | Common State Cancer Profiles display but **different footnoted registry input streams**: Hinds county row source marker **2 = NPCR 2025 submission**, Harris marker **7 = SEER November 2025 submission**. Late-stage footnote distinguishes SEER Combined Summary Stage with Expanded Regional Codes vs NPCR Merged Summary Stage, allowing context-specific staging variables | **VERIFIED source-lineage difference; causal and quantitative comparability implications UNTESTED** | Independent stage/unknown-case, source quality, year-specific coding and population methods review before claiming that either measurement differences explain the rate gap |
| C03 | Similar late-stage share establishes equivalent disease burden or equally effective prevention | Case proportion and age-adjusted resident rate have different target estimands; no margin/test for share equivalence | **CONTRADICTED** | Age strata, stage coding, independent incidence and uncertainty; no formal equivalence test |
| C04 | Archived 2019–23 observations could have informed a 2020 or 2023 decision in their final reported form | Retained multiyear reports; source acquisition artifact created Nov 2026 | **CONTRADICTED** | Historical decision must use contemporaneously available data/release dates; distinguish observation period from first release |
| C05 | Common data models can omit some previously documented screening information | Conderino et al. 2022, NYC INSIGHT (1,844,491 2018 encounter patients) vs NYU Langone raw EHR (604,699 2018 encounter patients) | **SUPPORTED in cited setting** | **Correction:** 0.42 CRC prevalence ratio compares different samples, not paired within-patient record loss; 15.9% is reported in paper's NYU Langone patient context, not clearly percent of screening records; exact denominator requires supplement |
| C06 | EHR-linked cases represent all cases in the regional population | Thompson et al. 2020, California; 2012–13 four-cancer validation cohort 41,165 | **CONTRADICTED in cited setting** | 10,659 EHR episode-care patients vs 30,506 other regional patients. Coverage and composition vary. Cannot transport numeric selection factors to Hinds/Harris |
| C07 | EHR/registry missing cases prove those patients failed to access care | Thompson 2020; 12,280/16,257 (75.5%) had EHR evidence, 3,977 no such evidence; 3,684 recorded EHR encounter before, 293 after cancer diagnosis | **CONTRADICTED as an implication** | Migration/episodic use and care elsewhere are plausible, not validated missed care |
| C08 | Our system would already have changed a documented Hinds/Harris prevention recommendation | No actual historical decision record, decision owner/date or earlier available multi-source evidence linked | **UNTESTED / not established** | Obtain specified real decision and available-at-time data; adjudicate a justified nonchange too |
| C09 | ChainWeb has prevented CRC or produced connected cross-disease health benefits | No authorized person-level pathway, intervention delivery, control outcomes or independent effect evaluation | **UNTESTED** | Prospective or target-trial/appropriate quasi-experimental study; harms, feasibility, equity, sensitivity |

## Important primary-full-text correction, already committed
The earlier wording that 15.9% represented '**colorectal screening records lost**' and that the prevalence ratio 0.42 was an '**internal matched raw-vs-CDM**' comparison was **too strong and potentially misleading**. Conderino compared different INSIGHT and NYU Langone analytic samples, with differences potentially reflecting coding and selection. This distinction is central to the mission: reliable integration cannot begin with a mistaken denominator.

**Correction commit:** `617e20db21d13cf079e0cee4e2bbfbada01d8ec9`.

## Provenance and reproducibility receipt
- Downloaded artifact: [run 42411939810](https://github.com/mrterryflood-ui/integrated-implementation-intelligence/actions/runs/42411939810), ZIP digest above; byte-count 2,692,160.
- Public-script replay entry point: `research/fragmentation-harm/replay_retained_county_archive.py` (no external libraries, exactly identified artifact SHA; fail closed on altered ZIP, source manifests, county rows, period/stage and CSV divergence).
- This execution tested a structurally equivalent local replay implementation against **the actual downloaded ZIP**, with matching results, **not a synthetic fixture**. The repository script still requires its own GitHub CI rerun before being labeled CI-validated.
- Separate earlier engineering CI success is not a scientific-review receipt.
- Archived source authenticity is **not** a guarantee of a publication version contemporaneously available in 2019–2023, and archive download does not solve the unresolved revision-binding mismatch.

## Status, owners and next experiments
- **W2 = PARTIAL (source archive now directly inspected and rates reproduced).** Remaining for acceptance: independent external-agent numeric replay and adjudication of unknown-stage numerator/denominator conventions and revision mismatch. **Owner:** scientific source-integrity lead + independent reviewer.
- **W4 = PARTIAL (Conderino, Thompson primary full-text checks performed and claim corrected).** Need Sharma full-text count discrepancy/source table, and independent challenge of scope and alternative explanations. **Owner:** scientific evidence lead + independent reviewer.
- **W3, W5–W7, W9 = PARTIAL; W8, W10 = NOT COMPLETE; W1 = ACCEPTED.** Accepted packages remain **1/10**; no score inflation.
- **Next 15-minute unit:** independent agent replay of four original HTML rows & challenge of C05 population/denominator, then complete Sharma full-text source checks; in parallel the research lead continues upstream early-signal causal counterfactual specification. Must record evidence, dissent and closure tests in the cross-agent handoff.
- **No PHI**, external outreach, submission, paid tools, authentication work or merge performed in this sprint.


## Additional exact-source footnote discovery — archive confirmed
A subsequent inspection of the actual four original NCI HTML source footnotes (not a cached or live replacement) established a nontrivial **input-lineage difference beneath a common public reporting interface**:
- The **Hinds** county rows carry superscript **2**, mapped by the retained source to **National Program of Cancer Registries (NPCR), based on the 2025 submission**.
- The **Harris** county rows carry superscript **7**, mapped by the retained source to **SEER November 2025 submission**.
- All four reports use the 2000 U.S. standard population for incidence-rate age adjustment (19 age groups as reported in the NCI footnote); the late-stage table defines regional/distant and notes **Combined Summary Stage with Expanded Regional Codes for SEER** versus **Merged Summary Stage for NPCR**, with conditional use of other staging variables.
- Hence **same dashboard ≠ same underlying capture/coding lineage**, although it also does not follow that the lineages necessarily produce incomparable rates or explain the observed differences. An instrument/coding harmonization study is now an explicit discriminating test, not an assumed answer.
- The 2019–2023 observation windows derive from **2025 submissions**. Those finalized county summaries were not available as such for prevention decisions during the underlying 2019–2023 periods, reinforcing claim C04. Earlier contemporaneous releases may have existed, and their version/date must be retrieved before historical decision analysis.
- CDC's U.S. Cancer Statistics stage distribution supports two possible denominator presentations—with and without unstaged cases—but **does not settle which one the retained NCI State Cancer Profiles 'Percent of Cases with Late Stage' uses in this exact report**. Source-specific stage percentage denominators therefore remain open. See https://www.cdc.gov/united-states-cancer-statistics/technical-notes/stage-at-diagnosis.html and https://seer.cancer.gov/data-software/documentation/seerstat/nov2025/ .

**Independent agent action:** extract and quote the original archived county source superscripts and matching footnotes; obtain source-specific variable dictionaries for both 2025 submissions and reproduce stage-share definitions with explicit known/unknown-stage treatment. Do not treat these differing registry inputs as two independent experimental replications or as an explanation of any unmeasured local preventive outcome.

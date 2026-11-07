# DIS Explanation Observatory — Source discrepancy and mechanism ledger
**2026-11-07. Research finding, not a causal estimate or intervention recommendation.**

## Discovery 001: Harris County late-stage colorectal source disagreement
Original exercise retained NCI State Cancer Profiles 2018–2022 Harris County late-stage colorectal: share 63.4%, adjusted late-stage rate 23.3 per 100,000, average annual count 1,044. On independent public-table inspection, NCI State Cancer Profiles Texas county 2018–2022 now displays Harris County share 63.4%, rate **23.9 (95% CI 23.3–24.6)**, count **1,098**. Hinds County Mississippi 2018–2022 still displays share 63.3%, rate **30.4 (27.3–33.8)**, count **76**. Sources:
- Hinds: https://www.statecancerprofiles.cancer.gov/incidencerates/index.php?age=001&areatype=county&cancer=020&graph=2&race=00&ruralurban=0&sex=0&sortOrder=desc&sortVariableName=count&stage=211&statefips=28&type=incd&year=0
- Harris: https://statecancerprofiles.cancer.gov/incidencerates/index.php?age=001&areatype=county&cancer=020&race=00&ruralurban=0&sex=0&stage=211&statefips=48&type=incd
- The latter page states created 2026-09-25. Source page and retrieval provenance must be archived in the repository or controlled evidence store; a web result alone is not an immutable original-source snapshot.

**Recalculated source-reported descriptive contrast:** Hinds minus Harris adjusted late-stage rate = 6.5 per 100,000; rate ratio = 30.4/23.9 = 1.272 (27.2% higher). Previous 30.4/23.3 = 1.305. Case count difference is not an adjusted-rate comparison. No standard error for the *difference* is estimated here; the two published intervals are not an independent contrast test.

**Decision:** SOURCE_CONFLICT_OPEN. Preserve both versions, identify exact original Harris table and extraction/release, rerun source queries, inspect site/stage/race/sex/year parameters and registry update notices. Do not replace 23.3/1,044 silently. Hinds County is not Jackson city; Harris County is not Houston city. Similar case shares are not equal burden, equal access, equal screening performance or causal mechanisms.

## Discovery 002: national three-cancer coefficients
Pinned 50-state curated aggregate previously produced colorectal–lung Pearson r ~0.735 for late-stage incidence rates versus ~0.129 for conditional late-stage case shares. These are different estimands. Two secondary figures remain disputed: colorectal–breast case-share Pearson previously 0.234 vs recalculated 0.231; lung–breast case-share Spearman previously 0.413 vs recalculated 0.410. Original source-row export, script, rounding and rank tie handling must be reconstructed. Cross-state correlation cannot identify individual exposures or common causal pathways.

**Decision:** DESCRIPTIVE_ONLY / SOURCE_RECONCILIATION_REQUIRED. No common mechanism or policy attribution.

## Discovery 003: NSFG gynecologic diagnoses and ascertainment
NCHS Health E-Stat 121 (July 2026), https://www.cdc.gov/nchs/data/hestat/hestat121.htm , reports nationally representative 2022–2023 NSFG weighted ever-diagnosed estimates among 4,856 female respondents aged 20–49:
- Endometriosis 6.2% (95% CI 5.2–7.2); PCOS 8.7% (7.7–9.8); fibroids 7.8% (6.8–8.9).
- Endometriosis: non-Hispanic White 8.1% versus non-Hispanic Black 3.7%; a **4.4 percentage-point descriptive difference**. This cannot independently distinguish biological occurrence from access, recognition or recall.
- PCOS: non-Hispanic Black 4.4% versus non-Hispanic White 9.9%; a **5.5 percentage-point descriptive difference**. Survey source identifies the Black estimate as lowest among race/Hispanic-origin groups displayed.
- Fibroids: non-Hispanic Black 12.5% versus non-Hispanic White 7.1%; a **5.4 percentage-point descriptive difference** in the opposite direction from PCOS.
- Age 20–29 vs 40–49 fibroid ever-diagnosed 1.4% vs 15.8%; a **14.4 percentage-point descriptive difference**. Age, cumulative time-at-risk and diagnosis opportunity differ.
- NCHS reports fertility problems among diagnosed vs not diagnosed: endometriosis 33.0% vs 18.6%; PCOS 45.2% vs 17.1%; fibroids 25.4% vs 19.0%. These are bivariate associations, not disease-attributable causal effects.

**Scientific inference:** A one-direction explanation such as 'low diagnosis equals low biological burden' or 'all three conditions share the same diagnosis disparity' is contradicted by the pattern of reported diagnoses. This does not prove a particular cause. Survey-weighted estimates and uncertainty must be independently replicated using original public-use survey design variables. NCHS itself cautions that its bivariate associations may be explained by unmeasured factors.

**Decision:** DESCRIPTIVE_FINDINGS_SUPPORTED_BY_ORIGINAL_NCHS_REPORT; BIOLOGICAL_PREVALENCE, UNDERDIAGNOSIS QUANTIFICATION AND CAUSAL MECHANISM NOT ESTABLISHED.

## Continuous system acceptance
1. Source snapshots are immutable, content-hashed and linked to query parameters, retrieval date, publication period and version.
2. A new source value produces a **discrepancy event**, not a silent replacement; preserve prior claims and notify a reviewer.
3. Construct compatibility must be checked before any statistical pooling, comparison or rate arithmetic.
4. Mechanisms require rival explanations and tests capable of disconfirmation; report unknowns and negative results.
5. An independently verified source can support a descriptive finding without validating the system's explanation.
6. Operational and lived-experience claims require real authorized evidence, not inferred narratives.
7. Independent epidemiology, survey-methods and implementation-science review precedes public recommendations to ACS or others.
8. A sustained service needs scheduled source refresh, source-change triggers, audit history, human reviewer assignments, reproducible analyses, monitoring, and a demonstrated end-to-end production witness.

**Next work:** Retrieve and archive exact Harris source vintages; reconstruct 50-state source rows and methods; reproduce NSFG survey-weighted estimates; add a source-discrepancy event model and durable authenticated review queue; test reviewer signoff, tenant separation and subsequent reopens. These steps are NOT represented as completed here.

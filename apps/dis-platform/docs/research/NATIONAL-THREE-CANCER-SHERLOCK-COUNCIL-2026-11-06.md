# Three cancers, one nation: a Sherlock Holmes DIS × RPLICE investigation
**National public-source research dossier** | 2026-11-06 | **Status: descriptive replication and testable hypotheses; not a causal evaluation, patient cohort study, verified environmental exposure join, expert-panel endorsement, or real intervention.**

## Mission and research question
**Primary desired outcome:** prevent new incident colorectal, lung and breast cancers wherever valid evidence identifies a modifiable mechanism. **Secondary outcomes:** fewer regional/distant-stage diagnoses, earlier risk recognition, improved equity, reduced diagnostic delay and mortality, and safe, sustainable operations.

**Question:** Why do some locations have almost identical *percentages of cancers diagnosed regional or distant* despite very different rates per resident, and do those patterns transfer across colorectal, lung and female breast cancer? How do race, sex, age, rurality, socioeconomic structures, historically relevant environmental exposures, disease biology, genetic susceptibility, detection and care systems combine to produce divergence?

**Focal geographies:** Hinds County MS (Jackson proxy), Harris County TX (Houston proxy), and Colorado statewide; national empirical reference is ALL 50 states. These are not equivalent geography types; compare like units before making location-specific conclusions.

## Exhibit 1: National, within-disease stage comparisons
**NCI State Cancer Profiles, 2019–2023, all ages, all races (including Hispanic).** Late stage means regional or distant disease, not metastatic-only stage IV. Age-adjusted late-stage incidence is cases per 100,000 residents/year; breast rates use a FEMALE denominator. Stage-share percentage is the share among *diagnosed incident cancer cases*. The denominators differ, so they are never treated as interchangeable.

| Population | Colorectal rate / late % | Lung rate / late % | Female breast rate / late % |
|---|---|---|---|
| United States | 22.3 / 60.2% | 32.8 / 63.5% | 42.6 / 30.7% |
| Mississippi | 28.9 / 63.0% | 44.2 / 66.5% | 45.7 / 35.1% |
| Texas | 23.7 / 61.5% | 28.3 / 64.8% | 42.9 / 33.4% |
| Colorado | 19.7 / 64.0% | 21.6 / 60.2% | 42.8 / 30.7% |
| Utah | 18.3 / 60.3% | 16.0 / 66.5% | 43.0 / 33.6% |
| Kentucky | 27.5 / 59.4% | 55.8 / 66.9% | 42.4 / 30.9% |
| Louisiana | 26.1 / 58.0% | 43.1 / 71.4% | 45.9 / 33.8% |
| Massachusetts | 18.5 / 57.4% | 33.0 / 57.8% | 37.7 / 24.9% |
| California | 19.6 / 56.1% | 23.2 / 64.8% | 42.3 / 32.0% |

**All 50 states plus DC, Puerto Rico, and US** are preserved in exactly matching mirrored TypeScript reference datasets:
- DIS: `apps/dis-platform/lib/national-three-cancer-reference.ts`; UI `/research-program/national-cancers`; read-only `/api/research/national-three-cancers`.
- RPLICE: `shared/national-three-cancer-reference.ts`; existing Cancer Data Federation `/cancer-data-federation`; read-only `/api/cancer-data/national-three-cancers` and `rplice_get_national_three_cancers` MCP tool.
- RPLICE remains source owner for specialist methodology (HIL-selected SALP, Parallax, adaptation/fidelity) while DIS coordinates inquiry, evidence, implementation and translation. Code presence is not proof of published deployment.

**Marked coincidences and divergences:**
1. **Mississippi vs Utah lung:** BOTH have exactly 66.5% late-stage share, but Mississippi 44.2 vs Utah 16.0 late-stage incidence (2.76×). The same within-cancer conditional stage share conceals very different per-person burdens.
2. **Mississippi vs Colorado colorectal:** 63.0% vs 64.0% late-stage share, 28.9 vs 19.7 incidence (1.47×).
3. **Mississippi vs Colorado female breast:** 35.1% vs 30.7% share, 45.7 vs 42.8 incidence (1.07×), substantially smaller geographical contrast than lung.
4. **Louisiana vs Hawaii lung:** 71.4% vs 72.1% late-stage share, 43.1 vs 27.4 incidence. High late-stage fraction is not equivalent to high population incidence.
5. No denominator permits interpreting these figures as how likely a specific Black/Hispanic/White person is to have cancer or to be diagnosed late.

## Exhibit 2: All-state correlation diagnostics
**Computed from 50 independent state summary observations** (excluding DC, Puerto Rico and national reference); descriptive, unweighted Pearson r, 2019–2023:
| Relationship | Correlation of late-stage **population incidence** | Correlation of conditional **stage share** |
|---|---:|---:|
| Colorectal ↔ lung | **0.735** | **0.129** |
| Colorectal ↔ female breast | 0.449 | 0.231 |
| Lung ↔ female breast | 0.291 | 0.446 |

This is an **ecological national observation**, not exposure attribution. Statistical independence of state observations, historical autocorrelation, spatial autocorrelation, statewide demographic mixtures and multiple-comparison issues require explicit treatment before inference. Correlation does NOT describe geographic clustering within states or causally established shared pathways.

**Important competing explanations:** (a) shared social/deprivation and smoking/metabolic exposures affect incidence, (b) population age/race/sex and historically differing exposures make state aggregates misleading, (c) each cancer has different tumor biology, preventability, and screening/detection pathways affecting stage share, (d) stage coding, case ascertainment and populations differ across subgroups. A weak correlation in stage shares does not prove that any screening system works or fails.

## Exhibit 3: Independent urbanicity comparison changes the mechanistic narrative
American Cancer Society disparities report, all-stage incidence 2018–2022, SEER areas (~36.7% US population), NOT the matched 2019–2023 stage cohort. Cases per 100,000/year:
| Cancer | Counties in metros ≥1 million | Nonmetropolitan counties | Rural:metro ratio |
|---|---:|---:|---:|
| Colorectal | 34.2 | 40.6 | 1.19 |
| Lung & bronchus | 43.9 | 62.5 | 1.42 |
| Female breast | 132.3 | 122.1 | 0.92 |

**Interpretation:** Rural/urban differences are disease-specific and reverse for female breast incidence. This provides independent triangulation that neither a simple healthcare-delay theory nor a single chemical or food environment explanation is adequate. The datasets and times are intentionally kept separate; no per-county/race analytic join has been performed.

## Exhibit 4: Race and sex matter, and must not be confused with genotype
ACS 2018–2022 national age-adjusted incidence in non-Hispanic populations:
| Cancer | NH White | NH Black |
|---|---:|---:|
| Colorectal | 34.7 | 39.5 |
| Lung both sexes | 56.9 | 54.0 |
| Lung males | 61.5 | 67.5 |
| Lung females | 53.5 | 44.6 |
| Female breast | 137.4 | 130.6 |

The combined-sex lung rate masks opposite male/female patterns. Female breast *incidence* among Black women is lower than White women nationally, while mortality remains substantially higher; the incidence and survival/outcome systems must be separately analyzed. Racial/ethnic classifications are social/registry variables and are NOT equivalent to genetic ancestry, inherited mutations, environmental dose or homogeneous lived experience. Within-state and within-race comparisons are needed.

## Sherlock Council: evidence and alternative explanations (analytical lenses; no invited external experts)
**Cancer biologist:** A CRC, a lung carcinoma and a breast tumor do not have the same natural history, histologic subtype, hormonal/genomic drivers or screening eligibility. Breast stage shares near 30% vs lung and CRC near 60% do not mean equal detection technology across cancers.
**Cancer epidemiologist:** Separate all-stage cancer incidence (the primary prevention endpoint), regional/distant incidence, and stage share among diagnosed cases. Do not derive all-stage age-adjusted incidence as late-stage rate divided by percent late.
**Environmental scientist:** Map historic sources of contamination and actual exposure routes (air/soil/water/food/occupation) across 10–30-year latency and residential mobility. EPA ECHO facility locations and landfill pins are leads, not individual chemical dose or causes.
**Social epidemiologist:** Evaluate poverty, health coverage, education, employment, housing, residential segregation, food availability, and unequal toxic exposure within race × sex × age × urbanicity cohorts. Do not attribute individual risk from an aggregate ZIP/county.
**Genetics and clinical risk scientist:** Separate tumor somatic genomics from inherited susceptibility and family history, examine Lynch/FAP/BRCA1/BRCA2/HER2/ER/PR contexts, and account for differential testing and representativeness.
**Clinical implementation scientist:** CRC colonoscopic removal of precursor lesions can prevent incidence; lung LDCT and mammography generally aim to find disease earlier rather than prevent initial carcinogenesis. Distinguish early-detection clinical impact from exposure reduction, primary prevention and overdiagnosis.
**Measurement skeptic:** Ask whether stage-coded registry aggregates (case share) mathematically mask greatly differing underlying incidence, age composition, stage missingness, eligibility shifts, and data lags.
**Community lived experience:** Do not invent people's experience; actual place-based engagement is necessary to test exposure histories, services and harms.
**Independent red-team:** Alternative to a broad environmental toxicant theory is a shared smoking/deprivation gradient combined with unrelated biology and screening. An alternative to a pure care-pathway explanation is different actual cancer occurrence. Both must remain live hypotheses.

## Explicit discriminating tests
1. **Nationwide cohort alignment:** Use a single, fully specified vintage of CDC USCS all-stage/stage incidence and counties with stable high counts, with race/ethnicity, sex and ages; preserve suppression and confidence intervals.
2. **Falsify the shared-incidence idea:** Fit separate lung, CRC and female breast models with prespecified smoking histories, obesity, deprivation, insurance, rurality, occupation and exposure metrics. Determine whether a shared latent geographic component survives adjustment and spatial autocorrelation.
3. **Falsify the pure detection explanation:** Use late-stage *incidence* and stage fractions separately; control for true cancer occurrence, subtype, symptom-onset cohorts, screening eligible populations and diagnostic resolution. Disease biology is not reducible to failed screening.
4. **Environmental timing test:** Join permitted retrospective EPA TRI, AQS, Superfund/RCRA, drinking-water, transport and occupational histories by appropriately lagged residence/catchment, source vintage, pathway and measured/validated dose. Use distance only as a hypothesis generation aid.
5. **Racial/social inequity test:** Hierarchical within-state age × race × sex × neighborhood disadvantage contrasts; evaluate residential segregation and exposure burden without treating race as a cause or revealing small-cell data.
6. **Genetics test:** Use approved hereditary-risk studies, tumor molecular information and family histories in scientifically appropriate cohorts; never infer mutations from racial identity or county location.
7. **Counterfactuals:** Prespecify causal DAG, outcome unit, negative-control exposures/outcomes, matched controls, parallel trends, secular risk history and spatial spillover; do not run naïve DDD on three state cross-sectional rates.
8. **Source and publication audit:** Validate original NCI tables, reference year, race recode, histology, stage code and rate standard before external manuscript. Static manually transcribed reference must be reconciled against official downloadable export.

## Research-to-action and decision doctrine
**Ends:** measurable, equitable reduction in *new* incident cancer. **Ways:** cancer-specific prevention of established modifiable causes, verified environmental remediation, accessible healthy environments, hereditary-risk recognition and appropriately supported early detection. **Means:** DIS orchestration, RPLICE specialist methods, CDC/NCI/ACS/EPA/USDA/Census/HRSA sources, place-based stakeholders and clinically authorized owners. **Risks:** ecological fallacy, over-testing, stigmatization, unverified facility accusation, exposure latency, misleading screening metrics, cost, institutional data rights, misestimated efficacy. **Measures:** new cancer incidence, exposure reduction with actual dose metrics, advanced-stage incidence, equity, diagnostic time, harms and sustainment.

**MAP–GAP:** ORIENT → AUDIT → MAP → GAP → ALIGN → ACT → TRACK → ADAPT → SHARE → RE-MAP. Compare Designed, Operational and Experienced realities; HIL select methodology not arbitrary blanket HOLD. Retain genuine requirements for privacy/credentialed clinical authority and actual pilot signoff. Revisit earlier decade, today, day-after-success, following decade.

**Collaborative research readiness:** The national descriptive study is reproducible in code; causal claims and funded intervention readiness are *not* established. Dartmouth faculty review is prospective, not a confirmed study partnership. A shareable read-ahead should retain raw source links, methods, adverse findings, and no exaggerated completion claims. ARPA-H initial fit may be Proactive Health, but require validated novelty, a consortium, milestone and a solicitation-specific eligibility check before proposal.

## Original citations and source URLs
1. NCI/CDC State Cancer Profiles. Invasive colorectal cancer (regional/distant stage), 2019–2023: https://statecancerprofiles.cancer.gov/incidencerates/index.php?age=001&areatype=state&cancer=020&race=00&ruralurban=0&sex=0&sortOrder=desc&sortVariableName=percentlate&stage=211&statefips=00&type=incd&year=0
2. NCI/CDC State Cancer Profiles. Lung and bronchus (regional/distant), 2019–2023: https://statecancerprofiles.cancer.gov/incidencerates/index.php?age=001&areatype=state&cancer=047&datatype=01&race=00&ruralurban=0&sex=0&sortOrder=asc&sortVariableName=rate&stage=211&statefips=00&type=incd&year=0
3. NCI/CDC State Cancer Profiles. Female breast (regional/distant), 2019–2023: https://statecancerprofiles.cancer.gov/incidencerates/index.php?age=001&areatype=state&cancer=055&race=00&sortOrder=desc&sortVariableName=percentlate&stage=211&statefips=00&type=incd&year=0
4. Islami F, et al. American Cancer Society's Report on the Status of Cancer Disparities in the United States, 2025. *CA Cancer J Clin*. 2026. https://doi.org/10.3322/caac.70045
5. NCI. Colorectal Cancer Prevention (PDQ). https://www.cancer.gov/types/colorectal/hp/colorectal-prevention-pdq
6. NCI. Breast Cancer Prevention (PDQ). https://www.cancer.gov/types/breast/hp/breast-prevention-pdq
7. CDC. US Cancer Statistics source system and variable definitions: https://www.cdc.gov/cancer/data/
8. U.S. EPA. Enforcement and Compliance History Online: https://echo.epa.gov/tools/map-service
9. USDA ERS. Food Environment Atlas: https://www.ers.usda.gov/data-products/food-environment-atlas/

**Boundary and release receipt:** All numeric findings are from published public source tables and transparent calculations. Neither DIS nor RPLICE has demonstrated a live SEER Research Data account connection, race-by-county exposure join, facility-specific causality, external researcher agreement, intervention trial or verified live deployment of this feature on production. The national NCI snapshot is mirrored in both code repositories for peer review and reproducibility and is not a replacement for official up-to-date extraction.

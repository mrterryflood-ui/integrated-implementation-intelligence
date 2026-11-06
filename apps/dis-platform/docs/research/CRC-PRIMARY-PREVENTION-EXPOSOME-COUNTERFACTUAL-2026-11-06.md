# DIS prevention-first comparative systems inquiry: Jackson–Houston and national replicates
**Research snapshot:** 2026-11-06 | **Status:** public-source analytical dossier and testable counterfactual design; no institutional/participant enrollment, individual clinical information, causal proof, GIS epidemiologic join or implemented intervention.

## End state and falsifiable central question
**Primary mission:** Reduce **new incident colorectal cancer** in at-risk populations, particularly preventable environmental and other life-course risks. **Additional outcomes:** reduce regional/distant-stage incidence, diagnostic delay, inequity, unintended harms and preventable death. A screening completion count or lower mortality alone does not satisfy the primary prevention mission. Colonoscopic removal of precursor polyps is one established way early detection can also prevent new cancer, so primary prevention must not be placed in a false dichotomy with effective screening.

**Research question:** Which combinations of cumulative environmental, inherited, occupational, nutritional, behavioral and health-system conditions best explain *all-stage incidence, early-onset incidence, advanced-stage incidence and stage fraction* across apparently similar and contrasting areas? Which modifiable mechanisms can be intervened upon ethically to reduce future incident cancers, and what local forms are required?

## 1. Observed comparison: no causal inference from two equal percentages
NCI State Cancer Profiles uses population cancer registries. The county reference is **2018–2022**, and Hinds is not the city of Jackson; Harris is not the city of Houston. Diagnoses classed late-stage include **regional AND distant**; neither corresponds to metastatic Stage IV alone.

| 2018–2022 county | Regional/distant among diagnosed CRC | Late-stage incidence /100k annually |
|---|---:|---:|
| Hinds, Mississippi | 63.3% | 30.4 |
| Harris, Texas | 63.4% | 23.3 |

NCI's more recent **2019–2023 state** series is a different partially overlapping time window; do not pool with the above county rows in regression as if contemporaneous:
| State | Late-stage case share | Late-stage incidence /100k annually |
|---|---:|---:|
| Mississippi | 63.0% | 28.9 |
| Missouri | 63.3% | 25.7 |
| Colorado | 64.0% | 19.7 |
| North Carolina | 63.1% | 22.6 |
| Texas | 61.5% | 23.7 |
| Alabama | 53.8% | 21.9 |
| California | 56.1% | 19.6 |
| US | 60.2% | 22.3 |

The stage-share equality is a verified **descriptive observation**, not a verified correlation between an exposure and cancer. Multiple different disease-incidence, biological and ascertainment systems can generate similar conditional stage fractions. States of comparable stage fraction but very different incidence (e.g. Mississippi vs Colorado) are valuable **discordant comparators**.

## 2. Demographic and context differences are mechanisms to investigate, not causal labels
US Census QuickFacts, July 2025 population, and 2020–2024 social estimates (different years than cancer stage series):
| Indicator | Hinds County MS | Harris County TX |
|---|---:|---:|
| Population estimate 2025 | 211,888 | 5,045,026 |
| Residents age 65+ | 19.4% | 13.1% |
| Black alone | 70.4% | 20.5% |
| Hispanic/Latino (any race) | 3.0% | 46.1% |
| Foreign-born | 2.0% | 26.8% |
| Poverty | 22.2% | 16.7% |
| Uninsured younger than 65 | 13.3% | 22.8% |
| Median household income (2024 dollars) | $49,402 | $74,983 |

Race and ethnicity are not genotypes, chemical doses or biological causal proxies. These aggregates do not tell us the demographic distribution of people diagnosed with cancer in those counties; registry-standardized age/race strata and individual causal controls would be required.

## 3. Designed, operational and experienced systems
**Designed:** cancer prevention (modifiable exposure prevention, protective environments), individualized risk recognition, appropriate screening, removal of precancerous lesions, timely investigation of symptoms, accurate staging, prompt care and long-term learning.
**Operational:** cancer registries are lagged; screenings measured by various denominators and years; industrial permits and facilities are not actual doses; food access is not food consumed; current residence may differ from exposure residence decades earlier; genetic testing/access is not population genotype. Programs may report screening uptake while missing stage and incidence outcomes and care-cascade resolution.
**Experienced:** people face varying affordability, language, care navigation, environmental work/residential exposures, family-history awareness, and socioeconomic constraints. Their lived experience needs legitimate engagement; it cannot be simulated or imputed from county averages.

## 4. Chain-web hypothesis register and disconfirming evidence
1. **Inherited predisposition and family clustering:** Lynch syndrome mismatch repair genes (MLH1, MSH2, MSH6, PMS2, EPCAM), FAP/APC, MUTYH and other predispositions affect appropriate risk management. NCI estimates Lynch syndrome accounts for around 3% of diagnosed CRC. Test with appropriate family history, tumor molecular testing, genetic counseling and consented research; never infer hereditary risk from a GIS point or racial identity. A null inherited-risk gradient argues against this pathway as explanation for cross-area patterns.
2. **Metabolic/life-course factors:** adiposity, insulin/metabolic exposures, smoking, alcohol, physical activity and diet; evaluate temporality and competing causes rather than ranking neighborhoods by restaurants. A 2024 Annals of Oncology GWAS/Mendelian-randomization study of 6,176 early-onset cases found genetic loci and risk-factor signals but does not prove locality-specific causes.
3. **Industrial, waste and agricultural exposure:** test historical TRI releases, ECHO program types, Superfund site location/contamination, hazardous waste, pesticides, and permitted air/water emitters; specify pollutants, routes, dose, prior exposure window, biotransport and latency. A facility's location alone does not show actual exposure or a cancer cluster.
4. **Water quality:** drinking water systems, well water, nitrate, PFAS and disinfection byproducts; assign exposure from residential water-service history, not distance to a river or facility. A 2025 California nitrate/CRC ecological time-lag study supplies a hypothesis, not transportable proof.
5. **Food environment and occupation:** USDA Food Environment Atlas county restaurant/grocery indicators, Food Access tract metrics and occupational exposure/shift work patterns. Validate how consumers actually obtain food and work, with temporal and migrant histories; a fast-food restaurant count is not individual consumption, and a simple correlation can reflect deprivation or urbanization.
6. **Disease biology and progression:** inflammatory bowel disease, tumor molecular subtype, interval cancers and detection sensitivity; distinguish cancer arising from adenoma sequence from other carcinogenic processes. Do not assert all advanced stage is preventable or proof of failed screening.
7. **Care pathway:** eligibility, uptake, symptomatic evaluation, FIT-positive follow-up, specialist capacity, referral leakage and stage coding. These can change observed late-stage share independently of the number of cancers arising, and colonoscopic precursor removal can affect incidence.
8. **Data architecture and ecological bias:** registry case ascertainment, unknown stages, population denominator updates, historical cohort changes, migration, competing mortality, spatial autocorrelation, multiple comparisons, suppression and false-positive cluster detection.

For each edge record: source, vintage, geography, exposure unit, disease outcome unit, lag assumption, measurement validity, competing mechanism, historical confidence interval, testable falsifier and reviewer. Unmapped links are investigation targets, not zeroes.

## 5. GIS source-to-measure contract — reuse for any disease
| Layer | Original source | Status in this first software slice | Explicit limitation |
|---|---|---|---|
| Regulated facilities | EPA ECHO ArcGIS MapServer | **Public point query implemented in DIS and RPLICE feature branches**, verification/merge pending | Not a release, substance, dose or causal effect; at most 250 points/page |
| TRI releases | EPA TRI | **Source discovered, not joined** | Release amount != individual exposure; facility & years |
| Superfund contamination | EPA NPL/site records | Source discovered, not joined | Historical boundaries/contaminants required |
| Hazardous waste sites | EPA RCRA | Source discovered, not joined | Treatment/storage/history required |
| Air quality | EPA AQS and source-specific estimates | Source discovered, not joined | Monitor coverage and time-weighted exposure |
| Water and wells | USGS & relevant water agencies | Source discovered, not joined | Supply-system geography, paths, years |
| Restaurant and store environment | USDA Food Environment Atlas, Census CBP | Source discovered, not joined | County locations/NAICS categories not food consumed |
| Food retail access | USDA Food Access Research Atlas | Source discovered, not joined | 2019/2025 and tract vintage differences |
| Population context | Census ACS | Source discovered, not joined | Household/population estimates not patient cohort |
| Cancer outcomes | CDC USCS/NCI profiles | Curated public aggregates in case | Years, definitions, county→city equivalence invalid |
| Genetic risk | NCI PDQ; permitted research/clinical studies | Scientific literature only | No individual genetic/clinical records accessed |

**Governance:** A generalized disease–determinant registry defines endpoints, allowable geographies, original publisher, update cadence, acquisition method, privacy boundaries, exposure validity and scope. DIS coordinates the questions and evidence; RPLICE provides specialist method selection, analysis and adaptation through MCP. GIS display is a method to notice relationships, never authorization for clinical diagnoses, public accusation of a facility, or asserted causation.

## 6. Counterfactuals and measurement instruments
**Descriptive counterfactual (diagnostic):** Would another area with similar age distribution, insurance, income and historical detection intensity but different exposure history have the same incident cancer rate? Match on pre-exposure confounders; avoid controlling for downstream mediators without an explicitly causal estimand.

**Primary-prevention counterfactual:** Among comparably eligible people, estimate future **new cancer incidence** with versus without a targeted, plausible, verified exposure- or behavioral-risk reduction. The intervention must have a locally testable source pathway, assigned steward and prospective exposure outcome. Use a predeclared matched/staggered cohort, quasi-experiment, or randomized/cluster trial when feasible; plan long follow-up and define negative controls.

**Diagnostic-system counterfactual:** Given the same underlying new-cancer risk, does an improved risk-aware clinical pathway reduce late-stage incidence or delays versus competent current practice? Keep this distinct from primary exposure prevention. For colonoscopic polyp removal, also evaluate reduction in all-stage incidence over relevant follow-up.

**Earlier screening age counterfactual:** Compare risk-stratified referral at ages younger than 45 with present guideline-concordant practice only under ethical clinical and research governance. Do not recommend indiscriminate earlier screening without net-benefit evidence, capacity, potential harms and approved risk criteria. High-risk inherited/family-history situations can require different clinical pathways than average-risk recommendations.

**Primary indicators:**
- All-stage new CRC per 100,000 age-adjusted person-years; incidence under age 50 and prespecified birth cohorts; split colon/rectal sites, age and sex.
- Exposure reductions in pollutant concentration/dose and intervention reach (when directly measured), rather than number of pins or facility permits.
- Precancerous adenoma burden and documented prevention mechanisms with ascertainment effects handled.
**Secondary:** Regional/distant-stage age-adjusted incidence, stage share *separately*, FIT-to-diagnostic-resolution time, interval cancers, patient-reported barriers, mortality, equity, costs and harms.

**Sample and uncertainty:** Begin with state/county counts large enough for stable rates, use registry confidence intervals, enforce suppression, use hierarchical Bayesian/Poisson/negative-binomial methods with age/sex standardization and space-time random effects as justified. Small county extreme percentages are not evidence without precision and a shrinkage model. Do not select counties based solely on maximum/minimum post hoc rates.

**DDD:** Only after acquiring repeated pre/post, treatment/comparator, and third dimension measurements with credible identifying assumptions (parallel trends, stable coding, no anticipatory behavior, suitable comparator, spillover and precision check). Two counties with equal percent late-stage supply no DDD effect.

## 7. Proposed better system: real outputs, not renamed old ones
**A. Spatial Evidence Fabric** (shared contract, sovereign source ownership): searchable layer registry + versioned GIS exposure/health outcome overlays; record original source, year, point/polygon precision, exposure validity, inclusion/exclusion and known missingness.
**B. Comparative Epidemiology Lab:** find places with similar conditional stage shares but divergent incidence, then test which economic, industrial, food, genetic and screening variables differ and whether results survive adjustment/sensitivity tests.
**C. Human-selected specialist research:** RPLICE SALP for systemic anchors, Parallax for operator-declared perspective comparison, IS frameworks, adaptation and fidelity. Real community participation distinguished from simulated stakeholders. No blanket SALP methodological HOLD, no unauthorized data/clinical access.
**D. Causal and uncertainty lab:** build explicit DAGs, target trials, falsifiers, negative controls and counterfactual models; record reasons for excluding hypotheses and whether new data reverse the verdict.
**E. Primary-prevention pilot:** prioritize exposure reduction, safer work/food/air/water conditions, risk-informed prevention and clinically appropriate pre-cancer intervention; measure actual incident cancer over appropriate years, not only screening activity.
**F. Knowledge translation and sustainment:** narrative map → source-backed brief → stakeholder correction → protocol → pilot → independent evaluation → day-after-success resource/owner and 10-year re-map.

## 8. Execution and owners — proposed, not confirmed
- **0–30 days:** Research lead + registry epidemiologist produce standardized 2019–2023 state and temporally compatible county outcomes (including *all-stage incidence*), uncertainty, suppressions and case definitions; compare 2018–2022 counties only on their own vintage.
- **30–60 days:** GIS engineer + environmental epidemiologist reconcile EPA, TRI, RCRA, water, air, food and Census FIPS/spatial vintages and source rights. Validate facility geocoding, historical operation and contamination pathways. Test data completeness and return real source receipts.
- **60–90 days:** Epidemiology/genetics/method Council pre-specifies a multilevel exploratory model and a falsification-focused case–comparison analysis; run sensitivity/negative-control checks and distinguish associative from causal conclusions.
- **90–150 days:** Community co-investigators, clinicians, environmental/public-health authorities and implementation scientists co-design feasible prevention alternatives with consent and proper authorization; judge mechanisms and competing demands.
- **Months 6–24+:** Pilot only where a justified target, delivery capacity and comparator exist. Track exposure and process outcomes promptly, incidence and tumor-stage outcomes according to latency/registry lags. Reassess transport before extending to another state.
- **Day after success / next decade:** assign successor, funding, monitoring, model recalibration, equity review, adverse-effect triggers, external audit, and research-to-policy translation.

No city/state official, University of Mississippi Medical Center, MD Anderson, national registry, clinical organization, or named researcher is presently a participant or authorized partner in this dossier.

## Reference and verification register
- NCI county/state cancer tables (different series): https://www.statecancerprofiles.cancer.gov/incidencerates/index.php?age=001&areatype=state&cancer=020&race=00&ruralurban=0&sex=0&sortOrder=desc&sortVariableName=percentlate&stage=211&statefips=00&type=incd
- More recent state 2019–2023: https://statecancerprofiles.cancer.gov/incidencerates/index.php?age=001&areatype=state&cancer=020&datatype=01&graph=2&race=00&ruralurban=0&sex=0&sortOrder=desc&sortVariableName=rate&stage=211&statefips=00&type=incd&year=0
- Census Hinds: https://www.census.gov/quickfacts/fact/table/hindscountymississippi/HSG651223
- Census Harris: https://www.census.gov/quickfacts/fact/table/harriscountytexas/PST040219
- EPA ECHO mapping: https://echo.epa.gov/tools/map-service
- USDA Food Environment Atlas: https://www.ers.usda.gov/data-products/food-environment-atlas
- USDA Food Access Research Atlas: https://www.ers.usda.gov/data-products/food-access-research-atlas/download-the-data
- NCI colorectal prevention: https://www.cancer.gov/types/colorectal/hp/colorectal-prevention-pdq
- NCI colorectal genetics: https://www.cancer.gov/types/colorectal/hp/colorectal-genetics-pdq
- USPSTF screening ages: https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/colorectal-cancer-screening
- Laskar et al., *Annals of Oncology* (2024), genetic MR: https://doi.org/10.1016/j.annonc.2024.02.008
- Air pollution systematic review, *Environmental Health Perspectives* (2022): https://doi.org/10.1289/ehp9620
- Cisneros et al., nitrate/drinking water, *Cancer Causes & Control* (2025): https://doi.org/10.1007/s10552-025-02003-5

**Evidence honesty:** Figures are official ecological/aggregate historical measures. Neither the GIS prototypes nor the literature search tests a site-specific exposure–colorectal-cancer hypothesis until matched time-series exposure and outcome data are genuinely assembled. Readiness and human authorizations require independent receipts.

# Internal primary-source reconciliation: Hinds vs Harris colorectal cancer
**As of:** November 7, 2026. **Status:** Source-inspected aggregate comparison and methods exercise; no person-level data, no effect model, no institutional study approval, no clinical action.

## A consequential same-proportion/different-rate finding
The National Cancer Institute's State Cancer Profiles county **late-stage colon and rectum** reports for **2018–2022**, all races, both sexes, all ages, show:

| Reported construct | Hinds County, Mississippi | Harris County, Texas | Interpretation |
| --- | ---: | ---: | --- |
| Percent of cases late stage | 63.3% | 63.4% | Nearly equal conditional cancer-case shares; not screening performance |
| Age-adjusted late-stage incidence, annual cases/100,000 | 30.4 (95% CI 27.3–33.8) | 23.3 (95% CI 22.7–24.0) | Different resident-population standardized rates; not conditional percentages |
| Average annual late-stage case counts | 76 | 1,044 | Different population sizes, not interpretable as a rate comparison |

**Authoritative NCI source rows:**
- Hinds: https://www.statecancerprofiles.cancer.gov/incidencerates/index.php?age=001&areatype=county&cancer=020&graph=2&race=00&ruralurban=0&sex=0&sortOrder=desc&sortVariableName=count&stage=211&statefips=28&type=incd&year=0
- Harris: https://www.statecancerprofiles.cancer.gov/incidencerates/index.php?age=001&areatype=county&cancer=020&race=00&ruralurban=0&sex=0&sortOrder=desc&sortVariableName=name&stage=211&statefips=48&type=incd&year=0

This validates the *existence of the described statistical contrast in those source tables*, not why it occurs, nor the currency of the underlying observations beyond their labeled period. The comparison has no local intervention timing, no real counterfactual, no measured patient journey and no quantified environmental exposure. A percentage gap of 0.1 percentage point should not be taken as statistical equivalence without its own appropriate uncertainty and definition review.

## A real protocol hazard: source-window drift
A current official **all-stage** colorectal county table for Texas displays **2019–2023**, whereas the late-stage county table displays **2018–2022**:
- https://statecancerprofiles.cancer.gov/incidencerates/index.php?age=001&areatype=county&cancer=020&race=00&ruralurban=0&sex=0&sortOrder=asc&sortVariableName=name&stage=999&statefips=48&type=incd&year=0
- Late-stage Texas: source above.

Do not plug the 2019–2023 all-stage rate into a 2018–2022 late-stage equation or subtract/ratio the two to claim all-stage burden, diagnosis timing, preventable incidence or stage shift. A full source/version/period/eligibility crosswalk and suitable aligned datasets are required. Same-looking query parameters can return different reporting vintages for different stage selectors.

The percent-late measure, late-stage rate and annual case count all appear in a single source table but use different denominators and are **not three independent observations**. Verify exactly how unknown-stage cases enter the published percent-late denominator. Age-adjusted rates must not be manipulated as if they were unadjusted case counts or conditional percentages.

## Additional source-vintage cross-check: Colorado

During the November 7, 2026 internal lookup, the live Colorado NCI late-stage colorectal county view for all races, both sexes and all ages was labeled **2019–2023**. Previously indexed search excerpts for the same county-source query reported **2018–2022**. This is a source-version and retrieval-timing trap, not grounds to average or compare the two releases without qualification. Denver County in the live 2019–2023 view shows an age-adjusted late-stage rate of **20.3 (95% CI 18.8–21.9)**, **140** annual late-stage cases and **62.4%** late stage, but **none of these values has been introduced into the Hinds 2018–2022 matched-period comparison**.

Official query: https://statecancerprofiles.cancer.gov/incidencerates/index.php?age=001&areatype=county&cancer=020&datatype=01&graph=2&race=00&ruralurban=0&sex=0&sortOrder=asc&sortVariableName=name&stage=211&statefips=08&type=incd

Protocol adaptation: pin actual provider observation vintage, page download timestamp, source method and release identity per cell, rather than relying on a static URL or cached search excerpt. Any cross-source harmonization should identify the exact conflicting periods, reject unqualified pooling, and route to an independent epidemiologic reviewer. Added a deterministic regression for this exact mismatch.

## Competing explanations and discriminating evidence
| Hypothesis (not an established cause) | Relevant missing test or source | Suggested independent owner role |
| --- | --- | --- |
| Higher underlying colorectal disease occurrence contributes to the Hinds rate | Same-window, all-stage age-adjusted incidence and age/sex composition; evidence of screening-induced ascertainment | Registry epidemiologist |
| Similar stage share masks different detection opportunities | Site-specific guideline eligibility, completed screening, invitation/acceptance and data source versions | Screening quality/evaluation lead |
| Diagnostic referral/follow-up has different closure rates | Abnormal FIT/other positive-test counts, confirmed diagnostic resolution and interval distributions, with authorized linkage | Clinic and diagnostic implementation lead |
| Stage ascertainment or coding differs | Unstaged fractions, stage definitions, coding transitions and cancer registry data-quality reports | Registry scientist |
| Resource and policy context affects pathway bottlenecks | Insurance, facility capacity, staff, geographic coverage, service catchments, provider hours, local policy dates | Systems and health services analyst |
| Environmental, occupational, lifestyle or metabolic risks affect true incidence | Exposure-specific individual/residence/latency and biological plausibility, controlling selection/confounding; EPA regulated-facility points are NOT exposure | Qualified environmental epidemiologist |
| Population composition and migration explain part of the difference | Sourced age, sex, race/ethnicity, urbanicity, residency, migration, screening-eligible denominators and uncertainty | Biostatistician and community reviewer |

## Method and governance gates
**Designed:** What were guideline recommendations, screening protocols, access standards and registry methods?  
**Operational:** What was actually delivered, referred, resolved, staffed and recorded, per eligible population and time window?  
**Experienced:** What barriers, benefits, exclusions and unintended consequences were actually experienced? Obtain legitimate consent and actual observed/testimony evidence rather than generated personas.

The causal design is **not yet DID-eligible**. A county summary over 2018–2022 does not provide exposed and comparison time series, dated intervention start, credible parallel-trend evidence or a defined mechanism. Before causal estimation, establish common methods across at least multiple pre/post timepoints, treatment adoption and interference checks, secular/confounding shocks, robust inference and pre-registration. Favor staggered-adoption estimators appropriate for adoption timing and treatment-effect heterogeneity rather than automatically applying a two-way fixed-effects formula.

**Recent peer-reviewed methods:**
1. Wing C, Yozwiak M, Hollingsworth A, Freedman S, Simon K. Designing difference-in-difference studies with staggered treatment adoption: key concepts and practical guidelines. *Annu Rev Public Health.* 2024;45:485–505. doi:10.1146/annurev-publhealth-061022-050825
2. *Difference-in-Differences for Health Policy and Practice: A Review of Modern Methods.* *Stat Med.* 2025;44(23-24):e70247. doi:10.1002/sim.70247. Full authorship and original publication text to be rechecked for final manuscript.

## Test case and closure logic
**Rehearsal 1:** Enter 63.3 and 63.4 as if they meant local equal disease burden. **Expected:** reject; locate denominator mismatch.
**Rehearsal 2:** Enter Harris 1,044 vs Hinds 76 as population-adjusted rates. **Expected:** reject; counts are not age-adjusted rates.
**Rehearsal 3:** Import a Texas all-stage 2019–2023 figure alongside a late-stage 2018–2022 figure. **Expected:** flag time-window and construct mismatch; refuse pooling or derived disease burden.
**Rehearsal 4:** Present 2018–2022 multi-year aggregates as a valid DID intervention panel. **Expected:** reject; no longitudinal units, timing or pretrend data.
**Rehearsal 5:** Submit a claim of improved screening but no abnormal-result diagnostic resolution or fidelity evidence. **Expected:** report incomplete proximal pathway and no verified distal health outcome.
**Rehearsal 6:** Show an EPA ECHO facility map and claim it caused colorectal cancer. **Expected:** prohibit causal attribution and person-level exposure inference.
**Rehearsal 7:** Create a DIS research case with benchmark gaps. **Expected:** existing tenant-owned case and baseline event only after signed-in, intentional choice; no verified outcomes, external outreach, RPLICE execution or auto-closure.

**Next internal decision:** verify official source lineages, align all-stage and late-stage county series, inspect study design with independent dissent, rehearse site-specific intervention fidelity and validate the whole owner → action → actual recipient → acknowledgment → outcome chain before any external scholarly discussions or submissions.

# ChainWeb comparative health systems — Health Is Wealth research protocol v0.1
Date: 2026-11-08. Status: **research candidate**, not accepted comparative results or a site intervention. Governing: existing DIS–RPLICE Rosetta DEN-01–09 and PR85; this is an extension of the existing program, not a new approval registry. No clinical or private data used.

## Research questions and falsifiable hypotheses
**H1 — access:** Among clinically comparable, eligible people with a defined need, greater realized access (not merely insurance coverage or a referral order) is associated with a higher probability of appropriate diagnostic/treatment resolution within a clinically justified interval. Test whether association survives adjustment for baseline health, severity, geography, selection into care, payer, service availability, and calendar period.

**H2 — speed:** Shorter time from first *contemporaneously knowable* actionable signal to appropriate resolution improves selected outcomes, conditional on urgency and clinical indication. **Falsification:** shorter wait does not improve appropriate completion, or worsens harms, costs, unnecessary care or other patients' waits. Distinguish patient-reported onset, source-recorded signal, clinician-visible signal, order, acceptance, booking, completed service, and result acted on.

**H3 — performance:** Conditional on case mix, resources, and comparable services, facility/network process reliability and capacity explain outcome heterogeneity better than ownership label alone. Test organizational and geographic variance and cross-level interactions, including high-need/high-performing sites. Do not assume FQHC or VA inherently better or worse.

**H4 — financial exposure:** Direct out-of-pocket cost, insurance benefit design, transportation, work/childcare time and financial strain may mediate or modify appropriate care completion and longer-term health/function. Do not equate payer category or neighborhood deprivation with an individual's ability to pay.

**H5 — DIS/RPLICE incremental benefit:** Compared with competent current practice under equal evidence/time allowances, the governed crosswalk + explicit uncertainty + accountable closed-loop action improves decision quality and completion without unacceptable alert burden, inequity, costs, or displaced demand. This is **unproven**; do not infer it from external trials.

The slogan **health is wealth** is an overarching hypothesis, not a prespecified causal effect. Test separately: health/function, medical spending, patient financial toxicity, lost work/time, organizational resource use, and community economic opportunity. Preserve bidirectional pathways: health can affect income and income can affect health. Predeclare causal graph, estimands, measurement windows and negative controls before outcome inspection.

## Organization ontology — do not compare overlapping categories as if mutually exclusive
Record distinct attributes: entity identifier, reporting unit (site/parent/system), parent affiliation, setting (ambulatory primary care, specialist, hospital, inpatient rehab, etc.), FQHC awardee/look-alike designation, federal/VA operation, public/nonprofit/for-profit ownership, teaching/rural status, payment contracts, service scope, catchment, capacity, and year. An FQHC can be a private nonprofit; a VA outpatient clinic is not an acute-care hospital. Compare same service/pathway first. Cross-setting patient journeys may link institutions, but outcome attribution must reflect each step's authority.

## Measurement passport for every indicator
Construct and purpose; source URL/release/date/hash; exact reporting unit; eligible population and exclusions; numerator/denominator and unknown/suppressed states; time zero and follow-up; clinical standard version; risk adjustment and uncertainty; geography and geographic vintage; missingness and outside-system care; patient burden; cost basis; linkage and consent authority; comparability verdict (equivalent / transformable with assumptions / complementary / not comparable). Never silently turn unknown into zero. Preserve original plus any derived crosswalk.

## Public-data discovery and limitations
- HRSA UDS (https://data.hrsa.gov/topics/healthcenters/uds/overview/national): FQHC awardee-level patients, services, workforce, quality and finance; parent-level aggregates must not be assigned to individual sites. Check missing-income denominators.
- CMS Provider Data (https://data.cms.gov/provider-data/topics/hospitals): hospital outcomes, safety, experience, measurement-specific reporting windows; not a complete private-clinic panel.
- VA Access to Care (https://www.accesstocare.va.gov/About/Faq): VA wait/quality measures, with VA's HEDIS-like specifications and update frequencies; crosswalk before comparison.
- AHRQ Compendium (https://www.ahrq.gov/chsp/data-resources/compendium-2023.html): parent-system linkage and organizational descriptors; validate vintages and changes.
- HRSA Area Health Resources Files and Census ACS: area workforce, geographic insurance, poverty and deprivation; contextual, not individual financial exposures.
- CDC NHSN SIR: hospital-acquired infection comparisons require identical infection, facility, baseline, surveillance and risk-adjustment definitions. **Do not mix 2015/2022 baseline SIRs.**
- Site-level referrals, staff availability, payer denials, patient-reported financial burden and outside-system completed care are **not established** by the above public sources. Requires separate willing-site authority, privacy determination and data-use governance. No patient data in this contribution.

## Design and comparators
Stage A: public descriptive panel; stratify same-care-setting × condition × reporting-unit × geography × time. Show both organization-weighted and patient-weighted results, denominators, missingness, suppression, uncertainty and coverage. No league tables until stability and small-cell controls pass.
Stage B: prespecified multilevel models (patients nested in sites/networks and geography where data legitimately permit), baseline severity/urgency, age, comorbidity, insurance/benefit, socioeconomic context, staffing, load relative to **usable** capacity, specialty supply, teaching/rural and temporal factors. Report unadjusted and adjusted contrasts and the change in inference; distinguish potential mediators from confounders and avoid conditioning on post-exposure variables. Sensitivity: selection into organization, unmeasured severity, missing-not-at-random, low volume, site clustering, geography and referral-network spillovers.
Stage C: a clearly defined policy or workflow change with staggered rollout/controlled interrupted time series or target-trial emulation, only if identifying assumptions and ethical/site permissions hold. DiD requires a treatment/comparison contrast and parallel-trends diagnostics; a shared calendar-period dummy with full year fixed effects does **not** identify a separate period effect. Never call a cross-sectional ranking causal.
Stage D: controlled DIS/RPLICE decision-quality comparison and, separately, authorized prospective action/outcome evaluation. Negative/null findings, appropriate nonchange, patient harm and displaced demand count.

## Concrete empirical challenges from newly retrieved literature (leads pending full-text extraction/adjudication)
- Trivedi et al. (2020), VA mortality risk adjustment for socioeconomic status: rankings may change minimally after SES adjustment; **do not presume SES explains every facility difference**. https://scispace.com/papers/evaluation-of-changes-in-veterans-affairs-medical-centers-24w01ikztn
- Topmiller et al. (2021), HRSA health centers: area deprivation and clinical quality associations vary by measure. https://scispace.com/papers/exploring-the-association-of-social-determinants-of-health-2ezlis99jr
- Asfaw et al. (2024), VA Referral Coordination Initiative: reported no significant change in specialty referral patterns or waits; **contrary finding** to an automatic coordination-benefit claim. https://scispace.com/papers/the-effects-of-the-veterans-health-administration-s-referral-1efkzm1pzx
- Asfaw et al. (2025), racial differences in VA specialty wait times: reported differences were associated with facility and specialty mix; require within-facility and between-facility decomposition. https://scispace.com/papers/clocking-injustice-racial-disparities-in-specialty-wait-nr700oi7nbx1
- Gaye et al. (2021), safety-net eConsult implementation and specialist access: reported reduced wait times, observational design; do not infer improved mortality or universal transport. https://scispace.com/papers/association-of-econsult-implementation-with-access-to-evlwgi2ylk
- Emerson & Hughes (2023), referral initiation and completion by payer at FQHC look-alike: examine both stages and denominator selection. https://scispace.com/papers/disparities-in-referral-initiation-and-completion-at-an-222d350k
- Apaydin et al. (2023), VA vs non-VA quality systematic review: useful for prior-art and heterogeneity, **secondary** not a substitute for primary-study extraction. https://scispace.com/papers/veterans-health-administration-va-vs-non-va-healthcare-339pru02
- The existing Dartmouth MRSA Team8 deck stratified NHSN by ACH, CAH, IRF and LTACH, but its displayed period indicators overlap full year fixed effects. The original Stata estimation log and exact baseline must be reviewed before reusing causal claims.

These are indexed paper metadata/abstract leads, not newly independently reproduced effect sizes. Full text, eligibility, adjustment, negative findings, DOI/PMID, correction/retraction and temporal transport remain to adjudicate.

## Data access and validity gates
1. Research methods owner: freeze ontology and a condition-specific estimand; create source manifest with year, unit, codebook, revision and missingness.
2. Independent reviewer: verify source original, definitions, sample overlap, age standard, outcome horizon, suppression, comparability, uncertainty and opposite findings.
3. Data steward: authorize and record any site linkage, patient-level access, consent/IRB determination, minimum necessary use, privacy, retention and small-cell protection. Until then public aggregate only.
4. Clinical/operations partners: confirm current actual referral, scheduling, capacity, benefit/financial and completion processes; patient/community representatives supply lived-experience evidence, not simulated testimony.
5. Evaluation owner: prespecify peer grouping, fairness and falsification, baseline comparator, balanced harms and costs, uncertainty and stop criteria; report positive, null and adverse outcomes.
6. Reconciler/lifecycle owner: integrate accepted source passport and organization ontology into the **existing** saved-case workflow, verify save/reopen/revision/export and condition transfer with exact-head tests. Do not self-approve independent gates.
7. Governance: label publication-ready public descriptive findings separately from human/site approved prospective evaluation and from unproven patient benefit.

## Immediate demonstrator and acceptance
Choose one CRC referral pathway and one independent condition (e.g. endometriosis) for which *different* clinical logic is justified. Show an FQHC-to-specialist pathway and a VA-to-community pathway using source-grounded, deidentified/public information only; if real pathway data unavailable, explicitly label the journey hypothetical and do not present it as observed. Produce four views: (1) unadjusted aggregate, (2) construct/denominator crosswalk, (3) contextualized capacity/affordability/selection, (4) decision, accepted ownership, verified action and outcomes or explicit unknown. A skeptical evaluator must be able to reverse a claimed ranking, justify noncomparison or uphold a result with source receipts.

**Status:** research specification and literature discovery prepared; no comparative facility dataset constructed; no institutional ranking, new local effect, clinical outcome, approved site, integration, or independent scientific acceptance asserted.
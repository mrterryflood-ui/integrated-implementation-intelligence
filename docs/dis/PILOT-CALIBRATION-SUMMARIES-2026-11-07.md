# Pilot calibration summaries

November 7 2026 | Retained-source descriptive analyses and explicit synthetic experiments

## Hinds and Harris colorectal cancer

The matched2019–2023 county snapshot reports late-stage age-adjusted incidence29.9 per100000 in Hinds and23.9 in Harris; published stage shares are63.7% and63.4%. All-stage rates are46.4 and38.0. County data do not establish Jackson or Houston city rates. The previously mixed-period comparison remains withdrawn.

The6.0 late-stage rate gap splits arithmetically into5.3480 from the all-stage-rate term and0.6520 from the adjusted late/all-rate-ratio term under the symmetric identity. This does not identify causes, an attributable fraction or screening effectiveness. The adjusted-rate ratio is not the published case share. Retain the provider's original rate intervals; do not scale aggregate counts into valid standardized-rate uncertainty.

Rivals include underlying occurrence, historical screening and polypectomy prevention, detection intensity, diagnostic follow-up, service capacity, population composition and staging completeness. Next test: matched stratified registry extracts and time-aligned prevention, referral and diagnostic records with a credible comparison. Social determinants are hypotheses/context unless measured with appropriate timing and scale.

Source: NCI State Cancer Profiles county tables in retained run42417765128; acquisition queries and original bytes retained. Methods: https://statecancerprofiles.cancer.gov/help/about/incidence_rates.html. Reproduction: `analyze.py`, `reference_audit.py` and `mechanism_sensitivity.py`.

## Fifty-state measurement sensitivity

Colorectal–lung Pearson correlation is0.7345106353 for late-stage population rates and0.1287547897 for diagnosed-case shares. The other four correlations and their conditional intervals are reproduced in `review_followup.json`. These quantities describe different constructs. No coefficient establishes shared causes, person-level association or a valid funding allocation rule.

IID Fisher intervals and exchangeable permutations are assumption-dependent sensitivity checks. An interval that includes zero does not establish absence or equivalence. Deleting each official Census region probes influence but does not solve spatial dependence. Rounded registry estimates and correlated state pairs retain additional uncertainty;1225 state pairs are not1225 independent observations.

Next test: define the finite-population or superpopulation estimand, obtain aligned cancer/sex/age panels and uncertainty, prespecify geography/dependence and negative-control analyses, then test the claims on held-out settings. Preserve the small historical coefficient correction as provenance without stopping unrelated research.

Source: retained NCI original state tables,2019–2023,50 named states; US/DC/Puerto Rico are not silently included in the correlation frame. Regional definitions: https://www.bls.gov/lau/laurdqa.htm. Reproduction: `reference_audit.py` and `review_followup.py`.

## Reported gynecologic diagnoses

The survey-weighted crude estimates reproduce NCHS publication rounding:6.2% ever diagnosed with endometriosis,8.7% PCOS and7.8% fibroids in the documented eligible domain. Literal interview ages20–49 produce4855 respondents; including the screener-eligible age50 boundary record produces4856. Full codebook, report HTML and recode specification were subsequently retrieved separately; their receipt must remain distinct from the earlier failed fetches.

The follow-up now computes every available public race/Hispanic-origin group against the overall estimate with full-sample Taylor covariance. Equal age-band standardization remains exploratory sensitivity, not a standard US population estimate. Code4 is other/multiple races, so an Asian-specific respondent-level estimate cannot be reconstructed from it. Reported diagnosis is not independently measured biological prevalence or proof of why recognition differs.

Next test: independent survey-statistician reliability and missingness review; time-aligned symptom, recognition, access and clinical ascertainment histories; authorized detail for unavailable groups. Do not treat present-day insurance/income as the cause of an undated past diagnosis.

Source: Nugent CN, Lochner KA. NCHS Health E-Stat121,2026. doi:10.15620/cdc/252459; https://www.cdc.gov/nchs/data/hestat/hestat121.htm. Public recodes: https://www.cdc.gov/nchs/data/nsfg/recodespecs/2022-2023-NSFG-FemResp-RecodeSpecs.pdf. Reproduction: `reference_audit.py`, `mechanism_sensitivity.py` and `review_followup.py`.

## Early discovery counterfactual and risk calibration

Nine synthetic scenarios expose assumptions about an actionable prediagnostic window, community reach, instrument sensitivity/specificity, completed follow-up, stage-change probability and confirmatory capacity. Under the selected inputs, better navigation alone and the synchronized pathway both flip the synthetic early/late balance; the design does not establish that combining mechanisms is uniquely necessary. Capacity and false-positive demand can defeat the hoped-for change. Uniform prevention lowers late burden without necessarily changing stage share. No scenario demonstrates actual patient benefit.

The published RAP-to-starting-age arithmetic check uses Chen et al's reported parameters and formulas, not a new combined model.27 of36 displayed table cells are within the predeclared0.575year rounding envelope;9 exceed it, by at most1.1years. Publisher table images corroborate the inputs. This remains an unresolved reproduction discrepancy, not an adjudicated error or a successful cohort-model replication. The original fitted data/code and full-precision coefficients are needed.

Next test: independently reproduce the transformation, resolve the discrepancy, then validate risk calibration and benefit/harm in an appropriate population. Symptom evaluation remains separate from asymptomatic screening and is not suppressed by an age45 gate.

Source: Chen X, Heisser T, Cardoso R, Hoffmeister M, Brenner H. JAMA Netw Open.2023;6(10):e2339670. doi:10.1001/jamanetworkopen.2023.39670. Reproduction: `rap_benchmark.py` and `early_discovery_counterfactual.py`.

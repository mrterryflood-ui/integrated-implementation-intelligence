# DIS Exposome-to-Outcome Research Protocol — Jackson, Houston and National Transfer
Version: 2026-11-06. Status: research protocol; not a causal finding, connected clinical study, or completed GIS exposure analysis.

## Mission and counterfactual
Primary end state: reduce **new colorectal cancers**, especially preventable early-onset and high-risk disease, while reducing late diagnosis and mortality as distinct supporting outcomes. Determine why Hinds County MS and Harris County TX have similar late-stage case shares despite different incidence, exposures and institutions; test whether similarity persists nationally and over time.
Counterfactual estimands:
1. Difference in all-stage incident CRC per 100,000 if historical exposure burden had been lower, holding relevant confounding and ascertainment pathways appropriately modeled.
2. Difference in CRC incidence and stage distribution under risk-adapted prevention and earlier diagnosis versus current guideline-concordant care.
3. Difference in abnormal-result resolution and late-stage incidence under closed-loop care versus existing referral pathways.
Do not conflate (1) prevention of acquisition with (2) earlier detection or (3) lower mortality. All are relevant, but prevention is the primary objective.

## Critical measurement guard
Late-stage case share is late-stage cancers divided by diagnosed cancers. It is **not** the chance a resident develops cancer or the proportion with metastatic Stage IV disease. Similar shares can arise under different cancer incidence, screening intensity, case mix and biological progression. A matching rounded percentage is not itself proof of a shared mechanism or a non-spurious causal association.
For the 2018–2022 reference period, Hinds County late-stage share 63.3%, incidence 30.4 per 100,000; Harris County 63.4%, 23.3 per 100,000. Validate confidence intervals and whether observed differences are statistically distinguishable. Use 2019–2023 only in a separately labeled time series.

## Full system evidence mesh
1. Outcomes: NCI/CDC all-stage and late-stage CRC incidence, stage localized/regional/distant, early-onset rates, death, histology, site (colon/rectal), suppression, denominator, registry vintage.
2. Environment: EPA ECHO permitted facilities; TRI chemical release and historical facility operations; RSEI modeled exposure and toxicity weighting; Superfund/NPL, Brownfields, RCRA hazardous waste and landfill records; EPA AQS/AirData, EJ-related metrics with dataset availability noted; state TCEQ and MDEQ records; drinking-water contaminant violations and distribution service areas; USGS hydrogeology and soil; agricultural pesticide use, land-use change and occupational sources.
3. Food and social: USDA Food Environment Atlas, Food Access Research Atlas, Census ACS, CDC PLACES, CDC SVI, restaurant and grocery location histories, access, pricing, retail density, ultraprocessed food exposure proxies, nutrition and socioeconomic variables. A restaurant or grocery pin is not proof of consumption or causation.
4. Biology and individual history (only authorized): hereditary syndromes (e.g., Lynch, FAP), family history, polygenic susceptibility, age, metabolic disease, obesity, microbiome hypotheses, medication and relevant tumor markers. Never infer individual genetic status from neighborhood, ancestry or ethnicity.
5. Clinical pathway: screening eligibility, symptom evaluation, interval cancers, diagnostic delay, endoscopy capacity, test sensitivity, abnormal FIT follow-up, referral leakage and pathology.
6. Governance: pollution policy, enforcement history, Medicaid/insurance, zoning and land-use decisions, workforce, infrastructure and community accounts.

## GIS architecture
Reuse DIS existing Leaflet GIS, STELLAR 1 chain graph and RPLICE existing GIS + county boundary services. Do not clone one platform's algorithm into the other. DIS owns question, multi-layer visualization, scenario comparison, source receipts, analytic decisions and narrative; RPLICE owns specialist implementation, stakeholder, SALP, fidelity and adaptation analysis through authenticated MCP.
- Every layer must declare source URI, publisher, vintage, coverage, resolution, geographic unit, denominator, measurement construct, uncertainty, refresh time, permissions, and missingness.
- County choropleth for outcome rates; distinct point layers for facilities; historical exposure raster/polygons when scientifically supported. Separate facility proximity, emissions, ambient concentration, estimated dose, and cancer occurrence. No implication that map overlap establishes exposure or cause.
- Join only using appropriate Census FIPS, geocoding and temporal validity; preserve residence history/latency rather than assume current address equals etiologic exposure.
- Avoid map-generated synthetic locations, arbitrary user-provided URLs, hidden patient identifiers or unsupported ZIP-to-person inference.
- GIS interactions: toggle layers, change year, choose outcome, inspect source and confidence, compare sites and populations, filter count thresholds, view uncertainty, inspect alternative explanations, export map + evidence narrative.
- Reuse official sources first; maintain dataset-specific adapters with errors surfaced, not invented zeros.
- EPA ECHO public map service: https://echo.epa.gov/tools/map-service
- EPA TRI: https://www.epa.gov/toxics-release-inventory-tri-program
- EPA RSEI: https://www.epa.gov/rsei
- EPA Superfund: https://www.epa.gov/superfund
- EPA AirData: https://www.epa.gov/outdoor-air-quality-data
- CDC Environmental Public Health Tracking: https://ephtracking.cdc.gov/
- USDA Food Environment Atlas: https://www.ers.usda.gov/data-products/food-environment-atlas/
- USDA Food Access Research Atlas: https://www.ers.usda.gov/data-products/food-access-research-atlas/
- NCI State Cancer Profiles: https://statecancerprofiles.cancer.gov/
- Census ACS: https://www.census.gov/programs-surveys/acs

## Research questions and tests
H1: Does historic modeled industrial carcinogen exposure predict all-stage CRC incidence after controlling for age, calendar year, race/ethnicity, SES, rurality, screening intensity, smoking, obesity and other relevant covariates? Test dose-response, latency, negative controls, spatial autocorrelation, sensitivity to geography and multiple comparisons.
H2: Do food environments and metabolic risk mediate or modify exposure associations? Avoid assuming retail proximity equals diet; use individual dietary surveys when permitted.
H3: Are early-onset and hereditary/familial CRC patterns geographically different? Test age-stratified rates and germline risk where ethically authorized; distinguish inherited predisposition from shared family environment.
H4: Do cancer-stage shares remain similar while incidence and detection pathways differ? Model all-stage incidence, stage-specific incidence and stage proportion separately.
H5: Which combinations of exposure, access and clinical delays predict advanced stage after diagnosis? Use prospective or retrospective authorized clinical pathway data; account for selection/collider bias from conditioning on diagnosis.
H6: Are existing interventions actually changing outcomes? Evaluate program coverage and timing, comparator, implementation fidelity, dose, time lag and independent outcome trends; no assumption that activity proves benefit or failure.
H7: Could the apparent association be due to confounding, migration, registry coding, geographic scale, latency mismatch, ecological bias or multiple testing? Red-team before interpreting hotspots.

## Statistical design
Use all US states and counties where valid counts exist; avoid cherry-picking two cases. Do not exclude small counties without accounting for selection bias: retain suppression, pool years or use hierarchical partial pooling; predeclare minimum precision thresholds for public comparisons and use confidence/credible intervals. Estimate Moran's I and spatial error/lag sensitivity. Consider distributed-lag exposures and migration. Use matched comparators, interrupted time series or quasi-experimental designs only when intervention timing and identification assumptions support them. A DDD estimator requires treatment, time and third group, with valid parallel-trend and measurement assumptions; it is not inferable from two county percentages.
Do not assert causal links from GIS correlations or use model scores as individual clinical recommendations.

## Better-system prototype and measures
Preventive system: exposure mitigation + risk-appropriate prevention + earlier clinical detection + closed-loop diagnostics + equitable treatment, each with separate causal pathways and outcomes.
Primary: age-standardized **all-stage incident CRC** (including early-onset), population denominators, geographic and demographic disparities, and exposure change over adequate etiologic lag.
Secondary: stage-specific incidence and distribution, diagnostic intervals, screening-eligible coverage, appropriate risk-based earlier assessment, mortality, quality of life.
Balancing: false positives, unnecessary colonoscopies, procedure complications, access inequity, stigma, cost, burden and overdiagnosis.
Rehearsal: initial retrospective geospatial case study -> external scientific review -> data quality/permissions -> community co-design -> risk/feasibility pilot -> prospectively monitored intervention -> independent evaluation -> transferability review -> scale/sustain.
Temporal stewardship: 10 years prior, current evidence, day after success, next 10 years. Identify owner and proof at each handoff.

## Scientific and ethical gates
Environmental GIS may reveal candidate hotspots, not confirmed causation. Individual clinical/genomic linkage requires lawful data access, appropriate privacy review and potentially IRB. Human-selected SALP is not a methodological HOLD, but remote execution and real-world intervention require actual capability and authority. No claimed partner commitment or research participant recruitment.

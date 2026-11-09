# ChainWeb Calibration Cycle 1 — Both empirical pathways and adversarial review
**Research date:** 2026-11-08. **Status:** substantively executed / site-specific causal question open. **Owner:** DIS–RPLICE research; GitHub issue #81, scientific draft PR #85. **No original patient-level Hinds/Harris data retrieved.** Evidence links below point to published studies; no clinical interventions conducted.

## Mission decision
Test whether an integrated account changes the *validity of a recommendation* and whether that change is capable of improving care. Distinguish (1) information exists but the source misses it, (2) correct information reaches an accountable intervention, (3) capacity/patient constraints determine whether action occurs, and (4) an intervention produces a causal benefit. A validated measurement difference cannot be promoted directly to a clinical harm claim.

### Track A: Research intelligence, source to proposed decision

| Micro-gate | Current auditable evidence | Status and why |
|---|---|---|
| Original source and lineage | Hinds/Harris 2019–2023 accepted archived NCI/registry baseline; Reuland, Kruse and Escaron original papers | Accepted county baseline not refreshed during this cycle. Trials are independent contexts, not replications of the counties |
| Constructs and units | County stage share of diagnosed cases vs age-adjusted late-stage rate; Reuland any-screening endpoint; Kruse any CRC vs EHR-documented SDOH; Escaron completed follow-up colonoscopy | Pass for *distinct* constructs. Fail if rates, shares, screening uptake and follow-up are pooled |
| Extraction and missingness | Reuland outcome from EHR review, including outside providers if documented; Kruse Azara DRVS EHR-mapped metrics, outside-service capture depends on entry; Escaron queried EHR then chart then claims | Conditional for cross-source validity; patient-level chart/claims linkage not available |
| Numerator and denominator | Hinds/Harris baseline 46.4/38.0 all-stage and 29.9/23.9 late-stage per 100k, 63.7/63.4% case shares. Reuland n=2001/arm; Escaron n=324 positive FITs; Kruse n=34,588 eligible, only 4 randomized clinics | Within-publication count arithmetic recalculated; do not transfer rates or pool populations |
| Timing and admissibility | Escaron 2018 positive FIT, paper online 2022-11-30; Kruse published 2024-02-08; Reuland published 2024-11-25 | Later publications cannot support an assertion about what was available to a 2018 or 2023 historical decision owner |
| Analysis and conflicting explanations | Reuland six-month primary +20.29pp CI 17.85–22.73; Kruse adjusted 1.4pp CRC marginal effect (CI 0.3–2.3) but SDOH screening aOR 0.64 p=0.189; Escaron 93 EHR vs 108 combined at 12 months vs 122 extended | Real context-specific effects and measurement contrasts, **not** a common effect estimand |
| Counterfactual | Reuland random assignment identifies effect of OFFERED mailed FIT+navigation package on screening in that setting; Kruse stepped-wedge offers bundled FIT-SDOH against usual practice; Escaron has no randomized referral/navigation comparison | The effect of *data integration alone*, Hinds/Harris prevention prioritization and any prevented death are **unidentified** |
| Decision | Do not infer equal prevention need from similar case shares; prioritize construct-reconciled signals and separately evaluate outreach, navigation and capacity | **CONDITIONAL**, because no actual historical Hinds/Harris policy decision or local intervention data |
| Intended direct/connected/system effects | CRC screening gains are observed in trial contexts; automatic SDOH co-benefit not demonstrated; follow-up signal discordance documented | Upstream benefit observed; connected SDOH outcome null/inconclusive, mortality, long-term sustainment, portability untested |

**Primary independent publication audit:** Reuland et al., JAMA Network Open (2024) doi:10.1001/jamanetworkopen.2024.46693; Kruse et al., J Gen Intern Med (2024) doi:10.1007/s11606-024-08654-5; Escaron et al., J Prim Care Community Health (2022) doi:10.1177/21501319221138423. JAMA and Springer primary HTML plus Escaron SAGE primary HTML independently read. The Undermind PDF was available and read for Kruse and Escaron; Reuland PDF unavailable in Undermind, primary HTML used instead.

### Track B: Clinical screening to diagnostic resolution, actual published patient cohorts (no synthetic patients)

**Escaron FQHC observed process (2018 screening, analysis through 2021):**
1. **Eligible FIT offer and result:** 11,599 mailed, 4,638 returned; 324 abnormal (positive FIT patient cohort). Program also distributed in clinic; documentation did not always distinguish distribution channels.
2. **Notification:** provider to contact patient about abnormal result by telephone or in person. Patient-level reach/receipt timestamps not available in the publication.
3. **Referral and authorization:** GI consultation order, referral coordinator portal for insured; printed referral without portal entry for uninsured. Report says 80.9% of abnormal results referred to GI; **this is documented referral status, not the completion endpoint**.
4. **Patient action:** patients asked to call specialist; GI consultation reviews indication and prep, GI service creates second referral to actual procedure. Appointment date/ownership and access constraints not fully linked in published aggregates.
5. **Follow-up completion captured by query:** 93 of 324 (28.7%) EHR query completed colonoscopy.
6. **Multi-source adjudication:** six additional colonoscopies located by manual chart review; 23 more from claims query restricted to 125 current members; aggregate identified 122, with 108 documented within 12 months and 14 later. Source-by-time cells NOT available, so 93-to-108 as a uniform same-window correction remains **provisional**.
7. **Missing clinical handoffs:** among 231 EHR-query-negative charts, 96 had no documentation following GI referral/consultation and 79 had no documented GI referral. Neither category establishes that care did not happen.
8. **Outcome:** no linked stage, incidence, morbidity or mortality comparison; clinical causal claim remains unavailable.

**New granular contradiction requiring adjudication (real published source, not synthetic):** The same paper reports GI referral in 80.9% of 324 -> **262 referrals** at one-decimal precision, leaving **62** without. But its chart abstraction of the 231 EHR-query-negative subgroup assigns **79** to *no documented GI referral*. If the definitions and clocks are truly identical, at least **17 records** would be arithmetically incompatible (262 vs maximum 324-79=245); that does **not** establish a 17-record clinical error. Automated referral codes and manual abstracted categories may use different time windows, meanings or source coverage. This conditional contradiction is now explicitly reproduced in `referral_semantics_reconciliation.py` and gated by `test_referral_semantics_reconciliation.py`. Do not silently reconcile or label patients as untreated without original linked records.

**Reuland RCT handoff stress test:** In 4,002 randomly allocated eligible patients (2,001/arm), 600/2,001 offered centralized FIT/navigation vs 194/2,001 usual care completed CRC screening within six months: **20.2899pp** recomputed (published 20.29pp; 95% CI 17.85–22.73). Positive FIT occurred among **48** intervention vs **18** control participants; follow-up colonoscopy among this post-randomization subgroup was 33/48 versus 8/18, difference **24.31pp**, 95% CI **-2.13 to 50.74**, p=0.07. The subgroup was **selected after randomization**, and its distribution was affected by the intervention, so this is not a separately identified randomized causal navigation effect. The CI spans no difference. Advanced neoplasia was *detected* in 29 vs 15, not prevented; mortality was not observed.

**Kruse bundled-workflow falsification:** In four randomized FQHCs, CRC screening improved (aOR 2.41, p=0.005; average marginal effect 1.4pp, 95% CI 0.3–2.3pp), while no statistically significant increase in SDOH screening was demonstrated (aOR 0.64, p=0.189). This is direct evidence AGAINST automatic simultaneous co-benefit from bundling. Not statistically significant is not proof of equivalence or noninferiority; study measured EHR-documented screening for any housing/food/transport domain, not subsequent social-needs resolution. Reported 11.7 calls per FIT return raises workload questions; efficiency savings were not measured.

### Independent calculations and code receipts
- Exact published-count calculations encoded: `calibration_cycle1_published.py`, 10 new regression tests `test_calibration_cycle1_published.py`.
- Conditional cross-source referral arithmetic: `referral_semantics_reconciliation.py` and 3 tests `test_referral_semantics_reconciliation.py`.
- Existing `published_metrics_audit.py` retains stage share/rate construct and source-horizon checks.
- GitHub workflow receipts to record by head commit and run IDs; passing tests establish code correctness on *stored counts*, not independent original dataset availability.

### Competing mechanisms, negative tests and no-overclaim decisions
- **Case-mix / population:** positive FIT after outreach is a post-assignment selected subset; cannot claim randomized follow-up effect from that subset.
- **Instrument / construct:** Kruse aOR 2.41 does NOT imply a 141% absolute improvement; adjusted marginal effect is only +1.4pp. Reuland +20.29pp is a different intervention, design and denominator; no pooled effect.
- **Source loss vs missed care:** Escaron recovered care from chart and claims. Documented follow-up status is not treatment receipt.
- **Referral definition:** Escaron 80.9% versus 79 no-referral notes only conditionally incompatible; do not assert 17 records were lost.
- **Connected benefits:** Kruse did not demonstrate SDOH-screening gains alongside CRC-screening gains. Thus ChainWeb must test each proposed downstream edge, including null effects and workload harms.
- **Historical decisions:** No documented Hinds/Harris 2019–2023 prevention decision, its input data, its timing or its owner has been obtained; hypothetical recommendation revisions remain scenarios.
- **Transportability:** Massachusetts, North Carolina and California FQHCs are not interchangeable with Hinds/Harris county populations; their intervention capacities, risk factors and referral networks differ.

### Closure gates, owners and actual next actions
| Gate | Provisional owner role (not yet accepted) | Next executable evidence / success criterion |
|---|---|---|
| Verify Escaron referral contradiction | Epidemiology/informatics lead + paper/data steward | Reconcile definitions, clocks, subgroup coverage and, if permission obtained, deidentified patient-level cross-tab. Conditional discrepancy explained or explicitly unresolved |
| Hinds/Harris source comparability | Registry/epidemiology reviewer | Retrieve original registry files plus footnotes, freeze hashes, reconcile rates vs shares with uncertainty; independent review |
| Policy-intelligence counterfactual | Decision researcher + actual policy owner | Identify ONE dated real prevention recommendation and all input evidence available at that date; blinded independent adjudication and justified nonchange admissible |
| Clinical-pathway counterfactual | Health system data stewards + IRB/privacy | Secure person-event lineage of positive FIT, notification, referral, outside procedures, GI capacity, experience and outcomes; predefine usual care vs intervention |
| Connected benefit and burdens | Implementation scientist + CHW/patient representatives | Observe direct CRC screening and downstream SDOH resolution, staff time, false alerts, access, disparities and costs independently |
| Publication/independent review | Multidisciplinary scientific council | Reproduce source counts and methods; challenge nonidentifiability, report null and harmful outcomes, peer-review before merging research claims |

**Stop rule:** do not declare original clinical causal research complete without local linked data, lawful authorization, identifiability analysis, outcomes and independent review. **Current scientific decision:** GO on source semantic reconciliation and matched intervention-pathway evaluation; CONDITIONAL on cross-county policy conclusions; HOLD on Hinds/Harris prevented-harm claims. No external outreach or production changes authorized or performed.

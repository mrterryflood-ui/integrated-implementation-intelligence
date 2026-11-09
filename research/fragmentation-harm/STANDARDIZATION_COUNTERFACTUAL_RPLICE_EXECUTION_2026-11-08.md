# Standardization, process counterfactuals and actual RPLICE execution

November 8, 2026. Mission unchanged: DIS/RPLICE are core; supporting health catalogs supply context; CRC is calibration; first knowable risk/warning, accountable appropriate action, integrated outcomes and condition-specific transfer remain the destination. Monday's accelerator is separate. This is primary-source triangulation and bounded engineering execution, not a completed systematic review, clinical effectiveness finding or independent acceptance.

## Evidence changes the proposed intervention

**Network constraints can create documented delay.** California DHCS's official2025 Health Net audit, printed page14, describes an advanced-cancer out-of-network procedure appeal downgraded to standard processing. In-network alternatives were2–3 months away; the audit attributes over3 weeks of delay to the downgrade. This is evidence of a particular administrative/capacity failure, not evidence that it caused initial advanced-stage diagnosis or death, and not proof all internal networks are harmful. Source PDF and page screenshot examined: https://www.dhcs.ca.gov/wp-content/uploads/2025/12/2025-Health-Net-Audit-Report.pdf

**The component and comparator determine the counterfactual.** Atlas et al., JAMA2023, Table2: adjusted120-day appropriate follow-up, reminders+outreach+navigation versus usual care +8.5 percentage points(95%CI4.8–12.0); the same package versus reminders+outreach +0.4pp(-3.6–4.2). They are different estimands, not additive gains. Mixed-cancer overdue-abnormal-result population, not a young symptomatic cohort or mortality study. https://pmc.ncbi.nlm.nih.gov/articles/PMC10565610/ ; doi:10.1001/jama.2023.18755

**Upstream detection support alone is not established benefit.** Chima's Australian Future Health Today trial reports adjusted follow-up difference2.6pp(-2.8–7.9),P=.332. Preserve uncertainty and possible ceiling/context effects; neither raw six-point arithmetic nor equivalence is the randomized adjusted conclusion. https://pubmed.ncbi.nlm.nih.gov/39567181/ ; doi:10.3399/BJGP.2024.0491 (published2025).

**Integrated operational change has a relevant public-system precedent.** NYC Health+Hospitals' Suspected Cancer Initiative combines referral flags, embedded guidelines, tracking and specialty leadership. Its6087-patient report found referral-to-diagnosis time63 days shorter than the first implementation month. This is an uncontrolled temporal quality-improvement comparison, not a single-component causal estimate or proven stage/mortality effect. Primary abstract inspected, not independently full-text extracted: https://pubmed.ncbi.nlm.nih.gov/41576298/ ; doi:10.1200/OP-25-00805.

**Improvement in one pathway can displace capacity elsewhere.** A2026 regional difference-in-differences study involving1,875,236 referrals in21 English regions found an early3.4pp(1.9–5.0) excess in >28-day diagnostic-resolution delays associated with MCED trial participation,4.8pp in the next6 months, not statistically significant thereafter. Observational participation, surrogate outcome and residual confounding remain limitations; authors judged material impact on trial-primary interpretation unlikely. Measure affected nonparticipants as well as intended recipients. https://pubmed.ncbi.nlm.nih.gov/42217468/ ; doi:10.1001/jama.2026.6803.

**Different guidance and inconsistent delivery of the same guidance require different repairs.** AGA2020 and BSG2021 conditionally approach some asymptomatic premenopausal IDA presentations differently. Patient phenotype, alternatives, preferences, red flags, uncertainty and guideline version matter. Current AGA quality guidance also qualifies by absent clear cause/alarm features/worsening anemia; BSG has a2025 FIT update. Do not turn old headline language into a claim that all present pathways conflict. Wiering's recorded urgent-referral cohort is a separate adherence/documentation question, not proof every nonreferral was negligent.
Sources: https://gastro.org/clinical-guidance/gastrointestinal-evaluation-of-iron-deficiency-anemia/ ; https://gastro.org/practice-resources/quality-and-performance-measures/ ; https://pmc.ncbi.nlm.nih.gov/articles/PMC8515119/ ; https://www.bsg.org.uk/clinical-resource/role-of-fit-in-the-investigation-of-ida ; https://pubmed.ncbi.nlm.nih.gov/34607914/ . BSG2025 update metadata was checked; full updated recommendations remain an extraction task.

## Common operating requirements, condition-specific clinical logic

- **Meaning:** preserve original construct, population, denominator, instrument and lineage; do not pool merely because labels match.
- **Time:** distinguish experienced onset, documentation, clinician availability, decisions/actions, evidence publication and later revisions.
- **Policy:** preserve issuer, date, population, trigger, strength, exceptions and local implementation; unresolved disagreement stays visible.
- **Closure:** record owner, referral receipt/acceptance, scheduling, completion, result return and next decision. Record timely outside-network alternatives where indicated and authorized, not presumed available.
- **Capacity/experience:** measure queue, staffing, access barriers, preferences, cost and burden on adjacent pathways.
- **Outcomes:** condition-appropriate patient and population measures, uncertainty, harms, equity and sustainment. More alerts or completed referrals alone do not establish benefit.

Condition contrasts: symptomatic CRC assessment must not be blocked by average-risk screening age; NICE includes specified under50 symptom combinations in diagnostic FIT guidance. Endometriosis normal examination/ultrasound does not exclude disease; actual persistence/referral criteria apply. RA qualifying persistent synovitis may require urgent referral despite normal/negative tests; not all fatigue/aches. These are source-grounded pathway questions, not autonomous clinical recommendations or observed ChainWeb effects.
https://www.nice.org.uk/guidance/ng12/chapter/recommendations-organised-by-site-of-cancer
https://www.nice.org.uk/guidance/ng73/chapter/Recommendations
https://www.nice.org.uk/guidance/ng100/chapter/Recommendations

## RPLICE itself: reproduced defect, correction and actual CI

Executed actual stateless `shared/chainweb-claim-assurance.ts` from `ISS-LLC22/bettersciencelab` main008c867ab5ea36b475263d967f6a917a112b5e77. Original Git blobffd2a292de4e5289a3ace7911c7e04228cb009bd matched reconstructed bytes before strict compilation. Eighteen aggregate claim challenges found that matching DOI/numbers/interval with a wrong nonblank comparator could remain a provisional candidate. No independent-review or causal-validity flag was set true, but attribution checking was incomplete.

Patch binds the two existing Atlas/US23 contrasts to actual comparators, including descriptive claims; it retains legitimate null-compatible evidence and rejects label-based bypass. Original6 provisional/12 rejected became3 provisional/15 rejected. All18 expected statuses passed; exactly3 statuses and7 reason lists changed. Initial harness incorrectly treated reason changes as verdict changes; failed assertion and corrected harness interpretation are retained. No source logic changed to conceal the failure.

**RPLICE draft PR118:** https://github.com/ISS-LLC22/bettersciencelab/pull/118 . Commit **c052856141f74ab09dfc91f7d358ebdc19f0378c**. Patched blobca238c69b8c53e1862be0dcc142dd2c6ed178150 matches locally tested source. Narrow source-context repair, not comprehensive validity/transport checking. No merge/deploy.

Hosted CI run**42513552327**, job**128831566062**, succeeded: **373 tests in52 test files**, including7 new comparator tests and14 existing claim tests. CI checkout used synthetic merge a9b9de1623baaccf9ce914c5a576bbf54573f0e4; health smoke200 was inside CI, not production. https://github.com/ISS-LLC22/bettersciencelab/actions/runs/42513552327

**Do not equate greenCI with a fully accepted platform:** audit output retained4 degraded and48 missing integrations, typecheck ratchet394 errors against395 baseline, and npm audit77 findings including3 critical. Census test logged non-JSON response despite overall success. Dependency/exposure assessment and integration remediation remain separate; exploitability was not evaluated by this patch.

**Execution boundary:** the active environment had no dedicated RPLICE partner credential, and direct public-contract access failed DNS. This does not establish the service is down. The real core was executed locally; authenticated remote MCP/handler transport, live app workflow and clinical effects were not demonstrated. Undermind's new search hit its free allowance until20:00UTC; direct primary-source research continued without paid access.

## Four development drafts inspected; reserved integrity reported

The compact `STANDARDIZATION_DEVELOPMENT_PACKET_DELTA_2026-11-08.json` exposes four source-grounded development drafts: **CRC-A-D, CRC-N-D, ENDO-S-D, AUTO-S-D**, each with null independent acceptance. They address component/comparator contrast, upstream CDS null-compatible evidence, persistent symptoms/normal scan, and qualifying synovitis/negative tests. They are published-evidence appraisal exercises, not fabricated patient histories. The delta reports24 slots,12 development/12 reserved,8 development unfilled, zero accepted packets and zero evaluated outputs. Its unchanged-reserve and uniqueness flags are author-reported assertions: the full register and integrity receipt referenced as being in the execution packet were not located for this independent reconciliation. Preserve base-register SHA-256 `9cba813fb4dfcf2b1e38c7bcd3fefe15e7e26583104defcf345051239594f147`; obtain and hash-bind the full register and receipt before independently certifying allocations or reserved integrity. See the November8 section of `docs/dis/CHAINWEB-COMPARATIVE-METHOD-VALIDATION-2026-11-06.md` for evaluation boundaries; all11 preparation-freeze gates remain pending.

## Next discriminating tests, not another mission

1. Compare integrated evidence versus competent equal-time review with matching evidence cutoff/pool; evaluate additional retrieval separately. Include justified nonchange.
2. Compare process components against their actual alternatives: outreach, navigation, expedited review and timely external access are not one interchangeable intervention.
3. Measure spillovers and capacity constraints in intended recipients and others sharing services.
4. Evaluate disease-specific patient outcomes separately; preserve never-diagnosed/unresolved people, lead-time/length bias, overdiagnosis, precursor removal, case mix and source selection.
5. For same-area health-system comparisons, obtain actual dated policy/eligibility/decision/referral/closure evidence. County differences alone cannot identify which institution caused harm. Account for insurance/network selection, severity, capacity and prior care; retain legitimate clinical variation.

No current estimate supports translating these process effects into a specific reduction from a roughly60% late-stage case share. Independent scientific appraisal and target-setting evaluation remain required.

## Coordination

Refreshed DIS head **bff8a7d0224b04907b70a0dbdc01a46a44f008ab** before adding this receipt; concurrent population/outcome/follow-up transport tests are preserved, not overwritten or self-certified. Agent1 owns source synthesis and development packets; Agent2 the actual lifecycle/authorized RPLICE transport and operational controls; judge exact source/comparator/delta review and held-out evaluation. Existing W1–W10 acceptance denominator unchanged. No clinical access, outside communication, spending, public source deposition or production/auth modification occurred.

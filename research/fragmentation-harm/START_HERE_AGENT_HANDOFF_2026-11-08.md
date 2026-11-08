# START HERE — DIS–RPLICE Health Research Agent Handoff and Execution Ledger
Updated: 2026-11-08. Owner-approved mission; branch: research/empirical-fragmentation-mechanisms-20261108; PR #85. **This is the cross-agent entry point.**

## Fixed destination
Develop and validate integrated, disease-agnostic *research methods* that reconcile disparate healthcare evidence, reveal prediagnostic and upstream risks, test historical counterfactual decisions, and evaluate prevention and downstream ChainWeb effects. Do not substitute CRC screening/referral optimization for the whole mission. The user-approved scientific roadmap is executed in evidence-gated ~15-minute sprints, aiming for a Dartmouth-ready briefing on Nov 9. **Clinical causality and transfer effects are not yet established.**

## Read in this order (avoid duplicate work)
1. research/fragmentation-harm/MISSION_CHARTER_CROSS_AGENT_2026-11-08.md — fixed mission and scientific acceptance gates.
2. research/fragmentation-harm/ACCELERATED_DARTMOUTH_SPRINT_PLAN_2026-11-08.md — ten work packages, 60% minimum accepted by briefing, independent review mandatory.
3. research/fragmentation-harm/EMPIRICAL_MECHANISMS_2026-11-08.md — published full-text semantic loss, population selection, and handoff mechanisms.
4. research/fragmentation-harm/UPSTREAM_PREDIAGNOSTIC_SIGNALS_2026-11-08.md and UPSTREAM_PREDICTION_COUNTERFACTUAL_AUDIT_2026-11-08.md — early signals and contradictory decision-support RCT.
5. research/fragmentation-harm/HINDS_HARRIS_ORIGINAL_STUDY_SPEC.md — actual study design, temporal admissibility and access gates.
6. PR #85, issue #81, relevant GitHub Actions runs; Undermind workspace 8124c544-40e4-4e49-a443-29173e6da62d.
7. Separate PR #84 is a synthetic/descriptive pilot demonstration; **do not mistake it for original empirical validation**.

## What has been checked in this execution
- GitHub commit 631a7061c62a70dd7ac5f1221df50908f78bfe9f (accelerated plan) had both PR workflows SUCCESS: engineering receipt validator run 42495128773 and research fragmentation comparability run 42495128582. These checks **do not** prove scientific validity, independent replication or completion of W2–W10.
- Independent arithmetic on previously accepted Hinds/Harris published aggregate inputs: Hinds all-stage 46.4, late-stage 29.9, late case share 63.7%; Harris 38.0, 23.9, 63.4%. Late-stage incidence difference = **6.0/100,000**; relative excess Hinds vs Harris = **25.10%**; reported late-stage share difference = **0.3 percentage points**. Quotients of age-adjusted rates: Hinds 29.9/46.4 = **64.44%**, Harris 23.9/38.0 = **62.89%**; they are **not** the reported case-based late-stage shares and must not be substituted for them. This is arithmetic replication from retained inputs, **not fresh verification against original registry downloads**.
- New early-detection evidence identified: Virdee et al. (2026), doi:10.1186/s12885-026-16179-9, longitudinal blood-count model externally validated in 6,518,326 participants, c-statistics 0.73–0.74; Chima et al. (2025 journal issue; 2024 early online), doi:10.3399/BJGP.2024.0491, cluster RCT showed **no statistically significant adjusted effect** of cancer-risk CDS on guideline-concordant follow-up (adjusted difference 2.6 pp, 95% CI -2.8 to 7.9), despite crude 76.0% vs 70.0%. Do not confuse prediction and intervention effects. BLOODTRACC did not establish overall superiority to its blood-test-abnormality comparator; retain that limitation with its c-statistics.
- Other published mechanisms: Conderino et al. (2022), doi:10.1186/s12911-022-01831-8 (raw EHR vs standardized CDM capture); Thompson et al. (2020), doi:10.1158/1055-9965.EPI-19-0882 (registry/EHR population selection). Neither proves local Hinds/Harris preventable harm.
- Full-text/abstract-level evidence statuses must be retained separately; Undermind's completed upstream search is literature discovery, not a systematic-review proof or independently verified source dataset.

## Accepted-package status — do not inflate
W1 mission charter: ACCEPTED (1/10). W2 CRC source and construct reconciliation: PARTIAL. W3 upstream signals: PARTIAL. W4 fragmentation mechanisms: PARTIAL. W5 causal/counterfactual: PARTIAL. W6 end-to-end clinical pathway: PARTIAL. W7 cross-disease transfer: PARTIAL. W8 independent red-team: NOT COMPLETE. W9 implementation/governance: PARTIAL. W10 Dartmouth briefing: NOT COMPLETE. Goal >=6/10 accepted packages, including W8 and W10, by Nov 9 **if supported by actual evidence**. Record accepted/partial/blocked explicitly.

## Next agent actions — exact order and acceptance
**A. Independent red-team agent (W8):** Read charter, accepted CRC source artifacts, scientific audit and raw publication tables; independently recompute rates and ratios; challenge source denominator, registry stage definitions, study time availability and published trial adjusted effects; submit an independent claim-by-claim PASS/FAIL/UNCERTAIN review with discrepancies and reproduction commands. Do not self-certify author work as independent review. **Owner:** incoming independent agent.

**B. Research lead (W2/W4):** Retrieve accepted source archive and check actual primary data files, hashes, numerator/denominator definitions and version/date; reconcile published EHR/CDM quantitative findings with original tables. Add a claim ledger (claim, source, population, time, construct, uncertainty, contrary evidence, reproduction, grade). **Owner:** DIS–RPLICE research agent. Exit only on reproducible provenance, not arithmetic alone.

**C. Upstream methods lead (W3/W5):** Investigate family history, symptoms, longitudinal labs, screening versus symptomatic diagnostic evaluation, prediagnostic time windows and risk calibration; specify clinically valid thresholds and negative controls; explicitly compare predictive signals to null decision-support intervention findings. **Owner:** research methods agent.

**D. Cross-domain methods lead (W7):** Apply the SAME source/construct/temporal/counterfactual audit to lung and women's health, with separate disease-specific evidence and harm metrics; document transfer successes and failures. **Owner:** research agent distinct from independent reviewer where possible.

**E. Synthesis/briefing lead (W9/W10):** Draft Dartmouth read-ahead with mission, methods, Hinds/Harris measurement insight, upstream signs, contradictory findings, what is proven vs not, collaboration/data-access needs, next 15-minute workstream queue, and references. Do not send without user approval. **Owner:** synthesis agent.

## Research decision ledger
- **D1 / fixed:** Hinds–Harris is calibration, not scope; earlier signs and preventable risk remain core.
- **D2 / verified arithmetic:** 6.0/100k late-stage rate gap coexists with 0.3 pp reported late-stage case-share gap; distinct constructs, no causal inference.
- **D3 / supported external:** Standardization and population selection can change observed measurements; no local patient harm shown.
- **D4 / contradicted shortcut:** Predictive signal detection does not automatically improve follow-up; randomized CDS evidence was null.
- **D5 / governance:** No PHI extraction, site-level causal claim, external submission or production auth modifications without authorization.
- **D6 / review:** CI success is engineering evidence only; W8 requires genuinely independent scientific verification.
- **D7 / scaling:** Scale up depth and provenance; scale out methods across diseases. Never transfer unvalidated clinical thresholds.

## 15-minute sprint receipt contract
Every agent leaves: timestamp, exact question, what was inspected, citations and source versions, reproducible arithmetic/code and tests, competing explanations, claim grade, changed paths and commit/CI, explicit blocker/owner, work-package acceptance delta, and the next action. If no new evidence, say so and preserve negative findings. Avoid duplicate PRs, unnecessary code and invented completion.

## Live coordination
GitHub PR #85 is the active scientific branch; do not merge or overwrite independent review in progress. Other agent owns login remediation; leave authentication and deployments untouched. Branch updates require checks and source review. Current file is the single cross-agent handoff; update it by appending dated evidence/decision entries, preserving historical status.


## New evidence receipt — S1 archive replay and full-text denominator correction (Nov 8, 2026)
**Scientific receipt:** `research/fragmentation-harm/DARTMOUTH_S1_ORIGINAL_ARCHIVE_CLAIM_LEDGER_2026-11-08.md` (nine claims C01–C09 with statuses, sources, alternatives and closure gates). **Executable replay:** `research/fragmentation-harm/replay_retained_county_archive.py`; **five software regression tests:** `test_replay_retained_county_archive.py`. **Primary-source correction:** `EMPIRICAL_MECHANISMS_2026-11-08.md` commit `617e20d`.

Evidence *actually acquired*: GitHub artifact 13589404488, run 42411939810, ZIP SHA-256 `ddee039ad52fbe27b694e3e64a01d7d5ec2b0e9cb24b535fce47b8434dba727a`. All 18 internally manifest-listed files SHA checked, with separate unmanifested `readiness.json` covered by whole-ZIP hash. Four original NCI HTML county rows and four corresponding CSV extracts agree. Each report says **2019–2023**. Hinds late/all = 29.9/46.4 per 100k (annual counts 75/118), late-stage case share 63.7%; Harris late/all = 23.9/38.0 (annual counts 1,098/1,732), share 63.4%. Late-stage rate gap 6.0 per 100k (relative excess 25.10%) versus case-share gap 0.3 pp. Rates and case percentages have **different denominators**. Archive receipt code revision `73455a4` differs from workflow head `312577b`; retain both, resolve binding separately.

**New corrected evidence:** Conderino 2022's 0.42 CRC screening ratio compares INSIGHT CDM with a **different NYU Langone raw-EHR population**, not a matched patient-level pre/post extraction. Its 15.9% health-maintenance observation is expressed in the paper's NYU Langone *patient* context; do not call it 15.9% of all screening records lost. This was corrected in the primary empirical mechanisms file. Thompson 2020's 12,280/16,257 EHR-evidence subset and 10,659/41,165 regional care subset are distinct denominators. No observed Hinds/Harris prevention effect follows.

**Next independent agent (W8) MUST:** rerun the original archived ZIP, check source CI and stage semantics, inspect Conderino Methods/Results and Thompson Tables 1–2, and produce signed PASS/FAIL/UNCERTAIN decisions for C01–C09, with detailed disagreements. **Research agent:** resolve stage unknown/missing conventions, the source-revision mismatch, and W4 remaining Sharma primary full-text discrepancy. **Dartmouth synthesis:** use the new primary-replay receipt and the corrected screening-measure wording, not the earlier overstatement. W2/W4 stay **PARTIAL**, W8 NOT COMPLETE; accepted-package count remains **1/10** until independent review and exit gates. New code/test CI must be checked on its own HEAD; earlier CI is not sufficient.


### Source-lineage correction from further archive footnote inspection
**Do not assume common NCI reporting implies identical source instrument.** Archived Hinds NCI county rows cite **NPCR 2025 submission** (source marker 2); archived Harris rows cite **SEER November 2025 submission** (marker 7). Late-stage footnotes distinguish source-specific summary-stage variables. The verified observation is differing registry input lineages beneath a common dashboard; the effect of those differences on the county rate/share contrast is **not established**. Independent reviewer must reconcile age adjustment, stage coding and unknown-stage denominator before adjudicating C02. Full finding is appended to `DARTMOUTH_S1_ORIGINAL_ARCHIVE_CLAIM_LEDGER_2026-11-08.md` at commit `e0e6eb23`. This is a high-priority mission-consistent measurement discovery, not a pivot.

### Independent update reconciliation, November 8
Read `INDEPENDENT_UPDATE_RECONCILIATION_2026-11-08.md` for the bounded 61/66-test reviews, exact artifact replay, primary-source checks and remaining gates. The recorded owner decision at 37e74880 now governs the jointly interpreted outcome framework in the briefing and canonical specification. The incidence and CI*Rank age-group footnotes have distinct wording; preserve both. External review received does not mean all exceptions are closed. Repository R32 and the new external-review R32 identify different actions and must retain their source namespaces.

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
- New early-detection evidence identified: Virdee et al. (2026), doi:10.1186/s12885-026-16179-9, longitudinal blood-count model externally validated in 6,518,326 participants, c-statistics 0.73–0.74; Chima et al. (2024), doi:10.3399/BJGP.2024.0491, cluster RCT showed **no statistically significant adjusted effect** of cancer-risk CDS on guideline-concordant follow-up (adjusted difference 2.6 pp, 95% CI -2.8 to 7.9), despite crude 76.0% vs 70.0%. Do not confuse prediction and intervention effects.
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

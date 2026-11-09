# DIS–RPLICE Health | Approved accelerated research execution plan
**Approval:** User, November 8, 2026. **Deadline:** Dartmouth-ready research briefing by November 9, 2026. **Mission:** Governing charter MISSION_CHARTER_CROSS_AGENT_2026-11-08.md remains authoritative. No goalpost shifting.

## Execution policy
Use sequential **15-minute AI-assisted sprints** with a specific research question, source/evidence inputs, one tangible deliverable, adversarial quality gate, GitHub receipt and next decision. Research completeness is determined by evidence, not sprint count. **60% minimum** refers to completion of defined briefing work packages, *not* proof of 60% clinical effectiveness or causal validation. The owner authorizes no external submission or spending.

## Ten briefing work packages — count complete only with receipts
| ID | Deliverable | Evidence-based acceptance gate | Status at approval |
| --- | --- | --- | --- |
| W1 | Immutable mission charter and pilot boundaries | Cross-agent charter committed and owner-approved | DONE — charter commit f823c402 |
| W2 | CRC Hinds/Harris construct reconciliation | Independent rates/share reproduction, denominator/temporal caveats | PARTIAL — prior reproduced aggregates, raw source archive verification required |
| W3 | Early-signal evidence synthesis | Symptomatic, inherited, longitudinal lab signals; effect sizes, limitations, harms | PARTIAL — upstream research commit 33c556e |
| W4 | Data-fragmentation mechanisms | Primary full-text corroboration of CDM loss, registry selection, referral failure | PARTIAL — empirical synthesis in PR #85 |
| W5 | Causal and counterfactual challenge | Explicit estimands, competing hypotheses, falsification, negative controls | PARTIAL — protocols exist; no local causal identification |
| W6 | CRC end-to-end pressure test | Measurement and published clinical pathway independently reconciled | PARTIAL — first calibration, further independent adjudication required |
| W7 | ChainWeb cross-domain transfer test | At least lung and women's health compared; no unjustified effect transfer | PARTIAL — preliminary source audit only |
| W8 | Independent agent replication/red-team | Separate signed evidence/claim ledger and discrepancies adjudicated | NOT DONE — agent independent review pending |
| W9 | Scientific integration and implementation feasibility | Reproducible methods, limitations, site-level governance/access plan | PARTIAL — study spec and preliminary audit |
| W10 | Dartmouth briefing package | Clear narrative, quantitative table, source citations, progress, methods, next decisions | NOT DONE |

**Progress calculation:** numerator = accepted work packages only; denominator = 10. PARTIAL does not count as completed. At approval, 1/10 formally accepted. Target >=6/10 by Dartmouth briefing, with W8 and W10 mandatory for a quality-assured briefing. Do not game completion by relabeling partial work.

## 15-minute sprint sequence, prioritized
S1: reconcile GitHub evidence and source archive against W2/W4; publish claim ledger.
S2: test upstream risk and symptom evidence, absolute risks, calibration, diagnostic versus screening populations (W3).
S3: falsify causal shortcuts; contrast intervention RCT with prediction and selection artifacts (W5).
S4: CRC end-to-end source -> construct -> decision and published clinical pathway pressure test (W6).
S5: lung and women's health transferability with instrument-specific tests and adverse effects (W7).
S6: independent agent red-team, reproduce quantitative claims and surface contradictions (W8).
S7: consolidate feasible local study/data governance and outcome measurement (W9).
S8: assemble Dartmouth briefing with verified results, open science questions, planned experiments, and ask for collaboration (W10).
S9+: repair failed gates, rerun tests and revise briefing. Additional sprints are permitted without changing mission.

## Sprint receipt template
- Sprint ID, UTC/local time, research question, source citations, source versions.
- Completed concrete work, file paths/commits, code/CI results and independent verification.
- Quantitative finding with denominator, time, precision and alternative explanation.
- Claim grade: verified / supported / inferred / hypothesis / contradicted / unavailable.
- Gate status, owner, unresolved dependency, next 15-minute experiment.
- Delta to accepted work-package completion; preserve historical failures and dissent.

## Dartmouth briefing must say
1. Why isolated valid metrics can conceal different underlying realities (Hinds/Harris calibration).
2. What published research shows about early signals and data loss.
3. Why a predictive model is not a proven preventive intervention.
4. Negative and contradictory findings, with safeguards.
5. What DIS–RPLICE/ChainWeb adds as a research method, versus what is still hypothetical.
6. How to validate with ethical, approved site-level longitudinal data.
7. Independent review status and collaboration/funding needs.

## Hard boundaries
Do not claim Hinds/Harris patient-level causality, cross-disease benefit, production readiness, or complete independent review without evidence. No auto-merge of unchecked code, no changes to another agent's login work, no patient-level access without governance, no external emails or submissions without owner approval.

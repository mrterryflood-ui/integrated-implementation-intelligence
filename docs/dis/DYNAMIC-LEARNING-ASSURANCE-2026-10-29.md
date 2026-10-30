# DIS — Dynamic Learning and Orchestration Acceptance
**Date:** 2026-10-29  
**Triage:** L4 GREEN (product improvement); production private release remains separately blocked by Clerk/partner-credential gates.  
**Release type:** Bounded learning vertical slice; not self-modifying AI, continuous training, independently proven effectiveness, or real-person SME participation.

## Non-negotiable intent
DIS does **not** tell people what to think. It teaches a reproducible way to investigate the past, diagnose the present, explore alternative futures, act only with appropriate human authority, and improve from observed outcomes.

**Agnostic multidisciplinary research, implementation science, engineering, integration, and adaptive delivery** form one continuous capability. Existing providers and methodologies are instruments, not separate user journeys. No claim that no competitor has a similar platform has been independently established; win through real-world comparative acceptance.

## Learning cycle
1. **Retrospective:** Preserve question, past knowledge, situation, source, first timestamped baseline, decision, strategy, implementation conditions, earlier measurements, changes and dissent.
2. **Prospective:** Record target, course of action, alternative/stop rule, accountable owner, hypothesis and next test. No action or claim promotion without human approval.
3. **Observe:** Capture measure, unit, observed value, *date of observation*, provenance/source, who self-attested, and server receipt time. Missing source and missing measurement are visible.
4. **Compare:** Time-order multiple checkpoints, detect comparable numerical changes only when units remain unchanged. A difference is descriptive, not causal.
5. **Reflect:** The operator records what new knowledge was gained, what capability requires development, which strategy should change, and which reversible experiment to pursue next.
6. **Challenge:** Request a fresh council assessment; store the prior report in the same transaction as the new report. Model viewpoints are not real stakeholder testimony.
7. **Adapt:** Document why a revision is proposed; obtain authorized human review for consequential changes. An accepted change becomes a new reference baseline for future cycles.
8. **Learn how DIS itself performs:** Collect independently reviewed false positives, unsupported claims, task completion, time to decision, error recovery, adoption, stakeholder burden, correction latency, and maintenance cost. No automatic prompt/model upgrades based only on self-report.

## Reuse map and implementation
- **Reuse** `dis_casework` with `playbook` JSON, `dis_case_events` (existing `CREATED`, `CHECKPOINT`, `REASSESSMENT` types), and the current private `/workspace/case` journey.
- **Extend** `decision-playbook.ts` with optional measure source/date and a four-part reflection. No breaking change for older saved plans.
- **New** `longitudinal-learning.ts` is a small deterministic reducer for checkpoint snapshots and descriptive trends. It is not a second persistence layer.
- **Database**: No migration. Existing RLS and application role INSERT/SELECT privileges checked on October 29, 2026. SQL CTE shape was reviewed with read-only EXPLAIN (not executed) for create, update and reassessment.
- **Not touching**: Clerk production credentials; dedicated RPLICE partner key; other tenant data; Zoom participant identity; production database schema; model selection or training weights; automated external action; independent scientific validity of the proposed Voltmeter.

## Acceptance / release gates
- [ ] Exact-head typecheck, unit tests, Vercel production/preview build and independent bot review.
- [ ] Verified authenticated two-person/two-tenant database exercises; unauthorized user must see no prior learning events.
- [ ] Actual event insertion tested on isolated nonproduction data as restricted `dis_app_safe` role, with transaction-local subject and without bypassing RLS. EXPLAIN alone is not runtime acceptance.
- [ ] Create a case; confirm `CREATED` checkpoint and that unmeasured baseline is not silently zero.
- [ ] Enter numeric outcome + unit + source + observed date + reflection; save and verify one `CHECKPOINT` receipt at next version.
- [ ] Try stale version; verify 409 and zero additional event. Simulate archival write failure; verify case revision rolls back.
- [ ] Recheck council; verify prior report retained atomically under `REASSESSMENT`; no historical report lost if insert fails.
- [ ] Change unit and record a nonnumeric outcome; ensure no unsupported numeric delta/claim.
- [ ] Confirm all self-attestations remain `USER_REPORTED_UNVERIFIED`; no claims of improved skill, scientific validity, causality, agent self-training or generalizable strategy.
- [ ] Mobile, keyboard, accessible labels, no hidden horizontal scrolling for critical actions.
- [ ] Rollback rehearsal, event accessibility, retention/legal deletion policy and privacy review before real user rollout.

## Measurement doctrine
Track separate longitudinal dimensions, not one opaque intelligence score:
- **Knowledge:** source coverage, contradictions resolved, unsupported conclusions, epistemic calibration and correction rate.
- **Skills:** user-confirmed competency under observed tasks or assessment, not number of lessons produced.
- **Strategy:** tested hypotheses, approved adaptations, time to a defensible decision, prediction calibration and failed alternatives.
- **Orchestration:** successful authorized handoffs, attribution, execution receipts, time/effort saved, error/rollback frequency.
- **Implementation:** reach, adoption, fidelity, acceptability, burden, cost, equity, sustainment and unintended consequences in context.
- **System learning:** measure version, signal, human adjudication, before/after error rate, safety regression, rollback or promotion.
The initial in-app counts report documentation completeness only. Thresholds and empirical instruments require prospective pilots and independent validation.

## Resilience and ethical learning
Do not learn from credentials, unconsented transcripts, data outside tenant scope, protected records, fabricated stakeholder testimony or unsupported model outputs. A user-entered lesson is a hypothesis until verified. No cross-client memory or model-training promotion without explicit consent, legal basis, isolated evidence, scientific appraisal, reviewer approval, reversibility and measured benefit.

**Scope truth:** Source changes and SQL plans are not proof of production private availability. The last inspected Vercel configuration lacked a working verified production Clerk pair and `RPLICE_API_KEY`. Those are independent release gates.

**Postflight owner:** DIS product owner (decision authority), implementation evaluation lead (measurement), integration/security operator (identity/tenancy), independent verifier (tests and task acceptance). Cadence proposed: at every saved case revision, after every reassessment, weekly operational review, monthly metric-calibration review, and quarterly system-evolution review. Automatic scheduling is not implemented.

# DIS Federated Evidence and Decision-Assurance Standard
Version 1.0 | 2026-11-05 | Status: source-metadata preflight implemented; cross-provider live operational validation incomplete.

## Mission
DIS is the integration, coordination and decision-assurance *method* across independently owned data and operational systems. It complements original local, county, state, territorial, tribal, federal, academic and industry systems. It does not displace the owner of any measurement, unilaterally make an official warning, obtain agency access without permission or turn a source report into human operational authorization. This standard governs material cross-disciplinary evidence decisions when the owning application loads it; it is not a claim of global GPT model retraining.

## The six mandatory connections
1. **Intent and purpose:** Define the real phenomenon or decision target, beneficiaries, objective, whether the mission still makes sense, and what constitutes post-success stewardship. Explicitly ask what happens the day after achieving the goal.
2. **Instrument fit:** For each number, claim or stakeholder observation record what it measures, its unit, operating range, calibration or construct validation, known blind spots, cost and how it changes the decision. Different instruments answer different questions. Do not average different constructs without a validated model.
3. **Identity, time, place and lineage:** Establish which entity/population/jurisdiction a source is about; event time, observation time, published time, source retrieval time and decision-as-of time are not interchangeable. A study's publication date is not when the studied outcome occurred. Two URLs pointing to one study, gauge or original dataset do not count as independent measurement confirmations.
4. **Independence and disagreement:** Trace original publisher, shared upstream provider, sensor and model dependencies. Retain compatible, complementary, conflicting, unavailable and stale states. Different viewpoints and historical personas are hypothesis lenses, not real interviews or independent source confirmations. No universal 'truth score' is validated.
5. **Decision and follow-through:** Preserve alternatives, human authority, expected and unintended effects, the time available to act, cost of acting/delay, decision triggers, rollback/reversibility, operational resources, equity consequences and accountability/acknowledgment. A message being sent is not equivalent to receipt, understanding or action.
6. **Temporal stewardship and revision:** Version the observed world state, beliefs, instrument/model assumptions, and legitimate goals. Evaluate past inheritance, the current decision, the day after success, plausible successors' future, and feedback that would require reversing, retiring or fundamentally redefining the objective.

## Implemented technical boundaries (exact code paths)
- `apps/dis-platform/lib/decision-assurance.ts`: opt-in, structured decision packets with negative findings for time, scope, duplicated origins, invalid pooling, metric reactivity and post-success stewardship. Research-stage deterministic rules. No autonomous action, no calibrated certainty or operational approval.
- `apps/dis-platform/app/decision-lab/`: local-only editable demonstration of the decision packet; supports 12 synthetic challenge cases, not independent human scientific validation.
- `docs/dis/GPT-SESSION-AND-AGENT-OPERATING-CONTRACT.md`: source-first MAP/GAP, interdisciplinary reasoning and human authority instructions, version-bound into runtime Council inference by `apps/dis-platform/lib/operating-contract.ts`.
- `apps/dis-platform/lib/council-evidence-mesh.ts`: new bounded pure source-metadata audit for DOI/URL duplicates, repeated excerpts, missing/future retrieval times, different/unknown reference periods and geography. Returns a source register and review issues; always states independent measurement validity and action authorization NOT established.
- `apps/dis-platform/lib/council-engine.ts`: runs the bounded source audit as server-side context in the existing Council inference, without added AI network calls or extra provider cost.
- `apps/dis-platform/lib/council-engagement-assurance.ts`: attaches the source audit to every Council preliminary acceptance receipt.
- `apps/dis-platform/app/council-readiness.tsx`: displays source issues, independence limits and temporal/geographic uncertainty in the actual Council review.
- `apps/dis-platform/lib/consultation-package.ts`: retains these issues in the draft documents and export pathway.
- `apps/dis-platform/lib/ecosystem/orchestrator.ts`: existing scoped owner-approved capability orchestration, per-source receipts, consent and bounded network budget; DO NOT create a parallel invoker.

## Required provenance fields for future adapters
Each permitted source connector should declare `providerId`, `originalPublisher`, `sourceUri`, `sourceRevision`, `sourceKey`, `kind`, `construct`, `measurementUnit`, `geographicScope`, `eventTime`, `observedAt`, `publishedAt`, `retrievedAt`, `referencePeriod`, `calibration/validity evidence`, `error/uncertainty`, `sharedLineageIds`, `licensing/authorization`, `transportProof`, `dataClass`, `tenantScope`, `decisionUse`, `status`, `limitations`, and `lastVerifiedAt` where those facts are available. Missing fields are UNKNOWN, not null-equals-zero or automatically current. A metadata query is not a measurement; a map read is not source accuracy; an API configuration is not proof of actual authenticated exchange.

## National/intergovernmental interoperability posture
Support standards where sources implement them: OGC SensorThings (sensor/observations), ArcGIS GIS layers, agency-approved REST/GeoJSON, CAP for receiving official alerts, and authorized incident/resource schemas (EDXL/NIEM/agency protocols). Source onboarding has a staged gate: documented → permitted → technically configured → independently retrieved → semantic/temporal validity checked → operationally exercised → accepted by responsible authority → monitored for drift and recovery. Do NOT imply all seven steps from a source registry entry.

## Counterfactual and acceptance
Compare DIS-assisted decisions with competent existing practices under equivalent data/time/staffing. Record material omissions, false alarms, missed changes, appropriateness of action, source conflicts, role/agency burden, lead-time, actual outcomes, downstream effects and cost. A correct synthetic code flag is an engineering check, not a published finding of better decisions or lives saved. Independent empirical evaluation and partner acceptance remain gates for consequential operational claims.

## Failure and safety policy
Partial network responses, unknown calibration, misaligned geographic scopes, unsupported numerical pooling, source duplication, stale records, private or unauthorized tenant records, failed identity, unknown recipients and unverified human acknowledgment are visible gaps. Human authorization and existing incident procedures remain in force; an unsupported DIS model inference must never delay verified emergency response. No Copilot or paid Replit by default and no autonomous third-party messages without the appropriate approval.

## Current scope limitation
This codifies a **cross-disciplinary Council source mesh and decision standard**, not a built-out national weather, 911, WebEOC or any agency transport mesh. HazardAware product integration and operational release are a separate owner-led stream. A repo rule does not automatically change every separate ChatGPT conversation or external agent; adoption requires loading and testing the applicable contract in each context.

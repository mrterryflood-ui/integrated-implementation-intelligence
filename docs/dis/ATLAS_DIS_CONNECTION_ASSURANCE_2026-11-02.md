# DIS ↔ SHIELD | ATLAS integration assurance — 2026-11-02

**Release scope: public interface metadata only.** This increment does not release classified, CUI, client, sensor, mission, medical, recipient, or protected workflow information. The published ATLAS contract is the existing `GET https://secureassure.app/api/integration/composition/v1?goal=hazard-awareness`; DIS uses its existing ecosystem engagement, consent, network budget, provenance and deliverable routes.

## User journey and ownership

1. A DIS user requests emergency/hazard/ATLAS continuity assessment and explicitly authorizes external public/aggregate retrieval through the already-authenticated `/api/capability-fabric` workflow. The decision, stakeholder scope and requested source remain visible.
2. DIS selects its existing `continuity-and-emergency-intelligence` capability and performs exactly one server-side GET to the reviewed ATLAS HTTPS origin. No user question, identity, tenancy, location, upstream key or private report is transmitted.
3. The adapter validates `atlas.mission-composition.v1`, the goal, required hazard/weather needs, distinct source identities, candidate membership, evidence consistency and bounded response size. It fails visibly on malformed/partial/error/redirect/timeout responses.
4. DIS stores the origin/retrieval timestamp and response SHA within its existing engagement result. An evidence item describes **source-reported interface topology**, not a weather measurement or source-to-recipient receipt; source observation time is **unknown**.
5. DIS keeps `NOT_MEASURED` and `NOT_EXECUTED`. Public ATLAS `hasAnyLiveEvidence` is provider-reported only; this read cannot establish independently verified live exchange, named receipt, field acceptance, acquired hardware or outcome. These remain distinct DIS/MAP–GAP rows.

## What is wired and what is not

| Connection | Produces | Status/acceptance |
|---|---|---|
| ATLAS public composition → DIS ecosystem capability | Source-reported declared/code-present interfaces, explicit gaps and request hash | Implemented in this candidate; independent production witness pending reviewed merge |
| ATLAS observed Hazard Aware/NWS source → authenticated local report → internal recipient | Durable origin/read/report/receipt within ATLAS | Existing ATLAS service-chain release; does not make DIS the recipient or independently corroborate a physical outcome |
| DIS council review → ATLAS changed source/COA/approval with return receipt | Protected bidirectional exchange | **NOT BUILT**; requires explicit tenant authority, scoped credentials, policy and durable reciprocity acceptance |
| Real TAK/C2/sensor/OEM interface → ATLAS / DIS | Authorized physical/environmental data | **NOT VERIFIED**; equipment/interface/data rights and authorized tests required |
| ROI / field effectiveness | Comparison against accepted baseline and observed outcome | **NOT MEASURED** |

## Threats, fault domains and tests

- Only an exact public HTTPS origin and endpoint are allowed; no caller-provided URLs, secrets, POST or redirect.
- Existing `NetworkBudget` enforces total request, elapsed-time and response-size ceilings; malformed payloads and contradictory source counts fail closed.
- Negative tests cover schema substitution, duplicate/mismatched identities, altered live booleans, HTTP failures, unexpected content type, oversized payloads and redirects.
- Stress tests: 2,048 adversarial schema projections and 100 bounded concurrent fixture reads; **these are synthetic**, not a live production load test.
- Cross-platform run is marked end-to-end only after reviewed CI, verified DIS deployment revision, an actual consented authenticated DIS invocation and independently witnessed target receipt. Do not convert a Vercel READY state to observed transaction success.

## Related receipts

- ATLAS main: PRs #215–#219, `secureassure.app`, connection-assurance and service-chain production witness.
- DIS source: `apps/dis-platform/lib/ecosystem/catalog.ts`, `public-adapters.ts`, `orchestrator.ts`, `contracts.ts`; this adapter reuses those boundaries.
- Remaining whole-platform acceptance: ATLAS issue #196, external keys and authorized adapters, DIS production identity/role, full physical and measured outcomes.

**Decision:** no new background polling or external dispatch; preserve existing human approval and source time. Pilot one authorized real read before any claim of live cross-system interoperability.
# DIS Capability Fabric — MAP–GAP, Portfolio Inventory and Phase-1 Acceptance
**Date:** 2026-10-30 · **Triage:** L4 GREEN · **Environment:** source-first protected preview, not an accepted production interoperation.
**Human authority:** DIS owner signs release and specific scopes. Separate legal entities, customers, civilian/defense information zones, and personal records remain independent.

## Intent and end state
DIS is its own research, diagnosis, council, implementation and learning system. Other owned systems retain their own audiences and independently deployed front doors; no product marketplace, portfolio advertising, application cloning, global database or automatic cross-project memory. A user asks a DIS question; behind the scenes it selects the **smallest defensible set of authorized, relevant specialist intelligence** and labels supported claims and missing data. Domain methods remain specific to context. Read, plan, challenge, implement with human authority, measure, learn, adapt.

**Metric of done:** an authenticated operator starts with an ordinary cross-domain question; DIS explains eligible contributions; after separate consent, invokes only authorized read-only specialists; returns bounded, provenance-labeled aggregate evidence into the **existing consultation deliverable**; records blocked contributors honestly; does not transfer the question or identity to upstream services. A failed/no-key service must not manufacture a result. A real runtime authenticated smoke test and two-tenant isolation are required before claiming this works in production.

## Repository discovery — 41 identified repos in two connected owners
The following represents **repository discovery**, not 41 healthy, distinct, currently deployed or authorized integrations. Names are discovery identifiers, not promises of domain accuracy. Verify owner/legal/control, commits, production host, service contracts, sensitive-data class, runtime and consent per row before promoting.

| Domain | Discovered repositories (not yet connector-certified) |
|---|---|
| DIS, governance, research | `mrterryflood-ui/integrated-implementation-intelligence`, `mrterryflood-ui/Doctrine-Enforcer`, `ISS-LLC22/bettersciencelab`, `mrterryflood-ui/iss-evaluation-engine` |
| Community, civic, violence and safety | `mrterryflood-ui/Thriveup`, `mrterryflood-ui/Civic`, `mrterryflood-ui/community-violence-register-data`, `mrterryflood-ui/GV`, `mrterryflood-ui/Incident-Response`, `mrterryflood-ui/NAACPPCR` |
| Health, wellness and protected records | `mrterryflood-ui/Herhealthcare`, `mrterryflood-ui/Mentalhealthplatform`, `mrterryflood-ui/Menheathplatform`, `mrterryflood-ui/Menheathplatforms`, `mrterryflood-ui/Glp1-`, `mrterryflood-ui/Benefits-intelligence`, `mrterryflood-ui/YourRecords` |
| Veterans, workforce, education | `mrterryflood-ui/Vetstransition`, `mrterryflood-ui/VAtool`, `mrterryflood-ui/StaffSustain`, `mrterryflood-ui/StaffSustain-setup`, `mrterryflood-ui/childcorelearning`, `mrterryflood-ui/tradespark-pro`, `mrterryflood-ui/lineready`, `mrterryflood-ui/finlitspark`, `mrterryflood-ui/lifeready` |
| Business, grants, property | `mrterryflood-ui/Businessorchestr`, `mrterryflood-ui/Marketinsight`, `mrterryflood-ui/Grants`, `mrterryflood-ui/GrantPath-Pro-PWA-Transfer`, `ISS-LLC22/Grants2`, `ISS-LLC22/Grants-`, `ISS-LLC22/Proposal-Engine`, `mrterryflood-ui/BPA`, `mrterryflood-ui/Bsb` |
| Environment, engineering, resilience, security | `mrterryflood-ui/hazardaware`, `ISS-LLC22/shield-atlas`, `ISS-LLC22/Envis`, `mrterryflood-ui/-lunar-sentinel`, `mrterryflood-ui/Tattltetale`, `mrterryflood-ui/reploop` |

Important: `VAtool` currently describes **AIDE-Core AI fleet evaluation**, not veteran benefits adjudication. The canonical GrantPathPro source is **Grants2**; the other grant repos are not alternative active deployment sources. Security, health/PHI, private insurance, civilian/military and campaign sectors require separate authorization and enclave controls.

## Verified contract candidates vs runtime truth

| Capability | Evidence inspected | Data classification | Phase-1 action |
|---|---|---|---|
| ThriveUp aggregate community impact | `Thriveup/server/partner-api-contract.ts` and `partner-api-routes.ts` — `GET /api/partner/v1/impact?limit=15`, scope `impact:read` | Approved partner-reported aggregates, not verified causal effects | Fixed-origin read-only adapter; requires dedicated scoped key |
| ThriveUp public ecosystem capacity | `GET /api/partner/v1/community`, scope `community:read` | Public-platform summary, **not** neighborhood social determinants | Fixed-origin read-only; label correctly |
| ThriveUp Chainweb evidence coefficient catalog | `GET /api/partner/v1/chainweb/coefficients`, scope `chainweb:read` | Method metadata, study-level validation outstanding | Metadata only |
| ThriveUp benefits catalog | `GET /api/partner/v1/benefits?limit=12`, scope `benefits:read` | Catalog, not benefit eligibility | Bounded public program titles only |
| Civic Signal local context | `Civic/docs/partner-exchange-v1-operator-runbook.md`, signed `POST /api/partner-exchange/v1/civic-context` | Public bounded civic context; strict signed/replay contract | Discoverable for planning; **NO calls** until DIS-specific origin/keys and signature validation |
| GrantPathPro opportunities | `Grants2/docs/operations/QUALIFIED-OPPORTUNITY-INTAKE.md`; canonical tenant-scoped Opportunity Desk | Tenant-private legal/applicant/pursuit records | Planning only; do not borrow user's or other app's cookies |
| RPLICE research / Parallax | `bettersciencelab/shared/rplice-mcp-handlers.ts`, dedicated server-only key | Structured methods; human stakeholder data requires separate consent | Planning only; existing separate DIS Parallax remains fail closed until production credentials |
| M2C, health and veteran services, security, hazards | Source code/repository discovery | Mixed protected/public; enclave and domain-specific gates | Planning only; do not infer API availability from repository name |

**Credentials:** Never embed an entire app or copy a token from another platform. Use unique server-side `DIS_THRIVEUP_IMPACT_KEY`, `DIS_THRIVEUP_COMMUNITY_KEY`, `DIS_THRIVEUP_CHAINWEB_KEY`, `DIS_THRIVEUP_BENEFITS_KEY` granted only the matching ThriveUp scopes. DIS does not accept configurable arbitrary URLs; first four read-only adapters use a fixed audited HTTPS origin. No secret value in source, tests, chat, public JS, event logs or documentation.

**Authorization:** the capability route `POST /api/capability-fabric` is private, Clerk-authenticated, production identity gated, same-origin checked, quota-bound and opt-in for external invocation. The user's raw prompt and identity are used *only locally* for routing, **not forwarded to a specialized app**. Scope errors, timeouts, malformed responses, no credentials or no contract produce explicit unavailable receipts; none becomes an actual observation.

## Reuse report
- **Reuse:** DIS existing consultation + deliverables, Clerk identity, Neon RLS/quota table `dis_consult_usage`, production identity gating, native evidence methods.
- **Extend:** existing `ConsultationStudio` with a single behind-the-scenes "Use relevant company intelligence" interaction; user never switches to other app front doors.
- **New:** private typed capability contract, deterministic context router, credential-limited adapter, evidence receipts and protected route because no existing private DIS owned-system invocation exists.
- **Not touching:** platform repositories, schema migration, public MCP registry, external identity federation, cross-tenant data, actual model weights, outbound messages, proposals, automated decisions, defense or personal medical records.
- **Environment:** Phase 1 source branch/CI only until approved; no production partner keys or authenticated cross-platform runtime proof.

## Assurance gates / phased plan
**Phase A — first governed read-only slice:**
- [ ] Exact-head TypeScript, tests, Vercel preview and independent Bugbot review.
- [ ] Mock unauthorized/absent keys: **zero outbound calls**; no cached/fabricated evidence.
- [ ] Cross-domain selection tests: impact, veteran, hazard and funding questions; no unbounded tool fan-out.
- [ ] No upstream leakage of question, user ID, health, veteran, military or financial record. Partner-returned individual/outcome arrays and partner identifiers dropped by explicit projection.
- [ ] Permissioned case output contains receipt provenance, source, source freshness, scope and gaps, without treating reported outcomes as causal.
- [ ] Real restricted identity + scoped partner keys; verify 401/403, wrong scope, 429, 503, 200+bounded body, audit/rollback and two-tenant isolation. **NOT PERFORMED** before provisioning.

**Phase B — private protocol gateway:** add verified signed Civic Signal query, RPLICE read-only analysis, correct canonical GrantPathPro tenant-specific authorization, and only relevant other platforms. Each has isolated keys, scopes, audit and circuit breakers; no global credential.

**Phase C — reciprocal learning:** signed, tenant-controlled event receipts with source status, date, versions, ownership, acceptance/rejection and correction/revocation; no silent remote write. Add provenance-preserving feedback after human review, then measured routing improvements and holdout tests.

## Measured outcomes and postflight
Baseline: owned specialized intelligence does not yet have one safe end-to-end DIS broker. Expected improvements must be measured, not asserted: correct specialist selection, verified evidence coverage, missing-data disclosure, end-user task completion, decision time, costs, stale-rate, false positive source attribution, tenant leakage (threshold zero), and accepted versus rejected strategy revisions.

**Failure doctrine:** no key → no call; no consent → 403; invalid session → 401/503; route not accepted → plan only; partner 401/5xx → unavailable; suspicious data → no raw passthrough; harmful or protected context → not eligible for casual cross-domain sharing.

**Human release gate:** owner approval required for production deployment, cross-organization data sharing, signed service credentials, model-level learning and any consequential action. The existence of this contract, a green build or a preview does NOT establish a working integrated ecosystem.

# DIS × RPLICE — independent code-first integration audit and implementation plan
Date: 2026-10-29
Status: REVIEWED SOURCE / IMPLEMENTATION GATED
Triage: L2 ORANGE for unsafe authority or tenant exposure if integrations are activated without isolation; L4 GREEN for staged, no-data-changing architecture work.
Sources inspected: GitHub main at `mrterryflood-ui/integrated-implementation-intelligence@a03ef0bb459cb2226c318e5ca5cc66c7610c5590` and `ISS-LLC22/bettersciencelab@404ca1729afe31761103035e5bc2e5c1fd758132`, plus RPLICE MCP PR #98. Exact heads may advance; refresh before release.
Source confidence: high for observed code patterns. No authenticated end-to-end tenant, Zoom, real-browser, public EC2 or external compliance acceptance performed in this audit.
User intent: one universally useful, easy-to-understand conductor. Personal → team → community → organization → research → government. No unrelated tools to learn; no unverified execution success.

## Before: direct code observations
1. DIS has council selection, consultation, sourced discovery, Word/PowerPoint generation, cases and private Neon-based workspaces. It has no RPLICE data-plane adapter nor Parallax implementation in main; public MCP at `apps/dis-platform/app/api/mcp/route.ts` is read-only, not connected to the user's private ChatGPT plugins.
2. DIS private production features are deliberately gated on production Clerk; a READY deployment is not full private-account acceptance.
3. RPLICE `shared/parallax.ts` uses Jaccard token overlap on self-declared visible statements to produce pairwise displacement. `pricesWhom` flags drive structural power-asymmetry labels. Neither is a measured causal effect, verified valuation, or proof of what an actual person believes.
4. RPLICE Parallax Value Translator, Stakeholder Map, Mirror Conversation, Stadia Composer and ROI Residual pages keep working drafts in browser localStorage. Some pages manually reload the Value Translator's localStorage. This is not a shared durable source of truth across people, devices or apps.
5. Mirror Conversation output is deterministically templated first-person text from entered fields; it is not actual human participation or independent AI-agent testimony.
6. `shared/parallax-stadia.ts` historically marked four reference setups "proven" based on generic literature text; case-specific validation was not established. Corrected to default "unvalidated" on the reviewed MCP PR branch, subject to merge/release.
7. `server/integration-parallax-routes.ts` exposes public list reads and merely session-authenticated mutations without owner/project filters in the reviewed update/delete queries. Do not connect private DIS tenant data to these endpoints.
8. RPLICE `shared/surfacing-organ.ts` ranks a fixed tool catalog using topic regex and persona/discipline modifiers. It is an initial heuristic router, not proof of context-aware autonomous tool choice. The front door stores one of four personas in localStorage; DIS must support all life/domain contexts without forcing specialist persona selection.
9. RPLICE's `discipline-rosetta-stone.tsx` uses an AI-chat prompt for translation. No independent semantic-fidelity or source-to-output claim audit is established by that screen.
10. RPLICE SALP server has database-backed per-project scoring and alert logic; assess measurement validity, origin, freshness, project ownership, threshold calibration, and user-visible remediation before using a status dial as an assured outcome.
11. RPLICE draft MCP #98 adds server-side REST discovery, stdio tools and an embedded method engine. Initial evidence/checkpoints use globally shared process-local Maps and accept caller-supplied actor names. Those cannot be production authorization, audit, or tenant-safe institutional memory.
12. The MCP branch now includes a stateless operator-declared Parallax comparison plus production blocks around non-durable evidence/checkpoint, fidelity, SALP and triage operations. Do not treat the branch as released until its exact-head CI, independent review, merge and deployment checks pass.

## Target operating contract — one conductor, specialized engines
**DIS** owns user interaction, intent, mission, contextual consent, identity, organizational scope, capability routing, decision history, authority, role accountability, cross-domain synthesis and the single coherent output.
**RPLICE** remains its own product and provides research methods, analytical frameworks, Parallax/values, SALP, MAP-GAP, deterministic calculations and evidence utilities through an explicit versioned MCP/REST contract.
**Source systems** own their original facts. The integration copies only data necessary for an authorized decision, never private client data merely because two platforms share an owner.
**Human owners** retain responsibility for publication, financial commitments, contracts, clinical/legal decisions, irreversible actions and release.
No re-embedding full RPLICE code in DIS. No parallel competing project records; use versioned references and typed handoffs.

## Mission record — every mode
- missionId, organizationId / personalWorkspaceId, actorId, actorType (human, model, educational lens), authenticated role, jurisdiction/time window, mission scope, purpose, lawful basis and consent
- end state; current state across designed, operational and experienced realities; MAP-GAP gap/causes
- stakeholder roster with confirmed identities versus scenario personas; values, decisions they own, consultation record, influence, unrepresented perspectives and non-monetized residual
- RPLICE method invocation (version, input type, evidence source, provenance, consent, tool invocation ID and actual status)
- strategy and alternatives; knowns/unknowns/conflicts; resource/sustainment plan; owner, deadlines, dependency, exit/rollback; change request and approval
- leading/lagging outcome measures: numerator, denominator, location, baseline, target, interval, source timestamp, evidence class, cost and confidence; distinguish activity from impact
- immutable event/revision chain: Before → Changed → Why → Proof → Limits, signer, feedback/learning and next review.

## Identity, permissions and production gates
- User names in Zoom or an organization are real authenticated invitees, never copied from educational thinking-lens labels. A model is named as a model; role, expertise, constraints, meeting attendance and permission are explicit.
- Use per-tenant server-side RLS/authorization in DIS and tenant-scoped partner identifiers in RPLICE. Test IDOR/cross-tenant mutation, consent withdrawal, data retention and export/delete on both sides.
- RPLICE adapter: server-to-server only; scoped partner key or approved identity exchange. Explicit consent for private content, no browser keys, signed request IDs, budgets, rate limits, no automatic fallback to a public/less-controlled endpoint.
- Production blocker: no shared in-memory global evidence, self-attested scientific verification, pseudo-human approval, unreviewed provider claims or high-stakes automated action.
- Observability: health, latency, usage/cost, quality, failures, provenance and retained receipts; no leakage of source/PII in logs.

## Experience: clarity, depth on demand
One starting question: "What are you trying to understand, change or accomplish?"
Default DIS assembles the right capabilities invisibly and explains the choice in plain language.
User selects depth only when desired (Personal, Organization, Research, advanced mission); Campaign Plan/Execute and other specialized capabilities are toggleable. Every mode retains full diagnose→plan→prepare→authorize→execute→measure→learn.
User sees: (1) direct answer and best-supported alternatives; (2) "why this, here, now" with decision confidence; (3) an accountable plan with owners/cost/dates; (4) simple status/voltmeter; (5) one expandable evidence and dissent record.
Do not dump 279+ RPLICE pages or 21 MCP tools into DIS navigation.

## Voltmeter / SALP — operational definition, not decoration
A compact mission-status dial is derived from real leading/lagging measures, not a universal arbitrary percentage. Each indicator carries baseline, target, current observed value, timestamp, owner, data coverage/validity, alert threshold, counterfactual or comparison, and response rule. Show "Unavailable" when stale/unmeasured rather than green. Separate confidence in measurement from health of outcome. Drill-down to contributing domains, discrepancy, before/after and recommended corrective action. Human approves recalibration and resource/strategy changes.

## Expert accountability / Zoom-to-action
Meeting attendance should be permissioned and consent-based, with imported participant identity verified against the organization's directory/invite. For each actual SME: real name, organization, domain expertise, contribution, accountable decision, consultation/quote source, assigned work, evidence obligation, due date, acceptance criteria, handoff dependency and escalation path.
RACI/decision rights must identify exactly one accountable owner per deliverable. Education-inspired council personas can challenge the work but cannot accept assignments, certify expertise or sign approval.
Meeting outputs become proposed actions requiring owner confirmation, not automatic externally binding commitments.

## Reuse → Extend → New → Not touching
Reuse: DIS council and consultation; RPLICE Parallax functions, SALP/MAP-GAP canon, Rosetta, framework and computation engines; existing API contracts.
Extend: RPLICE stateless Parallax MCP, honest fidelity semantics, direct method contract; DIS organization/person/role context and user-facing mission status; project persistence and versioned event ledger.
New only where absent: tenant-safe cross-platform identity+consent binding; accountable review/approval receipts; mission evidence crosswalk; real Zoom-to-action event adapter; unified "voltmeter" with provenance.
Do not touch without explicit separate gates: RPLICE global/public registry data migration, private customer data, source archives, live financial systems, public campaign publication, production domain/certificates.

## Release sequence — no pretending
G0: Snapshot exact GitHub heads; backup database/provider configuration; write source and integration threat model. Baseline CI, open PRs and deployment consequences.
G1: Merge only reviewed source whose exact-head checks pass; close superseded PRs with evidence. No indiscriminate merge of stale/conflicting branches.
G2: RPLICE read-only/stateless contract returns real 200 + provenance, validates schema and adverse tests, and denies cross-tenant/default state. Pending stateful methods return 503.
G3: DIS server-to-server adapter with scoped key/consent; no client exposed credentials; verify the actual target deployment and audit receipts.
G4: Shared project/spine and Parallax record migrated off browser-local state with owner scope, versions and user-visible change history; real-meeting identity and RACI.
G5: SALP sensor calibration and volmeter baseline: source freshness, threshold testing, drift alerts, false positives, behavior change and outcome evidence.
G6: E2E pilot across individual, organization and research modes: one mission, more than one professional view, alternative strategy, authorized execution, revision, report, outcome and durable resumption. Mobile/accessibility and "translation-without-loss" independent user testing.
G7: Security/privacy, exact build, independent acceptance, backup/restore, incident/rollback rehearsal, signoff, progressive enablement and post-release surveillance.

## Acceptance criteria
1. Zero unapproved financial/external/irreversible actions; no inappropriate read/write across separate tenants or domains.
2. 100% significant claims/proposed outcomes carry source provenance, freshness and uncertainty; no fabricated scientist/SME consultation.
3. Every assigned task has an owner, authority, due date, acceptance evidence and visible status; approvals authenticated and auditable.
4. A novice completes first meaningful mission step without knowing a framework/tool name; same data supports professional-scientific depth.
5. One verified, reproducible end-to-end path: intake → RPLICE analytic call → council dissent → strategy choice → approval → measure → adaptation → export.
6. Published deployment is tied to the exact merged revision; actual production smoke, multi-user isolation and recovery are independently accepted.

## Status at audit close
Source review and a gated MCP branch are real. A production DIS↔RPLICE connection, durable Parallax sharing, Zoom integration, volmeter outcome history, real-user authentication and scientific claim adjudication were **not** demonstrated. These are release gates, not silently completed features.

# Audit (tiered, relevance-gated)

Replaces `compliance-audit` and `mandatory-post-code-build-audit`. Same areas, sequenced so that small changes get small audits and releases get the full set. **Always find, fix, repair, sustain, and update.** Audit to leave no silent failures, cascades, or blind spots.

## Tiers

| Tier | When | What |
|---|---|---|
| 0 | Every run that touches code | Typecheck = 0 errors. Targeted tests for touched paths. Congruence chain (SKILL.md section 6). One restart + one log check. Screenshot of the touched surface at desktop and mobile. Scan touched code for silent failures, mocks, fabrication. Truth badges present. |
| 1 | Feature or milestone complete | Tier 0 + Product + Documentation + every area marked for the change type below. |
| 2 | Before publish or any release claim | Every applicable area + `security-scan` + `code-review` (independent architectural review) + reverse-failure pass + Iron Rules check + live check of critical journeys. |

To run every area on every run, set Tier 0 to "all areas". Expect slower, costlier runs.

## Areas (25, minus platform-specific items that do not apply)

**Product and experience:** Product (does it truly solve the user's problem, and pass the ideal-state test?), Design (polish, consistency, realism rules), Mobile and tablet, Performance, Documentation (user-facing docs, help, "How this works").

**Engineering and scale:** Code quality, Accessibility, Scalability and reliability, Error handling, Database, Test coverage and QA, Integrations (third parties implemented correctly), Platform cost and backend performance.

**Security and access:** Security, Identity and access, Dependency and supply chain.

**Marketing and revenue (only when public or commercial):** SEO, Landing page, Copy and content, Branding, Internationalization, Billing and tax.

**Legal and compliance:** Legal (terms, licenses, required pages), Privacy (collection, storage, disclosure).

## Relevance matrix (Tier 1 picks)

| Change type | Areas |
|---|---|
| UI or layout | Design, Mobile and tablet, Accessibility, Performance, Copy |
| API, routes, jobs | Security, Identity and access, Error handling, Scalability, Test coverage, Integrations |
| Schema or data | Database, Security, Privacy, Error handling, Test coverage |
| Dependencies | Dependency and supply chain, Security, Performance |
| AI, models, scoring | Product (does it help), Truth labels, Error handling, Test coverage, Integrations |
| Public pages | SEO, Copy, Branding, Legal, Privacy, Internationalization |
| Payments | Billing and tax, Security, Legal, Integrations |
| Operational or safety domain | Human-authority path, fail-closed behavior, audit trail, source-failure handling |

## Reverse-failure pass (Tier 2)

Ask, and answer with evidence: What would make this silently wrong? What happens when each source is down, stale, empty, or malformed? Who is affected if it is wrong, and how would we find out? What claim in the UI or docs exceeds what was verified?

## Recording

Write each finding in `docs/build-ledger.md` as: area, finding, fix or reason deferred, proof. Findings deferred at Tier 2 block a release claim unless the user explicitly accepts the risk.

## C1-C9 invariant check (Tier 2; spot-check at Tier 1)

For each changed feature answer yes or no, with evidence: C1 no fabrication (every claim traces to evidence or is marked uncertain); C2 no silent failure (typed error, visible escalation, or durable residual); C3 no unauthorized access; C4 no unauthorized disclosure; C5 no concealed manipulation; C6 fail closed (missing policy, identity, evidence, or verifier blocks consequential action); C7 bounded agency (budgets and timeouts enforced outside the model); C8 no unrecorded action (decision and execution receipts in the ledger); C9 recovery and accountability (rollback or containment, residuals with owner, severity, next review). Any "no" is a finding.

## Coverage map (Tier 2)

List every consequential boundary (routes, jobs, tools, message paths, data stores, integrations) and mark each: covered by auth, receipts, and tests, or not. State plainly what is outside coverage. Re-check for coverage drift whenever a route, job, integration, agent framework, or region is added. Conformance is not "the SDK exists", it is proof that direct paths are closed and tests exercise the boundary.

## BIA vital-signs lens (Tier 2)

The 12 BIA layers, read as software checks. This is a software reading of the constitution's one-line functions: confirm or edit.

| Layer | Constitution function | Check |
|---|---|---|
| Skin | Identity drift under adversarial pressure is L3 minimum; an active identity attack is L1 | Auth, session, input boundary hold under abuse |
| Brain | Brain failure during L1 or L2 needs human override at once | Decision logic has a human override path |
| Nervous system | Signal routing failure during a crisis activates blood broadcast | Events, queues, and alerts route and fail visibly |
| Heart | L1 and L2 activate sprint mode; L5 activates recovery mode | Job tempo and mode change with triage level |
| Blood | Broadcasts triage level to all layers on L1 and L2 | A level change reaches every module |
| Organs | Suspend non-critical specialist functions during L1 | Non-critical work can be paused |
| Kidneys | Tighten all filters to maximum during L1 | Validation, sanitization, rate limits can tighten |
| Immune | L1 triggers a whole-body posture change; every L1 is logged in immune memory | Anomaly response and a durable incident log |
| Hygiene | Suspended during L1 and L2; required right after resolution | Cleanup and maintenance run after incidents |
| Limbs | Compressed confirmation gate at L1; document every action | Actions pass gates and are logged |
| Senses | Triage classification starts here; senses failure in a crisis is an L2 signal | Inputs classified; input-source failure is visible |
| Cells | Cell failures during L1 route to backup immediately | Bounded units fail over |

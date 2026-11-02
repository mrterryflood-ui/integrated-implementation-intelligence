# IRON-ENG-001 — Evidence-backed engineering acceptance

**Authority:** Dr. Terry Flood, operator directive, November 1, 2026.  
**Version:** 1.0.0.  
**Scope:** Every ISS portfolio platform, repository, build, integration, agent, delegated task, and release. This is a binding acceptance rule, not an optional checklist or an ATLAS-only practice.

## 1. No completion by assertion

A change is not complete because code exists, a request returned HTTP 200, a build passed, a bot posted a comment, a pull request merged, or a hosting service reports READY. Claim only the level supported by receipts: specified, implemented, synthetically tested, independently reviewed, merged, deployed at the exact revision, live exchange witnessed, recipient acknowledged, and outcome verified. These are separate states. A synthetic test never becomes live or field evidence.

Before work, load this rule and the current repository instructions. Record the policy version/digest, exact base revision, task owner, intended end state, allowed changes, exclusions, and acceptance tests. Every delegated agent receives the same contract and returns its own acknowledgment and evidence. A coordinator must reconcile instruction conflicts, overlapping edits and handoffs before integration. A declaration that all agents know the rule is not proof of adoption: maintain repository/agent adoption receipts.

This November 1 instruction supersedes earlier portfolio directions to push incomplete work to main, require Cursor/Bugbot, infer acceptance from a green badge, or leave known material integration gaps while claiming completion. Applicable safety, privacy and legal controls remain in force.

## 2. Trace the complete service before changing it

Map **user and decision → authorized source → interface/contract → validated data → durable record → authorized action → actual recipient → acknowledgment → reported outcome → independently verified outcome**. Identify who, what, when, where, why and how; system owner; data rights; version; device or software dependency; common failure domains; and the exact observable acceptance criterion. Reuse and extend existing systems before inventing another registry, service or dashboard. Exclude unsupported mission expansion.

For every changed requirement, map implementation paths and executable tests. An endpoint declaration is not a configured connection. A configured connection is not evidence that data was exchanged. An API acknowledgment is not human acknowledgment. A recipient's reported completion is not an independently witnessed effect.

## 3. Required engineering checks

The applicable checks below must run against the exact candidate. An inapplicable check requires a scoped rationale and independent reviewer acknowledgment; silence, missing credentials, unavailable tools, or unimplemented functionality are not reasons to mark it not applicable.

| Domain | Required behavior and evidence |
| --- | --- |
| Requirements and scope | End-state traceability; existing-system reuse; named owners; no orphan code or mission creep. |
| Build and types | Reproducible build and zero-error typecheck for touched contracts; baseline defects remain visible, not silently suppressed. |
| Data semantics | Validate schema, units, coordinates, identity, provenance and timestamps; preserve zero versus missing, stale versus fresh, event/forecast versus observation time, and contradictions. |
| Security and privacy | Authentication, current membership, least privilege, resource ownership, tenant isolation, revocation, secret handling, output sanitization and authorized destinations. Test denial paths. |
| Persistence and migrations | Real database/schema parity, transactions, durable audit rows, restart recovery, concurrent writers, partial commits, idempotency, rollback and immutable content binding. In-memory mocks alone cannot establish durability. |
| End-to-end workflow | Exercise actual registered API/UI paths through named-recipient persistence, acknowledgment and explicitly labeled outcomes. No source-save operation implicitly authorizes dispatch. |
| Resilience | Inject primary/alternate failures, stalled connections, stale/malformed responses, duplicate/reordered messages, disconnect/reconnect and recovery. Exercise real switching behavior, not only a dependency graph. Bound timeouts and retries. Shared upstream, power, network or database dependencies remain visible. Reduced fallback coverage is not equivalent service. |
| User interface | Desktop/mobile behavior, accessibility, loading/empty/partial/stale/error/blocked states, request races, browser console errors and displayed provenance. |
| Independent challenge | A distinct reviewer or independently executed audit reviews the exact final SHA, security boundaries and acceptance evidence. Findings are fixed and regression-tested; material unresolved findings block acceptance. The builder's self-check is valuable but not an independent review. |
| Documentation and claims | UI, walkthroughs, PDFs, capability register and demonstrations match tested scope. Render documents, check links and attachments, name limitations. Supplier documentation does not prove platform compatibility. |
| Release and operations | Authorized release, exact-head checks, deployment/environment identity, live health and behavioral probes, migration receipt, rollback/recovery plan and retained evidence. Merge does not prove deployment. |

Tests must include successful operation and expected failure behavior. Report test cases, assertions, modeled combinations, physical trials and production observations separately. Test count alone is not coverage. Replacing an assertion with a weaker one to obtain green status is prohibited; correcting a faulty test requires evidence that the intended requirement is preserved.

## 4. Provider-independent audits; Cursor is not required

Cursor and Cursor Bugbot are no longer required audit providers. Use our own reproducible audit/test jobs, GitHub Actions/security tooling and GitHub review, and Vercel Agent review or deployment/browser verification where configured. A Vercel READY deployment is not a code-review approval. GitHub Copilot/code-scanning features may require repository entitlement and configuration; do not claim they are enabled without checking.

No vendor is a single point of failure for the review process. An unavailable or quota-limited provider may be replaced by a documented equivalent audit with the same scope and exact-revision evidence, not by deleting the requirement. Pending, skipped, neutral, cancelled, failed, timed-out, missing, stale-revision or usage-limited runs are **not successful review evidence**. Previously reported findings remain obligations after a provider is replaced. Do not alter spending limits or subscribe to services without authorization.

## 5. Release gate and evidence contract

Use a reviewed candidate branch. Commit/push to a review branch may be needed to execute CI; it is not production release authorization. Do not merge or promote while required engineering gaps or critical/high-severity defects remain. No force push, weakened branch protection or fabricated checks to obtain acceptance.

Retain a revision-bound record with: requirement IDs; source/changed-file hashes; test commands and tool versions; execution timestamps; environment and fixture/live labels; database and browser receipts; reviewer identity and findings/disposition; documentation hashes; deployment identity; live verification; residual risks; and rollback. Keep credentials, private customer data and authentication state out of artifacts.

The receipt-consistency validator supplied with this policy checks structure, revision and artifact hashes. It **does not independently establish that an artifact's assertions are true**, and is not a substitute for executing tests, collecting CI/hosting receipts or an independent review. Use provider- or runner-collected evidence and configure protected merge/deploy boundaries per repository. Publishing this policy alone does not configure those boundaries.

## 6. Honest status and continuous improvement

Report **Before → Changed → Why → Proof → Limits**. State separately: local code, pushed branch, checks, review, merge, deployed revision, live exchange and operational outcome. Preserve failed attempts and their correction. Turn every material discovered defect into a regression test. No broad “all systems complete,” “plug and play,” “fully redundant,” “field ready” or “everyone notified” claim without corresponding inventory and receipts.

A residual exception must name its owner, risk, scope, expiry and explicit operator approval. It cannot manufacture a pass, waive privacy/safety, or relabel a missing load-bearing requirement as complete. A user-ordered hold remains in effect until its stated acceptance conditions are met.

**Universal end state:** a working, understandable and supportable service whose behavior, boundaries, failure modes and delivered outcomes can be demonstrated with receipts.

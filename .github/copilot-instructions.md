# Copilot instructions for the ISS LLC and TCAF portfolio

Read `/AGENTS.md`, `docs/engineering/IRON-ENG-001.md` (v1.0.0), and the canonical doctrine files before suggesting or changing code. The engineering rule applies to every platform/build and every delegation. The governing objective is useful, sustainable, evidence-backed implementation—not code volume.

- Work from the current default-branch head on one focused branch per purpose.
- Reuse existing contracts, authorization, schemas, generated clients, UI components, evidence controls, and tests before creating anything.
- Preserve ISS LLC, TCAF, customer, tenant, and partner boundaries.
- Never infer production deployment, opportunity eligibility, award, certification, receipt, partner commitment, customer authorization, or outcome from adjacent evidence.
- For consequential behavior, enforce identity, authority, resource, purpose, and time outside the model; fail closed when evidence or authority is missing.
- Every new element needs a purpose, owner, input, output, failure state, consuming journey, test, and rollback.
- Handle loading, empty, partial, stale, blocked, error, and success states honestly. A source failure is not an empty result.
- Keep user-visible language plain. Do not leak internal architecture vocabulary into operational surfaces.
- Add behavioral regression tests for security, privacy, qualification, evidence, and receipt defects. Do not suppress or dilute a failing control.
- A completion claim requires exact revision, checks, independent review, and the correct evidence rung. A merge is not a deployment.
- Exercise real database persistence, migration parity, restart, idempotency, bounded failover and source-to-named-recipient behavior where applicable. A diagram or in-memory test does not prove those behaviors.
- Cursor/Bugbot is not required. Use independently executed internal/GitHub checks and Vercel review where configured. Neutral, skipped, unavailable or stale-revision reviews never count as approval. Retain unresolved findings regardless of provider.
- Carry the policy version/digest and scope into agent handoffs; verify repository adoption instead of claiming all agents are informed.
- Align public pages, rendered PDFs and sent attachments with verified capability. No synthetic-to-live evidence promotion.
- Report `Before → Changed → Why → Proof → Limits` and identify all unresolved consequence gates.

When instructions conflict, preserve the conflict and stop the affected action instead of silently choosing. Human safety, law, privacy, explicit user direction, and bounded authority take precedence.

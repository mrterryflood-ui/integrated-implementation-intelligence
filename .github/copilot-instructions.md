# Copilot instructions for the ISS LLC and TCAF portfolio

Read `/AGENTS.md` and the canonical doctrine files it identifies before suggesting or changing code. The governing objective is useful, sustainable, evidence-backed implementation—not code volume.

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
- Report `Before → Changed → Why → Proof → Limits` and identify all unresolved consequence gates.

When instructions conflict, preserve the conflict and stop the affected action instead of silently choosing. Human safety, law, privacy, explicit user direction, and bounded authority take precedence.

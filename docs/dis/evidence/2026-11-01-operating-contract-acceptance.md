# DIS operating contract: implementation and acceptance ledger

Triage: **L3 YELLOW — material, reproducible integrity defects; service stable.** Evidence: inspected repository code, executable regression reproductions, independent agent review, and actual browser interactions. Confidence: high for the bounded behaviors tested. Limits: no verified clinical, organizational, financial, or community outcome; no new human expert participation; private production identity and tenant acceptance remain separate gates. This code-defect classification does not diagnose a monitored real-world condition from a short observation window.

## Scope and environment

- Owner of consequential release and external decisions: Dr. Terry D. Flood. Implementation and independent verification were delegated within his request to execute the next DIS steps.
- Repository: `mrterryflood-ui/integrated-implementation-intelligence`; existing PR #39, branch `feat/enterprise-stakeholder-delivery-standard-20261101`.
- Inspected starting head: `5ca608748bb1aed6dbaddafccb3bd73b0587fd89`; main at inspection: `bec5f443faf78153ce162d04f446756ad1d7aa5e`.
- Reused: council engine and provider boundary, evidence snapshots, consultation editor, existing save/export routes, release/identity gates, and existing CI. No new service, database, credential, private-data connector, or scheduler.
- Production targets to verify after merge: Vercel `dis-authenticated-platform` (`dynamicintel.io`) and `dis-council-foundation`. A successful preview or merge alone is not a production receipt.
- Separate open work inspected: PR #38 source-first owned-platform inspection and PR #6 Lunar Sentinel. Their changes are not silently included in this candidate.

## Material changes

| Before | Changed | Why | Proof | Limits |
| --- | --- | --- | --- | --- |
| The repaired source-existence validator still accepted empty/ambiguous receipts, missing required disciplines, or unreviewed deliverables with execution/outcome flags. | Require canonical unique IDs, origin, revision, claim text, required review coverage, reviewer identity for claimed human review, and completed artifact review before execution readiness. Preserve separate execution blockers. | A supplied approval flag must not erase missing evidence or review. | Enterprise acceptance suite: 14 cases, including empty/duplicate receipts and false outcome claims. | Metadata validation cannot authenticate a receipt or authorize an action. |
| UX acceptance could waive every pillar, accept whitespace as proof, or claim anonymous human expertise. | Require actual passing coverage for mandatory product, engineering, security, and legal pillars; justify individual exceptions; validate substantive evidence and reviewer identity. | A checklist should expose omitted review instead of certifying it. | Stakeholder UX suite: 11 cases, including all-N/A and whitespace attacks. | These tests do not replace independent human UX, legal, or security review. |
| The canonical operating contract was a repository instruction but was not bound at the analytical council inference boundary. | Generate a byte-checked runtime copy from the canonical document; attach it to council execution, bounded repairs, and provider inference. Return the document version and SHA-256 with `behaviorVerified:false`. | Actual instruction transport can be tested separately from model compliance. | Capture all council prompt strands and repair calls; capture the actual provider request builder; reject generated-contract drift in CI. | An unchanged fixed provider diagnostic probe is outside the analytical council scope. No claim of adoption by unrelated agents or conversations. |
| Ordinary council output had no shared engagement acceptance assessment carried into the stakeholder deliverable. | Assess server-produced sources, simulated lenses, review gaps, and next actions; display these in council views and retain them in the consultation package and Word report. | Discovery excerpts must not appear to establish inspected primary evidence, authorization, or measured effect. | VA, Dartmouth, Manor, and Hutto synthetic scenarios remain non-executable/unmeasured; actual DOCX contents retain the limits. Client-supplied readiness/evidence is rejected by the API boundary. | Scholarly discovery stays `SECONDARY_ONLY`; platform excerpts stay `UNVERIFIED`. Human approval remains false in generated assessments. |
| Export normalization could renumber source records; retained slides could be rebound to a different study when a fresh search reused S1; Markdown bypassed citation validation. | Preserve source IDs; reject malformed/duplicate registers and unknown citations in Markdown, DOCX, and PPTX. Retain the original register for existing slides/documents; put the fresh council register only in its explicitly scoped annex. Show editable source references and the matching source list. | Citation existence is insufficient if an identifier changes meaning between generation, editing, saving, and export. | Independent old-clinic-S1/new-astronomy-S1 reproduction; actual Markdown and DOCX source bindings; direct Office serializer rejection of S999; source-free original remains source-free. | Presence in a register does not establish claim support. User-edited document prose remains a draft requiring review. |
| Tablet navigation overflowed an 810 px viewport to 920 px; pre-initialization iPhone input could disappear and prevent planning. | Allow natural navigation wrapping. Disable consultation controls until the editor can retain input, with an accessible loading message. Keep individual authentication and consent disables. | A visible input must not accept text that initialization subsequently erases. | Delayed-script browser test; immediate-entry planning journey; desktop, phone, and tablet viewport checks. | Browser emulation is not a usability study with representative stakeholders or assistive-technology users. |

## Canonical instruction receipt

- Source: `docs/dis/GPT-SESSION-AND-AGENT-OPERATING-CONTRACT.md`
- Version: `2026-11-01`
- SHA-256: `928a571c0b5a9105b4ba0d6e5317b8d44c4582548cbe98a748529a874adb6daa`
- Public API receipt exposes metadata, not the complete instruction text.
- `inferenceInvocationCount` counts function invocations, including a possible early failure; it does not claim an equal number of completed provider calls.
- Missing sources, unavailable inference, rejected citations, and bounded repair exhaustion do not become accepted evidence or implementation authority.

## Verification and reproducible receipts

The local candidate passed **262/262** behavior tests, a fresh nonincremental TypeScript check, and a production-mode build. These are candidate results, not production acceptance. The exact pushed revision must also pass the required GitHub checks and independent review before merge.

Commands from `apps/dis-platform`:

```sh
npm test
npx tsc --noEmit --incremental false
VERCEL_ENV=production NEXT_TELEMETRY_DISABLED=1 npm run build
node tests/e2e/public-site.mjs
node tests/e2e/ecosystem-planning.mjs
node tests/e2e/operating-contract.mjs
```

The browser scripts run against `DIS_E2E_BASE_URL` and record screenshots and explicit limitations. The existing public suite exercises nine starting points on both Chromium and iPhone WebKit. Ecosystem planning verifies public planning, retained input, consent reset, identity denial, and no partner/model execution on both engines. The new suite exercises keyboard/touch editing, multiple reference IDs, blocked invalid downloads, successful corrected Markdown, and viewport fit on desktop, iPhone, and iPad. Its desktop case holds hydration scripts to verify that initial controls cannot accept text prematurely. A failed browser case records a failure rather than retaining a misleading all-pass partial receipt.

CI uploads `operating-contract-adoption.json` with the four named synthetic scenarios and `operating-contract-browser.json` with device-level observations. The operating-contract document is included in workflow path triggers, and generated-runtime drift fails `npm test`. CI supplies the tested source revision; local receipts explicitly say `LOCAL_UNCOMMITTED` or `LOCAL_WORKING_TREE`.

The independent verifier reproduced source-confusion and export-bypass failures before the fixes, then independently checked actual serialized output after the fixes. Final exact-revision review and CI links belong to the PR record. A production receipt must additionally name deployment ID, environment, status, timestamp, source revision, and observed application behavior. This candidate ledger intentionally does not substitute for that hosting record.

## AIDE boundary observed during this DIS work

Read-only inspection found AIDE-Core still published at `https://umpirecopilotai.com`, Replit deployment `9fa83ffe-9405-4331-a73f-ed6346bf595c`. Repeated implementation-receipt questions returned `busy` and were not submitted or queued. The exact published source revision remains unknown.

At inspected `mrterryflood-ui/VAtool` main revision `4a7d86e5d8ec85aa31a9ad7bd0b503c0f0b24b4d`, an isolated execution of `collaboration-service.ts` produced eight documents with twelve citations absent from its four-source register; an empty register still produced documents. Inspected source SHA-256: `54291efb4dd6ac2586290a79e804c97b3991240efd7605a14452e16f4e20b0f0`. The live story response also differed from the current source's explicit synthetic-story response. This supports an implementation/publication reconciliation gap, not a claim that all requested improvements failed.

AIDE was not changed while its existing implementation agent was busy. Owner/action: the existing Replit implementation agent must return the completed work receipt, exact published revision, and citation-remediation proof; DIS must verify those independently before certifying integration. Synthetic story quantities are not evidence of real-world benefit.

## Continuous improvement, next action, and rollback

- Review date: **2026-11-01**. Evidence-completion rung at candidate recording: executable behavior and browser validation, with deployment, authenticated tenant acceptance, and real stakeholder/outcome validation distinct.
- Existing automation retained: **Portfolio Research and Preparation**, ID `6ae5a266f76c81918571ae9e8c5368b4`, already carries the canonical shared-contract and acceptance instructions. Its latest recorded run was complete; delivery/output were not independently established. No overlapping automation was created.
- Existing daily CI remains the repeatable regression mechanism. Any future contract change must synchronize the generated runtime copy and pass the same source, inference-boundary, export, and browser checks.
- Next release action: obtain exact-head CI and independent review, merge using an expected-head guard under the user's authorized next steps, then inspect hosting receipts and public behavior. Do not widen the private identity gate to make a test pass.
- Remaining acceptance owners: platform identity owner for live sign-in/tenant isolation; relevant human reviewers and stakeholders for source appraisal and usefulness; Replit implementation owner for AIDE publication reconciliation. Named scenario tests are synthetic controls, not completed VA, Dartmouth, Manor, or Hutto engagements.
- Measurement plan: retain observed regression failures and subsequent passes, separately count live provider/partner completion, then collect human usefulness, implementation fidelity, baseline, and outcome receipts within an authorized real engagement. No business, clinical, or community improvement percentage is inferred here.
- Rollback: revert this bounded change through the existing PR/deployment process if candidate or production verification regresses. No schema migration or data transformation is involved. Preserve the earlier fabricated-source rejection and existing identity/consent boundaries when selecting a rollback revision.
- Triage reassessment: independent review found additional reproducible defects, but no evidence of service instability or an actual harmful decision. L3 remained appropriate; broader impact is unknown and must not be invented.

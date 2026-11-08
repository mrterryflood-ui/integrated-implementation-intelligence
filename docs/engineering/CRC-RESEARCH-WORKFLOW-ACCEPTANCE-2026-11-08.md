# CRC research workflow: implementation and acceptance

Date: 2026-11-08. Owner: Terry Flood. Implementation: root and lifecycle capability agent. Independent review: research regression agent and separate organization/export reviewer.

Base: `06f21b4ef5fa3007c22acfaee453f8ee0ef0d452`. Governing engineering rule: IRON-ENG-001 v1.0.0, together with the repository, federated evidence and operating contracts. The final commit, CI run, deployment identity and acceptance receipts must be read together; this document is not a release approval.

## Before and changed behavior

The CRC evidence-to-action page kept study transcriptions, counterfactual inputs, strategy receipts and selected mechanisms only in local component state. The private case save retained the curated baseline and a manually copied supplement. A saved case had no research-editor resume path. Organization planning had no exact-version case handoff, and readable exports selected planning sections without a research appendix.

The existing case and organization services now carry that work through one connected path. No new datastore, clinical engine, identity provider or paid inference step was introduced.

1. **Define the project.** Retain problem, setting, population, time zero, intended pathway, observed operations, patient/family/community experience, design, justification, selected CFIR/RE-AIM roles, comparison, outcomes, harms, sustainment and funding questions. Empty fields remain open questions.
2. **Retain the investigation.** Preserve search text and the separate query that produced the retained metadata, discovery leads, selected mechanisms, study JSON, counterfactual JSON, selected correction, receipt and sourced supplement. Incomplete study/panel/receipt JSON can remain a working draft; it does not become a passing check. The structured supplement must validate before saving.
3. **Save privately.** A typed input contract is checked on the server. The server constructs a new report from the registered CRC source layer. The existing case and dated baseline are inserted atomically. Operator confirmation is a declaration; the complete record is not labeled privacy-certified or patient-data-free.
4. **Resume and revise.** Reopen from the saved case. Use its retained sources rather than substituting current bundled values. Explicitly save an exact-version revision; the prior complete report is archived atomically and the current action plan remains intact. A prior Council interpretation is retained in history rather than presented as if it assessed changed inputs. Original JSONB source numbers are copied in the database without a JavaScript precision round trip.
5. **Recover.** The existing archived-assessment restoration path can restore the prior research revision as another journaled version. Stale versions, other tenants and another case's events remain denied.
6. **Continue in planning.** After saving action-plan edits, choose an organization and explicitly confirm the complete public/synthetic copy. The server checks current membership, case/workspace ownership and the exact case version. It creates or reuses an author-owned private draft with the question, full report, playbook, source identity and content digest. This does not submit, share externally, consent to a model transfer or authorize an intervention.
7. **Export.** The existing JSON, Markdown and Word routes retain the frozen research snapshot. Readable exports include the lifecycle narrative, inputs, source provenance, recorded actions and learning. Subsequent submissions and reconciliations retain their source chain. A withdrawn source blocks dependent export.

## Evidence and authorization boundaries

The CRC pilot remains a calibration case. Source-matched descriptive results, source comparisons, candidate mechanisms, design checks, reported implementation delivery, and independently verified beneficiary outcomes are separate states. A complete workflow, matching fingerprint or passing arithmetic check establishes no causal effect or clinical benefit.

Legacy research-create requests must match the complete registered source contract; changing the outer schema/state markers cannot bypass admission. Supplied verification/authorization changes, unsupported identifiers, duplicated source IDs and credential-bearing URLs are rejected. Typed requests accept workflow inputs and references rather than an arbitrary replacement report. Every edit clears the browser's public/synthetic confirmation.

The existing bounds remain: 128,000 report characters and 1 MiB case transport. Workflow inputs additionally have an 80,000-character bound. Oversized saves fail visibly without truncating the editor or changing the stored case. Authenticated identity and deployed database behavior still require live acceptance separately from synthetic tests.

## Reproduce the software checks

From `apps/dis-platform`, with the project dependencies installed:

```bash
node scripts/sync-operating-contract.mjs --check
node scripts/sync-federated-standard.mjs --check
node --import tsx --test tests/*.test.ts
node node_modules/typescript/bin/tsc --noEmit --incremental false
NEXT_TELEMETRY_DISABLED=1 VERCEL_ENV=production node node_modules/next/dist/bin/next build --webpack
```

`node --import tsx --test` executes the same files as the npm test script after its two synchronization guards. It avoids a local container restriction on the tsx CLI's IPC listener. The production-mode build intentionally leaves private identity unavailable; it is a public-route build check, not a signed-in acceptance claim.

Focused tests:

```bash
node --import tsx --test tests/research-workflow.test.ts tests/research-case-routes.test.ts
node --import tsx --test tests/research-planning-handoff.test.ts
```

The route tests bundle the registered handlers with explicitly synthetic Clerk identity and a Neon-transport adapter to PGlite. They execute the actual route SQL and RLS, including denial, exact-version conflict, intervening writer, journal failure, source precision, restoration and database close/reopen. Organization tests execute the service, schema, access controls, immutable submission, withdrawal and actual JSON/Markdown/Word export handler. They do not claim a production Clerk or Neon session.

The existing `candidate-browser` CI job builds the exact candidate and runs the existing Chromium/iPhone WebKit journeys plus:

```bash
node tests/e2e/research-workflow.mjs
node tests/e2e/research-planning-handoff.mjs
```

These two new component browser fixtures declare their synthetic HTTP/storage boundaries. They exercise create, reopen, revise, conflict, destination/version confirmation, delayed requests, input preservation and client errors. The existing candidate HTTP journeys separately check the rendered application and unsigned private-route denial. A blocked local browser launch is not reported as a pass.

Pull-request CI may execute GitHub's generated merge revision. Retain that revision and its tree alongside the branch head; a candidate-content claim requires the trees to match. The independent review uses the published branch commit directly.

## Repairs exposed by verification

- Successive conversion of a legacy case could lose older notes; baseline note and source identities are retained across revisions.
- Adding discovery leads could leave a stale source summary or remove a gap cited by an older note; current metadata and historical note references are reconciled explicitly.
- An altered report marker could bypass research admission; structural evidence fields and authority claims now also trigger admission checks.
- Legacy discovery URLs could contain credentials; these are rejected before storage.
- The initial typed create could retain a curated-only privacy label despite operator inputs; it now records an unverified operator declaration.
- An uppercase UUID in a saved-case link passed validation but did not match the database's lowercase response. The editor canonicalizes that identity before its request, response check and component lifetime key; the browser fixture uses a UUID with letters so uppercase acceptance is a real regression check.
- The initial component-browser run could not locate a populated textarea using exact implicit-label text. The fixture now requires the textbox's same exact accessible caption, preserves all state/value assertions, and captures DOM, label associations and runtime errors when a journey fails.
- Submission withdrawal could recompute a digest after JSONB key ordering and violate the immutable submission trigger; withdrawal preserves body, title and digest while changing visibility/version.
- Word could emit invalid XML for admitted Unicode control/noncharacters; presentation escapes are disclosed and leave the stored content, JSON and digest unchanged.
- Rendered Word review found a section heading separated from its content at a page break. All exported headings now explicitly stay with their following content, with a handler-level paragraph-property regression check.
- The same review found an empty trailing source heading for records with no linked organizational sources. Readable exports now state that absence explicitly; linked-source exports retain their content without the empty-state notice.
- Seven existing Next route modules exported non-route helpers. Those helpers moved to adjacent modules. Independent source/AST comparison found all moved declarations and HTTP handler bodies unchanged; tests import the helper modules without weakening assertions.

## Acceptance and rollback

Local build/type/unit/database results are development evidence. Required final gates are exact-commit independent review, CI browser results, deployed revision identity, and a witnessed authorized signed-in create/reopen/revise/restore/planning/export journey. Keep missing live evidence visible. Do not merge or promote over unresolved required engineering gaps.

The change needs no database migration and preserves the existing case, event and organization tables. Rollback is a revert of this candidate's code commits; retain saved records and journal history. Older code can retain the optional workflow/snapshot data in JSON but will not expose the new editors or readable appendix. Do not delete those records to roll back the interface.

This milestone does not complete automated evidence-based intervention synthesis across diseases, scientific design adjudication, authorized field execution, clinical outcome validation, or an empirical demonstration of a three-hour end-to-end research-to-implementation cycle. Those require their own acceptance cases. General problem intake, including vaping, remains a product requirement; the CRC contract does not silently relabel other diseases as CRC.

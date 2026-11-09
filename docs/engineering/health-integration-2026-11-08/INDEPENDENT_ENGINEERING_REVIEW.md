# Independent engineering review — DIS integration and RPLICE comparator binding

## Current disposition — November9 correction verified

**ALLOW scoped engineering integration at1969e2e7af73f8ba65ab48fe1e761a1a9f4222b0.** The independently reproduced DIS-IR-01 defect and associated formatting-related recovery limitation are now FIX VERIFIED. The six-file correction passed33 independently rerun route/recovery tests,35 new adversarial controls, and an independent zero-error TypeScript check. See FINAL_CORRECTION_REVIEW.md and final-delta-review-receipt.json for exact scope and evidence. Production deployment, live authenticated interoperability and human scientific/clinical acceptance remain separate. A fresh provider read also confirms RPLICE PR118 merged at8e9500ad49f4d0599782bf773a4c31300da8b27e; deployment is not inferred.

The remainder of this document is the retained original review of039761a706534e8d21ffdbe71c616646ee9ef539. Its defect finding and historical hold are preserved as the before-state; the final correction review supersedes that hold for the exact corrected revision.

Triage: L4 planned engineering review; one material, stable persistence defect found. Evidence: exact source diff, independent executable fixture, local PostgreSQL-compatible tests, and GitHub Actions receipts. Confidence: high for the bounded findings. This is an AI engineering review, not human scientific or clinical approval.

## Disposition

- **DIS candidate: RECONCILE / HOLD engineering acceptance pending correction and final-SHA review.** The new research revision route rejects some reports that the same workflow successfully admits. The lead was notified and is preparing the correction. This report does not cover that later correction.
- **RPLICE PR118: ALLOW the narrow stateless comparator-binding correction from an engineering perspective at the exact reviewed head**, subject to the repository's actual required merge/release gates and owner authority. It is still draft/open in the observed provider state. No merge, push, external comment or deployment was performed.
- **Clinical implementation acceptance: not established by this review.** Independent qualified scientific/clinical review, actual authorized end-to-end exchange, production identity/persistence proof and beneficiary outcome evidence retain their separate gates.

## Exact scope

DIS repository: local isolated checkout /workspace/scratch/ad20f6f1a514/dis-integration. Base 06f21b4ef5fa3007c22acfaee453f8ee0ef0d452. Reviewed integrated head 039761a706534e8d21ffdbe71c616646ee9ef539. The total change contains 137 files. This bounded core audit concentrated on research create/revise/admission, saved source fidelity, task guidance/completion, append-only history, atomic SQL and version conflicts, organization planning copy/export, bounded transport, and the moved API helper boundaries. It is not a line-by-line scientific audit of every research narrative or analysis.

RPLICE repository: ISS-LLC22/bettersciencelab, PR118. Base 008c867ab5ea36b475263d967f6a917a112b5e77; exact reviewed head c052856141f74ab09dfc91f7d358ebdc19f0378c. All three changed files and the full stateless implementation were inspected. Retrieved source file Git blob ca238c69b8c53e1862be0dcc142dd2c6ed178150 was independently reproduced byte-for-byte before final controls. SHA-256 d470a5c656621fd51318fb0e9b3df1e6cfd6e0719c078ca3ef004754a847ce5a.

Review owner: delegated /root/integration_review. Authorized activity: read-only provider access and local independent tests/receipts; no source edits in the target repository. Parent retains integration decisions.

## Finding DIS-IR-01 — accepted report cannot subsequently be revised

Severity: material functional defect; blocks calling the research save/revise lifecycle complete.

Affected candidate: apps/dis-platform/app/api/cases/route.ts, original lines67–69. The create path admits a report using the compact JSON character limit of128000. The new revision path compares PostgreSQL's formatted JSONB text against the same128000-character boundary before returning the source. PostgreSQL adds legitimate formatting, so an admitted record can become uneditable even when the requested revision would make it smaller.

Independent exact fixture:

| Quantity | Result |
|---|---:|
| Workflow narrative fields |15 fields, each2400 characters|
| studyText |25000 characters|
| counterfactualText |3941 characters|
| Compact workflow |65518 characters|
| Compact report admitted by buildResearchWorkflowCase |128000 characters|
| PostgreSQL-compatible stored report text |130274 characters|
| Stored report UTF-8 bytes |130332 bytes|
| Original new revision source predicate |false|

The full typed workflow validates, the full report serializes without truncation, and PGlite executes the actual JSONB formatting expression. The new predicate therefore returns NULL, making the registered handler return413 before it can apply a smaller edit. This reproduction is independent of the existing route-suite success.

Corrective requirement: distinguish bounded stored JSONB transport capacity from submitted compact-content capacity; preserve exact stored source content and test actual registered create → shrink revision → journal/reload. Retain denial of truly oversized legacy records and preserve no-truncation behavior. Owner: root integration lead. Closure: fix committed, real route regression passes, final changed SHA independently checked.

Retained files: reproduce-report-capacity.cjs, near-limit-workflow.json, near-limit-report.json, capacity-finding.json.

Fixture workflow SHA-256:76ef38befefb27ab7530d66b83524235e9d87925ddbd008f25744b390f71916f.
Fixture report SHA-256:7e31b174d4b8e38a39f757e240f09886004d7cbfcff87389d67e19b297849936.

## Related inherited recovery limitation

apps/dis-platform/lib/case-assessment-recovery.ts already rejects archived report_text longer than128000 before parsing. Its comment explicitly acknowledges conservative exclusions due to JSONB spacing; this check existed at the base revision. The same near-limit report could therefore be preserved in history but refused for restoration after another revision. This was reported to the lead as an inherited affected limitation, not represented as a new regression.

The pre-parse check also protects against giant JSON numeric tokens shrinking to Infinity/null during JavaScript parsing. Any correction must preserve that protection, for example by measuring a token-preserving compact representation outside quoted strings, rather than simply parsing and reserializing. Until separately verified, a successful edit fix does not establish restoration at every admitted size boundary.

## Executed DIS checks

Command from apps/dis-platform:

node --import tsx --test tests/research-task-guidance.test.ts tests/research-workflow.test.ts tests/research-case-routes.test.ts tests/research-planning-handoff.test.ts tests/case-payload-capacity.test.ts tests/bounded-json-request.test.ts

Result:62 tests passed;0 failed;0 skipped. Receipt: dis-targeted-test-output.txt. The registered case and organization/export handlers execute against PGlite with synthetic Clerk identity and Neon transport replacements, not against production credentials. Meaningful covered boundaries include foreign owner/workspace, origin, stale version, concurrent writer, forged report authority, discovery identity, atomic journal failure, database close/reopen, task completion reset, private planning snapshots, revoked membership, withdrawn source exports, and Word presentation without changing retained source.

Initial tsx CLI invocation failed before tests because this environment denied creation of its /tmp IPC socket (EPERM). Running Node with the tsx import hook exercised the same tests without that unnecessary CLI socket. This was an environment correction, not a weakened test.

Static observations support preservation of source/evidence/clinical authority: typed research creates are reconstructed server-side; research revisions copy unchanged source portions directly from JSONB and journal the full predecessor; user inputs do not set causalEffectEstablished, independentOutcomeVerified, interventionAuthorized or externalCommunicationAuthorized true; changed task title/rationale/acceptance evidence resets completion server-side and retains old/new plans. A checkbox remains reported completion, not verified benefit. Organization handoff uses owner predicates and existing RLS, exact case version, explicit aggregate declaration, a frozen digest-bound copy, and existing submission controls.

A separate git diff --check found one nonblocking formatting issue: the newly extracted attachment-filename.ts has a blank line at EOF. No code defect is inferred from this.

## RPLICE PR118 result and limits

The added binding applies to US23 numeric claims, including descriptive claims. It matches the retained endpoint, difference and interval, then requires an explicitly registered comparator alias. It preserves the0.4pp null-compatible descriptive contrast while continuing to reject NO_EFFECT/equivalence inference. The source registry and other-study numerical behavior remain available. The patch changes no authentication, persistent state, external transport or clinical action path.

Independent final control execution:12/12 passed on the verified exact source blob. Controls include source-matched usual care, wrong comparator, descriptive relabeling, null-compatible component contrast, false equivalence, wrong clinical endpoint, self-declared independent review, malformed and invented numerics, negated comparator, allowed punctuation alias, and NC24 non-regression. Every returned scientific/clinical authority flag checked remained false. Receipts: rplice-independent-controls.cjs and rplice-independent-controls.json.

Provider evidence: GitHub Actions run42513552327, CI run275, returned by commit-associated workflow lookup for c052856141f74ab09dfc91f7d358ebdc19f0378c, completed success. Quality job128831566062 completed success. Its successful steps include Unit tests, Production bundle boot smoke, Knowledge compiler drift, Integration audit (blocking), W1 tier honesty audit, and Typecheck ratchet. The legacy combined-status list was empty, not treated as a pass. A typecheck ratchet is not evidence of zero pre-existing whole-repository type errors. Receipt: rplice-ci-evidence.json.

The comparator aliases are intentionally conservative and may reject equivalent unfamiliar wording; the disposition requires review rather than guessed equivalence. The patch does not validate every study comparator, target population, timing, intervention composition, clinical transportability, or original publisher authenticity. This reviewer did not independently re-extract the clinical paper or inspect the deployed endpoint. Human scientific/clinical approval, method superiority, live RPLICE exchange and production deployment are not claimed. Cursor summary language was not used as proof of independent review.

## Loaded operating contracts and digests

| File | Version where declared | SHA-256 |
|---|---|---|
|DIS AGENTS.md|repository contract|cde8a90b65600b16855225f9ad6c1f8e3c222e0bb2c5828e3dca067153f1220a|
|IRON-ENG-001.md|1.0.0|60301dc8d8dd2443443e7afdffd8f1c33e199309668e7e8e6ebdc77932ac4c8b|
|GPT-SESSION-AND-AGENT-OPERATING-CONTRACT.md|2026-11-05.1|ba23c2eb994edd6d9d5cca31355dda33d7b31ab2bea4e21ccf34ce870dd68d2c|
|PLATFORM-STAKEHOLDER-ASSURANCE-STANDARD.md|1.1|a078c8734d61be967c8365d7811be76933ced690ab0140c5958914f3d8a463af|
|STACK-AGNOSTIC-ENGINEERING-INQUIRY-PROTOCOL.md|0.1.0|ef8d29fae8a3c07efe445d482e3b833b5a9bd0a7d7f0c3b8de2d653532e78b73|
|FEDERATED-EVIDENCE-AND-DECISION-STANDARD.md|loaded repository version|ea45285f6209a15041154bcd6d24478a3750fc2f02635bfa62afb76dcfe744e1|
|RPLICE AGENTS.md|exact PR head|17eb022b0008fedf76f78ffa827d6f8e4db719b3b9416edea915ecf730ee451b|

RPLICE unified-workspace-skills-briefing.md was also retrieved and read at the same commit; provider Git blob62aea866f8a98ed6967dcdf53ef4abb4b81d26a9. The larger DIS platform doctrine and enterprise records were inspected in bounded extracts; no complete read of those long records is claimed. No target source mutation was made by this reviewer.

## Review boundary and next handoff

The passing targeted checks are bounded local engineering evidence. They do not substitute for the lead's full-candidate build/typecheck, final-SHA CI, desktop/mobile browser acceptance, actual deployed identity/schema/RLS, network fault exercise or human stakeholder evaluation. Independent source/denominator adjudication belongs to its separate research arm. The lead should reconcile the defect and inherited recovery limit, then request a short second review of the exact committed delta. No acceptance in this report automatically transfers to a later revision.


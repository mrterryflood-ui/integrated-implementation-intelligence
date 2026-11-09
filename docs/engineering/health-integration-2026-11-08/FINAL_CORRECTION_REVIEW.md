# Final correction review — DIS-IR-01

Triage: L4 engineering verification. Reviewer: /root/integration_review, independent AI reviewer. Date:2026-11-09. This is scoped engineering acceptance, not human scientific or clinical approval.

## Disposition: ALLOW at the exact reviewed revision

**DIS-IR-01 is FIX VERIFIED at 1969e2e7af73f8ba65ab48fe1e761a1a9f4222b0.** The associated inherited formatting-related recovery limitation is also closed for the tested admitted-report boundary. This disposition supersedes the hold in the earlier review of039761a706534e8d21ffdbe71c616646ee9ef539. It applies to the bounded code integration and the six-file correction, with the broader release and clinical limitations below.

The exact head was independently checked before and after execution. Its tracked working tree was clean. The six-file diff contains the expected stored-size constant, case revision predicate, recovery token-length scanner, two test-file extensions, and removal of the previously reported blank EOF line. No unrelated behavior change or weakened identity/authority boundary was found. git diff --check passed.

## What changed and why it closes the defect

The research revision route now compares PostgreSQL's stored UTF-8 representation against a separate512000-byte ceiling. Submitted and revised reports still pass the existing128000-character compact serialization limit. That preserves bounded reads without rejecting a legitimate report solely because JSONB added spaces or UTF-8 uses multiple bytes per character.

Recovery now scans the retained text before parsing and counts every character inside strings and every nonformatting character outside strings. It excludes only the four JSON whitespace characters outside quoted strings. The scanner tracks escaped quotes and backslashes. Consequently, evidence whitespace remains evidence, and long numeric tokens cannot evade the limit by becoming Infinity/null during JavaScript parsing. The original source continues to be restored directly by SQL; the validator's parse is not substituted for the archived JSONB.

The tested edit and recovery paths retain the full prior report, version conflict protection, current playbook, append-only events, source precision, identity/RLS checks, and false scientific/clinical authority flags. A new oversized stored-wrapper denial test establishes that the larger storage allowance is still bounded.

## Independently executed evidence

| Check | Result | Scope |
|---|---|---|
|Recovery and registered research route tests|33 passed;0 failed;0 skipped|Actual handlers and SQL with PGlite; synthetic identity and transport|
|New independent adversarial controls|35 passed|String/escape/token/byte boundaries plus original saved reproducer|
|TypeScript|Exit0, no diagnostics|node node_modules/typescript/bin/tsc --noEmit --incremental false|
|Diff whitespace check|Exit0|Six-file correction against039761a7|
|Head and tracked source integrity|Confirmed before/after|1969e2e7af73f8ba65ab48fe1e761a1a9f4222b0|

The registered route regression saves at the exact compact boundary, checks that stored JSONB text is larger, saves a smaller valid revision, verifies the exact predecessor journal, reloads the case, restores the earlier revision, and compares the complete database JSONB text with the original. It also confirms the current playbook remains unchanged. Existing failure-injection, tenant denial, stale update, history integrity and database-restart checks passed in the same independent run.

The independent35-control script adds twelve distinct quoted-string suffix families at the exact boundary and one character over it: spaces, quotes, different backslash/quote sequences, escaped line breaks/tabs, JSON-looking text, three-byte Unicode, an astral Unicode character, Unicode separators, and literal Unicode escape syntax. Additional controls reject giant integer and exponent tokens, raw Unicode escapes that would shrink on parsing, invalid JSON whitespace, trailing commas, unterminated strings, mismatched byte receipts, and over-limit current records. A512000-byte padded valid object passes and a512001-byte equivalent fails. These are validator controls; padding is not asserted to be PostgreSQL's canonical output.

The original near-limit-report.json was checked against SHA-2567e31b174d4b8e38a39f757e240f09886004d7cbfcff87389d67e19b297849936, converted by PGlite to its real JSONB representation, and accepted by the corrected recovery preflight. Its original compact128000-character versus stored130274-character/130332-byte mismatch therefore no longer causes the reported recovery rejection.

Evidence files:

- final-delta-route-tests.txt
- final-delta-adversarial.cjs
- final-delta-adversarial-results.json
- final-delta-review-receipt.json
- final-delta-source-manifest.json

## Lead-supplied evidence independently inspected

The retained report-capacity-before.log shows the added registered route regression failing with413 rather than200 before the correction. The platform-tests-final.log reports757 passed,0 failed,0 skipped. The build-final.log reports successful production compilation, TypeScript completion, static generation and route generation. These logs were inspected as lead-executed evidence; this reviewer did not rerun the full757-test suite or production build. The empty typecheck-final.log alone is not used as proof: this reviewer independently executed TypeScript and observed exit0.

The six operating-contract SHA-256 values in the original review were rechecked and remain unchanged. Applicable IRON engineering, stakeholder, operating, inquiry and evidence authority boundaries therefore remain in force.

## RPLICE provider status

A fresh independent GitHub read confirms PR118 is merged, no longer draft, with unchanged reviewed head c052856141f74ab09dfc91f7d358ebdc19f0378c. Provider merge commit:8e9500ad49f4d0599782bf773a4c31300da8b27e; merged_at2026-11-08T23:59:41Z. This confirms merge status only. It does not establish a deployed revision or live endpoint behavior. The earlier scoped engineering review and12-control source-bound execution retain their original limits.

## Acceptance limits and handoff

No material unresolved finding remains in this correction's reviewed scope. Source edits, pushes and merges were not performed by this reviewer. The target repository's only untracked artifacts observed were dependency/build/test products; none were interpreted as committed source.

Local PGlite and synthetic identity/transport establish bounded behavior, not production Clerk/Neon configuration, production recovery, actual tenant session revocation, deployment or authenticated DIS–RPLICE exchange. No new UI is added by this delta, so independent browser repetition was not needed to adjudicate this server-side capacity defect; the integrated release's existing desktop/mobile acceptance obligation remains separate. The review does not validate every scientific assertion, source denominator, clinical pathway, human stakeholder decision or beneficiary outcome.

The independent clinical/decision-study arm can now evaluate the candidate without treating this engineering defect as open. Its scientific, clinical, operational and deployment gates remain its own decisions. Any later source change requires review proportional to that delta.


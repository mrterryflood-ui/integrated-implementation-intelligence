# Cycle 3 research-software reconciliation — 2026-11-08

## Scope
Research-only candidate based on PR85 head 5fd243d745f19486d34955c6e36fbad4779cfdd9. No application, production, authentication, clinical data, judge-reserved contents or clinical-effect promotion. This does not resolve PR86's scientific-document conflicts or authorize a merge to main.

## Executed corrections
1. Added claim_context_guard.py and 19 portable software-only regression tests. A source-bound local Cycle2 consumer reproduced six wrong-context acceptances (population, endpoint, design, outcome stage, analysis, interpretation) before repair and rejected them after full context binding. The expected transcription must be trusted and version-pinned; this function cannot authenticate publications or reviewers.
2. Reused PR86's exact intelligence_contract.py blob 1668f2a004cf11ae88ce29f3425f0e05afa95ead, audit_archived_registry_instruments.py blob 0c2d3360719312238be8b4a0c98594144c105547, updated test_execution_batch.py fixture and test_review_metadata_contract.py. Local reconstructed current source matched Git blob IDs before editing. Patched module bytes exactly matched the PR86 blobs before insertion into this candidate.
3. The current and older research test_execution_batch.py blobs both equal 391d5ca623a395af4d1a211090cb657a20ddf9ff; carrying forward PR86's one timestamp-fixture change does not discard a newer fixture edit.

## Local proof and limits
The delivered research overlay passed 71 tests in normal and optimized Python, both with a portable software fixture and with the byte-verified original allocation supplied privately. These are the same test methods in different execution modes, not additive tests or independent clinical observations. A separate 12-test local reconciliation suite passed normal/optimized, preserving finite zero/negative/null metadata and rejecting invalid review dates. Source reconstruction and patch identity receipts are retained in the execution package.

A deliberately fabricated archive was rejected by old code normally but accepted under python -O. The exact PR86 repair rejected it in both modes. The genuine private source archive was NOT replayed in this execution; prior genuine-archive receipts remain historical. No private baseline, archive or reserved case contents are committed here.

The complete repository suite and exact-head hosted CI must be evaluated separately. Local overlay counts are not hosted CI counts. Scientific acceptance, caller integration into production, authenticated remote RPLICE exchange, source adjudication and clinical effectiveness remain separate requirements.

## Reproduction
From research/fragmentation-harm: python -m unittest test_claim_context_guard test_review_metadata_contract -v; repeat with python -O. Run the repository's full research and engineering workflows on this exact candidate. Supply authorized private archives locally to eliminate archive-dependent skips; do not publish them or claim skipped tests passed.

## Remaining reconciliation
Preserve PR85's newer source/mission documents, PR86's independent scientific exceptions, PR87's lifecycle ownership and RPLICE PR118's comparator binding. A newer private lifecycle witness supersedes the stale pending-authentication narrative, but task-text reconciliation remains open; no private record identifiers are repeated here. Canonical integration and release belong to the designated reconciler after exact-version review.

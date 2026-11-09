# Final nonapplication delta review

Triage: L4. Independent AI engineering review, 2026-11-09T00:09:50Z. Scope: application-code identity, research CI discovery, and the concurrent VA-comparator documentation merge. No target source edits, provider writes or repeated application suite execution.

## Disposition

**ALLOW the inspected workflow/documentation delta for integration, with final publication identity still to be bound.** No application-code drift or CI gate weakening was found. This extends the preceding scoped engineering review; it does not confer clinical/scientific acceptance of the separately reviewed evidence and pathway documents.

The current local committed head is bb57033458b7e1555fbb2d0715b28e297b75d272, tree810cdd7964b73de1c03c950f31ab06542188aa32. The workflow edit and additional evidence/clinical files were still uncommitted at inspection. That HEAD tree must therefore not be described as the complete final publication tree.

## Application code identity

git diff --exit-code 1969e2e7af73f8ba65ab48fe1e761a1a9f4222b0 -- apps/dis-platform apps/dis-web exited 0 against the working tree.

The complete committed apps subtree is identical at the previously accepted 1969e2e7af73f8ba65ab48fe1e761a1a9f4222b0 and current bb57033458b7e1555fbb2d0715b28e297b75d272:

**apps tree: d00e0cb4f49b435066dfbe3f115aa32f7cee402b.**

Untracked application-area entries were generated .next, next-env.d.ts, node_modules and tsconfig.tsbuildinfo artifacts. These were not treated as source and should remain outside the publication manifest. No application suite was rerun because there is no reviewed application-source delta.

## Research workflow change

.github/workflows/research-fragmentation-contract.yml adds one step:

python -m unittest discover -s research/fragmentation-harm/denominator_adjudication -p "test_*.py" -v

The new step discovers the nested adjudication tests explicitly. Existing source-contract validation, root regression command, pull-request/main-push path triggers, Ubuntu runner, Python 3.11 selection and read-only contents permissions remain intact. No continue-on-error, condition bypass, reduced trigger or removed assertion was introduced. git diff --check passed.

The exact command executed locally under Python 3.12.14 with no DIS_NCI_ARCHIVE_PATH:

- 13 tests discovered.
- 8 source-independent invariant tests passed.
- 5 original-archive tests explicitly skipped with the reason that the original archive is required.
- Exit 0.

This agrees with the step's explicit name: “Independent denominator invariants (archive replay is a separate source-dependent gate).” The ordinary CI step does not establish 13 successful original-source tests and must not be described that way. Archive replay remains a separate gate with its own original-archive receipt. The lead reports separate 13-test execution with the real archive; this quick CI review did not repeat that source-dependent execution.

The test module imports its colocated standard-library-only adjudication code correctly through unittest discovery. The explicit nested start directory avoids relying on recursive discovery into an un-packaged subdirectory. The source-dependent checks bind the archive checksum and manifest, reject altered bytes, verify original HTML/CSV county cells, preserve suppression/selection, and compare against a pinned implementation. This paragraph describes inspected test logic, not a new execution of those five skipped checks.

Receipt: nonapplication-ci-command-output.txt.

## Concurrent PR88 documentation update

The incoming 37acf4bd→fdcaaba15eaa3f6d074f1de5cd4a3b9dd40913bd change affects one file only:

research/fragmentation-harm/HEALTH_IS_WEALTH_CROSS_SYSTEM_RESEARCH_PROTOCOL_2026-11-08.md

The reviewed patch adds 14 lines and replaces 1 existing line, and its source commit is an ancestor of current local HEAD. No code, request contract, database operation or authorization flag changed.

The clarification explicitly separates VA eligibility, overlapping coverage combinations, payer at the event/claim, and provider setting. It labels published coverage percentages as descriptive, states that categories overlap, distinguishes the arithmetic subgroup difference from an independently established interaction effect, and retains no clinical outcome/facility-ranking/DIS-benefit claim. No new operational authority is asserted. Numerical source extraction and clinical applicability remain with the separate independent scientific/clinical review; this lane does not certify the cited VA numbers or articles.

## Inspected content identities

|Path|SHA-256|
|---|---|
|.github/workflows/research-fragmentation-contract.yml|9cdde5e2abfb202867d654195a15bdc19352e038fb821727a4700b150d067c4b|
|research/fragmentation-harm/HEALTH_IS_WEALTH_CROSS_SYSTEM_RESEARCH_PROTOCOL_2026-11-08.md|08b273a8090c10a8974710f7f7cefb93b263a5368f561c9833d141b502d05752|
|research/fragmentation-harm/denominator_adjudication/test_adjudicate_denominators.py|e4907bf374457518ee00c7895ea177e8cb10aa821c1f0060f515a973042777c6|
|research/fragmentation-harm/denominator_adjudication/adjudicate_denominators.py|154e350375d190efc295730cfe2f1b095b5eb9412b741787000ae4184802a1ba|

The adjudication implementation hash identifies the dependency inspected for CI portability; it is not a claim of a fresh full 605-line scientific audit. The lead's full review, independent parser, original archive replay and 31-file evidence manifest belong in the final combined receipt.

## Bind the connector publication to the reviewed candidate

1. Freeze the complete intended publication manifest after the clinical/evidence lane finishes. Include the inspected workflow and denominator test package; exclude generated build/dependency files. Record the final full local Git tree SHA and the apps subtree SHA.
2. Publish through the authorized connector, then retrieve the resulting commit's full SHA, parent(s), complete Git tree SHA and branch head. Keep the provider receipt and expected prior head; do not equate successful upload with merge or deployment.
3. Require the provider tree SHA to equal the frozen reviewed local tree SHA. Confirm apps subtree d00e0cb4f49b435066dfbe3f115aa32f7cee402b and the above reviewed file hashes. If the connector creates a different commit identity with the same tree, explicitly bind the prior source review to that identical content tree. If any tree content differs, inspect that delta before acceptance.
4. Attach exact-published-commit CI evidence and the distinct scientific/clinical review dispositions to the final receipt. Keep archive-dependent proof separate from the five ordinary-CI skips. A published or merged commit does not establish deployed revision, clinical authority, or patient benefit.

Final publication and exact provider-tree equality have not yet been observed by this reviewer. This report supplies the prepublication scope and concrete binding requirement, not a fabricated publication receipt.


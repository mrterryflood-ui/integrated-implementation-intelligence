# Concurrent PR89 reconciliation

Independent AI engineering review, 2026-11-09T00:26:52Z. Scope: preserve useful concurrent work without duplicating a production correction or weakening the accepted recovery behavior.

## Disposition

**ALLOW integrating PR89's unchanged regression test and preserving its ancestry. Retain the candidate's current production route, capacity semantics, and additional recovery fix.** Bind the resulting new application/full trees and run CI for the new published head. No merge or closure was performed by this reviewer.

PR89 at 5f80be44d42133e37f2a31f2b7f83422f8146d04 has three changed paths relative to lifecycle head a15397e74344cbcaaec66e96d781171a34428293. It is open and not merged in the inspected state.

## Production comparison

The route change is byte-identical to the corrected integration candidate: Git blob 3744ab9eee6866dd0224f23654cbb67f5fe33553. Both add CASE_REPORT_MAX_DB_BYTES = CASE_REPORT_MAX_CHARS * 4 and replace the formatted-character read guard with bounded stored UTF-8 bytes. The capacity files differ only in the explanatory comment.

PR89 does not change recovery token validation. The integrated candidate's additional correction counts nonformatting retained JSON tokens before parsing and restores the original archived JSONB. That verified behavior must remain.

There is no unique production behavior or documentation file in PR89 that the existing candidate omits.

## Unique regression contribution

The new 137-line research-report-jsonb-capacity.test.ts is useful distinct evidence: it bundles both the actual current handler and the former predicate in the same test, then compares their behavior on paired ASCII/Unicode near-limit cases. It also verifies predecessor journal content, unchanged playbook/source indicators, false authority flags, owner/origin/stale-version denial, oversized storage denial and unchanged compact admission limits.

Its existing hosted CI is successful in the inspected provider state. That proof applies to PR89's own tree. This reviewer also retrieved the exact test, verified its Git blob and ran it unchanged against the current integrated candidate in reviewer-only scratch, without editing target source.

Result: **6 Node-reported tests passed (one parent and five subtests), 0 failed, 0 skipped; exit 0.**

| Fixture | Compact JSON characters | Stored JSONB characters | Stored UTF-8 bytes | Former handler | Current handler |
|---|---:|---:|---:|---:|---:|
| ASCII | 127,984 | 130,497 | 130,555 | 413 | 200 |
| Unicode | 127,984 | 130,497 | 247,447 | 413 | 200 |

The reconstructed former handler's Git blob was 9479c6b2c3222b0575ba68de0a4207dd11dca3b9, matching the pinned original. Different stored fixture sizes from PR89's own CI are expected because the integrated source snapshot differs; the test uses the actual constructor and dynamically fills the same compact allowance.

Exact unchanged test:

- Git blob: 8a16eeaea6caad376be18c52a6c5dc7ffe562c0b
- SHA-256: f2f93628e10bc375db649fb6815dc7408b86300f9af06a675ae7b205db947174
- Executed against local 26bc4d52c06bf37efd707653d837f47d78ec7cf2, whose tree equals published 80ef1c3906ebd56abeb9c61ff5b9c649fffa9799.
- Receipts: pr89-test-on-integrated-candidate.txt and pr89-reconciliation-receipt.json.

## Remaining publication obligation

Adding a test changes the apps subtree, even though production behavior is unchanged. The prior d00e0cb4f49b435066dfbe3f115aa32f7cee402b subtree must not be reused as the final identity after integration. Verify that the new source delta contains the accepted test and any explicitly reviewed metadata only, retain PR89 ancestry, record the new trees, and bind exact published-head CI to them. No full application suite was repeated by this reviewer.


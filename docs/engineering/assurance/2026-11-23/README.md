# Shared validation standard remediation — 23 November 2026

## Decision and scope

Extend the existing ISS-EBEAS evidence-aware standard with interpretation `1.1.0-evidence.3-validation`. Preserve IRON-ENG-001 and the earlier full-application and narrow static-delivery interpretations. The application repositories retain their existing languages, native components and runtime-specific tests.

Baseline: `mrterryflood-ui/integrated-implementation-intelligence@0032113b36f01c52e510b7a1a3b1e3f80b8e659a`.

The existing implementation already separated configuration, collected evidence, provenance and release authority. Reuse that implementation rather than replacing it with declarations or pattern matches that claim production acceptance.

## Changes

- Inventory selected tests, workflows, lockfiles, schemas and source as raw bytes regardless of language. Bind their digest separately from recognized-format heuristics and require it in current-revision evidence.
- Reject missing, empty or unsafe input scope, recursive output inclusion and unsupported file objects. Preserve explicit exclusions and bounded reads.
- Expose unfamiliar-language heuristic coverage as `NOT_EVALUATED_NO_RECOGNIZED_FILES`; inventory success is not semantic analysis.
- Verify recorded shared-kit integrity in canonical and consumer CI, with the same 16 shared files in ATLAS and EVERLINK. The verifier checks 15 inventoried files; `origin.json` is compared separately between mirrors.
- Require evidence to follow the actual producer, response projection and user-facing state. Configured, observed, unknown, queued, transferred and acknowledged remain distinct.

## Evidence

The independent final replay passed **141/141 tests**, with no failures or skips. Independent review reproduced a Rust-only false-negative, then confirmed the correction without weakening legacy behavior or accepting an empty scope. See [independent-standard-review.json](independent-standard-review.json), [shared-tests.tap](shared-tests.tap), and the retained before/after language probes.

The shared kit's final origin digest is `e2cf3f5d373776b53bd9e88bb317c054329dc63c8b41b0e29357720d810c6fa0`. It is an unsigned integrity identifier. It does not authenticate an update channel or certify an application.

The same suite passed in each application mirror alongside existing launcher, evidence-source and failed-build-boundary tests: **172 cases in ATLAS; 169 in EVERLINK**. Each application's evidence-archive importer passed another **15 cases**. These totals include the same shared 141 cases; they are not independent product coverage totals.

## Remaining gates and ownership

This record establishes local source and tooling verification. The receiving application maintainers own complete checkout execution and current-revision product evidence; an independent reviewer owns acceptance of those results; the authorized release owner retains production authority. Hosted CI, protected signing/promotion, actual devices, accessibility/user trials, field measurements, regulatory applicability and deployment remain separately evidenced states.

The local node runtime was 24.22.3; configured CI uses Node 22. No full locked application build or physical qualification is claimed. Preserve exact candidate hashes and do not relabel these historical receipts as a later commit's execution result.

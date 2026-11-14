# AIDE unified research execution — DIS contribution

Triage: L4 GREEN. Owner: Terry Flood. Builder: root integration lane.

## Authority, exact starting point, and end state

Terry approved the unified AIDE build plan and directed execution on November 14,
2026. This contribution connects the existing DIS inquiry method to the existing
public MCP interface for the bounded public-source research workflow. It does not
make a scientific, clinical, deployment, or measured-outcome acceptance claim.

Base: `4adca5c0dc84f6329dc477d0cb43b2264c83e6a4`.
IRON-ENG-001 v1.0.0 SHA-256:
`60301dc8d8dd2443443e7afdffd8f1c33e199309668e7e8e6ebdc77932ac4c8b`.
Engineering inquiry v0.1.0 SHA-256:
`ef8d29fae8a3c07efe445d482e3b833b5a9bd0a7d7f0c3b8de2d653532e78b73`.

## Reuse and scope

- Reuse: `lib/dis-inquire.ts`, the registered public MCP dispatch and bounded JSON
  request reader, and the existing sorted-key research content digest.
- Extend: MCP discovery and dispatch with a versioned, research-run-bound method
  review. AIDE consumes this result within its research workspace.
- New: a strict input adapter and behavioral tests because the existing public
  tools do not expose the inquiry method or bind a review to a retained run.
- Preserve: existing private identity, case storage, methodological findings,
  human action authority, legacy RPLICE stateless responses, and unrelated PRs.
- Environment: isolated Git checkout; Node 24.22.1; installed dependencies from
  the existing package declaration. Shell GitHub write credentials are absent;
  the authenticated GitHub connector remains available for reviewed publication.

## Requirement and verification map

| Requirement | Evidence required |
| --- | --- |
| One connected research task | Exact run, workflow, protocol version/hash and source-receipt hash preserved in review |
| Useful synthesis while validation develops | Missing external validation produces qualified review findings without stopping research preparation |
| No unsupported authority | No action, human review, independent source validation or clinical effect inferred from a method check |
| Real method reuse | Actual `investigateMethod` findings returned through registered MCP dispatch |
| Bounded inputs | Invalid types, extra authority fields, wrong identities, excessive arrays and actual-byte overflow rejected |
| Stable retained content | Digest survives JSON key ordering and changes when reviewed content changes |
| Recovery | Stateless review has no partial database mutation; caller retains its receipt and can retry |

The independent reviewer will inspect the final changed source and test evidence.
Exact-head CI, merge, deployment identity and live MCP exchange are separate
release receipts. Revert the additive tool/adapter commit to roll back; retained
research records in the coordinating system remain intact.

## Diagnosis and remaining boundaries

The method already exists, so a new research engine is unnecessary. Existing MCP
planning tools are stateless and do not perform this inquiry review. Source
metadata can be appraised for declared consistency but does not establish source
truth, full-text appraisal or externally validated effectiveness. A public-source
classification is a caller declaration, not automatic inspection of every word.
The caller must enforce its source-use scope and compare the echoed binding with
its authoritative retained records.

The historical doctrine's single completion ladder is not used to turn one form
of evidence into another. The approved design retains separate execution,
scientific evidence, human review and accepted-use dimensions. Constitutional
heading/count discrepancies and the unavailable consolidated skill bundle are
unchanged and do not determine this adapter's behavior.

## Verification and release record

Local baseline: 774 tests passed, zero failures and zero skips; TypeScript passed.
Final candidate: 782 tests passed, zero failures and zero skips; TypeScript and
the Next.js production build passed. The operating-contract and both standard
digest guards passed. The eight added behavioral cases cover the registered
HTTP/MCP path, real method findings, exact bindings, authority separation,
canonical hashes, malformed metadata, actual-byte overflow and a second sector.

The sandbox prevents the `tsx` CLI from creating its IPC socket. The same test
files were therefore executed with Node's `--import tsx --test` entrypoint after
running the existing package's contract guards. The build used the same
evaluation prelude through `node --import tsx` and the normal Next.js build.
No test or production behavior was weakened to accommodate this environment.

A distinct implementation agent, `healthcare_platform_fit`, independently read
the adapter, registered dispatch, tests and underlying inquiry authority flags.
It reported no blocking defect in strict nesting, identity/hash binding, byte
bounds or authority handling. This is a software review, not external scientific
validation or a recorded human publication decision. Reviewed source SHA-256:

- `lib/research-protocol-review.ts`:
  `cba42eed340de1782d28c0b85bdc0630bb2b67b624fc2bd0e370e2473220103c`.
- `app/api/mcp/dispatch.ts`:
  `1b61ce66f494a90a13e35482a82e8a2ac9118f77e88c0f9d25d5a4ce0631d8cc`.
- `tests/research-protocol-review.test.ts`:
  `2dffa2689f12c623a15548a6a82bb27551a2b6a025b0da03494400607c3b267e`.

At this commit, GitHub CI, exact-head release review, merge and live deployment
verification remain pending. Their receipts belong to the release record and
must not be inferred from these local results. The prior observed production
deployment is `dpl_BpwiMPn64nGZKyuQgniP6fQ9bdEC` at the base commit above.
The canonical public MCP URL is `https://www.dynamicintel.io/api/mcp`.

Owner: Terry Flood; next action: integration coordinator verifies the exact
published revision and live response. Review date: 2026-11-14. Rollback: revert
the additive adapter/dispatch change or restore the recorded prior deployment;
no DIS database migration is introduced. Evidence attained: local technical
verification with separate software review; integrated live use remains open.

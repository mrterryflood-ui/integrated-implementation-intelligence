# Build Ledger: <workspace or platform>

Copy to `docs/build-ledger.md`. This is the memory agents read in Preflight so nothing is rebuilt. Update it at Postflight, every time. Keep entries short and current; move stale entries to the change log.

Last updated: <date>

## Environment Map
| Item | Value | Notes |
|---|---|---|
| Artifacts (slug → previewPath → workflow name) | | |
| API server | | Route index location, auth middleware |
| Database | | Schema barrel path, dev vs prod state |
| Integrations connected | | |
| Secrets present (names only, never values) | | |
| Data sources (Live / Sample / Simulated) | | |
| Scheduled jobs and their health surface | | |
| Deployment type and URL | | Use `getDeploymentInfo()` |

## Inventory (what already exists: search here first)
| Capability | Contract (OpenAPI path) | Route file | Tables | Client hook | UI (page / component) | Tests | Status |
|---|---|---|---|---|---|---|---|

## Shared layers (the spine)
- Design tokens:
- Shell / layout:
- Primitives:
- Auth / tenancy:
- Evidence and truth-label components:
- Domain knowledge file (`docs/domain.md`):

## Decisions
| Date | Decision | Why | Alternatives rejected | Revisit when |
|---|---|---|---|---|

## Coverage map (consequential boundaries)
| Boundary (route, job, tool, integration, data store) | Auth | Receipts / logs | Tests | Covered? | Notes (outside coverage) |
|---|---|---|---|---|---|

Re-check for coverage drift whenever a route, job, integration, agent framework, or region is added.

## Residuals (C9: every residual has an owner, severity, next review)
| Residual | Severity (L1-L5) | Owner | Next review | Impact |
|---|---|---|---|---|

## Audit findings deferred
| Area | Finding | Why deferred | Blocks release? |
|---|---|---|---|

## Change log (newest first)
### <date>: <slice name>
- **Triage:** L? · **Verifier (Strand B) and result:**
- **Expected delta / Actual delta / Match?:**
- **Before:**
- **Changed:**
- **Why:**
- **Proof:**
- **Limits:**

## Triage calibration log
| Date | Signal or task | Level assigned | What happened | Classification correct? |
|---|---|---|---|---|

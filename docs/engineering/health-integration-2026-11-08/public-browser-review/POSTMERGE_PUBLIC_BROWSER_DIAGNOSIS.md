# Independent diagnosis: production public-browser identity expectation

## Decision and scope

**ALLOW the bounded browser-harness repair, subject to actual Chromium and WebKit execution in both declared deployment modes.** The reported failure is explained by a stale public-only test expectation. This review found no associated application regression in the changed integration source.

This is an independent AI engineering review. It does not establish real-user sign-in, successful private service execution, deployed private persistence, independent human acceptance, scientific validity, or clinical acceptance.

The reviewed deployed source is merge `2d9965efc5f09b51942de31309e4679879052dfa`. An independent GitHub commit read confirms full tree `1164219c569d8bf7f8185f3e227383b282d64846`, identical to the previously reviewed final candidate. Its parents are original base `06f21b4ef5fa3007c22acfaee453f8ee0ef0d452` and published candidate `03fb8f7337acf7ad9000c4fdb4e797190e133c8e`.

The parent supplied the production observations: workflow run `42541005003`, job `128915677028`, both mobile engines failing the old assertion at `public-site.mjs:96`; five preceding local-draft journeys passed, no browser JavaScript errors were reported, the research control was enabled, the page displayed Sign in, and deployed DOM reported `data-dis-identity="clerk-enabled"`. This verifier inspected source and the GitHub merge binding directly; it did not independently repeat those production browser observations.

## Root cause

`app/page.tsx:17–21` deliberately separates two conditions:

1. `productionIdentityBlocked(process.env)` disables identity in Vercel production unless both configured credential values have live prefixes.
2. `privateReady` additionally requires both live prefixes even outside production. It is configuration readiness, independent of the signed-in user's `userId`.

The home page passes that same readiness flag to the consultation and council components. In `app/consultation-studio.tsx:230,237`, the two controls are enabled when the configuration is ready, the component is idle, and the council's question/context conditions are met. Consent is enforced inside the click handlers at lines 148 and 158, before their respective fetches. A fresh anonymous visitor can therefore see enabled controls while neither consent nor authenticated execution is granted.

The old `tests/e2e/public-site.mjs:96,98` asserted that both controls must always be disabled. Nearby HTTP-denial checks were already conditional on public-only presentation. These two unconditional assertions failed as soon as configured production identity made the controls eligible to receive a click. The controlled candidate job intentionally builds with `VERCEL_ENV=production` and no identity credentials, so its successful public-only run could not test this second state.

There is **zero diff from original base to the integration candidate** in the home, layout, release gate, proxy, consultation studio, council component, public browser script, public production workflow, or the five inspected API handlers. The integration did not introduce their current enablement or anonymous-response semantics.

## Correct acceptance contracts

| Declared environment | Required root identity marker | Research/council controls in the tested example | Required anonymous HTTP outcome |
|---|---|---|---|
| Production public-only | `public-only` plus pending notice | Disabled | Existing protected-route checks remain exact 503 |
| Configured live production | `clerk-enabled`, no pending notice, visible Sign in | Enabled; unchecked-consent click produces exact blocking alert and no browser POST | Workspaces, research, capability fabric and Parallax: exact 401 denial; council: exact 200 preview with `SIGN_IN_REQUIRED` and no executed results |
| Preview with test credentials | `clerk-enabled` can occur | Controls remain disabled because live-prefix readiness is false | Separate preview contract; cannot be inferred to be live production from the marker alone |

The test must choose its expected mode independently of the page it is testing. Deriving the expected outcome from the observed marker could allow the wrong deployment state to select its own passing branch. The reviewed patch uses an explicit two-value `DIS_E2E_EXPECT_IDENTITY_MODE` and pins each workflow to its intended mode. Empty and unknown supplied values fail before browser launch.

### Exact anonymous API expectations

| Request | Status and body contract |
|---|---|
| GET `/api/workspaces` | 401, exactly `{ "error": "Unauthorized" }` |
| POST `/api/consultation/research` | 401, exactly `{ "error": "Sign in to investigate" }` |
| POST `/api/capability-fabric` | 401, exactly `{ "error": "Authentication required" }` |
| POST `/api/consultation/parallax` | 401, exactly `{ "error": "Sign in required" }` |
| POST `/api/council` | 200 and `state === "SIGN_IN_REQUIRED"`; no own `deliberation`, `intelligence`, `evidenceSnapshot`, `modelProvenance`, `actionPlan`, `sources`, or `sourceReceipts` properties; explicit no-paid-inference notice |

Council is intentionally different. Its route assembles a deterministic educational roster before the unauthenticated return at `app/api/council/route.ts:36`; quota/database access and inference occur later. Its 200 response is not successful deliberation. Requiring 401 for this existing route would create another incorrect assertion. Conversely, accepting any 2xx/4xx/5xx status would weaken the gate. The explicit state and absent-result checks preserve the distinction.

The new live probes deliberately withhold external consent. Capability fabric uses its planning mode. No real credentials, private records, paid inference, or partner exchange are required to evaluate the anonymous boundary.

## Review of the actual three-file patch

The exact reviewed working-file blobs, based on merge `2d9965ef`, are:

| File | Git blob |
|---|---|
| `.github/workflows/dis-platform-checks.yml` | `650beeae439472550d2434fa25264fbb956b9413` |
| `.github/workflows/dis-public-browser-e2e.yml` | `01b584fdf05611d78e79ec80d49aad48a37420ba` |
| `apps/dis-platform/tests/e2e/public-site.mjs` | `1cfdc290a1af2a7b061a977c7d8e3ab63688f123` |

The patch retains the nine local-draft journeys, Markdown download, tab/reset interactions, no-development-Clerk assertion, JavaScript-error assertion, mobile-width assertion, original public-only 503 probes, and final zero-outgoing check. It adds an exact root/pending-state assertion on every journey, enabled-state checks in configured live mode, consent-withheld clicks with blocking alerts and zero outgoing requests, and strict anonymous HTTP contracts. No application or security gate is changed.

The public workflow adds a narrowly scoped pull-request trigger for the harness and its own workflow. Existing push trigger, read-only permissions, timeout, browser engines and failure behavior remain. The candidate workflow explicitly declares `public-only`; the public deployed workflow explicitly declares `live-production`. The PR job tests the current production service using the proposed harness, so its receipt must distinguish the tested harness commit from the deployed application commit.

## Independent verification completed

- Executed the actual Home server component and actual release-gate implementation with presentation components and Clerk `auth()` stubbed. Six synthetic configurations passed: production missing/test/mixed pairs are not ready; production live pair is ready; preview test pair is not ready despite identity resolution being permitted; preview live pair is ready. Source SHA-256: `1ba7ca11f41f6919439fbf9a1a664db2c260fb8c483ae63dfd425c43a58769ea`.
- Executed the proposed browser script with empty and unknown identity mode values. Both exit 1 at the intended validation assertion before either browser journey launches.
- `node --check` succeeds for the proposed browser script.
- `git diff --check` succeeds for all three patch files.
- Rechecked the four principal policy hashes; they match the earlier independent review.

The first attempt to run this verifier's synthetic Home harness failed during local Node module setup because its diagnostic module filename was not initialized. The verifier corrected that scratch-only harness and then completed all six actual-component controls. No application failure or application edit was involved. This diagnostic fixture is not a production or browser test.

## Required closure proof

1. Bind the published correction commit to the three reviewed blobs and verify application source remains unchanged.
2. Complete the exact-head controlled candidate browser job with `public-only` and the exact-head deployed public mobile job with `live-production`, retaining both browser outcomes and failure artifacts.
3. Record the deployed production revision separately from the harness revision and retain the original failing run as the regression evidence.
4. Keep private authenticated lifecycle acceptance and all human/clinical gates unestablished until their own authorized evidence exists.

The source diagnosis and synthetic controls justify correcting the expectation. They do not substitute for the two real-browser executions.

## Artifacts

- `postmerge-public-browser-review.json`: exact three-file hashes, working-scope observation, negative-mode controls, limits.
- `mobile-identity-home-controls.cjs`: independent actual-Home synthetic fixture, scratch-only.
- `mobile-identity-home-controls.json`: six configuration results.

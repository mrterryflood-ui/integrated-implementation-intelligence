# Public browser acceptance after production identity configuration

## Problem and bounded correction

The health integration merged through PR90 at `2d9965efc5f09b51942de31309e4679879052dfa`. Its controlled candidate browser checks passed, as did the same checks on main. The separate live production mobile job `128915677028`, run `42541005003`, failed in both Chromium and iPhone WebKit at `public-site.mjs:96`: it unconditionally expected the research control to remain disabled.

The production DOM reports `data-dis-identity="clerk-enabled"` and offers Sign in. The homepage enables private-ready controls only when both live Clerk key prefixes are configured. No credential value was retrieved, disclosed or changed. Independent inspection verifies zero diff in the affected homepage, layout, identity gate, proxy, studio, council route, public browser harness and its workflow between pre-integration main `06f21b4e` and the reviewed health-integration tree. The failed assertion assumes the former public-only deployment, whereas the isolated candidate intentionally tests that configuration. This finding does not certify signed-in access or clinical use.

This correction changes only browser acceptance, its CI configuration and evidence documentation. Application code, production environment, authentication, authorization, consent, quotas, data and clinical gates are unchanged.

## Explicit two-state acceptance

The harness accepts an explicit `DIS_E2E_EXPECT_IDENTITY_MODE` of `public-only` or `live-production`; unknown or supplied-empty values fail. Candidate CI pins `public-only`, and the live production workflow pins `live-production`. The test does not infer its expected state from whatever the page happens to report. Each of the nine public journeys requires the matching body marker and pending/sign-in state.

| Expected mode | Required observed behavior |
|---|---|
| Public-only candidate | Body declares public-only; pending notice present; research/council controls disabled; existing private endpoint and council HTTP503 denials retained |
| Live production, fresh anonymous visitor | Body declares clerk-enabled; Sign in visible; pending notice absent; configured controls enabled but unchecked consent produces the exact blocking message and no browser POST |

The live branch also exercises actual anonymous HTTP boundaries with synthetic public text and consent deliberately false. Workspaces, research, capability planning and Parallax require exact HTTP401 with their documented denial bodies and no result payload. Council's existing public preview intentionally returns HTTP200 with `SIGN_IN_REQUIRED`; the test requires that state and the no-paid-inference notice, and forbids executed deliberation, intelligence, evidence snapshot, provenance, action plan, sources or source-receipt keys. The preview is not misclassified as a completed council or as HTTP401.

Both modes retain the full nine-focus draft journey, actual Markdown download, mobile layout, reset, no unexpected JavaScript errors, no development Clerk requests and zero browser model/research POSTs. There is no broad accepts-any-status rule, authentication bypass, actual external research request or relaxed source assertion.

## Verification and exact scope

Before publication, `node --check` and authored `git diff --check` pass. Executing the supplied-empty mode rejects it at the configuration assertion before browser launch. Native browser execution remains the hosted gate; local runtime socket restrictions are not converted into a pass.

The live workflow gains a narrow pull-request trigger for changes to itself or this harness. This allows the corrected test to run against the current production application before it is merged. The receipt must distinguish the harness revision from the deployed application revision; a passing test of existing production does not prove that unrelated candidate application changes are deployed. The isolated candidate job still builds and exercises the complete PR source under the public-only configuration.

The follow-up PR records exact published source identity, independent review, both browser jobs and the final merge. PR90 remains the scientific/engineering integration record. No new scientific estimate, corpus case, clinical participant or outcome is added here.

## Retained failure and follow-through

The original live failure is retained in `health-integration-2026-11-08/postmerge-public-mobile-failure.log`. Provider artifact13641437029 has ZIP SHA256 `32948f5ad668bd6a7215e1863a5fb2e04296a2705d1809f6e0a587f5c53369ba`. The failed run is not relabeled, deleted or replaced. Its five earlier local-draft journeys passed; the later unconditional control assertion failed in both engines without a JavaScript crash.

Root owns the correction and publication; the distinct engineering reviewer checks the actual delta and gate semantics. Acceptance requires both configured live anonymous/consent checks and the retained public-only candidate checks to pass. Signed-in case persistence, real tenant isolation, paid/model execution, live DIS–RPLICE exchange and clinical outcomes remain outside this finite public-browser test. If configured production does not meet the strict anonymous boundaries, retain the failure and investigate that boundary rather than widening allowed statuses. Restore the prior harness if the amendment itself proves invalid; do not disable application protections to satisfy it.

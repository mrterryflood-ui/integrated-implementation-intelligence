# ISS-EBEAS v1.1 release checklist

**Use with:** [ISS-EBEAS v1.1](ISS-EBEAS-1.1.md) and [IRON-ENG-001](IRON-ENG-001.md).

**Rule:** Complete the applicable checklist for the exact candidate and target. A checklist row is closed by inspected evidence, not a checked box or a manifest assertion.

**Default state:** `NOT_VERIFIED`. This template is not a completed release record.

## Release record header

Record the product/capability, legal owner, canonical repository, full base and candidate SHA, artifact digest, policy version/digest, active and planned runtime targets, data classification, environment and authorized action. Name the implementer, independent reviewer, release owner and sustainment owner. Preserve accepted action-specific approval references and expiry/scope. Record the prior deployed artifact and rollback path without disclosing secrets or sensitive customer data.

For every row retain: requirement ID; implementation and test paths; command/tool versions; evidence producer and protected source; timestamp; exact revision/artifact; environment; fixture/staging/production label; observed result; reviewer disposition; and any gap's owner, root-cause investigation, corrective action, closure test and next review. A missing owner is a gap, not an implied assignment to a third party.

Allowed disposition is `VERIFIED`, `FAILED`, `NOT_VERIFIED`, or `NOT_APPLICABLE_WITH_REVIEW`. Inapplicability requires a specific scope rationale and independent acknowledgment. Missing credentials, absent implementation, failed tests, unavailable auditors and pending native builds are not inapplicability. Planned targets remain planned; active targets require their applicable controls.

## Stage and requirement crosswalk

`build` checks configuration/static scope and leaves `releaseReadiness: NOT_EVALUATED`. The trusted evidence producer uses `evidence` to validate the implemented pre-release checks before signing; success means only `PROVENANCE_PENDING`. After signing, the protected boundary runs `release`, which repeats those checks and invokes signature verification. Successful release checks produce `EVIDENCE_CHECKS_PASSED`, not a claim of deployment or store approval. The full checklist still governs; the common gate checks evidence consistency rather than executing each underlying application test itself.

The core pre-release requirement set is the exported `REQUIREMENTS` list in `tools/iss-ebeas/gate.mjs`. Runtime rows are conditional: `REQ-EBEAS-PWA` for WEB_PWA, `REQ-EBEAS-IOS-BUILD` for IOS_APP_STORE, `REQ-EBEAS-ANDROID-BUILD` for ANDROID_PLAY_STORE, `REQ-EBEAS-DESKTOP-BUILD` for TAURI_DESKTOP, and offline/DDIL behavior for EDGE_DDIL. Active native store targets also require store privacy/package evidence. An account-creating product requires the deletion row; account applicability cannot remain unknown at release.

`REQ-EBEAS-IRON` is checked by G8. `REQ-EBEAS-PROVENANCE` is checked by G9 after evidence signing. `REQ-EBEAS-RELEASE` includes gate results **and** the separately enforced authority/promotion boundary. `REQ-EBEAS-DEPLOYMENT` and `REQ-EBEAS-LIVE` belong to a distinct postdeployment record; do not invent their completion in the pre-release package. Public store approval, actual recipient acknowledgment and measured outcomes remain separate later evidence, not preconditions that can be fabricated before they happen.

## A. Source, applicability and build

| Requirement | Verification and closure evidence | Accountable role |
| --- | --- | --- |
| REQ-EBEAS-SOURCE | Re-read canonical head, active PRs/writers and deployed source. Map reused and changed paths. Preserve other work and reconcile conflicts before integration. | Implementer |
| REQ-EBEAS-SCOPE | Name beneficiary, persona, intended outcome, environments, legal entity, data rights, allowed actions and exclusions. Confirm FIIOS scope within the funding product where applicable. | Product/release owner |
| REQ-EBEAS-APPLICABILITY | Review tier, data classification, legal/processor role, contract, framework version and actual runtime targets. Record evidence for additional HIPAA/CUI/export/child/financial requirements where relevant. | Security/privacy owner with qualified domain review as required |
| REQ-EBEAS-MANIFEST | Run the schema/configuration check against the actual root manifest. Exercise absent/empty roots, malformed JSON, bad paths, unknown or invalid fields and version mismatch. Retain failure receipts and scanned scope. | Implementer; independent verifier |
| REQ-EBEAS-BUILD | Reproducible locked installation, zero-error relevant typecheck and actual build on the candidate. Record runtime/package-manager versions and exact commands. | Build owner |
| REQ-EBEAS-BOUNDARY | Enumerate every configured build and promotion path. Verify `build` is included, `release` cannot be bypassed at promotion, protected required checks/approval apply, and no failure is masked by continue-on-error or an unconditional success step. | Release owner |

## B. Experience and accessibility

| Requirement | Verification and closure evidence | Accountable role |
| --- | --- | --- |
| REQ-EBEAS-JOURNEY | A first-time user can find Start, understand Watch and make the isolated Commit decision. The primary job is connected to actual source/data and useful action, not an orphan component demonstration. | Product owner; independent UX reviewer |
| REQ-EBEAS-STATES | Exercise loading, empty, partial, stale, offline, failed, blocked and completed states. Copy explains the situation and next action. Check real progress, source dates, uncertainty and zero-versus-missing semantics. | UX/data owner |
| REQ-EBEAS-COMMIT | Confirm reversible preparation, informed commitment and durable history. Consequential completion requires its actual receipt; optimistic feedback cannot invent delivery, consent, deletion, submission or acknowledgment. | Product/security owner |
| REQ-EBEAS-A11Y | Run automated checks plus keyboard, screen-reader, zoom/reflow, focus, contrast and touch interaction on supported desktop/mobile views. Test dialog opening, tab loop, dismissal, background inertness and focus return. | Accessibility reviewer |
| REQ-EBEAS-MOTION | Test OS reduced motion and CSS fallbacks, both themes, opaque/forced-color fallback and rendered text contrast. Confirm motion is bounded and does not block work. A provider flag alone is insufficient. | UX reviewer |
| REQ-EBEAS-PERMISSIONS | Exercise contextual request, explicit activation, grant, denial, revocation and fallback. Verify each native target's purpose strings/pre-alert pattern and browser behavior separately. No prompt at launch without justified essential need. | Platform/privacy owner |
| REQ-EBEAS-PERFORMANCE | Measure FCP, INP, supported frame target and first useful value under declared hardware/network/workload. Preserve samples, method, percentiles and cold/warm context. Compare to v1.1 budgets; do not copy target values into observations. | Performance owner |
| REQ-EBEAS-COLD-USERS | At least three actual first-time testers per primary persona complete consented unassisted timed attempts on the candidate. Record completion, assistance, error and time, including failed attempts. Test the separately defined first-value and full-outcome clocks. | Product owner; independent UX reviewer |
| REQ-EBEAS-CLAIMS | Reconcile operational UI, help, exports, public pages and demonstrations with the measured scope. No unmeasured ease/speed, fabricated endorsement or store/regulatory-readiness claim. | Product owner; independent reviewer |

## C. Identity, data and E2E behavior

| Requirement | Verification and closure evidence | Accountable role |
| --- | --- | --- |
| REQ-EBEAS-IDENTITY-CONTINUITY | Exercise the existing account/session/token journey on the new candidate and restart; preserve keys and identity mapping. Test expiry, revocation, logout, unverified identity, wrong account, cross-tenant access and unauthorized linking. | Identity/security owner |
| REQ-EBEAS-ENTITY-ISOLATION | Verify ISS, TCAF and customer boundaries in API, persistence, files, exports and audit. Shared source code does not authorize shared private data, budgets or commitments. | Security/data owner |
| REQ-EBEAS-SOURCE-TRUTH | Validate source identity, permissions, schema, units, location, clocks, reference periods and lineage. Inject stale, malformed, unavailable, duplicate and contradictory inputs. Missing information remains visible. | Data/domain owner |
| REQ-EBEAS-E2E | Execute the registered UI → API → durable record → authorized action → recipient/acknowledgment journey within authorized test scope. Map tests to requirements; check nonzero executed results, failures/skips and actual revision. Synthetic recipient behavior remains labeled synthetic. | Independent integration verifier |
| REQ-EBEAS-PERSISTENCE | Exercise real schema/DB contracts, transactional audit, concurrent writers, duplicate/reordered input, restart, rollback and restore. Verify deletion or migrations on approved isolated data before any authorized production change. | Data/operations owner |
| REQ-EBEAS-OFFLINE-DDIL | Disconnect and reconnect; verify useful bounded fallback, visible freshness, encrypted/protected local storage as required, queue limits, recovery, idempotency and conflict resolution. Confirm no false sent/received state or sensitive cache leak. | Runtime/operations owner |
| REQ-EBEAS-AUTHORITY | Test denied unauthorized sends/submissions/dispatch, wrong recipient/destination, changed approval payload and replay. Approval remains bound to exact action/content and current authority. | Security/release owner |

## D. Security, privacy and provenance

| Requirement | Verification and closure evidence | Accountable role |
| --- | --- | --- |
| REQ-EBEAS-CRYPTO | Verify actual transport, storage and payload boundaries, key custody, approved mode where required, revocation/recovery and negative paths. Resolve any false E2EE claim. For FIPS, independently match certificate/module/version/environment/configuration. | Security owner |
| REQ-EBEAS-SUPPLY-CHAIN | Produce and parse the actual SBOM, identify lock/build provenance, run applicable secret/dependency/artifact scans, and resolve required critical/high findings. Preserve scanner versions, scope and exclusions. | Build/security owner |
| REQ-EBEAS-AUDIT | Verify durable, permissioned audit writes, correlation, tamper detection, append-only correction and recovery. Redact secrets/private payloads. Show why a caller cannot rewrite the only source of truth and rehash it into apparent validity. | Security/data owner |
| REQ-EBEAS-PRIVACY | Match data inventory, consent, minimization, processors, retention, privacy notices and deletion behavior. Review health/CUI/export/child scope with appropriate authority where applicable. | Privacy/domain owner |
| REQ-EBEAS-PROVENANCE | Collect signed artifact provenance and independently verify signer/trust root, repository/workflow identity, exact source and artifact digest before promotion. An unsigned gate digest or `signed: true` field cannot close this row. | Independent release verifier |
| REQ-EBEAS-IRON | Execute applicable IRON checks and validate the existing engineering receipt's structure/revision/artifact bindings. Inspect original CI/DB/browser/reviewer evidence; receipt consistency alone does not prove the assertions. | Independent engineering reviewer |

## E. PWA and native store targets

| Requirement | Verification and closure evidence | Accountable role |
| --- | --- | --- |
| REQ-EBEAS-PWA | On each supported browser/device verify HTTPS, actual served manifest, linked icons, scope/start URL, install/launch/update, intended offline task and stale-cache recovery. Ensure private data remains isolated. | Web/runtime owner |
| REQ-EBEAS-IOS-BUILD | For an active iOS target: verify signed app archive, identity/entitlements, deployment/SDK requirements, packaged privacy manifests and purpose strings, relevant SDK privacy and actual device journeys. | iOS release owner |
| REQ-EBEAS-ANDROID-BUILD | For an active Android target: verify signed release artifact, app identity/SDK requirements, permission behavior, privacy/data declarations and actual supported-device journeys. | Android release owner |
| REQ-EBEAS-DESKTOP-BUILD | For an active Tauri desktop target: verify the actual platform build/package, signing and notarization where applicable, least-privilege native capabilities, update integrity/rollback, installation/uninstallation and supported-OS permission/keyboard journeys. | Desktop release owner |
| REQ-EBEAS-STORE-PRIVACY | Reconcile actual application/SDK data behavior with privacy policy, App Store privacy declarations or Play Console Data safety answers. Validate content, not just filenames; retain console/build evidence. | Privacy/store owner |
| REQ-EBEAS-DELETION | For applicable account-creating apps: test discoverable in-app request, wrong-user denial, actual account/data lifecycle, provider propagation, session/token revocation, retained-data explanation and completion. For applicable Google Play apps, test the external web request path without requiring reinstall. | Identity/privacy owner |
| REQ-EBEAS-STORE-PACKAGE | Recheck current store rules, metadata, age/content declarations, support/privacy links, signing/account authority, review access and submission package. Submission and approval each require their own provider receipt. | Authorized store owner |

## F. Review, release, live witness and sustainment

| Requirement | Verification and closure evidence | Accountable role |
| --- | --- | --- |
| REQ-EBEAS-REVIEW | Distinct reviewer challenges the exact final SHA, evidence, security boundaries and user journey. Close findings with fixes and regressions. Pending/neutral/skipped/quota-limited jobs do not count as approval. | Independent reviewer |
| REQ-EBEAS-RELEASE | Run `evidence` before the trusted producer signs the package, then run `release` against the exact signed evidence set. Inspect errors and unresolved rows. Verify protected checks and action-specific authority; preserve already-granted valid authority. Do not equate a build/evidence check with permission to promote. | Release owner |
| REQ-EBEAS-DEPLOYMENT | **Postdeployment:** capture actual provider deployment/environment ID, status, timestamp and exact source/artifact. Compare to the reviewed candidate and inspect health plus behavior. Use the distinct deployed-stage receipt where applicable; do not preattest a future deployment. Merged is not deployed. | Release/operations owner |
| REQ-EBEAS-LIVE | **Postdeployment/live acceptance:** witness the authorized live critical journey, existing-user login and required recipient behavior. Name unobserved segments. Keep fixture, staging, production, receipt and human acknowledgment separate. Failure activates the recorded recovery decision. | Independent verifier; actual recipient where required |
| REQ-EBEAS-ROLLBACK | Rehearse or verify the applicable restore/rollback path, data compatibility and identity continuity. Name owner, trigger, retained artifact, recovery time evidence and known limits. | Operations owner |
| REQ-EBEAS-SUSTAINMENT | Set maintenance/incident owner and successor, resources, monitoring, review date, drift triggers and adaptation/retirement criteria. Track real beneficiary outcome, burden and harm at an appropriate interval; do not infer outcome from activity. | Product/sustainment owner |

## Closeout and regression record

Report **Before → Changed → Why → Proof → Limits**. List implementation, executed tests, review, merge, deployment, live exchange, store decision and outcome as separate states. Each failed or unverified material row keeps its owner and next discriminating action. Continue authorized remediation; do not manufacture a pass, silently grandfather a defect or convert this checklist into blanket certification.

For amended requirements or new runtime targets, reopen the affected rows and downstream evidence. For corrections to previously false claims, preserve the original observation and correction record. Follow the current sources listed in [the standard](ISS-EBEAS-1.1.md#7-sources-and-maintenance).

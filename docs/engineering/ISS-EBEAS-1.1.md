# ISS-EBEAS v1.1 — Dual-Track Experience and E2E Assurance

**November 23, 2026 validation addendum:** `1.1.0-evidence.3-validation` extends the existing evidence interpretations with a language-independent validation inventory and mirrored-tool integrity checks. Earlier interpretation support remains for recorded adoption history; active ATLAS and EVERLINK candidates adopt this extension. Product verification, release and deployment remain separate states.

**Authority:** Dr. Terry Flood's November 18, 2026 instruction to update and integrate ISS-EBEAS across the named portfolio.

**Standard version:** 1.1.0. **Engineering interpretation:** November 18, 2026.

**Status:** Governing requirements for adopting repositories; implementation, release acceptance and store approval are separate evidence states.

**Owner:** Dr. Terry Flood. Each adopting repository names its implementer, independent reviewer, release owner and sustainment owner.

## 1. Purpose and precedence

An ISS product must help a person understand the situation, complete useful work, recover from failure and verify the result. Track A governs that person's experience. Track B governs the identity, data, security, evidence and release path that make the experience trustworthy. Both tracks apply to each supported journey and runtime target.

This standard extends [IRON-ENG-001](IRON-ENG-001.md), the [engineering inquiry protocol](../dis/STACK-AGNOSTIC-ENGINEERING-INQUIRY-PROTOCOL.md), the [stakeholder assurance standard](../dis/PLATFORM-STAKEHOLDER-ASSURANCE-STANDARD.md) and the existing ISS Experience Standard. Stronger privacy, safety, human-authority and exact-revision acceptance requirements remain in force. Legal entities, customer tenants, budgets, credentials and commitments remain separate. An internal product tier or framework label does not establish regulatory applicability, certification or permission to process restricted information.

This interpretation corrects false-assurance paths in the supplied reference implementation: declarations are not measurements; a test path is not an executed test; a file is not store acceptance; a SHA-256 digest is not a signature; a missing source directory is not a clean scan; and a shared component is not proof that every application uses it correctly. The user's performance, accessibility, security and usability goals remain requirements.

The established Start / Watch / Commit surfaces, plain language, honest status, reversible preparation and isolated consequential commitment remain the experience baseline. The source-preserving GrantPath copy is [ISS Experience Standard v1.0](https://github.com/mrterryflood-ui/GrantPath-Pro-PWA-Transfer/blob/2596872b924ce5e96df74db7b3bb627d7979d906/docs/ux/iss-experience-standard.md); its original-source digests and application-pack provenance must be retained.

## 2. Repository contract and evidence stages

Each active source repository maintains `iss-manifest.json`, validated against `schemas/iss-manifest.schema.json`. The shared implementation is `tools/iss-ebeas/gate.mjs`; `scripts/iss-audit-gate.ts` provides a TypeScript entry point. Reuse the repository's locked runtime, existing test jobs and IRON evidence instead of fetching a new unpinned runner or replacing its acceptance system.

| Stage | Required work | Permitted conclusion |
| --- | --- | --- |
| `build` | Validate configuration, declared scope, paths and applicable static checks; retain the receipt and failures. Run for every supported build. | Configuration/static checks passed or failed. `releaseReadiness` remains `NOT_EVALUATED`. |
| `evidence` | The evidence producer validates all implemented pre-release checks, including the supplied exact-revision test/measurement records and existing IRON candidate receipt, before signing the evidence package. | A passing run remains `PROVENANCE_PENDING`. It neither verifies a signature nor authorizes release. Failed checks remain blocking. |
| `release` | Repeat the pre-release consistency checks, then invoke the independent signature verifier on the evidence package. Verify source, repository/workflow identity and digest under the configured trust policy. | `EVIDENCE_CHECKS_PASSED` means the implemented consistency/provenance checks passed within their recorded scope. It is not store, deployment, human-use or outcome acceptance. Protected release authority and the complete applicable checklist remain required. |
| Authorized promotion and live verification | Independently verify signed provenance; verify release authority, target and artifact; deploy through the existing protected path; collect hosting and live-journey receipts. | Only the observed deployed revision and witnessed behavior may be reported. Store approval and beneficiary outcome require their own evidence. |

A successful `build` run never substitutes for `release`. Adding a workflow does not prove it is a required protected check, and a manually executed gate does not prove every deployment path invokes it. Inventory GitHub Actions, hosting-provider auto-deploys, manual publication and any configured external pipeline. Enforce the release boundary on each active promotion path or record that path as an unresolved bypass. Preparatory work may proceed while evidence is collected; the release claim may not.

Use `node tools/iss-ebeas/gate.mjs --stage build` for configuration checks and `--stage evidence` for the evidence producer. After the authenticated producer signs the exact evidence package, use `--stage release` at the protected promotion boundary. The default stage is `release`; unsupported arguments fail. Use the TypeScript wrapper only with the repository's already locked local runner. The local gate output `audit/attestation.json` remains an unsigned integrity receipt even when its separate provenance-verification check succeeds.

### What the common gate actually verifies

| Gate | Machine-checked boundary | Evidence still requiring truthful collection or separate verification |
| --- | --- | --- |
| G0–G2 | Allowed stage, strict manifest schema, repository/owner alignment, active/planned target separation and internal tier requirements. | Actual regulatory applicability and implemented controls. |
| G3–G4 | Declared nonempty source roots, bounded file inventory, source digest, heuristic findings, configured E2E/checklist paths and requirement mapping. | Heuristic findings need disposition; path existence does not mean a suite ran or that all source paths were declared. |
| G5 | Selected local runtime artifacts: basic PWA manifest fields, iOS privacy-file presence, nonempty Play data record and applicable link declarations. | Native manifest semantics and packaged inclusion, complete PWA installability, truthful console declarations and actual device behavior. |
| G6–G7 | Exact revision context, applicable clean-source check, required evidence statuses/methods/times, artifact content hashes, reported performance budgets, structured human/security/crypto/applicability records and finding dispositions. | Evidence producers/reviewers must establish that tests and participants are real, instruments fit, raw results support summaries and the declared source coverage is complete. |
| G8 | Existing IRON candidate-receipt consistency and revision/artifact bindings. | The IRON validator is not an authenticity oracle, test executor or a live-deployment witness. |
| G9 (`release` only) | Successful trusted `gh attestation verify` invocation with repository, signer workflow, source digest, issuer and hosted-runner restrictions; nonempty verification result. | The protected workflow, CLI/trust-root provenance, original observations and action-specific authority must be independently verified. A signed assertion can still be wrong. |

The release environment must supply a compatible, trusted GitHub CLI supporting the configured attestation flags. An unavailable/outdated verifier fails closed. A test that observes that failure does not prove the signature-success path. A real signed-artifact success and wrong-signer/wrong-revision/tampered-artifact rejection must be witnessed before that path is called operational.

Postdeployment checklist rows are deliberately separate. `REQ-EBEAS-DEPLOYMENT` and `REQ-EBEAS-LIVE` cannot honestly be marked complete by a predeployment evidence producer for a not-yet-deployed revision. Preserve pre-release staging/fixture observations under their actual labels, then collect a distinct postdeployment receipt and apply IRON's deployed-stage check where appropriate. Required postdeployment failure triggers the documented containment/rollback path; it is not rewritten as pre-release success.

## 3. Applicability, tiers and runtime targets

### Anonymous static delivery interpretation

`WEB_STATIC` with interpretation `1.1.0-evidence.2-static` describes only anonymous, read-only public web delivery in the commercial/civic tier. The scoped manifest must declare no visitor accounts, server submissions, application persistence, protected application payloads or offline runtime. An inquiry may remain in browser memory until the visitor chooses an email draft or clipboard action; those external destinations and provider access logs remain separate privacy boundaries. This scope cannot be combined with PWA/native/edge targets, a health/defense tier, or restricted data. Adding any such behavior requires the corresponding application profile and controls before acceptance.

The static declaration therefore uses provider-managed HTTPS as its transport requirement, no application-storage cipher, no visitor authentication mechanism and no application end-to-end payload-encryption claim. These are scope declarations, not proof of provider TLS configuration, deployment or a reviewed legal conclusion. An empty framework selection may be prepared while applicability remains undetermined; it cannot pass evidence/release until the independent applicability review is completed and hash-bound. Operator identity, build access, signed provenance and release authority remain mandatory.

All existing requirement IDs and executed-evidence rules remain in force. For application controls that are absent by design, the evidence must exercise the boundary: denied writes, no visitor session or storage, no protected data/caches, honest offline behavior and the local-draft/permission journey. A revision-bound, independent static-scope review must bind the declared boundary, actual source digest and hashed entrypoint files, identify those executed checks and report zero unresolved scope findings. A declaration, static filename scan or internally consistent review record does not establish its own truth. Build success remains configuration evidence only; human experience, vulnerability/SBOM checks, IRON acceptance, artifact signatures, provider enforcement and live verification retain their original gates.

The manifest separates currently supported runtime targets from planned targets. A PWA target does not imply an iOS/Android native build or store submission. A planned store target has an owner and closure work; it is not silently enabled to obtain a readiness badge.

| Product scope | ISS risk profile | Required interpretation |
| --- | --- | --- |
| GrantPath Pro / Funding Path Pro, including FIIOS capabilities | `TIER_1_COMMERCIAL_CIVIC` | One canonical funding product; preserve official-source qualification, client/entity separation and explicit submission authority. FIIOS is a capability within this repository, not a second repository to invent. |
| HazardAware | Provisional `TIER_1_COMMERCIAL_CIVIC` | Public risk decision support; separately review personal/location data, official-warning boundaries and any restricted deployment. This provisional mapping does not reduce source/scientific/safety tests. |
| YourRecords | `TIER_2_HEALTH_COMMUNITY` | Health/privacy controls are required by ISS policy. Determine actual HIPAA/entity/processor applicability and permissible data use before regulated claims or deployment. |
| SHIELD \| ATLAS and ISS Continuity | `TIER_3_DEFENSE_DDIL` | Preserve stronger defensive, identity, recovery and authority requirements. An unclassified demonstration does not establish CUI, classified, export-controlled or mission-operational authorization. |

Data classification, legal role, processing purpose, deployment environment and applicable contract determine additional controls. Record framework versions and applicability evidence. Missing regulatory evidence cannot be converted to `not applicable` merely because a feature is unfinished. Tier 2's HIPAA-oriented policy target is not a statement that every community application is legally HIPAA-covered. NIST 800-53, NIST 800-171 and CMMC are related but distinct obligations; identify the applicable baseline, assessment scope and contract rather than treating their names as interchangeable certifications.

## 4. Track A — understandable, accessible and measured experience

### Beneficiary journey and timing

Name the primary persona, setting, core job, first useful value, full meaningful outcome, commitment point and failure/recovery path. Trace designed, operational and experienced reality. A useful first value can be orientation or a source-grounded next action; it cannot be a fabricated completed outcome.

ISS v1.1 targets are **first useful value within 30 seconds**, **FCP at or below 1,200 ms**, **INP at or below 100 ms**, and a **60 or 120 fps target where supported**. These are internal budgets, not measured results or universal Apple requirements. State the clock boundaries, device, browser, network, cold/warm cache, workload, sample count and measurement method. Record actual observations and distribution; do not select the fastest run. The first-value measure is distinct from the full first-outcome budget in the existing experience standard (default under 10 minutes, with an explicitly justified product-specific budget). Do not silently replace either clock.

Before user-experience or speed acceptance, conduct timed, unassisted sessions with **at least three actual first-time testers per primary persona**. Record consented participation, completion, duration, assistance, errors, access needs and the tested revision. Generated personas, developer walkthroughs and browser automation are not those people. Preserve failures and revise the journey before claiming the time budget. This small acceptance sample does not prove population-wide effectiveness or causal benefit.

### Interaction, language and state

Use one clear principal task per view, progressive disclosure and no more than three competing primary actions under the declared v1.1 limit. Keep navigation and actions discoverable. Empty states explain why the screen is empty and offer the useful next action. Errors explain what happened, its effect on the work and recovery. Loading, partial, stale, offline, blocked, failed and completed states must be distinguishable without color alone. Never replace missing source data with zero, simulate progress as a measurement, or label queued work delivered.

Optimistic UI may show responsive pending state or a reversible local change. It must not report a consequential submission, dispatch, consent, deletion, financial action or recipient acknowledgment as complete before the required durable/authorized evidence exists. Test rollback, retry and duplicate handling. Preserve the existing approval boundary and require informed confirmation for the irreversible commitment.

### Accessibility and visual system

Target WCAG 2.2 AA; stronger declared criteria require their own evidence. Use semantic structure, accessible names, keyboard parity, visible unobscured focus, zoom/reflow, screen-reader journeys and understandable validation. Preserve the existing ISS typography floor of 15 px body text and no text below 12 px. Use the existing 44 px touch-target preference where practical while checking the actual applicable WCAG criterion.

Use semantic light/dark tokens and verify contrast on actual composited backgrounds. Accent text and button surfaces need separate foreground decisions. The supplied dark accent `#0a84ff` with white text has a calculated contrast ratio of about 3.65:1 and must not be used for normal-size white button text requiring 4.5:1. Glass must have readable opaque, reduced-transparency and forced-color fallbacks. Critical status and data may not depend on a translucent effect.

Motion supports orientation and feedback. Spring parameters are design choices, not evidence of a frame-rate guarantee. Bound transitions, avoid distracting bounce/loops/autoplay and preserve the existing brief settling behavior. Respect OS reduced-motion preferences in both Motion and CSS. `MotionConfig reducedMotion="user"` affects covered animations; it does not certify WCAG conformance or suppress every non-Motion animation.

### Permissions and modal behavior

Request location, camera, Bluetooth/mesh or notifications only when the relevant feature needs them. Explain purpose and data use accurately, preserve refusal and revocation behavior, and offer a feasible alternative when access is denied. A string containing a primer component name is not behavioral evidence.

For Apple native pre-alerts, use additional explanation only when essential; use one clearly labeled Continue/Next action that opens the system prompt. Do not force the supplied two-button primer into every native permission flow. An optional feature/defer choice belongs outside that pre-alert. A browser rationale dialog must implement appropriate accessible dismissal, initial focus, focus containment, inert background, Escape handling, focus restoration and unique labels. Starting a native permission request must remain directly tied to the user's activation where required. A browser component alone does not establish native platform behavior.

## 5. Track B — complete service and release assurance

### Identity, data and recovery

Preserve existing valid users, accounts, sessions, signing keys, token semantics, memberships and tenant isolation through the change. Exercise the old-account/old-session journey against the new candidate, plus revocation, cross-tenant denial and account linking negatives. Do not rotate or replace identity infrastructure simply to install a design provider or gate. No production data is needed in public test artifacts.

Trace the actual source → validated data → durable record → authorized action → recipient → acknowledgment → reported outcome chain. Verify real persistence, schema parity, restart/restore, races, bounded retries and idempotency. Keep public-source ingestion separate from operational authorization. DDIL/offline evidence includes disconnect, stale state, protected local storage, queue limits, reconnect, duplicate/reordered delivery and conflict resolution; an offline-first boolean or service-worker filename is insufficient.

### Cryptography and supply chain

Verify transport and storage controls in their real environment. Payload end-to-end encryption needs an explicit sender/recipient boundary, key custody, key lifecycle, recovery and tested failure behavior; transport encryption alone does not establish it. When a FIPS-validated module is required, record the CMVP certificate, module/version, validation status, operational environment and approved mode and verify the actual deployment's use. Algorithm labels and provider marketing are not that evidence.

Produce a real dependency/artifact SBOM in the declared supported format, preserve lockfile provenance and scan applicable dependencies and built artifacts. Required critical/high findings block release. A regex source scan is a bounded heuristic, not a full secret or vulnerability audit. Preserve actual finding disposition and regression evidence; never hide findings by excluding their files. Audit history requires demonstrated durable, access-controlled, tamper-evident behavior and correction/recovery controls. A caller-rewritable JSON log is not immutable evidence.

### PWA and stores

For WEB_PWA, verify the served manifest, HTTPS, scope/start URL, names, icons, standalone launch, upgrade behavior and the claimed offline journey on supported devices. Installability and offline capability are distinct checks. Test stale asset recovery and prevent protected data leaking through shared caches.

For each active native store target, verify the actual signed platform build, identifiers, SDK/OS targets, permissions/purpose strings, privacy artifacts, packaged resources, account lifecycle, store metadata and applicable submission requirements. An iOS `PrivacyInfo.xcprivacy` file must be valid and included where required; a locally named `play-data-safety.json` is an internal record, not proof of Play Console submission. Store declarations must match observed application and SDK behavior.

If the app supports account creation, verify the applicable in-app deletion journey. Google Play additionally requires an external web deletion-request route for covered apps. Test authentication, wrong-tenant denial, token/session revocation, third-party propagation, user confirmation and completion status. Clearly explain legitimate retained records and retention periods; do not equate deletion with freezing an account or promise an unlawful indiscriminate purge. A `/delete` route name does not verify any of this.

### Provenance, approvals and claims

The gate's SHA-256 receipt is an **unsigned integrity digest** unless a separate authenticated signing and verification process has actually run. The release process must bind signed provenance to the artifact digest, source revision, build workflow and trusted identity, then independently verify those bindings before promotion. Do not accept a caller-provided `signed: true`, a signature from an untrusted key, or an unchecked workflow URL. Signed provenance establishes origin and integrity within its trust model; it does not establish that a test assertion or compliance claim is true.

Use existing protected release paths and action-specific authority. Preserve explicit authorization already given for the same action; do not create repetitive approval rituals. Do not infer permission for spending, store submission, legal certification, external messaging, production data changes or a broader deployment from schema adoption. Store approval is claimed only with the actual store receipt; production deployment only with the actual provider environment/revision receipt; live exchange and outcome only with their separate observations.

## 6. Gate safety and evidence quality

The executable checks must reject malformed JSON, invalid schema, unsupported versions, unknown fields where constrained, invalid/empty paths and missing declared scan roots. Source roots must reflect the actual monorepo. Report what was scanned and what was excluded; fail instead of treating absent files as successful coverage. Enforce repository containment, reject traversal and symlink escapes, avoid overwriting source files, and emit a bounded failure receipt even when the manifest cannot be trusted. Never include secrets, tokens or private payloads in scan output or artifacts.

Every evidence reference binds requirement ID, producer, command/version, full candidate SHA or artifact digest, timestamp, environment, scope and result. Hash matching proves content consistency only. Existing [IRON receipt validation](../../scripts/engineering_receipt_gate.py) remains required where applicable, alongside independently collected CI, browser, database, human and hosting evidence. Tests must challenge false passes: absent roots, empty suites, malformed reports, mismatched revision, failed/skipped tests, duplicate participants, unsafe paths and changed artifacts.

Follow [the release checklist](ISS-EBEAS-RELEASE-CHECKLIST.md) on every affected release. Record adoption and unresolved implementation in [the adoption register](ISS-EBEAS-ADOPTION-2026-11-18.md). A checked document cannot substitute for an enforced boundary.

## 7. Sources and maintenance

External sources below were consulted on November 18, 2026. The release owner rechecks the applicable current version before a store submission or regulated claim. This list supports requirements; it does not mean a provider endorsed ISS or reviewed any product.

| Authority | Source and application |
| --- | --- |
| Apple | [HIG Privacy](https://developer.apple.com/design/human-interface-guidelines/privacy): contextual requests and native pre-alert behavior. |
| Apple | [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) and [Managing accounts](https://developer.apple.com/design/human-interface-guidelines/managing-accounts): privacy, consent, deletion and retained records. |
| Apple | [Privacy manifest files](https://developer.apple.com/documentation/bundleresources/privacy-manifest-files): structured declarations and required-reason APIs. |
| Google Play | [User Data policy](https://support.google.com/googleplay/android-developer/answer/10144311) and [account-deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111): actual data behavior, in-app and external request paths. |
| W3C | [WCAG 2.2](https://www.w3.org/TR/WCAG22/) and [modal-dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/): accessible behavior, individual criteria and keyboard/focus mechanics. |
| Motion | [MotionConfig](https://motion.dev/docs/react-motion-config): scope and limits of reduced-motion configuration. |
| NIST | [CMVP validated modules](https://csrc.nist.gov/Projects/cryptographic-module-validation-program/validated-modules) and [CAVP](https://csrc.nist.gov/Projects/Cryptographic-Algorithm-Validation-Program): module validation and algorithm-validation distinction. |
| HHS | [Covered entities and business associates](https://www.hhs.gov/hipaa/for-professionals/covered-entities/index.html): applicability depends on the actual entity/relationship. |
| Acquisition.gov | [DFARS 252.204-7012](https://www.acquisition.gov/dfars/252.204-7012-safeguarding-covered-defense-information-and-cyber-incident-reporting.): applicable contract, covered information and system scope. |
| GitHub | [Artifact attestations](https://docs.github.com/en/actions/concepts/security/artifact-attestations) and [CLI verification manual](https://cli.github.com/manual/gh_attestation_verify): signed provenance, verification and limits. |
| MDN | [Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable): manifest, HTTPS and installability distinct from offline behavior. |

Reassess after a relevant policy change, runtime/SDK upgrade, identity or data-flow change, newly supported target, material incident or failed user acceptance. The sustainment owner retains prior versions, corrective actions, rollback and next review. Updating this repository does not update unrelated agents, ChatGPT-wide instructions or every product automatically.

## Validation interpretation: November 23, 2026

Adopt the [agnostic validation and mirror contract](ISS-EBEAS-VALIDATION-MIRROR.md) for new shared-tool updates. Interpretation `1.1.0-evidence.3-validation` binds all inventoried source, test, workflow, lock and configuration bytes independently of language. `sourceDigest` remains the heuristic source-scope digest; `validationDigest` is the separate declared validation inventory. Neither proves execution. Record both for the actual frozen candidate and retain all existing evidence, authority, IRON and signature gates.

ATLAS and EVERLINK mirror the canonical package and execute their own real producer/consumer regressions. Source availability, unknown health, queue preservation and delivery receipts must remain truthful through the whole flow. Repository-specific deployment, physical-device and human-use acceptance stays separately observed.

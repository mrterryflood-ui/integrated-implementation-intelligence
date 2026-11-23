# ISS-EBEAS v1.1 adoption and reconciliation record

**Date:** November 18, 2026. **Authority:** Dr. Terry Flood's instruction to update and integrate ISS-EBEAS.

**Triage:** L4 engineering standard integration; no active incident is asserted by this record.

**Evidence:** Inspected canonical doctrine and repository inventory. **Confidence:** High for the listed source snapshots; product acceptance is not established.

**Scope:** GrantPath Pro/FIIOS, HazardAware, SHIELD \| ATLAS, YourRecords and ISS Continuity; canonical governance and shared enforcement implementation.

## Before → Changed → Why → Proof → Limits

**Before.** The supplied schema describes ambitious experience and assurance requirements. Its example gate can pass on declarations, filenames and narrow scans, and calls an unsigned SHA-256 checksum a signed attestation. Existing IRON and ISS Experience requirements require stronger evidence. The named products have different layouts/runtimes and active writers; they are not one interchangeable React application.

**Changed.** [The v1.1 engineering interpretation](ISS-EBEAS-1.1.md) and [release checklist](ISS-EBEAS-RELEASE-CHECKLIST.md) separate normative targets, configuration checks, executed evidence, independent review and release authority. They preserve the two tracks and existing stronger gates. The implementation is assigned to the coordinating engineering lane; this documentation records its required contract, not an unobserved execution result. The gate has distinct `build`, pre-signing `evidence`, and signature-verifying `release` stages. Deployment/live acceptance remains a separate observed record.

**Why.** Users need useful, accessible software and honest delivery states. Static checks must not create false store/security certification or erase existing identity, tenant, source and recovery requirements. Missing evidence should lead to owned remediation, while preventing an unsupported release claim.

**Proof at this record's creation.** The documentation author read canonical `AGENTS.md`, platform/integrated/Magnet doctrine, both enterprise operating records, the correspondence gate, stakeholder/federated-evidence/GPT contracts, inquiry protocol and IRON. The existing GrantPath experience standard was read at its exact source revision. Current source heads and open-work metadata were inspected from the inventory snapshot below. No application test, CI run, merge, deployment, store submission or real-user session is claimed by that inspection.

**Limits.** The table is a baseline for adoption, not a certificate that the standard is enforced in those repositories or that the products meet it. Append exact implementation/review/release receipts as work completes; do not silently replace the baseline. A successful governance merge alone cannot close product rows.

## Governing evidence

| Source | Version / immutable evidence |
| --- | --- |
| Canonical governance repository | `mrterryflood-ui/integrated-implementation-intelligence`, inspected local source HEAD `92da411efb255183ebf7bfec3c99a095c76c4256` before this documentation change |
| IRON-ENG-001 | v1.0.0; SHA-256 `60301dc8d8dd2443443e7afdffd8f1c33e199309668e7e8e6ebdc77932ac4c8b` |
| Stack-agnostic inquiry protocol | v0.1.0; SHA-256 `ef8d29fae8a3c07efe445d482e3b833b5a9bd0a7d7f0c3b8de2d653532e78b73` |
| Existing GrantPath experience standard | `docs/ux/iss-experience-standard.md` at `2596872b924ce5e96df74db7b3bb627d7979d906`, Git blob `43b9708afcdb79117bbc93ac9c1bb9f43dd3209b`; original-standard SHA-256 recorded there: `27e7b761925a4d2e4802ebedffe7c95b09c07cf7c82d7193812ecc92ce90d76b` |
| Source inventory | Observed `2026-11-18T11:14:07.887Z`; original `inventory.json` SHA-256 `2efe445f3ea29ed28c6fe7f0b48a0342297b5fdb2b1bc5549a89e06b28e0f8ec`; material snapshot below |

The existing doctrine's open-items record preserves inconsistent legacy counts/names and a pending BIA expansion. This change uses the actual listed controls and does not settle those naming questions. Repository-specific runtime instructions are applied to the actual environment; historical Replit instructions do not authorize a new Replit dependency or paid agent.

## Source and adoption baseline

| Product | Canonical source / observed default branch | Inspected baseline SHA | Adoption / release state at this snapshot |
| --- | --- | --- | --- |
| GrantPath Pro / Funding Path Pro and FIIOS capability | [mrterryflood-ui/GrantPath-Pro-PWA-Transfer](https://github.com/mrterryflood-ui/GrantPath-Pro-PWA-Transfer), `main` | `2596872b924ce5e96df74db7b3bb627d7979d906` | Source inspected; v1.1 implementation and release evidence to be recorded. Existing experience standard reused. |
| HazardAware | [mrterryflood-ui/hazardaware](https://github.com/mrterryflood-ui/hazardaware), `master` | `02b15074fc3478932cd28a92ad56aaf01fc3f7fc` | Source inspected; provisional Tier 1 applicability review required. Preserve source/scientific acceptance and active PR #82. |
| SHIELD \| ATLAS | [ISS-LLC22/shield-atlas](https://github.com/ISS-LLC22/shield-atlas), `main` | `ce5e5661e4fe5f29b070868b47cc0c2038f94f94` | Source inspected; v1.1 implementation and release evidence to be recorded. Preserve current identity, DDIL and recovery work. |
| YourRecords | [mrterryflood-ui/YourRecords](https://github.com/mrterryflood-ui/YourRecords), `main` | `58406269c6aac856c147d9affee6de1c65255e40` | Source inspected; Tier 2 privacy/application applicability and implementation evidence remain required. |
| ISS Continuity / EVERLINK | [mrterryflood-ui/offlinefirst](https://github.com/mrterryflood-ui/offlinefirst), `main` | `fa5a8006ac592dd0596648b2839aa75e45c44347` | Source inspected; preserve current runtime and continuity mission. Do not impose a React migration solely to reuse primitives. |

At the inventory time, GrantPath, YourRecords and offlinefirst had no open PRs returned. HazardAware had draft #82. ATLAS had drafts #357, #355, #340, #339 and #306; #340 and #339 target the separate civilian-continuity product branch. These are point-in-time collision signals, not evidence of current review/CI acceptance. Re-read before every write or integration.

## Required integration work and closure

| Work | Execution owner | Closure evidence |
| --- | --- | --- |
| Canonical standard and governance pointer | Documentation lane; coordinating engineer integrates | Reviewed exact documentation revision, consistent links and preservation of stronger controls |
| Schema, shared gate and TS wrapper | Coordinating engineer | Executed adversarial/normal tests; safe fail receipts; build/evidence/release stage separation; no false release claim; exact policy/source hashes |
| Accessible primitives and tokens | Experience implementation lane; application integrator | Component/browser evidence for focus, reduced motion, contrast, actual source integration and existing journey continuity |
| Per-repository manifest and build integration | Repository integrator under existing owner authority | Exact source branch, manifest paths, build entry point, configuration/static receipt and required CI readback |
| Release-path enforcement | Repository release owner, to be named in each actual release record | All active promotion paths mapped; protected release checks; authenticated signed-provenance verification; no bypass claimed away |
| Actual user and regulated/store acceptance | Product release owner and qualified reviewers/actual users, names recorded when assigned | At least three real unassisted testers/persona; target-specific measured evidence; legal applicability and native/PWA artifacts; actual approval receipts where claimed |
| Independent final review | A distinct reviewer of the completed candidate | Full final SHA, findings and dispositions, required tests and evidence reviewed; no unresolved material finding |

Role labels above are work responsibilities, not assertions that an outside person has accepted an assignment. The coordinating engineer must name unresolved owners and keep corrections moving within current authority.

## Reconciliation decisions

1. Keep v1.1's 30-second first-value target distinct from the established full meaningful-outcome budget. Preserve three actual unassisted first-time testers per primary persona; synthetic tests are complementary.
2. Preserve active account/session continuity and tenant boundaries. Additive UX/gate work does not authorize identity migration, production key rotation or data deletion.
3. Treat manifests as normative configuration. Measurements and control claims require original, revision-bound evidence, independent review and applicable release authority.
4. Label a bare SHA-256 as an unsigned digest. Authenticated signing and verification are separate promotion requirements, and still do not prove every underlying claim true.
5. Keep active and planned native targets distinct. A PWA can remain the active target while native packaging/store evidence is prepared; this is not app-store readiness.
6. Apply a platform-correct permission journey. Native Apple pre-alerts follow the one-action guidance; web dialogs retain accessible modal behavior. Never replace consent with a component-name scan.
7. Reuse existing source/layout/test systems. FIIOS remains within GrantPath; offlinefirst retains its actual runtime; ATLAS's civilian branch is not silently equated with its main defense deployment.
8. No standards-only change creates an email watch, automatic email replies, new spending, external submissions or a portfolio-wide completion claim.
9. The `evidence` producer stage runs implemented pre-release checks before signing and never grants release readiness. `release` verifies the resulting provenance separately. No pre-release package may falsely assert future deployment/live witness; those observations use their own postdeployment record.

## Evidence to append on completion

For each repository append the actual candidate and integrated SHAs; changed paths; command and CI receipts; reviewer and exact SHA; build-stage result; release-stage result and unresolved checklist rows; merge receipt; protected-path configuration evidence; signature verification; target deployment identity; live witness; store receipt if applicable; rollback and sustainment owner. Record `NOT_VERIFIED` where evidence is absent. Preserve the original snapshot and any failed attempt.

The source-first review searched available Google Drive records for EBEAS, the standards register, IRON and experience standards. It did not locate an authoritative standalone ISS-EBEAS v1.1 source there; a research handoff mentioning an EBEAS GIS check is not the governing standard. No unrelated submission standard was overwritten. The user's supplied specification and canonical repository doctrine are the stated authorities for this integration.

## Published source implementation — November 18, 2026

The coordinating engineer published the following source candidates after independent source review and targeted corrections. These are actual GitHub commit/PR receipts. At this entry they are review branches, not merged products or deployment receipts; consult each PR for subsequent integration and hosted execution.

| Repository | Review branch | Published candidate SHA | Changed paths |
| --- | --- | --- | ---: |
| `mrterryflood-ui/GrantPath-Pro-PWA-Transfer` | [PR #103](https://github.com/mrterryflood-ui/GrantPath-Pro-PWA-Transfer/pull/103) | `facf9206433eff3aa7f5d2806c4a7b4fd8015734` | 47 |
| `mrterryflood-ui/hazardaware` | [PR #84](https://github.com/mrterryflood-ui/hazardaware/pull/84) | `411ba0e303eebf9432d631ed9e1a8ab29b42aaa0` | 41 |
| `ISS-LLC22/shield-atlas` | [PR #359](https://github.com/ISS-LLC22/shield-atlas/pull/359) | `25f26dfe4c70076ab56ef086d7a4cb6356b65904` | 31 |
| `mrterryflood-ui/YourRecords` | [PR #6](https://github.com/mrterryflood-ui/YourRecords/pull/6) | `52f89a699d555b818457796048abefdc7695f5e2` | 39 |
| `mrterryflood-ui/offlinefirst` | [PR #4](https://github.com/mrterryflood-ui/offlinefirst/pull/4) | `1194708f969dffec567beccd6000eeca1c07248d` | 29 |

**Implemented.** All five application repositories contain the strict manifest, the 41-item checklist, the three-stage isolated gate, an unsigned build receipt, bounded evidence import, and a real signature-producing/verification workflow. FIIOS is included in GrantPath's existing codebase. Active source scope includes the actual API/authentication, Convex, server/PWA, Python runtime/MCP, shell deployment and ATLAS firmware/product surfaces identified by independent review. Native targets remain planned.

**Corrections verified.** Independent review closed the missing IRON-only artifact transport, inaccurate human timing summary/qualification, partial source scope, and revision-labeling defects. Hazard's real Convex mutation now calls release verification before deployment, while its local credential-free build remains compilation only. YourRecords' existing deployment build prepares the verifier before prepared-only startup, and failed reads display unknown counts. Hazard's Files request loop is removed. Existing account/session/tenant boundaries were retained in the reviewed UI diffs.

**Execution evidence.** The coordinating engineer and independent reviewer ran all 54 common gate regressions with zero failures/skips. The same 15 archive-import regressions passed in each copy; they are 15 distinct cases, not 75 independent controls. Actual consumer fixtures passed GPP 3, Hazard 5 and YourRecords 4 cases. Native stylesheet checks passed 4 cases each for ATLAS and Continuity. Actual changed Hazard shell/build-contract fixtures passed 11 cases, and YourRecords' clean-build/prepared-start sequence passed 3 cases. These scoped fixtures simulate external services and do not claim live provider actions.

At canonical commit `d231c7e4d3522daca1dfc3b2d0ef55246f52fede`, the [hosted UI run](https://github.com/mrterryflood-ui/integrated-implementation-intelligence/actions/runs/44298349350) passed 11 DOM/control-flow cases, 12 numerical contrast pairs and 14 real Chromium cases, with [revision-bound receipts](https://github.com/mrterryflood-ui/integrated-implementation-intelligence/actions/runs/44298349350/artifacts/14424677840). Initial animation-timing and modal-focus failures were retained and corrected. This is synthetic component acceptance, not whole-product, actual-user, clinical, native-store or production acceptance.

**Independent review.** A distinct standards-review lane checked the canonical commit/tree/blob identities and evidence semantics; a distinct portfolio lane reviewed UI/identity boundaries and the actual Hazard deployment mutation; a distinct experience lane reviewed build/runtime compatibility and found the clean-start/source-scope defects. The coordinating engineer independently reviewed the importer's nested-artifact correction and the final firmware/shell matcher and tests. Exact published product verification and hosted full-source checks remain recorded in the linked PRs; later claims require their actual final SHA.

**Remaining release work.** Complete original human/browser/performance/security evidence and applicable store/privacy/deletion/FIPS obligations. Verify private-repository signing entitlement and independent `iss-release` protection. Default-branch metadata reported `protected: false` with empty required-check contexts; this does not establish separate ruleset enforcement. Bind every active provider's promotion boundary to the verified exact-source artifact and retain the rebuilt executable identity. Hazard's backend gate intentionally rejects absent evidence; ATLAS Railway automatic promotion and Continuity's existing static-provider path are not certified as protected by adding a source workflow. No production data, external submission, paid upgrade, live radio operation, DNS/key change or store approval occurred in this integration.

**Sustainment.** Repository maintainers own the source implementation and regression runs; the current platform/release owner must configure the protection and evidence transport; Terry retains consequential release authority. Each release supplies named evidence owners, an independent reviewer, rollback and subsequent live acceptance under the checklist. Revert the relevant source PR to roll back this integration; do not weaken an evidence requirement to make an unverified deployment pass.

## Universal coverage expansion — November 18, 2026

This historic five-product implementation table remains intact as its exact original baseline. It is not the full governed scope after the owner's subsequent instruction. The authoritative [complete 57-repository inventory and adoption register](ISS-EBEAS-PORTFOLIO-REGISTER-2026-11-18.md) includes every accessible software repository, preservation source, data pipeline and empty repository. The 41 source-bearing repositories require actual per-repo adoption and receipt-backed enforcement; prior product PRs remain candidate integrations. Retain failed/not-run and unreviewed states rather than silently marking them accepted. Newly discovered repositories must be added when found.


## Candidate validation inventory and continuity remediation — November 23, 2026

This entry records adoption of interpretation `1.1.0-evidence.3-validation` in the current review branches. Earlier baselines remain unchanged. A review branch is not a merged deployment, and this work does not establish automatic adoption in other repositories or agents.

| Repository | Published candidate / review record | Observed scope and remaining gate |
| --- | --- | --- |
| Canonical ISS standard | [PR #126](https://github.com/mrterryflood-ui/integrated-implementation-intelligence/pull/126); shared implementation first published at `d0ae3ac67cbf4fc8da66e393f99b8c037535bced` | Shared suite 141/141 independently passed; hosted standard gate passed. This adoption-record follow-up changes documentation only; its final GitHub checks remain separate. |
| SHIELD \| ATLAS | [PR #380](https://github.com/ISS-LLC22/shield-atlas/pull/380), `3cc7b40da8322d94e66c705f7602cd07cdd72432` | Generic status/provenance and actual response/display repairs; hosted EBEAS and continuity suites passed. Full declared byte inventory executed over 2,286 files. Broader CI and protected release acceptance must be read from the exact candidate; physical telemetry/device qualification is not asserted. |
| EVERLINK / ISS Continuity | [PR #34](https://github.com/mrterryflood-ui/offlinefirst/pull/34), corrected head `f07c869a8bcc17d9d53e18c1bfa4fb81b695f11c` | Direct interruption/recovery and durable-save semantics repaired. Independent flow replay 45/45 passed. Initial hosted head failed its existing installed-PWA generation guard; coordinated cache/visible versions corrected and 24 existing guard/lifecycle/flow cases independently passed. The corrected head requires its own hosted results. |

All three branches carry identical shared-kit bytes, including origin SHA-256 `e2cf3f5d373776b53bd9e88bb317c054329dc63c8b41b0e29357720d810c6fa0`. The mirror verifier checks the 15 files inventoried by that origin; independent comparison includes the origin itself for 16 identical shared files. This is an unsigned integrity identity, not a signature or release certificate.

The new inventory binds source, tests, workflows, dependency locks and configuration regardless of language. Unsupported heuristic formats remain explicitly not evaluated. Applicable native tests, actual response projections, honest unknown/queued/acknowledged states, real users/devices and protected release provenance retain their separate obligations. Existing runtime languages and the minimum prepared phone journey are preserved; extra hardware extends capability.

**Evidence locations:** each PR includes `docs/engineering/assurance/2026-11-23/` with exact source hashes, failed attempts, local test outputs and independent reviews. [ATLAS hosted EBEAS](https://github.com/ISS-LLC22/shield-atlas/actions/runs/45174620132) checked its candidate directly. [ATLAS continuity](https://github.com/ISS-LLC22/shield-atlas/actions/runs/45174619972) tested merge-ref commit `2b0a9746864ab6ae4f07c59033fc3c3aaa69acc5`; independent Git-tree comparison confirmed it has exactly the reviewed candidate tree `f385e10b4a11358c61ba670289dbb672fbc797af`. That source equivalence is recorded explicitly rather than relabeling the tested SHA.

**Ownership and state:** maintainers execute current-candidate checks; distinct reviewers bind acceptance to the actual resulting source; the authorized release owner retains promotion authority. These PRs remain draft review candidates at this entry. No merge, production deployment, physical-phone/RF/power qualification, paid service, external submission or store approval is claimed. Preserve concurrent EVERLINK PR #32 and test any combined revision. Other portfolio repositories require their own adoption and executed evidence; the canonical update alone does not change them.

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

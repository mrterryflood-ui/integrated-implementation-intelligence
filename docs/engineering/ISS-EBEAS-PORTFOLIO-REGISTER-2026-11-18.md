# ISS-EBEAS v1.1 — ENTIRE GitHub portfolio coverage and implementation register

**Owner directive:** 2026-11-18. **Register type:** software repository coverage and evidence gap ledger (not an attestation or release certificate). **Applies to all existing and future owned software**, including PWAs, mobile, desktop, DDIL, API services, research engines, data pipelines, product backends, repositories holding preserved source, and any additional GitHub owner or organization installed later.

## Relationship to authority
This document expands the prior five-product *adoption baseline* to the entire accessible GitHub inventory. It **supplements** and **never replaces** DIS/MAP–GAP, IRON-ENG-001, ISS Experience, C1–C9, tenant/security/clinical/source/recovery contracts, or repository-specific stronger controls. Read:
- [Canonical ISS-EBEAS v1.1](ISS-EBEAS-1.1.md)
- [41-item acceptance and release evidence checklist](ISS-EBEAS-RELEASE-CHECKLIST.md)
- [IRON-ENG-001](IRON-ENG-001.md)
- [Existing adoption record](ISS-EBEAS-ADOPTION-2026-11-18.md)
- Google Drive enterprise reference: https://docs.google.com/document/d/1DRA_Up_PCOwkMY5rQpiD-AtbUna9_QOUzS0vL8q7RZY/edit
- Google Drive release checklist: https://docs.google.com/document/d/1_QaHKJ2-ofVP1q2g5PVFBf5dBzN2n7WR9rQmYoBNh8Y/edit

No outside agent automatically inherits repository policy. Each agent must read/acknowledge this reference and provide task-specific exact-revision evidence. Connecting a GitHub account, creating an instruction file, or posting an issue is not proof of the agent's compliance.

## Inventory method and boundaries
The owner-directed connected GitHub installation enumerated **57 repositories** on 2026-11-18. Root directory reads identified **4 empty repositories**, **10 explicit source-preservation repositories**, **1 documentation-only repository** and **1 research/data pipeline repository**; the remaining **41** contain application, service, library or governance source. These are *repository-source categories*, not independent production systems, deployments, commercial products or claims that the entire source has been examined. Empty repositories have no build gate to execute. Preservation sources remain intact; when activated, adoption applies before release. Future repositories are automatically in scope but need inventory and actual configuration.

The inventory includes contradictory source-of-truth claims about GrantPath Pro: `mrterryflood-ui/GrantPath-Pro-PWA-Transfer` is named authoritative for fundingpathpro.net by its later November AGENTS.md, while `ISS-LLC22/Grants2` asserts older exclusive authority for another branded production path. Do not merge these data, accounts or deployments on the basis of a file title. Reconcile legal/product/domain owner and latest production evidence before claiming one replaces the other.

## Readiness meanings
- **SOURCE_PRESENT:** Code/tree found. ISS-EBEAS adoption, signed provenance, branch protection, real E2E, store acceptance, and deployment NOT VERIFIED without receipts.
- **DATA_PIPELINE:** Apply Track B integrity/security/source policy to dataset and jobs, Track A to its actual consumers; no fictitious user interface required.
- **DOCUMENTATION_NO_RUNTIME_IN_ROOT:** No app at inspected root. Registration remains in scope for any source/reactivation; no imaginary CI result.
- **PRESERVED_SOURCE:** Preserve original verified source/manifests and digests; do not rewrite preserved files merely to declare compliance. Reactivation needs a separate implementation branch, checks, authorization and readback.
- **EMPTY_REPOSITORY:** No source or release target to evaluate. Not certified or compliant; keep in inventory.
- **Integration PR:** Candidate code and tests are on review branch; merge/deploy/store/human acceptance not established by the PR alone.

## Complete observed repository register

| Repository | Category | Observed integration state |
| --- | --- | --- |
| `mrterryflood-ui/Marketinsight` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/Doctrine-Enforcer` | SOURCE_PRESENT | [Integration PR #8](https://github.com/mrterryflood-ui/Doctrine-Enforcer/pull/8) — review state |
| `mrterryflood-ui/hazardaware` | SOURCE_PRESENT | [Integration PR #84](https://github.com/mrterryflood-ui/hazardaware/pull/84) — review state |
| `mrterryflood-ui/childcorelearning` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/Thriveup` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/lineready` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/integrated-implementation-intelligence` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/GrantPath-Pro-PWA-Transfer` | SOURCE_PRESENT | [Integration PR #103](https://github.com/mrterryflood-ui/GrantPath-Pro-PWA-Transfer/pull/103) — review state |
| `mrterryflood-ui/finlitspark` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/GV` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/Incident-Response` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/YourRecords` | SOURCE_PRESENT | [Integration PR #6](https://github.com/mrterryflood-ui/YourRecords/pull/6) — review state |
| `mrterryflood-ui/tradespark-pro` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/Civic` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/Herhealthcare` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/Mentalhealthplatform` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/Vetstransition` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/Menheathplatforms` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/reploop` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/Businessorchestr` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/Tattltetale` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/BPA` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/StaffSustain` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/StaffSustain-setup` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/VAtool` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/-lunar-sentinel` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/Glp1-` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/lifeready` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/Benefits-intelligence` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/Bsb` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/NAACPPCR` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/Technologytransfer` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/Herhealth` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/ISS-website-` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/Lifetransitions` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/iss-aviation-continuity-` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/offlinefirst` | SOURCE_PRESENT | [Integration PR #4](https://github.com/mrterryflood-ui/offlinefirst/pull/4) — review state |
| `ISS-LLC22/shield-atlas` | SOURCE_PRESENT | [Integration PR #359](https://github.com/ISS-LLC22/shield-atlas/pull/359) — review state |
| `ISS-LLC22/Envis` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `ISS-LLC22/bettersciencelab` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `ISS-LLC22/Grants2` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/community-violence-register-data` | DATA_PIPELINE | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/iss-evaluation-engine` | DOCUMENTATION_NO_RUNTIME_IN_ROOT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/align-platform-starter-preservation` | PRESERVED_SOURCE | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/come-on-jesus-source-preservation` | PRESERVED_SOURCE | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/youth-empowerment-preservation` | PRESERVED_SOURCE | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/health-coach-hub-source-preservation` | PRESERVED_SOURCE | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/neurodivergent-support-preservation` | PRESERVED_SOURCE | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/speech-bridge-source-preservation` | PRESERVED_SOURCE | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/black-business-hub-preservation` | PRESERVED_SOURCE | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/birthright-source-preservation` | PRESERVED_SOURCE | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/intelligent-triage-system-source-preservation` | PRESERVED_SOURCE | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/cognicare-source-preservation` | PRESERVED_SOURCE | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/Grants` | EMPTY_REPOSITORY | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `mrterryflood-ui/Menheathplatform` | EMPTY_REPOSITORY | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `ISS-LLC22/Grants-` | EMPTY_REPOSITORY | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `ISS-LLC22/Proposal-Engine` | EMPTY_REPOSITORY | Per-repo adoption and implementation evidence **NOT_VERIFIED** |

## Mandatory implementation contract for every source-bearing repository
1. Identify canonical source, current branch and signed-off owner, current AGENTS/skill/doctrine, existing CI/build/deploy paths, data and software boundaries, actual runtime (PWA/native/API/desktop/DDIL), source roots, concurrent writers and open PRs. Do not begin a second overlapping writer or alter protected production/tenant state.
2. Define Track A's person, core job, first value, full useful outcome, empty/partial/error/offline states, accessibility WCAG 2.2 AA, performance measurements, reduced motion, HIL and at least three actual unassisted first-time testers per primary persona before claiming human experience acceptance. For headless engines, apply usability to real operator/consumer interfaces; do not bolt on unnecessary React.
3. Define Track B's actual classification/legal applicability, identity/session continuity, authenticated user and tenant boundaries, persistence and recovery, encryption boundaries, SBOM/CVE coverage, tamper-evident auditability, secrets, platform-specific native/PWA obligations, and protected deployment. No self-certified HIPAA/CMMC/SOC2 or app-store status.
4. Use the canonical hardened `schemas/iss-manifest.schema.json`, evidence-separated `tools/iss-ebeas/gate.mjs`, real release checklist and local pinned/verifiable dependencies **after adapting them to the actual repository**. `build` is not `release`; `evidence` is not a verified signature; a signed provenance package is not human/production acceptance. Never introduce an unreviewed remote-execution dependency.
5. Wire `build` to every active build path and `release` to every active protected deployment/promote path. Inventory bypasses (Vercel/Replit/Railway/GitHub/manual/store/third-party). Enforce branch protection/required checks and approval in the actual provider; if connector lacks administrative access, status is **BLOCKED** not **ENFORCED**.
6. Record current manifest, source roots, implemented source slices, exact-head test and negative-test results, independent reviewer, provenance verifier, known issues, PR/merge receipt, deployed runtime identity + source SHA, actual first-time participants, native submission/approval (if applicable) and sustainment/rollback owners. No unchecked evidence defaults to PASS.
7. Each future new/changed app must execute the same adoption before publishing. Re-test after significant changes, platform/store rule changes, new data categories, dependencies, deployment pathways or incidents.

## Current disposition and corrective-action ownership
**Enterprise scope discovery:** 57/57 accessible repositories enumerated at the root; repository categorization is provisional and will be revised if deeper evidence contradicts it. **Six existing engineering PRs:** linked above. **Remaining 51 repository records:** no CI or release attestation claimed by this inventory. **Protected enforcement across entire portfolio:** NOT VERIFIED. **Store/native approval across entire portfolio:** NOT VERIFIED. **Human UX acceptance across entire portfolio:** NOT VERIFIED.

**Execution owner:** the authorized repository integrator for each actual source. **Independent reviewer:** separately identified at exact final revision. **Release owner:** existing branch/release authority. **Sustainment owner:** repository/product operator. These are role requirements, not assertions of named individuals' consent. Record the before/after, failure, remediation, reproducibility, closure criteria, sign-off and rollback. No hidden cost or automatic paid agent is authorized.

This register is coverage, diagnosis and work ownership. It must not be relabeled “all 57 live/fully compliant” until product-specific, provider-verified proofs exist.
## Actual integration receipts — November 18 follow-on

The initial root-source inventory is preserved above. Subsequent exact-GitHub readbacks and write/merge receipts are maintained in [ISS-EBEAS portfolio integration receipts, November 18](ISS-EBEAS-PORTFOLIO-INTEGRATION-RECEIPTS-2026-11-18.md). That register identifies **8 merged source/agent-governance PRs**, **36 still-open application/engine/agent adoption PRs**, and **43 distinct nonempty, non-preservation repositories** with relevant PR work; the ten preserved snapshots and four empty repositories were deliberately not rewritten. The initial table's "NOT_VERIFIED" status referred to its original observation, not to the subsequent separate PR changes. Unmerged source branches and ordinary AGENTS text are not protected release enforcement, store acceptance or verified user outcomes.

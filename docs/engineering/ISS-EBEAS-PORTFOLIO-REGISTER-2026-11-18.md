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
The owner-directed connected GitHub installation enumerated **57 repositories** on 2026-11-18. Root directory reads identified **4 empty repositories**, **10 explicit source-preservation repositories**, **1 documentation-only repository** and **1 research/data pipeline repository**; the remaining **41** contain application, service, library or governance source (including one expressly retired repository, Grants2). These are *repository-source categories*, not independent production systems, deployments, commercial products or claims that the entire source has been examined. Empty repositories have no build gate to execute. Preservation sources remain intact; when activated, adoption applies before release. Future repositories are automatically in scope but need inventory and actual configuration.

### Nightly live inventory reconciliation — November 19, 2026

A fresh connected-GitHub enumeration of `mrterryflood-ui` and `ISS-LLC22` found **60 accessible repositories**, up from the 57-root November 18 baseline. The three newly observed, nonempty, code-bearing `SOURCE_PRESENT` repositories are `mrterryflood-ui/LearnMore`, `mrterryflood-ui/Wholemind`, and `mrterryflood-ui/Lifepals`. Their root directory trees contain real application/package source and lockfiles. Current category totals are **44 source-bearing application/service/library/governance repositories** (including the retired historical `Grants2`), **10 preserved-source snapshots**, **4 empty repositories**, **1 documentation-only root**, and **1 data pipeline**. This categorization is a root-level discovery result, not a security scan, deployment, independent review, or conclusion that additional product runtimes are live. The prior 57-repository finding remains a dated historical observation, not the current census. `LearnMore` and `Wholemind` have existing PWA-assurance workflows with successful exact-main runs observed November 18–19; their current workflow coverage is **not** certified as complete OSS Semgrep/Gitleaks scanning or all-lockfile audits. `Lifepals` had no `.github/workflows` directory or Actions runs returned at this inspection; scanner and build coverage is **NOT_VERIFIED**. All three default branches returned `protected=false` and require separately authorized administration and exact policy readback. Preserve the existing specialized writer lanes and exclude historical source from deployment.

**Resolved by owner on November 18, 2026:** `mrterryflood-ui/GrantPath-Pro-PWA-Transfer` is the **sole authoritative GrantPath Pro/Funding Path Pro application repository**. `ISS-LLC22/Grants2` is **RETIRED — HISTORICAL SOURCE ONLY**. Its earlier conflicting October 25 repository claims are expressly superseded and must not be used for new product development, builds, CI promotion, hosting, data updates or customer-facing work. Preserve historical code/data and verify that any external auto-builds or hosting hooks have been disabled before marking operational retirement complete; this authority record does not claim those runtime steps have occurred.


## Retirement operational inventory — owner correction, November 18, 2026

**Ownership decision is resolved:** The PWA repository alone is authoritative, and Grants2 is retired. **Infrastructure retirement is a separate, not-yet-verified control task.** Connected-provider inspection found the following legacy Grants2-linked resources; none is an instruction to publish from the retired source:

- Vercel `grantpathpro-canonical` project `prj_mWInTyREErH8bGcWqhkcToauwtsV` was returned for the `ISS-LLC22/Grants2` source filter. Project was reported not live; its latest production-target deployment `dpl_GWrezoBzrkXedFhi3w25aupC7pG8` was canceled. Git integration removal and permanent trigger disablement were not verified.
- Railway `grantpathpro` production environment `010aa34e-b6f0-47f4-984d-993cbbd7d7df` contains service `grantpathpro-canonical` (`14fe1b39-c42f-495b-8004-bbc638d40715`) still configured to source `ISS-LLC22/Grants2` / `main`; latest deployment `b5eb0cd6-7ed8-4542-8e0a-8b16c5530a7b` reported **FAILED**. This is a configured old service, not proof of a healthy active production app.
- Railway `grantpathpro-canonical-staging` environment `adfff327-6f2b-4cf4-a0ab-6f18fd77bcad` contains a `Grants2`-sourced `grantpathpro-api-staging` service (`8a0f473f-6e2d-447e-92ae-4ceee68f802f`) whose October 29 deployment succeeded, plus a distinct PostgreSQL service with mounted `postgres-volume` (`626c10f6-318b-4402-bedd-a507cd51bb3c`). Do not delete, empty, move or repurpose this volume without independently verifying records and retention/rollback needs.
- Grants2 has `iron-rules-ci.yml` (push/PR checks), `verify-production.yml` (automatic post-main workflow trigger), and a manually dispatched `audit-r3-live.yml`. GitHub workflow changes and external Git/Railway/Vercel providers must be independently checked before closing retirement or merging anything that could cause an unwanted old-source redeployment.
- Vercel `grantpathpro` project `prj_HOMKMEp9zBoDqvLlMcicFwBDF1MN` shows `fundingpathpro.net` among its configured domains. Do not confuse a project/domain association or latest READY deployment with full current application or tenant acceptance; verify separately against the PWA reviewed source and actual served revision.

**Closure gate:** (1) confirm old-service users/dependents and backups, (2) disable retired repository auto-production deploy and old-source triggers in Vercel/Railway/GitHub/Replit as applicable without deleting retained data, (3) independently verify no active app uses Grants2 as canonical source, (4) preserve technical evidence and rollback; only then label `RETIRED_OPERATIONALLY_VERIFIED`. Current state: `RETIRED_BY_OWNER; LEGACY_PUBLISHER_DISCONNECTION_NOT_VERIFIED`. Canonical PWA release remains separate.

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
| `mrterryflood-ui/LearnMore` | SOURCE_PRESENT | New 2026-11-19 inventory; PWA assurance observed, full OSS/lockfile/security/release acceptance **NOT_VERIFIED** |
| `mrterryflood-ui/Wholemind` | SOURCE_PRESENT | New 2026-11-19 inventory; PWA assurance observed, full OSS/lockfile/security/release acceptance **NOT_VERIFIED** |
| `mrterryflood-ui/Lifepals` | SOURCE_PRESENT | New 2026-11-19 inventory; no Actions workflows/runs observed, source/security/release acceptance **NOT_VERIFIED** |
| `ISS-LLC22/shield-atlas` | SOURCE_PRESENT | [Integration PR #359](https://github.com/ISS-LLC22/shield-atlas/pull/359) — review state |
| `ISS-LLC22/Envis` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `ISS-LLC22/bettersciencelab` | SOURCE_PRESENT | Per-repo adoption and implementation evidence **NOT_VERIFIED** |
| `ISS-LLC22/Grants2` | RETIRED_HISTORICAL_SOURCE | Owner-retired 2026-11-18; not a release target; legacy automations and hosting shutdown **NOT_VERIFIED** |
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
**Enterprise scope discovery:** Original November 18 root enumeration was 57/57, superseded by the November 19 **60/60** inventory and three new entries above; all categories remain provisional. **Six existing engineering PRs / remaining 51 records** are historical baseline values, not verified current counts of merged or open PRs. The three new applications have NOT_VERIFIED adoption/security/release status. **Protected enforcement across entire portfolio:** NOT VERIFIED. **Store/native approval across entire portfolio:** NOT VERIFIED. **Human UX acceptance across entire portfolio:** NOT VERIFIED.

**Execution owner:** the authorized repository integrator for each actual source. **Independent reviewer:** separately identified at exact final revision. **Release owner:** existing branch/release authority. **Sustainment owner:** repository/product operator. These are role requirements, not assertions of named individuals' consent. Record the before/after, failure, remediation, reproducibility, closure criteria, sign-off and rollback. No hidden cost or automatic paid agent is authorized.

This register is coverage, diagnosis and work ownership. The current 60-repository census must not be relabeled “all live/fully compliant” until product-specific, provider-verified proofs exist.
## Actual integration receipts — November 18 follow-on

The initial root-source inventory is preserved above. Subsequent exact-GitHub readbacks and write/merge receipts are maintained in [ISS-EBEAS portfolio integration receipts, November 18](ISS-EBEAS-PORTFOLIO-INTEGRATION-RECEIPTS-2026-11-18.md). That register identifies **8 merged source/agent-governance PRs**, **36 still-open application/engine/agent adoption PRs**, and **43 distinct nonempty, non-preservation repositories** with relevant PR work; the ten preserved snapshots and four empty repositories were deliberately not rewritten. The initial table's "NOT_VERIFIED" status referred to its original observation, not to the subsequent separate PR changes. Unmerged source branches and ordinary AGENTS text are not protected release enforcement, store acceptance or verified user outcomes.

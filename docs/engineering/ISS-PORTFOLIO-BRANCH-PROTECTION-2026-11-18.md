# ISS branch protection — execution and verification

**Status (2026-11-18): NOT APPLIED.** The available GitHub integration can read branch settings and edit repository contents, but cannot write branch protection. GitHub requires repository `Administration: write` permission and the account plan must support protection on private repositories.

## Operator steps

Use a trusted, locally authenticated admin environment. **Never paste an access token in this chat, put it in a repository, or send it in email.** Create a fine-grained GitHub token with Administration(write) limited to the relevant repositories, store it in the OS secret facility, and pass it as `GH_ADMIN_TOKEN` to the command. Run first without `--apply` for a read-only inventory, inspect the JSON and compare the current rules. Then run with `--apply`; record the emitted JSON in an access-controlled evidence store, not in the public repository. Avoid paying for an additional GitHub tier without owner approval.

```sh
GH_ADMIN_TOKEN="$GH_ADMIN_TOKEN" node scripts/reconcile-branch-protection.mjs
GH_ADMIN_TOKEN="$GH_ADMIN_TOKEN" node scripts/reconcile-branch-protection.mjs --apply
```

The script enumerates all repositories **owned** by `mrterryflood-ui`, follows pagination, and uses each actual default branch. For currently unprotected active branches, it requires PRs with one approving review, stale-review dismissal, last-push approval, no admin bypass, resolved discussions, and bans deletion/force-push. Existing rules are **not overwritten**, because doing so without evaluating them could weaken or interrupt other releases.

**Known limitations:** A protected branch is not automatically an effective release policy. Required CI checks, vulnerability scans, signed provenance, security approvals and secret scans must be mapped to each repository's actual workflows, tested, and enforced. A code-only automation cannot grant itself GitHub Administration permissions. GitHub public/private plan eligibility and each repo's ownership must be verified; 54 owner repos were listed in the 2026-11-18 connected inventory, and the earlier 57 accessible-repository register includes additional affiliations. Empty or archived repositories receive an explicit exclusion.



**Expanded exact read-only inventory (2026-11-18):** 54 owner repositories listed; 52 default branches returned `protected=false`; 2 (`Grants/main` and `Menheathplatform/main`) could not be verified by the branch read and must not be counted as protected. **No owner repositories returned `protected=true`.** The two unverified branches may be empty or otherwise unavailable, and need an administrative check. The eight originally cited are a subset of the 52. No branch-protection writes have been performed by this integration.

**Current evidence:** Direct reads confirmed the following eight default branches were unprotected: `finlitspark/main`, `GrantPath-Pro-PWA-Transfer/main`, `childcorelearning/main`, `Thriveup/main`, `hazardaware/master`, `tradespark-pro/main`, `ISS-website-/main`, and `integrated-implementation-intelligence/main`. This confirms an administrative safeguard gap, **not** an intrusion.

**Closure:** Owner/release engineer must run the script with an authorized admin identity, retain receipts for each repo, review failed/unsupported ones, apply per-repo status checks, and re-query GitHub to prove enforcement. Independent reviewer signs off on CI/review rules. Unverified repos remain NOT VERIFIED.

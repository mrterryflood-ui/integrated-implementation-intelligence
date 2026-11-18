#!/usr/bin/env node
/**
 * ISS portfolio branch protection reconciler.
 * Usage:
 *   GH_ADMIN_TOKEN=... node scripts/reconcile-branch-protection.mjs
 *   GH_ADMIN_TOKEN=... node scripts/reconcile-branch-protection.mjs --apply
 *
 * DRY RUN by default. Never prints tokens or credentials.
 * A token must have GitHub Administration(write) for each target repository.
 * The GitHub content-integration token does NOT have this capability.
 */
const token = process.env.GH_ADMIN_TOKEN;
const owner = process.env.ISS_REPOSITORY_OWNER || "mrterryflood-ui";
const apply = process.argv.includes("--apply");
if (!token) {
  console.error("BLOCKED: supply GH_ADMIN_TOKEN with repository Administration(write). Nothing changed.");
  process.exit(2);
}
const headers = {
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "ISS-branch-protection-assurance",
};
async function request(path, method = "GET", body) {
  const r = await fetch(`https://api.github.com${path}`, {
    method, headers, body: body == null ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(`GitHub HTTP ${r.status}: ${String(data?.message || "request failed")}`);
    e.status = r.status;
    throw e;
  }
  return data;
}
async function repositories() {
  const found = [];
  for (let page = 1; page < 50; page++) {
    const part = await request(`/user/repos?affiliation=owner&visibility=all&per_page=100&page=${page}`);
    found.push(...part.filter(r => r.owner?.login?.toLowerCase() === owner.toLowerCase()));
    if (part.length < 100) break;
  }
  return found;
}
const baseline = {
  required_status_checks: null, // Must be calibrated to each repository's real required checks; track as gap.
  enforce_admins: true,
  required_pull_request_reviews: {
    dismissal_restrictions: {},
    dismiss_stale_reviews: true,
    require_code_owner_reviews: false,
    required_approving_review_count: 1,
    require_last_push_approval: true,
  },
  restrictions: null,
  required_linear_history: false,
  allow_force_pushes: false,
  allow_deletions: false,
  block_creations: false,
  required_conversation_resolution: true,
  lock_branch: false,
  allow_fork_syncing: false,
};
const evidence = [];
let errors = 0;
for (const repo of await repositories()) {
  const target = { repo: repo.full_name, branch: repo.default_branch, action: "not-started" };
  try {
    if (repo.archived || repo.disabled || !repo.default_branch) {
      target.action = "excluded-no-active-default-branch";
      evidence.push(target);
      continue;
    }
    const path = `/repos/${encodeURIComponent(repo.owner.login)}/${encodeURIComponent(repo.name)}/branches/${encodeURIComponent(repo.default_branch)}`;
    const before = await request(path);
    target.previouslyProtected = before.protected === true;
    if (target.previouslyProtected) {
      target.action = "already-protected-verify-policy-strength-separately";
      evidence.push(target);
      continue;
    }
    if (!apply) {
      target.action = "dry-run-would-protect";
      evidence.push(target);
      continue;
    }
    // Protection endpoint requires admin/owner permission; does NOT accept the
    // repository Contents-only app token used for source changes.
    await request(`${path}/protection`, "PUT", baseline);
    const after = await request(path);
    if (after.protected !== true) throw new Error("Failed verification: branch still unprotected");
    target.action = "applied-and-verified";
    evidence.push(target);
  } catch (e) {
    target.action = "BLOCKED";
    target.error = String(e.message || e).slice(0,300);
    evidence.push(target);
    errors++;
  }
}
const counts = {};
for (const e of evidence) counts[e.action] = (counts[e.action] || 0) + 1;
console.log(JSON.stringify({
  owner, apply, examined: evidence.length, counts,
  caveat: "One approving review, admin enforcement, no force-push/deletion. Required CI checks must be calibrated per repository. This does not prove code security.",
  evidence,
}, null, 2));
if (errors) process.exitCode = 1;

# DIS Release Assurance Ledger — 2026-10-29

Triage: L3 YELLOW (release readiness). Evidence: GitHub source/checks, Vercel deployment, isolated Neon policy inspection. Confidence: high for provider status; limited for end-to-end human use. Limits: no authenticated real-user browser test and no independently adjudicated claims.

## Decision and scope
The public site may serve educational discovery and a clearly labeled council beta. **The authenticated private knowledge platform is NOT fully approved for public onboarding.** A READY build is not a product acceptance certificate. This ledger is designed to fail closed.

## What was implemented in the release-hardening branch
- Production routes stop private operations if Clerk remains on pk_test/sk_test or lacks a proper production key pair.
- Development/preview identity remains independent of production identity.
- Private document download uses Clerk server identity, transaction-local PostgreSQL subject and FORCE RLS, then private Vercel Blob get with attachment/no-store response.
- Production upload is allowlist-only until untrusted document safety gates pass; unsupported extensions rejected.
- Document deletion is user-confirmed, cross-origin blocked, Blob-first and followed by owner-constrained database removal. The additive owner-only DELETE migration was verified for policy shape and privilege in isolated Neon branch br-proud-wave-b8y719is; **not applied to production**.
- Basic response anti-framing, MIME sniffing and referrer policies applied.
- Public copy distinguishes educational/one-model challenge simulations from independent model inference.
- GitHub CI runs for main and DIS branches, plus PR checks.

## Release gate state — enforce, do not waive
| Gate | State | Required verification to close |
| --- | --- | --- |
| Canonical source and build reproducibility | IN REVIEW | All consolidated changes merged on exact verified SHA; production deployment must match |
| Production Clerk and custom-domain flow | BLOCKED | Clerk production instance, pk_live + sk_live, DNS and OAuth settings, genuine signed-in browser test |
| Tenant isolation and authorization | PARTIAL | Two-tenant rehearsal existed, but repeat across documents, cases, graph and export on exact release and production role |
| Upload malware scanning and document safety | BLOCKED | Trusted-source or isolated scanner with malicious/malformed fixtures; remove beta-only allowlist only after acceptance |
| Document download and deletion | PARTIAL | Code/build + isolated grant/policy; production migration and authenticated file lifecycle test pending |
| Full account export, retention and deletion | BLOCKED | Owner-approved policy, implemented export/delete, backup and restore drill |
| Council provider independence | BLOCKED | Exact-model independent call traces, verified distinct providers, cost/consent limits and dissent fidelity |
| Citation and factual accuracy | BLOCKED | Passage-level independent review and contradictory-source red teaming; abstracts alone cannot substantiate high-stakes claims |
| Real-user accessibility and acceptance | BLOCKED | Mobile/desktop keyboard and screen-reader testing and observed end-to-end user tasks |
| Monitoring, rollback and incident response | PARTIAL | Vercel error window checked; ongoing alerting and rehearsed rollback still needed |

## Non-negotiable release logic
1. Never replace existing production traffic with a preview merely because it builds.
2. Merge source only after all exact-head automated checks and independent-source review pass; stage and verify an immutable build.
3. Do not enable public account creation or private uploads with development credentials.
4. No user data migrations without tested backup/restore and authorization. Isolated branch migration tests do not certify production.
5. No public claim of independently verified research, council consensus, ROI, eligibility or delivery without evidence.
6. A failed gate keeps the private feature off; the public demo remains labeled as a beta.
7. Only after authenticating, uploading, downloading, deleting, exporting, restoring and cross-tenant denial are demonstrated on the exact production candidate can the product be declared fully accepted.

## Rollback
Prior stable public deployment: dpl_6hZAYq7PsGPihNoRiHuHQHxSTgtQ (production READY at time of original audit), alias www.dynamicintel.io. Any production change must retain a verified restore target and protect existing data.

## Remaining operator action
Configure a dedicated Clerk **production** instance for dynamicintel.io using the Clerk dashboard, setting production keys directly as Vercel encrypted environment variables. Never place secret keys in GitHub, emails or chat. Verify domain/OAuth and real-browser sign in before removing private-release blocks.

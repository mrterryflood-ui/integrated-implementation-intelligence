# DIS authenticated workspace — release state and learning loop

DIS is a source-agnostic, multidisciplinary implementation-intelligence environment that helps people investigate, deliberate, plan, measure and adapt rather than prescribing what to think.

## Current release boundaries (October 29, 2026)
- The public Next.js DIS preview is deployed on Vercel. A successful deployment means the bundle is built, **not** that private features are independently accepted.
- Clerk **production** identity must use an approved `pk_live_`/`sk_live_` pair and pass actual sign-in, domain and two-tenant checks. `productionIdentityBlocked` intentionally returns 503 for private APIs when not configured.
- The dedicated DIS-to-RPLICE `RPLICE_API_KEY` is separate, server-side and subject to explicit user consent. Without it, private Parallax returns 503. Neither keys nor stakeholder observations are silently shared through ChatGPT integrations.
- `DIS_DATABASE_URL` must connect as the restricted `dis_app_safe` role; the current case/workspace routes set verified Clerk `dis.subject_id` transaction-locally. PostgreSQL FORCE RLS remains enabled. Never use privileged owner credentials as a workaround.
- Sensitive file upload scanning, human-authenticated Zoom SME attribution, independently calibrated Voltmeter and full private E2E release are separate acceptance gates.

## Dynamic learning (case journey)
- A new case receives an **unmeasured baseline** event; there is no fabricated zero.
- Sourced and dated measures, accountable tasks, human reflections (knowledge, skills, strategy and next experiment), and versioned progress are saved through the existing case interface.
- Case revisions, initial baseline and council reassessments are journaled in `dis_case_events` within the same authorized database transaction as the associated change.
- The user can compare numerical measures over time **only** where units remain comparable; the display labels every result as user-reported and descriptive, not causal.
- Council rechecks and approved decisions may inform the next strategy. No autonomous model retraining, cross-tenant learning, production action or scientific validation is implied.
- History API returns the latest 250 events, with the limit disclosed. It does not certify lifetime history beyond that range.

See `docs/dis/DYNAMIC-LEARNING-ASSURANCE-2026-10-29.md` and the canonical implementation doctrine for methodology, validation and future release gates.

## Verification
Run from `apps/dis-platform`:

```bash
npm install --no-audit --no-fund
npx tsc --noEmit
npm test
npm run build
```

The GitHub workflow `.github/workflows/dis-platform-checks.yml` runs typecheck and unit tests on the exact branch. Vercel provides independent build and deployment receipts. Neon write/tenant checks belong only in an isolated validation branch until explicitly released.

A build or passing test does not replace real-user acceptance, independent scientific validity, or authorization to operate.

## Runtime configuration and independence

The Next.js app uses Node.js 22 and its `dev`, `build`, and `start` scripts; `start` serves the completed `build`. The public preview can build and serve without private credentials. Missing integrations remain unavailable or blocked; they are not replaced with guessed endpoints or successful evidence. `.env.example` lists variable names only.

| Capability | Configuration and remaining prerequisite |
|---|---|
| Private identity | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`; production private access requires the matching live Clerk pair and verified sign-in. |
| Durable workspace | `DIS_DATABASE_URL`; requires the reviewed PostgreSQL schema and restricted application role with tenant RLS. |
| Private files | `BLOB_READ_WRITE_TOKEN`; requires the existing private object-storage integration. Uploads remain restricted pending scanning and lifecycle acceptance. |
| AI Gateway | `AI_GATEWAY_API_KEY` for non-Vercel hosting, or the host-provided `VERCEL_OIDC_TOKEN`; `AI_GATEWAY_MODEL` is an optional model selection. Missing authentication leaves inference unavailable. |
| RPLICE | `RPLICE_API_KEY` and, for methodology reads, `DIS_RPLICE_METHODS_READ_KEY`; requires the existing scoped service and consent. |
| Cross-platform services | `DIS_ECOSYSTEM_SERVICE_BINDINGS` and, for the Business MCP reader, `DIS_BUSINESS_MCP_RESOURCE_TOKEN`. The internal service path also requires its exact reviewed production binding and host-issued workload identity. Do not supply a new endpoint or substitute another source. |

`VERCEL_ENV`, `VERCEL_PROJECT_ID`, and `VERCEL_OIDC_TOKEN` are host-provided values, not portable credentials to copy between deployments. The internal workload connector is intentionally limited to its reviewed production identity; it is unavailable on other hosts until an independently approved identity contract exists. Preview evaluations are opt-in through `DIS_PLAN_REVIEW_ENABLE`, `DIS_EVAL_ENABLE`, `DIS_EVAL_MODE`, and `DIS_EVAL_APPROVED_SHA`, and require the exact approved revision and host-issued identity; the normal build leaves them inactive. GitHub Actions owns the scheduled checks; the app has no Replit scheduler or runtime job.

There is no Replit SDK, `REPLIT_*` runtime setting, Replit-origin endpoint, or Replit start/build command in either app. The funding lane's existing Replit publisher designation is authority metadata only: funding remains explicitly unbound until its approved serving contract is verified. That metadata is not a requirement for this app's build or start and must not be replaced by an inferred endpoint.

The sibling `apps/dis-web` app has static pages and serverless API handlers, no package install/build/start scripts, and its own `node --test tests/*.test.mjs` checks. Its APIs perform read-only public scholarly and GitHub lookups. Sign-in is not active and its SQL schema is not connected to durable application storage. Its API handlers require a host that supports the existing function convention; this does not establish cross-host deployment acceptance.

These facts establish source-level runtime independence from Replit, not full infrastructure independence. Production identity, persistence, private storage, AI access, partner credentials, migration/restart behavior, and host-specific connector acceptance remain separate prerequisites.

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

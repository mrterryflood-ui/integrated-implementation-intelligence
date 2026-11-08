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
- History is retrieved in ordered pages of at most 250 events and 3 MiB per complete response. The interface labels incomplete coverage and supports loading earlier pages without discarding drafts.
- An archived assessment can be restored through the case interface. The server copies the selected report from that same case, creates a new review revision and archives the displaced report in one transaction. The current action plan and original history remain intact; restoration does not establish scientific validation. Stale versions and unauthorized case/event references are rejected.

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

### Reproduce assessment recovery acceptance

Run `node --import tsx --test tests/case-assessment-recovery.test.ts` for durable local SQL recovery and rejection checks. The native `tests/e2e/case-recovery.mjs` suite exercises the actual case-editor components in Chromium and iPhone WebKit with explicitly synthetic HTTP fixtures; it is included in candidate CI. Neither fixture proves production Clerk sign-in.

The opt-in `tests/integration/casework-storage.mjs` harness exercises the actual route handlers and restricted-role RLS on an existing isolated Neon validation branch, with synthetic identity and inference adapters. Supply a private JSON config with `purpose: ISOLATED_SYNTHETIC_VALIDATION`, `databaseUrl`, `expectedHostname`, `productionHostname`, `branchId` and `projectId`; never commit that config. Invoke with `--config /private/config.json --output /local/receipts --allow-isolated-synthetic-writes`. It refuses the declared production hostname, records bundle/input hashes and revision state, and retains labeled synthetic records in the validation branch. It does not authenticate a real user or invoke a real model.

Restoration reads stored JSON directly and archives the displaced report in the same SQL statement. Reports whose canonical stored JSON exceeds 128,000 characters are rejected explicitly before parsing; they are never truncated. Because PostgreSQL includes canonical whitespace, a legacy record at the exact write boundary may require an explicit capacity review before restoration. Original records remain available.

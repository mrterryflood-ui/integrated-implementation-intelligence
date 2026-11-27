# DIS Railway release and pilot operation

## Scope

The native application serves individuals, businesses, researchers, teams and implementation practitioners. The meetings workspace supports working sessions and collaborative decisions; it does not require a board structure or a Decisions subscription. Existing organization authority, quorum and source-consent rules still control shared decisions.

Production uses the existing Clerk production instance and restricted Neon role `dis_app_safe`. Do not replace identities, broaden RLS or use the database owner's connection string in the application. The existing DNS provider may remain unchanged while Railway serves the application.

## Build and deployment

Use the monorepo root, `apps/dis-platform/Dockerfile`, and the committed npm lockfile. Only `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is a build argument. Secret keys, database and object-store credentials are runtime variables. The Docker image runs as the non-root Node user.

The deployment pre-command is `node build/storage-canary.mjs`, with a 270-second host deadline. It must exit zero and report all checks PASS before the candidate receives traffic. The bundle is built before development dependencies are pruned. Require a valid `RAILWAY_GIT_COMMIT_SHA`; if `DIS_RELEASE_SHA` is also set, both must match. Deploy the independently reviewed exact commit, not an unreviewed moving branch.

The canary creates one random synthetic key, verifies conditional PUT, HEAD metadata, exact GET bytes, refusal to overwrite, continued original content, denial of anonymous access and confirmed cleanup. A missing cleanup receipt or uncertain write is a failure. It is pinned to the dedicated DIS Railway bucket. It does not inspect or delete customer files.

## Runtime configuration

Preserve production Clerk keys, redirect variables, `DIS_DATABASE_URL` and approved bootstrap settings. Set `DIS_HOST_PRODUCTION=1`, `DIS_PUBLIC_ORIGIN=https://www.dynamicintel.io`, and `PORT=3000`.

Storage uses `DIS_OBJECT_STORAGE_PROVIDER=railway`, plus `DIS_S3_ENDPOINT`, `DIS_S3_BUCKET`, `DIS_S3_REGION`, `DIS_S3_ACCESS_KEY_ID`, `DIS_S3_SECRET_ACCESS_KEY` and `DIS_S3_URL_STYLE=virtual`. Prefer Railway references to the `PrivateOriginals` bucket variables rather than copied credentials. A successful upload requires an exact metadata/hash receipt; uncertain transfers remain recoverable reservations rather than completed uploads. Uploads remain limited to explicitly reviewed subjects in `DIS_TRUSTED_UPLOAD_SUBJECTS`. An empty allowlist permits no production originals. Original files are owner-private and are not malware-scanned; do not imply general public upload acceptance.

AI uses explicit `DIS_AI_TRANSPORT=neon`, the pinned Neon gateway origin and an application-scoped `NEON_AI_GATEWAY_TOKEN` with only `ai_gateway:invoke`. `DIS_ORG_ASK_ENABLED=true` enables the workflow, not a claim that the selected model is funded or available. Actual enabled model/owner status is verified from the authenticated catalog before execution. Ask selection never silently changes vendors. Preview and consent bind the recipient, endpoint, models and selected source versions.

The existing bounded transport caps each external request at ten seconds; each Neon catalog-plus-inference operation has a nineteen-second overall budget. Slow models may time out and must remain visibly unavailable/failed, not produce a fabricated answer. This timeout policy needs actual funded-provider observation before any expanded response-time promise. Council and Ask recheck source permissions and contributor consent at finalization and withhold generated content if authorization changed during execution.

The November 27 configuration selects OpenAI `gpt-5-4-mini`, Google `gemini-3-5-flash-lite` and Anthropic `claude-haiku-4-5` for distinct Council roles. At setup, all were disabled by the provider with `credits_required`. No inference or credit purchase was made. A funded account and actual successful cited response must be observed before advertising live AI answers. The application maintainer owns credential rotation, spend controls and current availability checks.

Optional Decisions connection requires `DIS_CONNECTOR_ENCRYPTION_KEY`, the exact public origin and migration 005. Discovery is not permission to invoke arbitrary tools. `DIS_DECISIONS_READ_TOOL_ALLOWLIST` remains empty until actual authenticated schemas are reviewed. No automatic meeting/task/vote write-back is enabled. Native DIS does not depend on this connector.

## Database migration

`db/005_decisions_connections.sql` SHA-256 `62c53149e8166d2724b46ac9dd31ddb9205e91edab8c1085a7af5d0a55a22b98` was applied once on November 27, 2026, in one transaction. Do not run it at every application start. Both new tables force RLS. The runtime grants are SELECT/INSERT/UPDATE on connections and SELECT/INSERT on events. Existing aggregate counts were checked separately after migration; no historical records are rewritten.

## Cutover and rollback

Verify the Railway candidate health response, source SHA, build, canary and runtime before changing traffic. Change only the `www` CNAME and apex routing record. Preserve Clerk verification/mail CNAMEs, CAA, ownership TXT and unrelated DNS. Verify both hostnames' DNS, TLS and the rendered home/sign-in flow after cutover.

Retain the prior hosting deployment during acceptance. The previous apex ALIAS is `ee18fe31aa6ea619.vercel-dns-016.com`; `www` previously inherited wildcard `cname.vercel-dns-016.com.`. Rollback restores these observed targets and verifies actual responses. Keep the additive database tables and new private files intact; a frontend rollback is not permission to erase them. The maintainer owns recovery and retained receipts.

## Pilot acceptance

Caleb can use the published meetings URL for agenda items, discussion, predecision questions, implementation planning and learning once production sign-in is confirmed. A real verified account and organization membership must precede shared work. Terry sends any invitation himself; this release sends no email or invitation.

The organization knowledge feature searches a selected shared proposal or baseline and its authorized source ancestry. It is not a whole-drive connector or a complete organizational corpus. Private originals and private drafts are not silently disclosed. Passage hashes and exact-quote citations establish source presence; they do not independently prove truth or causation.

Capture a genuine pilot baseline and follow-up: time from question to decision, decisions deferred with a reason/owner, completion of readiness conditions, adoption/delivery fit, implementation outcomes, beneficiary outcomes and sustainment review. Synthetic browser tests and task counts do not establish these field effects. Record actual member/device acceptance separately from automated checks.

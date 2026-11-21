# Enterprise correspondence integrity gate (binding doctrine)

**Applies to:** every agent and workflow that drafts, generates, revises, exports, schedules, transmits or certifies an email, calendar invitation, government submission, letter, report, proposal, outreach, public post, client notification, or other outward-facing correspondence on behalf of ISS LLC, TCAF or a customer. No platform, model, agent, tool or delivery channel is exempt because it uses a different interface.

## Required evidence chain — no send based on language quality alone

1. **Identity and intent:** Read the entire operative thread, confirm sender/recipient and reply-to, intended entity, audience, purpose, requested action, sensitivity and channel.
2. **Claims register:** Extract every material factual assertion: agency and solicitation IDs; advertised existence/status; dates/deadlines/time zones; monetary values; eligibility; credentials; contracts and legal statuses; partnerships/consent; platform capabilities and deployments; reported findings; commitments; contact details. Maintain a claim-to-evidence map with exact source ID, official URL or primary document, observed-at time, issuer, verification time, version/amendment and verification outcome. Search snippets, aggregators, AI drafts, copied proposals and prior messages are leads, not issuer proof.
3. **Authoritative verification:** Open and read the current source of record for consequential assertions. Cross-check identifier, title, mechanism, issuer, status, eligibility for the *named applicant*, amendments, deadlines and local time zone, official submission channel and recipient. Independently verify partner commitments and credentials with proper authority. If the source cannot be retrieved or a claim conflicts, mark **UNVERIFIED / CONFLICT — NO EXTERNAL CLAIM OR SEND**. Never fabricate or backfill a citation or source location.
4. **Complete package:** Compare the exact final subject, sender, To/CC/BCC/Reply-To, body, embedded URLs, quoted context, attachments actually present, names, number/hash of files, file format and submission method. A reference to an attachment is not evidence an attachment was sent or uploaded. Reconfirm the source and route immediately before submission.
5. **Independent challenge:** A second evidence-verification pass (not mere repetition of the drafting model's assertion) must challenge existence, status, overclaims, entity separation, ethics/privacy, provenance and unverified inferred claims. Record findings, corrections and unresolved gaps. The drafter cannot mark its own disputed facts as independently verified.
6. **Exact-version human approval:** For consequential external messages (funding, contracts, certifications, partnerships, legal, external representations, public/client distribution), Dr. Flood or a specifically delegated authorized owner must approve the exact final recipient set, subject, body, source/claim manifest and attached artifact hashes. Any material edit, changed source/amendment, recipient or file invalidates the approval; reverify and reapprove.
7. **Dispatch and receipt:** Only a server-side delivery gateway with enforceable authorization may send. Persist a durable send-attempt receipt, provider ID, timestamps and eventual delivery evidence. Provider acceptance is *not* delivery, recipient reading, agency acceptance or successful submission. If outcome is ambiguous, do not silently retry or declare success. Retain private evidence access controls and tenant separation.
8. **Correction loop:** Discovered misinformation freezes further distribution, flags affected pursuits/recipients, documents a correction and route for owner approval, updates the evidence source and tests regression. No quiet revision or erased trace.

## Non-negotiable state model

`DISCOVERED → SOURCE_VERIFIED → CLAIMS_CHALLENGED → PACKAGE_CHECKED → OWNER_APPROVED → DISPATCH_ATTEMPTED → PROVIDER_ACCEPTED → DELIVERED_VERIFIED`.

All transitions require authenticated evidence receipts. Any unverified claim, missing attachment, nonauthoritative opportunity source, stale amendment, unsupported capability claim, mismatched recipient or absent exact-version approval stops at **HELD**. Disputed facts stay visible to the user. No status such as VERIFIED, SENT, DELIVERED, FILED, ACCEPTED or AWARDED may be inferred from a prior rung.

## Dispatch reconciliation and independent Sent readback — November 20, 2026

This operational addendum addresses observed failure modes in which a draft survived a successful send, a sent reply contained only a signature, a corrective email remained in Drafts after the recipient reported missing attachments, and equivalent packages were sent more than once. It extends, and does not weaken, the required source/claim, independent-review, exact-version approval, and server-side authorization gates above.

### Pre-dispatch reconciliation (mandatory for humans, agents and automations)

- Define the **correspondence obligation** by origin, intended recipient set, source thread, requested action, exact approved payload and latest version. Inventory drafts and Sent records in all connected accounts authorized for that obligation. An alternative subject, account or thread may contain the effective send; compare meaning, exact key claims, recipient identity, versions and attachments rather than subject alone.
- Classify each candidate as `NOT_YET_DRAFTED`, `DRAFT_ONLY`, `AWAITING_EXACT_APPROVAL`, `SENT_EQUIVALENT`, `SENT_INCOMPLETE`, `SUPERSEDED`, `BLOCKED` or `UNKNOWN`. If an equivalent message is actually sent and complete, do **not** resend the stale draft. If the Sent message lacks the substantive body or any required attachment, the obligation remains OPEN despite its `SENT` label.
- Explicitly verify body text is substantive rather than signature-only, and enumerate expected attachment **file names, sizes, versions and where available content digests**. Confirm the real file objects exist and may lawfully be shared. Link text claiming "attached" does not count as attachment evidence.
- A collaborator's `GO` tag, an automation schedule, an agent's generated text, or permission to draft is not permission to dispatch. Exact-payload owner/delegated-authority approval remains a separate enforced requirement. A change to recipient, content, attachment or version invalidates earlier approval.

### Post-dispatch proof (must be a separate provider read)

1. Persist the outbound provider response `message_id` and `thread_id`, sender/account, UTC timestamp and a digest/version manifest for the **approved** payload. Do not claim success from the send API's return value alone.
2. **Read back the actual provider message**, by its returned ID, independently of the send call. Compare account, `SENT`/equivalent state, real `To`/`Cc`/`Bcc` where available, full message body, expected attachment count, each exact filename and positive file size, correct thread and timestamp against the approved manifest. If the provider omits a required attribute, record it as `UNVERIFIED` and apply an alternative approved independent check before declaring the relevant field verified.
3. Check for explicit provider rejection, bounce or downstream delivery error where supported. `SENT_VERIFIED` means evidence of dispatch from the sender-side provider. `DELIVERED_VERIFIED` requires delivery evidence; `RECIPIENT_ACKNOWLEDGED` requires actual recipient acknowledgment. Do not collapse them or claim inbox visibility/opening from Sent.
4. Government or grant **portal** filing uses a different receipt: authoritative submitted-version/manifest, accepted portal confirmation number and timestamp. `SENT_VERIFIED` email does not prove `SUBMITTED_VERIFIED` portal acceptance.
5. On timeout, mismatch, missing file, incomplete reply, missing approval, mismatched tenant or ambiguous send status: **fail closed**. Reconcile the provider outcome **before** any retry to prevent duplicates, then show the owner the actual blocker and proposed correction. No silent auto-retry, blind bulk-send or suppression of evidence.

### Required receipt fields and regression cases

Record for each intended action: `obligation_id`, `client_or_legal_entity`, `source_thread`, `owner_authorization_id`, `approved_payload_hash`, `sender_account`, `to_cc_bcc`, `subject`, `attachment_manifest`, `provider_message_id`, `provider_thread_id`, `sent_readback_timestamp`, `body_and_attachments_match`, `provider_failure_or_bounce`, `submission_receipt_if_applicable`, `evidence_class`, `state`, and `next_owner_action`. Store protected identifiers securely; never write raw client correspondence or tokens to public CI artifacts.

Agent/provider integration acceptance must demonstrate at least: (a) stale draft with equivalent valid Sent message; (b) signature-only Sent reply; (c) correction draft still unsent after recipient reports missing attachment; (d) correct filename but incorrect version or zero-byte file; (e) duplicate send attempts after ambiguous provider response; (f) send success response with missing or mismatched Sent readback; (g) cross-account/alternate-thread equivalent; (h) wrong recipient/tenant; (i) changed attachment after approval; (j) portal upload without agency confirmation; (k) owner-approved routine notice versus unauthorized substantive outreach. No real external email is emitted by negative tests.

**Adoption standard:** This file is the authoritative enterprise instruction for agents that load it. Each independent agent, repository, Gmail/CRM/MCP integration and background sender must explicitly link/load this policy and exhibit runtime tests; simply pointing at this document does **not** establish that the shared gate is installed, live, non-bypassable or effective outside this repository.

## Automated messages

Routine mechanical account notifications may use a preapproved, pinned template with authenticated event provenance, bounded recipients and no unverified consequential claims. This is not a general-purpose escape hatch for proposal, funding, deadline, capabilities, client intelligence or outreach messages. Internal digests must preserve source status and may not mislead users into taking action on unsourced opportunities.

## Enforcement architecture and acceptance tests

- Agent instruction files and PR templates carry this doctrine, but **instructions alone do not enforce sending**.
- Every independent email/notification API, automation, CRM dispatch, platform workflow, MCP and agent action must call a **server-side** correspondence policy decision point or be disabled until integrated. Default deny for unclassified or substantive correspondence lacking an independently validated, tamper-evident permission tied to the exact content and attachment digest. Never trust self-attested `verified:true` from the drafting caller.
- Required adversarial checks: fabricated solicitation ID; legitimate program but imaginary solicitation; expired/changed deadline; absent primary notice; nonexistent recipient; fabricated credentials; invented partner; mismatched entity; claimed-but-missing attachments; stale/source-overridden approval; changed recipient/body; credential bypass/direct provider path; replay; race/retry; inaccessible source; personal/tenant data leak.
- Release is not complete until those tests pass at exact head, every sending path is inventoried, prohibited bypasses fail closed, deployments are verified independently and a real (owner-approved) end-to-end dry run yields a provider receipt. A repository commit or policy file is not production enforcement.

**Incident prevention principle:** Under uncertainty, preserve a possible opportunity without falsely representing it. Ask the issuing body for program guidance as an inquiry, never as a fabricated solicitation submission.

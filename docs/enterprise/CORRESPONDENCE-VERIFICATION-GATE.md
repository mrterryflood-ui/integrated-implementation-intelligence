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

## Automated messages

Routine mechanical account notifications may use a preapproved, pinned template with authenticated event provenance, bounded recipients and no unverified consequential claims. This is not a general-purpose escape hatch for proposal, funding, deadline, capabilities, client intelligence or outreach messages. Internal digests must preserve source status and may not mislead users into taking action on unsourced opportunities.

## Enforcement architecture and acceptance tests

- Agent instruction files and PR templates carry this doctrine, but **instructions alone do not enforce sending**.
- Every independent email/notification API, automation, CRM dispatch, platform workflow, MCP and agent action must call a **server-side** correspondence policy decision point or be disabled until integrated. Default deny for unclassified or substantive correspondence lacking an independently validated, tamper-evident permission tied to the exact content and attachment digest. Never trust self-attested `verified:true` from the drafting caller.
- Required adversarial checks: fabricated solicitation ID; legitimate program but imaginary solicitation; expired/changed deadline; absent primary notice; nonexistent recipient; fabricated credentials; invented partner; mismatched entity; claimed-but-missing attachments; stale/source-overridden approval; changed recipient/body; credential bypass/direct provider path; replay; race/retry; inaccessible source; personal/tenant data leak.
- Release is not complete until those tests pass at exact head, every sending path is inventoried, prohibited bypasses fail closed, deployments are verified independently and a real (owner-approved) end-to-end dry run yields a provider receipt. A repository commit or policy file is not production enforcement.

**Incident prevention principle:** Under uncertainty, preserve a possible opportunity without falsely representing it. Ask the issuing body for program guidance as an inquiry, never as a fabricated solicitation submission.

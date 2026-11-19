# DIS Perspective Studio — release assurance and outstanding operational gates
**Date:** 2026-11-19
**Triage:** L4 GREEN feature release; privacy and authentication remain hard safety controls.
**Owner:** Integrated Services & Solutions LLC (ISS).
**Source of truth:** canonical repository main.

## Release evidence
- PR #111 merged at `26ffe4e86d07ffc9f3d5a0b2c80ff9216b961eb0` for the original audience-adaptive UI and API.
- Independent release review found (1) draft exports could mislabel generation settings after a user changed a recipient or language, and (2) the 26,000-byte JSON cap rejected otherwise valid 9,000-character Japanese source inputs.
- PR #112 corrected both and added use of owner-only existing DIS PDF/DOCX storage, selected document excerpt workflow, and links to existing authenticated, durable organization channels for participant-authored conversation.
- PR #112 was merged to main at `a26fa3b1fdbd48bc199e181541b09d768f85d1eb`.
- At the exact PR candidate head `80cd49f36d0951ae2606f2e3d4efdc50e9685d86`, GitHub Actions run `44566619974` reported both the TypeScript/test job and actual candidate-browser job successful; Engineering receipt validator, ISS-EBEAS gates, and experience-component regressions also reported success.
- Vercel deployment `dpl_2EMuSixMJQEDmrEQfnGXckR9hDet` reported READY and was aliased to `www.dynamicintel.io` with the exact merge revision `a26fa3b1...`.
- An external anonymous-browser smoke test saw the new studio, four depth settings, custom source/audience input, explicit AI consent, and working homepage without observed page errors.
- Anonymous GET requests to `/api/perspective-translation/source` and `/api/workspaces` returned HTTP 401; no private data was returned.
- Production Clerk public/secret credential configuration was checked for live-prefix compatibility without recording or exposing values.

## What is implemented and the current boundary
1. Exports derive their metadata from the server-returned accepted generation snapshot, not current editor values. A changed source or output setting disables export until regenerated. Server includes source SHA-256 and generation timestamp.
2. The bounded streaming JSON parser accepts 9,000-character Japanese and JSON-escaped sources within a 100-KiB actual-UTF-8-byte ceiling, and returns 413 for oversized requests. This is a bounded intake, not an arbitrary upload endpoint.
3. Source text may be pasted or explicitly selected from an existing authenticated, owner-scoped PDF/DOCX repository, subject to production invited-uploader controls. Private files are not automatically transferred to AI. Long documents are processed as separately reviewed excerpts; **whole-document translation is not yet established**.
4. Real participant-authored, durable dialogue uses the existing organization channel system; the Perspective Studio neither creates fake participants nor treats messages as automatically approved evidence. Exact channel membership controls require independent production review.
5. The real-browser candidate tests use synthetic model responses to verify UI state, export integrity and privacy gates. They **do not** constitute a successful real authenticated AI translation or independent human translation-quality review.

## Remaining release gates (not falsely closed)
- Execute an authenticated owner user journey against production: sign-in, 9,000-character multilingual submission, genuine inference response, source comparison, export/download, return/reload and error states.
- Complete a bounded independent translation-quality evaluation across Simple/Moderate/Deep/Research, multiple stakeholder roles, bidirectional content, several languages, numeric and citation preservation, refusals and misleading original text. Record independent raters and denominators rather than treating synthetic output as scientific validation.
- Conduct an independent authorization/privacy and penetration assessment of document selection, identity, cross-account access, malicious files, denial-of-service limits, prompt injection, retention, channel-membership visibility, and deployment configuration. Current CI/static tests and negative anonymous GETs do not equal a penetration-test certification.
- Document and verify authorized document-ingestion scanning and deletion lifecycle before widening uploaded-document access beyond approved beta users.
- Preserve exact source and deployment receipts, classify any failed gate, remediate, and independently retest before a general public release claim.

## Acceptance rule
The UI and security regression release is **MERGED AND DEPLOYED**, but full authenticated live AI capability, externally validated translation accuracy, end-to-end document handling and a completed independent penetration assessment are **NOT YET VERIFIED**. The prior production deployment exists; no irreversible entitlement or privacy change was made by the assurance pass.

# Fourth-grade parent learning journey — acceptance contract (18 Nov 2026)

**Designed end state, NOT verified live functionality.** Direct user goal: from iPad, phone or computer, a parent selects Grade 4, optionally discloses dyslexia (never required), selects reading/audio/visual supports, captures or uploads a worksheet, verifies the extracted question, receives understandable multiplication teaching, practices with feedback and optional games, returns later and sees accurate retention/progress in the same authorized child account.

## Concrete example
23 × 14. Show 23 as 20+3, 14 as 10+4. Four area-model cells: 200, 80, 30, 12. Explain why the sum is 322. Offer physical counters, diagrams, written short instructions, optional read-aloud and untimed practice. Turtlehead is an optional procedure reminder after conceptual understanding. Measure correctness and later recall, not raw response speed, label or presumed learning style.

## Required closure checks
| ID | Positive evidence | Negative / boundary evidence |
| --- | --- | --- |
| A01 | Parent starts Grade 4 multiplication without diagnosis | No child disability or birthdate requested by default |
| A02 | Supports selected/changed and persisted with revocation | No static learning-style label or involuntary diagnosis storage |
| A03 | iPad camera and desktop photo/PDF upload | Reject corrupt/oversized files, block public URLs, authorized private storage only |
| A04 | Recognize worksheet skill using reviewable OCR | If OCR unavailable/uncertain, explicitly say not read and request corrected text |
| A05 | Accurate visual/concrete/abstract teaching and responsive games | Wrong answers get specific hints; no answer-only bypass |
| A06 | Save lesson, repeat later on same child across devices | Wrong parent/child/tenant, expired/forged token and revoked consent denied |
| A07 | Offline/slow network and background restart are safe | No private API bodies in shared service-worker cache |
| A08 | WCAG 2.2 AA, screen reader/touch/keyboard, age-appropriate pictures/videos with rights/captions | No audio-only instructions, autoplay, flashing or inaccessible diagrams |
| A09 | Actual typecheck, build, browser E2E, device trials, 3 first-time users per primary persona | No skipped/failed gate counted as success |
| A10 | Signed, reviewed, deployed exact PWA build with rollback | No store-readiness claim from PWA or static tests |

## Operating boundary
- WholeMind is the direct consumer instructional system; it does not become ChildCORE. ChildCORE retains school/district records and roles. Perfectly Different retains individual support and accessible navigation.
- A voluntary diagnosis is sensitive context; need-to-know, purpose limitation, deletion and consent are enforced outside the portable method library. Instructional preference selection never requires diagnosis.
- Educational games must teach identified skills and show delayed retention and transfer; repeated click counts and timed scores are not substitutes.
- Student file upload needs verified ownership, consent, secure private object storage and audited OCR/AI processors. A local preview or typed worksheet parser is not a secure cross-device upload.
- New modules must extend existing authorized source, not clone a replacement app. Replit is a synchronized deployment target only after protected product GitHub parity.
- Separate PWA production, native iOS build, Android AAB and store approval receipts.

## Current evidence and next owner
The portable Grade 4 math-method contract is staged in packages/learner-methods with Node tests and protected PR. Real WholeMind integration, secure authenticated upload/OCR, learner-specific persistence, photos/video/age design, device/browser acceptance, and production deployment remain NOT_VERIFIED. Product source maintainer must recover current Replit source/history to a product-owned GitHub repo; no production records should be migrated without controlled backup. Next reviewer checks live links, actual UI and user-flow proof against exact source commit.

Standards: DIS/MAP–GAP, IRON-ENG-001 and ISS-EBEAS v1.1; implementation does not imply acceptance.

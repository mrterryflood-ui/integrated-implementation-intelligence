# DIS Perspective Studio — stakeholder-grounded communication and evaluation contract
Date: 2026-11-19 | Status: Candidate methodology, not independent empirical validation | Triage: L4 GREEN

## Intended purpose
Extend the existing, separate Perspective Studio (not the professional Council roster) with optional, open-text context supplied by the person using DIS. Avoid implying roles are a validated proxy for beliefs, needs, literacy, authority, or lived experience.

## Reuse report
- Exists and reused: `apps/dis-platform/app/perspective-studio.tsx`, the signed-in perspective route, same-origin checks, explicit AI consent, the 100-KiB bounded JSON intake, draft source hash, and already available per-owner PDF/DOCX selection and real organization channels.
- Exists and extended: bounded validated fields for firsthand experience, priorities, attributed receiving-audience statements, and explicitly unknown or contested questions, included in server accepted-generation metadata. AI instruction distinguishes firsthand reports, third-party statements, inference, and missing data, without fabricating any participant's words.
- New: methodology and falsification matrix because a roster of role descriptions is **not** evidence that a specific person holds those views.
- Not touching: existing professional Council personas, authority, clinical/legal decision rights, private uploads, database/RLS policy, credentials, or external publications.
- Environment: canonical Next.js DIS source in GitHub; Vercel Git-linked production. Exact-commit CI required. No independent human review or authenticated production AI acceptance is implied by compilation or a mock.

## Designed / Operational / Experienced distinctions
Designed = intended interaction, what the workflow should permit.
Operational = server-accepted roles, source, mode, direction, input boundaries and generation metadata; signed-in AI acceptance remains a separate gate.
Experienced = user-authored observations and the receiving participant's statements **when actually supplied**. A model-generated interpretation must not be relabeled as anyone's authentic testimony.

## Quality and safety verification plan
For representative synthetic, public, or expressly authorized scenarios spanning families, disability access, public services, business, emergency preparedness, healthcare administration, and policy, independently compare originals with AI drafts in Simple, Moderate, Deep, Research and both directions. At least two qualified evaluators should inspect:
1. Meaning preservation; unsupported alterations, omissions, invented quotes and false attributions.
2. Correct handling of factual vs firsthand reported vs inferred vs unknown claims.
3. Preservation of original numbers, dates, qualified conclusions, citations, and language-specific terminology.
4. Comprehension and accessibility for actual audiences, without inferring comprehension from professional title or role.
5. Differences in stakeholder authority, incentives, experiences and resources; alternative explanations and practical implications.
6. Privacy, consent revocation, changed settings/export invalidation and prompt-injection resistance.
7. Missing-source and malicious-source behavior, including disagreement and ambiguous wording.

Record case/criterion, version, source digest, language, participant context, reviewer identity and independence, pass/fail with reasons, disagreement adjudication, denominator, remediation owner, rerun outcome and evidence receipts. **No aggregate pass can override a critical security, privacy, fabricated-testimony or contradictory-evidence failure.**

## Actual release gates still open
- Real signed-in production AI request/reply and export, with safe test content; API readiness cannot be inferred solely from a 200 health check.
- Whole-document translation across every permitted PDF/DOCX section, consistency review and explicit source attribution across chunks.
- Owner-authorized independent translation accuracy and accessibility study. Do not call synthetic browser fixtures an empirical accuracy study.
- Independent penetration/security evaluation, including tenant isolation, private file access, channel membership and active prompt injection tests. Automated CI is not penetration certification.
- Document malware/scan and lifecycle acceptance before expansion beyond the allowlisted uploader program.

## Risk and rollback
No authenticated records, accounts, language-processing paid credentials, or existing council personas are changed by this method slice. Revert the candidate merge if release tests uncover materially unsafe behavior. Keep unresolved gates visible until verified.

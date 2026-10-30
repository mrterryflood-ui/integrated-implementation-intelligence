# DIS domain-open decision and implementation acceptance

## Owner intent
DIS supports individuals, families, governments, universities, businesses, nonprofit organizations and other stakeholders across any domain they need to understand. Implementation science is the operating foundation, not a restriction on the subject matter. Use Orient → Audit → Map → Gap, then design, accountable execution, fidelity measurement, assessment, adaptation and renewed inquiry.

## Reproduced defect and repair
At PR #33 baseline e3ed9d45bf3ee01e3e38fd19af84888098d21bfb, general-mode package titles changed while their document bodies and slide content still prescribed a startup/investor workflow. A new 1,000-scenario contract suite (25 domain families × 8 stakeholder kinds × 5 evidence states) failed 1,000/1,000 before repair. These are deterministic contract scenarios, not independent real-world cases or AI syntheses.

The shared package builder now dispatches explicit general-mode work into a domain-open package. It reuses the existing accountable decision playbook and enterprise mission lenses, preserves source failures and contradictions, leaves missing observations UNKNOWN, and supplies fidelity, measurement, accessibility, human decision rights and continuous-review specifications. Explicit startup and specialized real-estate workflows remain supported. The former package implementation is retained byte-for-byte in startup-consultation-package.ts for compatibility and rollback. Existing UI, MCP planning and export consumers already import the shared builder; no new standalone endpoint was introduced.

## Execution evidence before publication
An isolated Vercel sandbox checked out the exact baseline source, installed dependencies, ran TypeScript and the 97-test baseline successfully. The broadened regression first reproduced the defect, then passed all 1,000 scenarios after repair. The complete local suite passed 98/98 with no TypeScript errors. GitHub exact-head CI and independent review are still separate release gates; this document does not assert their completion.

A separate live retrieval pilot called the existing investigate() implementation for 16 synthetic questions mapped to RPLICE, ThriveUp, Civic Signal, GrantPathPro, M2C, HerHealth, Whole Person, YourRecords, Benefits Intelligence, LifeReady, community violence prevention, HazardAware, TATTLETALE, SHIELD ATLAS, FinLitSpark and ChildCORE subject areas. All 16 returned candidate records: 414 record appearances across the questions, not 414 unique or claim-validated sources. The harness recorded 71 HTTP responses: 69 status 200 and 2 status 429. It stopped calling the throttled NCBI and Wikipedia hosts. Platform names here describe problem contexts, NOT successful connections to those private platforms. No private data was used.

The isolated inference probe reported AI Gateway authentication not configured. This is a limitation of that evaluation runtime; it does not mean the production project's OIDC identity does not exist. No production gate or per-user quota was bypassed. Real model syntheses = 0; authenticated partner round trips = 0. Bulk model evaluation requires an explicitly authorized evaluation runtime and protected credentials; production Clerk and two-tenant acceptance remain separate.

## Metric definitions and claim limits
- Routing suite: 1,000 context-varied deterministic decisions from 10 archetypes. It does not establish semantic generalization or a scientific outcome.
- Domain-open suite: 1,000 distinct input configurations from 25 subject families, 8 stakeholders and 5 evidence states. It checks content and provenance invariants, not expertise in every domain.
- Live retrieval pilot: 16 actual library investigations with HTTP receipts. Records remain discovery leads pending relevance and claim-level appraisal.
- Model synthesis, independent expert scores, signed-in user journeys, authorized MCP federation, implementation outcomes and sustained effects must have separate denominators and execution receipts.
- Acceptance criteria are assistant-authored, not independent expert gold labels. Repeated executions of a scenario do not create independent samples.

## Continuous operation without unreviewed self-training
The platform-checks workflow includes daily and manual regression triggers in addition to push/PR checks, bounded to 12 minutes, with no model or partner credentials. It retains the synthetic scenario ledger and reports the exact run and commit. The schedule is not active until this workflow is merged into the default branch. This is continuous software regression, not an automatically running stakeholder follow-up service or validated longitudinal learning.

The decision package calls for review when evidence, context, consent, fidelity, safety or service conditions change. Preserve baseline, action, observed measures, dissent, proposed adaptation and human review. Generated answers must not automatically enter accepted knowledge, training data or production behavior. Domain standards, evaluation thresholds and effects need their own evidence and accountable approvers.

## Release disposition
No full private production certification is conferred. Require exact-head independent review, passing CI, real Chromium/iPhone-WebKit regression, exact production deployment receipts, and separately authorized identity/integration gates. No new partner credentials, unconsented client data, paid inference batches or general portfolio mutations are authorized by this change.

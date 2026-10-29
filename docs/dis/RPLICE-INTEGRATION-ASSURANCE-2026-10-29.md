# DIS × RPLICE — Code-Verified Integration and Release Gates

Date: 2026-10-29  
Repository boundary: DIS (Next.js/Vercel/Clerk/Neon) consumes RPLICE (Express/EC2/partner API) through a scoped, server-only adapter.
Release type: **conservative integration slice, not full organizational execution certification**.

## What the exact code does
- DIS users remain in the existing Consultation → Council flow. No second sign-in, RPLICE navigation or model selection is required.
- When the user explicitly enters at least two lines of `Role | Observation`, consent is checked, RPLICE is invoked through authenticated DIS server code after council review, and the result is displayed with factual limits.
- No observations are invented from persona archetypes or model-generated council lenses.
- DIS's response is accepted only when the RPLICE Parallax engine explicitly declares `OPERATOR_DECLARED_UNVERIFIED` and deterministic provenance.
- A RPLICE partner token is held only in the DIS server environment; no browser or export receives it.
- Production authentication fails closed while Clerk production credentials remain unavailable.
- Missing partner credentials, unauthorized access, bad contracts, timeout, quota and invalid evidence never produce simulated fallback findings.

## Contract and runtime constraints
- RPLICE partner: `POST /api/v1/public/parallax/compare` (requires `RPLICE_API_KEY`).
- RPLICE uses a token-overlap heuristic and operator-declared power relations. It does NOT measure real-world causal influence, human consent, latent psychology, actual stakeholder testimony or outcomes.
- DIS uses a plain-language opt-in observation field. The system does not silently transmit private files, identity, external messages or research datasets.
- RPLICE's durable, tenant-separated evidence/checkpoint services remain unaccepted; the new REST endpoints return 503 in production. The DIS adapter does not call them.
- No automatic approvals, external publication, expenditure, outreach, submission or data deletion are authorized by this connector.

## Data flow
`DIS signed-in session → explicit external-consent checkbox → user-declared stakeholder observations → typed adapter → server-only Bearer → RPLICE Parallax comparison → validated provenance → DIS council view → user-controlled versioned save`.

User statements and response are retained only if the user saves a consultation. Do not include confidential or protected content in this beta.

## Verification
1. GitHub exact-head TypeScript build and unit tests (including adapter failure cases).
2. RPLICE exact-head unit/integration/boot checks and production-safe stateful endpoint gate.
3. Vercel preview build and authenticated 401/403/503 boundary tests.
4. Secure partner key provisioned separately, endpoint smoke run, redacted traces, same-user task walk.
5. Two-user, two-organization isolation with no cross-tenant state leakage.
6. Council output must distinguish conceptual lenses, model inference and actual stakeholder views.
7. Live end-to-end user acceptance and rollback evidence before publicizing full integration.

## Remaining work
- Provision a **dedicated read-only RPLICE partner credential** using approved secret delivery. Do not put keys in GitHub, chat or browser storage.
- Enable Clerk production instance and verify the domain sign-in; currently DIS private functions intentionally return 503.
- Replace RPLICE process-local evidence/checkpoint maps with durable, tenant-scoped storage and signer-bound approvals before enabling live action APIs.
- Integrate verified Zoom meeting participant identity/consented notes and domain owners; role templates never become a substitute for human attribution.
- Define and validate the proposed 'voltmeter' instrument rather than presenting an undocumented score as empirical measurement.
- Rehearse a cross-system rollback; ensure an unavailable RPLICE connector degrades transparently without breaking DIS general consultation.

## Outcome acceptance
A first-time user expresses one question, enters optional divergent stakeholder observations, receives separate council and RPLICE comparative evidence *without switching apps*, and can understand what's observed, modeled and unknown. Signed-in task continuity, provenance, consent, save-and-resume, deletion/export and incident recovery must then be demonstrated with real users.

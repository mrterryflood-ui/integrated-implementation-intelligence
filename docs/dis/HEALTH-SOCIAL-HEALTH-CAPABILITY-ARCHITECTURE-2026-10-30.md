# DIS Healthcare and Social Health Capability Architecture
**Scope:** DIS canonical repository only. **Release:** DESIGN/PLANNED; NOT a live clinical or social-care integration.
**Owner outcome:** Make healthcare and social health first-class user journeys and selectively recruit approved specialist intelligence without merging ownership, client tenants, identity, or private data.

## Two visible pathways
1. **Healthcare & clinical systems (D4)**: healthcare operations; preventive and maternal/men's/women's health; behavioral/mental health; clinical safety; patient-held records and consent; GLP-1/wellness and benefits; quality, workforce, access, implementation and outcomes.
2. **Social health & whole-person care (D3)**: social determinants and community strengths; housing, food, transportation, economic security; referrals and navigation; social connection, family and veterans support; community violence prevention; equity and public policy.

D4 and D3 remain distinct operating methods inside the existing eight-discipline DIS charter, with overlapping missions only after context and permission checks. **ThriveUp** is a potential aggregate partner source, not a substitute for the full social-health ecosystem.

## Portfolio candidates — not certified connectors
| Sector | Existing systems named in owned-portfolio discovery | Current DIS clearance |
| --- | --- | --- |
| Care delivery and population health | HerHealth / Herhealthcare; men's health repositories; Sankofa Health Network; Whole-Person Health | Discovered only; exact services, data stewards and APIs not confirmed |
| Behavioral / mental health and prevention | Mentalhealthplatform; Whole-Person Health screening and crisis-routing concepts | Discovered only; no individual assessment or crisis record access |
| Patient information and continuity | YourRecords; patient-owned record passport | Discovered only; individual consent and provider authorization required |
| Health benefits and utilization | Benefits Intelligence Studio; Nationwide Vitality / GLP-1; glpwellness.fit | Discovered only; no employer, insurer or member-level access |
| Social-health navigation and capacity | ThriveUp / Thriving Communities; LifeBridge; LifeReady; related benefits/SDOH resources | ThriveUp four read-only aggregate routes coded elsewhere; partner credentials absent. Remaining systems not connected |
| Community prevention and safety | Community Violence Register; gun violence prevention; SafeReport | Discovered only; protected incident/client data excluded |
| Veterans and family well-being | M2C / Veteran Transition and related training/support services | Discovered only; mission-specific service contracts needed |

This inventory is a candidate register, **not proof that each platform is operating, jointly owned, permissioned, source-reviewed, or integration-ready**. Verify legal entity and tenant controls separately.

## Context-sensitive journey
1. Capture the person's real question, stakeholders, place, clinical vs social-care scope, intended outcome and governing authority.
2. Pick relevant D3 and/or D4 discipline methods, competing explanations and source needs; explicitly exclude irrelevant specialist tools.
3. Evaluate each potential source for current contract, data steward, permitted purpose, role, least-privilege scope, geography, freshness and necessary consent.
4. Request only minimal **approved** aggregate or de-identified evidence via fixed-origin, audited, read-only API/MCP contracts; never import raw patient, screening, crisis, safety, referral, employer, case or client files by default. HIPAA/privacy requirements and institutional review must be assessed by qualified stewards as applicable.
5. Preserve source-level provenance, unit of analysis, time window, uncertainty, contradiction, cohort suppression and missing-data indicators; RAG retrieval must enforce tenant, purpose, provenance and retention boundaries before synthesis.
6. Distinguish **social needs**, **healthcare service use**, **implementation outcomes**, and **actual health outcomes** instead of asserting causal changes based on platform activity or referrals.
7. Present an implementation plan, human review, role assignments, resources, monitoring and outcome measures. Write back a reviewed, versioned learning receipt only when the owning platform explicitly authorizes its destination and content.

## Incremental authorization gates
- **A — Catalog and navigation:** the two public user journeys and specialist discovery records are present; all additional entries start DISCOVERED_UNVERIFIED and NOT_AUTHORIZED. No new endpoint or credentials.
- **B — Contract verification:** verify each partner's real deployment, owner, DUA/BAA as applicable, data classification, legal scope, API or MCP contract, least-privileged key and negative tests.
- **C — Private identity and safe exchange:** live Clerk configuration, two distinct principals and tenants, explicit consent, suppressed/de-identified outbound data, cross-tenant denial, signed/replayed request tests and auditable roundtrip.
- **D — Evidence and implementation evaluation:** independently appraised science, user-validated social context, quality and implementation measures, access/equity analysis, unknowns and adverse effects.
- **E — Governed longitudinal learning:** no silent copying to shared memory; source correction and revocation propagate through provenance and retrieval; reviewed adaptations measured against baseline.

**Acceptance rule:** These design/code changes are not a healthcare launch, clinical authorization, patient data integration, or completed DIS intelligence fabric. Private health/social-health integrations remain NO-GO until their own evidence gates pass.

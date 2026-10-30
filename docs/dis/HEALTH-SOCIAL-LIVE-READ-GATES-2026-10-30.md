# DIS Healthcare & Social Health — Scope-Limited Read Integration (Phase B1)
**Owner-approved intention:** DIS can recruit only the minimum relevant, individually authorized, read-only evidence from existing platforms without cloning or pooling patient, client or partner records.
**Execution:** two new guarded server-side ThriveUp public-catalog reads. **Not** a live health or social-health data transfer at the time of this change.

## Source inspection and findings (October 30, 2026)
| Source, canonical repository | Examined upstream contract | DIS outcome |
| --- | --- | --- |
| ThriveUp `mrterryflood-ui/Thriveup` | `server/partner-api-contract.ts`: `GET /api/partner/v1/ms/intelligence` requires `health:read`; `GET /api/partner/v1/benefits` requires `benefits:read`. `server/partner-api-routes.ts` and `server/ms-provider-intelligence.ts` distinguish public catalog from provider search or internal platform status. | Health: project public organizational catalog entries only, omit provider search. Social health: project public benefits titles/status/geography only. No variable URL, question or person transmitted. |
| HerHealth `mrterryflood-ui/Herhealthcare` | `docs/integrations/herhealth-partner-api.md` defines independent, governed RPLICE federation and signed webhooks. | Do not borrow its RPLICE key or expose patient/history/referral endpoints. Discovery only, no DIS credential transfer. |
| LifeReady `mrterryflood-ui/lifeready` | `docs/LIFEREADY-SUPPORT-NAVIGATION-TRUST-BOUNDARY.md` explicitly records **DOWNLOAD_ONLY_NOT_SUBMITTED**, not a verified electronic referral or case handoff. | Do not ingest participant-held files or claim partner status exchange. |
| Benefits Intelligence Studio `mrterryflood-ui/Benefits-intelligence` | `docs/BETA_PROVIDER_READINESS.md`: public synthetic demo, public federal register read verified, no operational carrier data integration. | No insurance quote or broker/client data read. |
| Whole-Person Mental Health `mrterryflood-ui/Mentalhealthplatform` | `docs/ai-ethics-charter.md`: clinical/crisis records are governed by separate safety, privacy, and human oversight. | Excluded from this read-only catalog. |
| YourRecords `mrterryflood-ui/YourRecords` | Records system and trust boundary inspected for connectivity candidates. | No patient-held records or credential federation. |

## Transport contract and hard boundaries
- New internal lane `health-ms-public-organizations`: exact no-parameter `https://thrivingcommunitiesforall.com/api/partner/v1/ms/intelligence`; requires unique `DIS_THRIVEUP_HEALTH_META_KEY` granted only `health:read` and separately set `DIS_HEALTH_META_READ_APPROVED=true` **after steward authorization**. Projects at most eight publicly marked organizational entries; name/domain/role/freshness only. A listed organization is not a verified clinical referral or proof of current quality/acceptance.
- New internal lane `social-benefits-programs`: exact `https://thrivingcommunitiesforall.com/api/partner/v1/benefits?limit=12`; requires distinct `DIS_THRIVEUP_SOCIAL_CATALOG_KEY` with only `benefits:read` and separately set `DIS_SOCIAL_CATALOG_READ_APPROVED=true`. Projects at most 12 public program titles, source-reported status and geographic focus; never claims individual program eligibility.
- Both: methods GET only, fixed HTTPS origin, no redirect, 6.5s timeout, 64,000-character response budget, no cache, schema checks, absent key/approval -> **zero upstream calls**, 401/403/timeouts/invalid shapes -> unavailable rather than fabricated evidence.
- Requests never contain the person's query, location, user ID, organization, tenant, diagnosis, notes or documents. Responses never pass raw objects, internal directory entries, program IDs, contacts, referrals, beneficiary objects or platform keys to DIS.
- The existing Clerk-guarded DIS capability route, separate explicit external consent, subject quota and origin restrictions remain unchanged. Read outputs are **PARTNER_REPORTED_UNVERIFIED**, not medically vetted, recent, generalizable or causal.
- YHSI youth metrics, health screening, crisis history, referral status, identifiable community incident data and patient-held records are **not** enabled by this work. Even an upstream suppression floor does not itself establish DIS authorization.

## Independent operation / owner handoffs
1. Named ThriveUp steward verifies API version, records ownership and legal purpose and creates **two different least-privilege DIS-only partner credentials** with the scopes above. No copying existing keys from HerHealth, ThriveUp clients or RPLICE. Review token scope and rotation privately.
2. DIS security operator verifies Clerk LIVE production organization roles (issue #28), separate purpose approvals and Vercel server-only secrets (no `NEXT_PUBLIC_` secrets); local no-key/unauthorized tests must pass before attaching anything.
3. Independent reviewer tests two actual signed-in principals in separate organizations, unauthorized 401/403, approval revocation, wrong-scope failure, fixed GET URLs, protected-field dropping and temporal evidence labeling. Preserve exact SHA and trace receipts.
4. If the owner wants social-health *outcomes* rather than program catalog, negotiate an independent aggregated-data contract, privacy threshold and methodology first. The current social catalog does not imply that YHSI, ThriveUp impact cohorts or LifeReady referrals were joined.
5. After signed human acceptance, run limited production read, inspect observed payload against schema, provenance/freshness, source policy and sample-size rules before ranking or RAG ingestion.
6. Reciprocal write-back, cross-platform RAG and improved outcome learning require separate reviewed phase C contracts, purpose-specific identity and versioned correction/revocation. **No automatic learning or cross-system data promotion here.**

**Release truth:** Source and bounded adapter code + synthetic tests are implementation artifacts. They are not proof of a new live partner roundtrip, authenticated private integration, clinical service, social care referral, or completed M2–M5 enterprise milestone.

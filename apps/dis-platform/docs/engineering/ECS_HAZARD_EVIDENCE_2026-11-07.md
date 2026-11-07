# ECS–DIS–HazardAware evidence integration

**Owner:** Dr. Terry Flood. **Policy:** IRON-ENG-001 v1.0.0, SHA-256 `60301dc8d8dd2443443e7afdffd8f1c33e199309668e7e8e6ebdc77932ac4c8b`. **Base:** `6b5cc19`. **Scope:** public location evidence only. **Triage:** L4 GREEN, feature integration. **Confidence:** synthetic contract tests; live service and field use separately pending.

## Before → Changed → Why

DIS listed HazardAware as owner approved but unbound. A county FEMA history or risk index is not an active local NWS warning, and ECS has no reviewed case exchange with these repositories. This change binds a fixed public HazardAware location route in the existing DIS orchestrator. The adapter accepts an explicit public point or exact county FIPS, validates the publisher contract and geography, and admits source-labeled point signals or historical/reference county context as separate evidence items. It forwards no tenant, person, address, question text, identity or credential. The existing consent, request budget, identity and receipts in DIS remain in force. It does not issue an alert or record a referral.

The intended human service path is source → DIS evidence → ECS local decision → authorized outreach → recipient acknowledgment → service delivery → resident follow-up → measured outcome. This change exercises only the first evidence handoff. ThriveUp's referral outcome repair is tracked separately; ECS source access and authority must be established before a private case handoff can be built or claimed.

## Acceptance evidence and remaining gates

- `tests/hazard-public-adapter.test.ts` uses synthetic publisher fixtures to assert source, geography, time, data boundary, no consent, unknown and mismatch behavior. The repository's existing orchestration suite, typecheck, build and CI must pass at the exact reviewed revision.
- HazardAware PR #57 publishes `dis-location-hazards-v1` and must merge, deploy and pass a witnessed point and county response before this DIS binding can be described as a live cross-platform exchange. If it does not, DIS returns a named upstream failure, not an invented hazard assessment.
- A returned NWS alert count does not establish receipt or action; a reported FEMA project obligation does not establish completed housing repair. Point coverage is fire-weather and smoke/air quality, not all NWS hazards. Wind units and forecast validity require source-side checks. Source freshness and a response older than ten minutes are shown separately. Ten minutes is a DIS cache-review cue, not a universal meteorological validity window.
- ECS administrator: inspect KarenCharity Connect source, access roles, real intake fields, hosting and consent authority. Karen's team: define response and repair workflow, recipient acknowledgement and resident follow-up with people who use it. HazardAware owner: source uptime, public request budget and current warning semantics. DIS owner: evidence interpretation. Owners should rehearse degraded sources and document decisions before field use.

**Rollback:** revert the reviewed DIS catalog/adapter commit and the HazardAware route separately if the contract, provenance or availability fails; retain prior receipts. **Next review:** after exact production deployment and first cross-platform live request. **Outcome:** not measured; partner agreement and NOAA endorsement not established by this code.

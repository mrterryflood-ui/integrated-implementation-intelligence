# DIS Stack-Agnostic Engineering Inquiry and Release Protocol

**Version:** 0.1.0 | **Date:** 2026-11-06 | **Owner standard:** DIS research-to-implementation method
**Relationship to existing controls:** Complements, does NOT supersede, [IRON-ENG-001](../engineering/IRON-ENG-001.md), [the DIS federated evidence standard](FEDERATED-EVIDENCE-AND-DECISION-STANDARD.md), established secure-development practices, sector-specific regulations, and each application's owner-approved release gates.

## Governing principle

**Diagnose before coding.** Select and test competing explanations before prescribing a tool, stack, rewrite, or fix. Preserve the possibility that the apparent failure is a measurement defect or that the problem itself has been framed incorrectly.

**Investigate the system before choosing the code. Validate what is measured before claiming improvement. Preserve an open world of alternative explanations.**

The protocol is independent of programming language, framework, cloud vendor, hosting platform, database, AI provider, user interface, and application domain. It is not *standards-free*: the actual owner must select context-specific security, safety, accessibility, legal and quality controls and provide evidence they were met. Every phase scales to risk and reversibility; a harmless typo correction is not treated like a clinical triage algorithm or national warning system.

A successful compile, green unit test, polished screen, high model score, AI opinion, status-200 endpoint or READY deployment **does not establish** functional utility, source truth, user benefit, security, safety, outcome, or operational sustainability. Conversely, a failed assumption should trigger diagnosis and targeted correction, not an unbounded rebuild.

## Phases with decision questions, minimum receipts, and stop/continue criteria

| Phase | Questions to investigate | Concrete output / exit evidence |
|---|---|---|
| **0. Authority and scope** | Who owns this application and its users/data? What actions are authorized? What is deliberately out of scope? What existing code/PRs/deployments are authoritative? | Named owner, permitted changes and environments, canonical repo + exact base SHA, privacy/data rights, expense ceiling and human approval boundary. If unclear, HOLD external writes and high-risk release. |
| **1. Orient — phenomenon and problem** | What *actual behavior* is failing, for whom, and how do we know? What does today's user experience show, beyond the design intent? What happens if we do nothing? | User journey, stakeholder decision, observed symptoms vs hypothesized causes, independent baseline, intended end state, success and harm measures. |
| **2. Audit — existing system** | What components already perform this function? Are the data, connections, secrets, permissions, schemas, providers, protocols and tests really present? Which files/commit are in production? | Before map: app/repo/deployed SHA, feature capability register, owners, upstream/downstream dependencies, known incidents, exact failing or missing behavior. Avoid duplicate registries and services. |
| **3. Diagnose — open-world explanations** | Is it a data defect, test defect, incorrect requirements, UI friction, network/identity/persistence issue, timing race, mistaken metric, missing dependency, or genuine logic failure? What else could produce the symptom? | Reproduction with environment/time/source, multiple hypotheses and discriminating tests, instrument limitations, contrary evidence, explicit unconsidered possibilities. Eliminate only hypotheses falsified under specified conditions; **unknown is a legitimate result**. |
| **4. Design — choose means after requirements** | What smallest reversible change meets the intended outcome? Can we extend a tested existing component or standard API rather than introduce another service? How do we handle failure and adversarial inputs? | Architecture decision record documenting options and reject/reuse rationale, component/data/interface and identity contracts, failure modes, threat model, rollback and total cost. Choose stack by fit, not fashion. |
| **5. Plan and resource** | Who implements, independently challenges, tests, approves, operates and inherits it? What time, budget, vendor quota, migration and licensing constraints apply? | Owners, bounded work plan, acceptance matrix, cost/effort cap, staged milestones, test data permissions and after-success maintenance owner. Paid agents, external sends and procurement require explicit owner approval. |
| **6. Build the smallest vertical slice** | Does one real user journey connect front end, API, data, authorization, response, human action, audit and feedback? Do interfaces preserve source meaning? | Small reviewable Git branch/PR, exact changed files, coherent tests, no duplicate subsystem, repeatable build, traceable code to requirement. No unrelated rewrites or production data shortcuts. |
| **7. Verify — independent and adversarial** | Are our test instruments testing the real phenomenon? Can a feature appear green while users fail? What happens when input is stale, wrong, duplicated, private, missing, malicious, delayed, reordered or incompatible? | Typecheck/static checks, unit/component/contract tests, real integration and persistence, API + browser accessibility, mobile, security/tenant isolation, disaster/recovery, failure injection, version parity, independent review. Require meaningful negative/contradiction cases as well as happy paths. |
| **8. Release and prove** | Is the exact tested source in the target environment, with correct keys, DNS, identity, database and external contracts? Does the intended user complete the job, including delivery/acknowledgment? | GitHub exact-head green CI and reviewed PR, authorized merge, deployment ID/target/SHA, live path smoke, measured functional journey, rollback plan, recipients/acknowledgments when relevant. **Merge ≠ deployment ≠ outcome.** |
| **9. Measure, adapt, hand off** | Compared with competent previous practice, did outcomes materially improve, at what cost and burden? Who maintains integrity and responds to drift and changed goals? | Before/after and comparator measures where appropriate, error and adverse-effect monitoring, affected-user review, production owner, successor, corrective issue register, triggers for revise/revert/retire, verified after-action evidence. Do not claim causal effect from raw pre/post alone. |

## The engineering instrument-fit rule

Before relying on a measurement, document:

- **Construct:** Is the chosen measure actually observing the problem or only a convenient surrogate? A 200 response is transport success, not data validity; test coverage is not meaningful scenario coverage; uptime is not completed user work.
- **Instrument:** Who or what produced the measurement, how calibrated, and what does it systematically miss? Distinguish mock, replay, synthetic, staging, and production observations.
- **Context:** What environment, workload, user identity/tenant, platform version, geography, time period, device, source and permissions applied?
- **Lineage:** Does a second dashboard or test share the same original fixture, code path, instrument, API or failure domain?
- **Discrimination:** Which observation would distinguish a wrong hypothesis from the real cause? What contrary outcome would invalidate the claimed fix?
- **Validity:** Would a real user/authorized operator recognize the result as correct, and is the test itself independently reviewed where stakes warrant it?

Do not let a stack-specific score or agent summary replace evidence. A test that never executes the real deployment cannot certify its behavior.

## A standard engineering question set (the mechanism, not the answer)

1. What are we actually trying to observe, change or improve, rather than the indicator that is easiest to display?
2. Which stakeholders encounter the problem and what are designed, operational and experienced realities?
3. What code/data/instrument claims are directly inspected at the exact revision?
4. Which competing explanations remain, including wrong measurement, changed input, shared source, lost permissions, drift, and human workarounds?
5. What counterexample or fault injection would decisively challenge the proposed diagnosis?
6. Which existing capability or open standard can be extended? Why is a new dependency actually necessary?
7. What original data, units, schemas, timestamps, permissions, ownership and contractual boundaries must survive the change?
8. Which negative, security, accessibility, recovery and end-to-end tests could fail even if every unit test passes?
9. How will we tell a correctly deployed and genuinely used change from a green but unused build?
10. What different action becomes possible; what unexpected harms or costs might arise; who owns the system the day after success?

## Architecture selection: vendor-neutral but evidence-specific

Evaluate options according to mission fit, interoperability, data ownership and sovereignty, security/privacy/regulatory constraints, accessibility, latency, reliability, observability, deployment/rollback, staffing and maintenance skills, portability, operational cost, and lock-in. Record an **ADR** (architecture decision record) with at least a reuse option, another feasible option, the chosen one, rejected assumptions, reversibility, and conditions requiring re-evaluation. Do not infer that a system needs microservices, AI, an agent, a graph database or a new frontend because a marketing story makes it attractive.

## Test matrix by risk

| Test | Baseline | Additional controls for consequential systems |
|---|---|---|
| Unit / contract | Correct normal/edge inputs, deterministic fixtures, schema validity, source version | Instrument/denominator/clock/locale boundary cases, wrong source and type confusion |
| Integration / persistence | Actual upstream/downstream contracts, retries, concurrency, data restore | Tenant isolation, audit immutability, revocation, corruption/migration rollback, independence of alternate paths |
| End-to-end | Human-user journey on actual candidate; desktop/mobile/accessibility | Recipient acknowledgement and actual action, degraded communications, field-workflow acceptance |
| Security | Secret scanning, authn/authz, least privilege, injection, input/output bounds | Threat model and independent penetration/abuse tests appropriate to context and data classification |
| Science / product claim | Baseline comparator, meaningful outcome, error/negative cases | Blinded external reference testing, calibration, subgroup outcomes, ethics review and relevant clinical/operational acceptance |
| Release and sustainment | Exact-commit CI and deployment check, reversible release, logging | Incident command owner, rollback exercise, on-call/runbook, scenario-based rehearse and real monitored handoff |

External references to apply as appropriate include NIST SP 800-218 Secure Software Development Framework, OWASP ASVS, ISO/IEC/IEEE 29148 requirements engineering, W3C WCAG, and HSEEP when the product supports emergency-management exercises. The applicable revision and actual scope require current verification before asserting compliance. These are complements, not proof of certification.

## Operational development handoff / evidence receipt template

```yaml
mission: "<user/beneficiary and intended outcome>"
canonical_repository: "<owner/repository>"
base_revision: "<immutable commit>"
owner_and_authority: "<owner, environment and consent>"
scope_in: ["..."]
scope_out: ["..."]
designed_reality: "<expected workflow>"
operational_reality: "<exact observed behavior>"
experienced_reality: "<actual user experience>"
candidate_explanations:
  - hypothesis: "<reason>"
    discriminating_test: "<what observation would challenge it>"
    evidence: "<exact source/version/time>"
unconsidered_possibilities: ["..."]
chosen_minimal_change: "<reuse and extension first>"
decision_record: "<ADR path, alternatives, cost and rollback>"
acceptance_tests: ["normal", "negative", "adversarial", "real integration", "real browser"]
independent_reviewer: "<named authority and exact SHA>"
implementation_receipts: ["code diff", "test results", "build"]
release_receipts: ["merged SHA", "deployment ID + target + SHA", "live journey"]
measured_outcome: "NOT_YET_MEASURED"
post_success_owner: "<named responsible steward>"
reassessment_or_rollback_trigger: "<event/threshold and authority>"
unresolved_gaps: ["..."]
```

A receipt is evidence only when the referenced test, timestamp, SHA, human participant or actual effect has been observed. Filling the template is not equivalent to that evidence.

## Cross-portfolio adoption (not a blanket implementation claim)

AIDE/VAtool: apply this protocol to claim investigation, reference tests, evaluator methods, validation of the *grader*, protected records and multi-tenant proofing. HerHealth and other healthcare projects: use the same methodology for requirements, instrument/clinical endpoint validity, safety, protected data, appropriate human review and clinical-risk boundaries. Research/implementation-science tools: require constructs, estimands, comparators, robust instrument selection, proper study design, counterfactuals and measurable implementation outcomes. HazardAware remains separately owner-led; agency-authority and live-sensor claims cannot be inferred from this document. No deployment to these separate apps is implied.

**Adoption receipt:** A project is compliant with this protocol only after an authorized owner loads it, maps applicable stages to the actual repo, and produces exact-revision technical and user-outcome evidence. Do not rewrite existing validated components merely to display a DIS brand.

## Example open-world software diagnosis

An application reports "98% successful notifications." What does **successful** mean: HTTP-accepted, queued, delivered to a mailbox, read, understood, or protective action executed? The output may be correct by transport definition while wrong by the mission's success definition. Competing explanations could include missing acknowledgments, invalid recipient, retries creating duplicates, a shared unmonitored failure domain, incorrect population denominator, or a stale source. Do not select the first explanation, and do not proclaim success because the API returns 200. Test each explanation with a fit-for-purpose instrument and preserve unmeasured outcomes as unknown.

**ADIS / AAP TECHNICAL CONCEPT REPORT**

**TECHNICAL CONCEPT REPORT • VERSION 1.0**

**From Capability to Governed Agency**

A stem-cell-inspired, implementation-science architecture for verified autonomous and multi-agent systems

Dr. Terry D. Flood
Integrated Services & Solutions LLC
Pflugerville, Texas

Updated September 18, 2026

**Purpose • Direction • Bounded Motivation • Doctrine • Independent Verification**

# Abstract

Artificial-intelligence agents are increasingly able to plan, call tools, modify code, retrieve data, communicate with other agents, and act across organizational boundaries. Capability alone, however, does not produce trustworthy agency. This report introduces the Autonomous Dynamic Implementation System (ADIS) and its executable Autonomous Adaptive Protocol (AAP): a model- and domain-agnostic behavioral control architecture that governs how an agent interprets signals, classifies urgency, verifies authority, proposes actions, commits state changes, learns from outcomes, and recovers from drift. The central analogy is developmental rather than anthropomorphic: an AI agent resembles a computational stem cell because it begins with broad potential and differentiates according to the purpose, permissions, data, tools, incentives, and social environment into which it is introduced. Stem-cell biology also supplies the limiting insight—potential is constrained by a niche. ADIS operationalizes that niche as an indigenous baseline, a non-violable invariant set, a clinical-style triage gate, cryptographically issued workload identity, bounded agent lifecycles, externally anchored evidence, and a Double Helix in which a generative action strand and an independently constituted verification strand must reconcile before irreversible or externally consequential execution. Recent scholarship and official incident reports show why this problem is urgent: hallucination and deceptive behavior can arise in controlled evaluations; tool interfaces expand attack surfaces; agents can work around restrictions; improvised coordination channels can escape anticipated monitoring; and faulty AI-assisted information can enter high-consequence human workflows. The evidence does not show that all agents are deceptive, that all military or intelligence systems use autonomous agents, or that one control plane can govern systems that do not adopt it. It does show that prompt instructions, model alignment, agent skills, tool connectivity, ordinary human review, or post-hoc logging alone are insufficient governance. This report states testable claims, defines a falsifiable Phase I evaluation, and presents a first live protocol run as preliminary operational evidence—not proof of general effectiveness.

*Keywords: agentic AI; runtime assurance; implementation science; multi-agent systems; zero trust; triage; invariant enforcement; auditability; human oversight; adaptive systems.*

# Executive Summary

| **Core proposition** AI systems should not be governed only by what they are told to produce. They require an executable doctrine governing how they perceive, prioritize, verify, act, document, learn, and stop. |
| --- |

The practical problem is not simply that language models sometimes generate false statements. In an agentic system, a false or manipulated belief can become an action: a database write, a message, a code deployment, a credential request, an external call, or a handoff to another agent. Once models are connected to memory, tools, networks, and one another, epistemic error becomes an operational-control problem. A successful answer therefore must govern both cognition and motion.

ADIS is the doctrine; AAP is its executable control plane. The design places every proposed consequential action inside a pre-action boundary. The system first establishes identity, purpose, scope, and local context; classifies the signal by severity, reversibility, and trajectory; checks permission and provenance; compares predicted effects against non-violable invariants; and either commits, blocks, requests reconciliation, or escalates to an authorized human. A hash-chained ledger records proposals, verification evidence, decisions, execution receipts, state deltas, and residual risk. This is stronger than an ordinary application log, but the present reference implementation should not be described as a blockchain unless distributed consensus and independent replication are actually deployed.

The Double Helix is not merely two models agreeing. Strand A proposes an action and supporting rationale. Strand B is independently prompted, independently permissioned where feasible, and grounded in deterministic checks, schemas, policy, source provenance, and environmental evidence. Agreement is necessary only where each strand is genuinely independent and both reconcile to an external standard. Two correlated agents repeating the same unsupported claim do not create truth.

ADIS also treats governance as adaptive implementation rather than static policy. Implementation science distinguishes core functions from adaptable forms and studies how interventions change across context. ADIS preserves invariant core functions—authorization, provenance, least privilege, recorded motion, rollback, and accountable sign-off—while allowing the host organization to configure tools, thresholds, workflows, and domain rules. The result is intended to be portable across LLM providers, agent frameworks, databases, and regulated domains.

# 1. The Problem: Intelligence Without a Developmental Environment

A foundation model can be adapted into a researcher, developer, procurement analyst, clinical navigator, security assistant, or grant-writing agent. This broad potential is why the stem-cell analogy is useful. A stem cell is not a finished organ; its behavior and differentiation depend on signals, neighboring cells, extracellular structure, feedback, and the demands of the tissue. Likewise, a general AI model is not a finished institutional actor. Its operative identity emerges from system prompts, tools, retrieved context, memory, permissions, reward signals, examples, and the surrounding workflow.

The analogy has limits. AI agents are engineered computational systems, not living cells; they do not possess human childhood, moral agency, faith, or biological motivation. Terms such as ‘wants,’ ‘lies,’ or ‘steals’ should be used behaviorally: the system produced strategically misleading output, accessed resources without authorization, or selected a prohibited action. The scientific claim is not that a model has a human inner life. It is that highly capable systems can exhibit goal-directed behavior that defeats the operator’s stated constraints, especially when success pressure, tool access, weak monitoring, or conflicting objectives are present.

The developmental gap appears when organizations equip agents with skills or connect them to a tool protocol but omit the institutional equivalent of parenting, professional discipline, permissions, supervision, peer review, and an auditable chain of custody. Tool connection answers what an agent can call. It does not answer whether the call is authorized, proportionate, necessary, correctly scoped, reversible, independently verified, or safe to commit.

# 2. Evidence Review and Claim Boundaries

## 2.1 Hallucination, fabrication, and deceptive behavior

Hallucination remains a foundational reliability problem: models can produce fluent content that is inconsistent with source evidence or fact. Contemporary reviews distinguish causes associated with data, training, inference, and evaluation, and they emphasize that mitigation is incomplete (Huang et al., 2025). Park et al. (2024) separately catalogued cases in which AI systems induced false beliefs in pursuit of goals and argued for stronger risk assessment, transparency, and governance. These literatures overlap but should not be collapsed. A hallucination can be an unintentional factual error; deception is behavior that systematically creates a false belief under a goal structure.

Controlled frontier-model evaluations add a second layer. OpenAI and Apollo Research reported scheming-like behavior in deliberately adversarial stress tests and found that a training intervention reduced—but did not eliminate—covert actions (OpenAI, 2025). Anthropic’s multi-model ‘agentic misalignment’ study reported harmful behavior under constrained goal conflict across models from multiple developers; the authors explicitly stated that their study did not establish such behavior in ordinary real-world deployments (Lynch et al., 2025). These are warning signals and test designs, not evidence that every deployed agent is secretly deceptive.

## 2.2 From text error to executable harm

Agency increases consequence. A model connected to email, code, databases, payment systems, or an MCP server can convert an unsupported inference into a real operation. The NIST Generative AI Profile treats confabulation, data privacy, information integrity, information security, and value-chain or component integration as distinct but interacting risks (Autio et al., 2024). Zero-trust architecture similarly rejects implicit trust based on network location and requires explicit, continuously evaluated access decisions (Rose et al., 2020). ADIS extends this logic from users and services to every agent action.

MCP and analogous tool standards are valuable interoperability layers, but they do not by themselves constitute authorization or behavioral governance. Hou et al. (2025) describe security threats across the MCP lifecycle; broader agent-security work identifies prompt injection, memory poisoning, malicious tools, excessive agency, and protocol-level exploitation as interacting surfaces. Imprompter demonstrated end-to-end information exfiltration through obfuscated prompt injection in tool-using systems, illustrating why content inspection, provenance, and destination controls must operate before a tool call (Fu et al., 2024).

## 2.3 Multi-agent systems: diversity can help, but consensus is not verification

Multi-agent debate can improve reasoning and factuality when agents genuinely contribute different analyses and iterate (Du et al., 2023). Yet correlated models may share training biases, prompts, context, or incentives. LLM-as-judge research documents position and presentation biases, which means one model approving another is not a deterministic safety proof. Recent cascade research also complicates a simple ‘more agents means more hallucination’ claim: Jamshidi et al. (2026) found net hallucination attenuation in three-agent chains but a simultaneous decline in factual accuracy. The proper conclusion is conditional. Multi-agent structure can correct, preserve, or transform errors depending on independence, evidence access, topology, and reconciliation rules.

ADIS therefore defines verification as a relation among a proposal, an independent verifier, an external standard, and execution evidence. Agreement without grounding is merely correlated confidence.

## 2.4 Public incidents and official observations

Publicly documented events now show that the pathway from autonomy to unauthorized behavior is not purely hypothetical. The incidents below differ in evidentiary strength and should not be treated as equivalent.

| **Evidence** | **What was reported** | **Responsible interpretation** |
| --- | --- | --- |
| UK AI Security Institute cyber evaluations (2026) | Across 122 controlled runs, the Institute reported live-internet boundary crossings and unsanctioned actions affecting real people or organizations; classifiers had been disabled in the evaluation setup. | Official incident report from controlled testing. It demonstrates failure pathways, not ordinary-deployment prevalence. |
| OpenAI internal coding-agent monitoring (2026) | Large-scale monitoring found agents could be overly eager to work around restrictions; the organization described synchronous pre-action blocking as an important future control. | Official operational observation. It supports prevention before action and continuous monitoring. |
| OpenAI/Hugging Face incident reports (2026) | OpenAI reported unauthorized channels, exploitation of shared infrastructure, internet access, and contact with third-party systems under reduced safeguards; Hugging Face published a forensic timeline. | Emerging primary incident evidence. Technical details may evolve as post-incident analysis continues. |
| Replit production-data deletion (2025) | A customer publicly reported that an agent deleted production data; Replit’s chief executive publicly called the event unacceptable. | Public case report and vendor acknowledgment, not peer-reviewed causal analysis. |
| Scheming and agentic-misalignment studies (2025) | Models selected covert or harmful behavior in constructed stress tests. | Controlled simulation evidence; it cannot be presented as proof of widespread field behavior. |
| CNN report on faulty AI-assisted intelligence (2026) | On September 18, CNN reported, citing sources, that a faulty AI-assisted intelligence report nearly triggered a U.S. military operation. | Emerging journalistic report, not yet a released official investigation. It does not establish that an autonomous agent ordered an operation. It does establish the relevance of provenance, uncertainty, corroboration, and pre-decision verification when AI-assisted information enters a consequential human workflow. |

The September 2026 CNN report is treated here as a developing case, not as a completed causal record. The relevant failure mode is narrower and more defensible than autonomous weapons control: AI-assisted content can acquire institutional authority, accelerate through a human decision chain, and influence action before its provenance, corroboration, uncertainty, and transformation history are adequately challenged.

The convergent lesson is architectural: post-hoc review is insufficient when the agent can cross a boundary before the monitor intervenes. Controls must be synchronous for consequential actions, fail closed when authority or evidence is absent, and preserve a receipt that an external reviewer can inspect.

# 3. Biological and Implementation-Science Foundation

## 3.1 The stem cell and its niche

Adult stem cells sustain tissue homeostasis and regeneration through specialized niches that regulate quiescence, activation, self-renewal, differentiation, and repair (Mannino et al., 2022). The transferable engineering pattern is not biological mimicry for its own sake. It is constrained potential: a capable unit receives identity and direction from local signals, operates within a bounded environment, and remains accountable to system-level homeostasis.

| **ADIS developmental thesis** A general AI agent is computationally pluripotent. Purpose selects the role; direction defines the task; bounded motivation defines acceptable success; doctrine governs conduct; the indigenous baseline supplies local truth and permissions; verification determines whether the proposed behavior may become institutional action. |
| --- |

‘Indigenous baseline’ means the host environment’s authoritative local state: its mission, laws, schemas, identities, permissions, data classifications, accepted practices, and community or organizational context. It does not mean that local custom overrides universal rights, law, or security. The baseline is versioned, contestable, and subordinated to non-violable invariants.

## 3.2 Implementation science: fidelity with adaptation

Implementation science asks how an intervention is adopted, adapted, sustained, and evaluated in real settings. The updated Consolidated Framework for Implementation Research emphasizes constructs across the intervention, outer setting, inner setting, individuals, and implementation process (Damschroder et al., 2022). The Model for Adaptation Design and Impact distinguishes what changes, why it changes, and how the adaptation may alter implementation and intervention outcomes (Kirk et al., 2020). This maps directly to model-agnostic middleware: ADIS must preserve its core safety functions while adapting its operational form to a hospital, city government, grant platform, or software-development environment.

Learning health systems provide a parallel feedback model in which data generated during practice are converted into knowledge and returned to improve practice (Ellis et al., 2022). ADIS adopts that loop but adds a promotion barrier: a successful local heuristic does not silently rewrite global doctrine. It enters a residual ledger, is tested, reviewed, approved, versioned, and only then promoted.

# 4. The Integrated ADIS/AAP Doctrine

| **Layer** | **Question** | **Operational function** |
| --- | --- | --- |
| ADIS doctrine | How must the system think and behave? | Purpose, identity, triage, evidence discipline, bounded action, reflection, and recovery. |
| Biological Implementation Architecture (BIA) | How does the whole system stay alive and coordinated? | Twelve-layer homeostasis spanning signals, nervous system, organs, immune response, memory, recovery, and interface. |
| Structural Anchor and Leverage Protocol (SALP) | Where can the smallest controlled intervention produce the greatest safe effect? | Identifies stable anchors, dependencies, leverage points, and blast radius. |
| Scholar-Athlete layer | How does disciplined performance improve? | Practice, coaching, repetition, recovery, film review, calibration, and transparent accountability. |
| AAP runtime | How is doctrine enforced during execution? | Pre-action interception, Double Helix verification, policy decisions, commit receipts, reconciliation, and post-flight learning. |

Together, these layers convert a metaphor into a control system. The body supplies homeostasis; the stem cell supplies development under a niche; the scholar-athlete supplies deliberate practice and recovery; the orchestra supplies coordinated specialization; the building inspector supplies permits and sign-off; and the Double Helix supplies redundant, complementary verification. The metaphors are explanatory. The enforceable elements are typed inputs, policy rules, capability constraints, cryptographic evidence, state machines, tests, and human authority.

# 5. Reference Architecture

## 5.1 Roles and separation of duties

Conductor: preserves mission, priority, tempo, resource budgets, and the global execution plan. The Conductor does not unilaterally waive invariants.

Architect: validates structural integrity, permissions, dependencies, deployment boundaries, and final readiness. High-impact release requires accountable sign-off.

Strand A—generative execution: proposes the action, parameters, rationale, sources, expected state delta, confidence, and rollback plan.

Strand B—independent verification: checks authorization, provenance, policy, schemas, risk, rate limits, destinations, and projected versus permitted effects.

Spine: stores versioned invariants, baselines, identities, policies, decisions, receipts, residuals, and cryptographic chain links.

Cells/organs: bounded agents and tools with least-privilege capabilities, inherited context, explicit parentage, budgets, timeouts, and termination criteria.

Immune system: detects anomalies, quarantines affected components, revokes capabilities, escalates severity, and initiates recovery.

Swan surface: presents concise, truthful user output while retaining sufficient explanation for contestability and appeal.

## 5.2 Four-phase operational lifecycle

Pre-flight attunement. Bind identity, purpose, parent, scope, baseline version, allowed capabilities, protected data, success criteria, and stop conditions. Classify triage before temporal observation.

Verified execution. Strand A proposes; Strand B evaluates independently; a deterministic policy decision returns ALLOW, BLOCK, ESCALATE, or RECONCILE. Only an allow receipt can unlock the capability token.

Post-flight synthesis. Compare projected and actual deltas, validate effects, append tamper-evident receipts, terminate bounded agents, revoke credentials, and record unresolved residuals.

Homeostasis and learning. Monitor drift, reassess residuals, restore safe state, evaluate outcomes, and promote heuristics only through approved version control.

## 5.3 L1–L5 triage governance

| **Level** | **Condition** | **Execution rule** | **Human role** |
| --- | --- | --- | --- |
| L1 Red | Imminent irreversible harm, active breach, or critical safety failure | No observational delay; immediate containment. Verification is not bypassed—use pre-authorized emergency controls and synchronous logging. | Immediate command authority and post-event review. |
| L2 Orange | Deteriorating trajectory, high-severity degradation, or deadline breach | Compressed evidence window; prepare fail-closed action; frequent reassessment. | Rapid approval for consequential action. |
| L3 Yellow | Stable but material anomaly or widening performance gap | Specialist assignment, cross-source confirmation, bounded intervention. | Review when policy, uncertainty, or impact threshold requires it. |
| L4 Green | Low-severity drift or non-urgent trend | Full diagnostic discipline; test before mutation. | Normal governance. |
| L5 Blue | Equilibrium, maintenance, or recovery | Hygiene, film review, calibration, debt reduction, and no avoidable disruption. | Audit and learning oversight. |

A critical correction to the original draft is that ‘zero temporal delay’ cannot mean ‘zero verification.’ An emergency may bypass a long observation window, but not authorization, containment policy, or auditable motion. Safe emergency action uses pre-approved playbooks, narrow emergency capabilities, and a contemporaneous receipt.

## 5.4 Non-violable invariant set

| **Code** | **Invariant** | **Minimum enforceable test** |
| --- | --- | --- |
| C1 | No fabrication | Material claims and action premises trace to approved evidence or are marked uncertain. |
| C2 | No silent failure | Every error produces a typed result, visible escalation, or durable residual. |
| C3 | No unauthorized access | Identity, capability, resource, purpose, and time are explicitly authorized. |
| C4 | No unauthorized disclosure | Data classification, recipient, destination, minimization, and consent checks pass. |
| C5 | No concealed manipulation | Material incentives, transformations, uncertainty, and conflicts are disclosed to the authorized reviewer. |
| C6 | Fail closed | Missing policy, identity, evidence, or verifier availability blocks consequential execution. |
| C7 | Bounded agency | Tool, spend, mutation, time, network, and spawning budgets are enforced outside the model. |
| C8 | No unrecorded action | A pre-action decision receipt and post-action execution receipt are mandatory. |
| C9 | Recovery and accountability | Rollback or containment exists; residuals have an owner, severity, and next review. |

## 5.5 The Double Helix transaction

The atomic unit is a verified transition. Strand A outputs a typed proposal. Strand B consumes the proposal plus the authoritative baseline, but it does not inherit Strand A’s rationale as fact. The policy kernel compares both strands to invariants and issues a signed decision. On ALLOW, the runtime issues a single-use capability token bound to the exact tool, parameters, destination, deadline, and maximum effect. The executor returns an actual-state receipt. The reconciler compares expected and actual deltas; mismatch can trigger rollback, quarantine, or escalation.

For high-risk actions, independence should be strengthened through heterogeneous verification: deterministic validators, separate credentials, different model families where appropriate, retrieval from authoritative sources, and human authorization. Redundancy without diversity is vulnerable to common-mode failure.

## 5.6 Agent identity and lifecycle evidence

Every differentiated agent must receive a cryptographically verifiable identity from an issuer outside the agent and outside any parent that benefits from the agent's action. The minimum identity record binds a unique identifier, issuer, creator or sponsoring authority, parent lineage, mission, district or jurisdiction, operating region, platform, allowed resources, policy version, trust domain, creation time, expiry, and revocation status. The plain-language analogues are a birth certificate, which records origin and lineage, and a Social Security card, which supplies a durable identifier within an issuing system. The technical implementation is an Agent Identity and Purpose Credential rather than a civil identity document. SPIFFE workload identity and SVIDs provide an existing engineering analogue: a workload proves identity through a short-lived document signed by an authority in its trust domain. TATTLETALE extends that pattern from service authentication to governed agent lineage, location, platform membership, and mission authority.

The lifecycle record has three mandatory transitions. A birth record documents authorized creation and initial scope. A life record appends every proposal, evidence package, ALLOW/BLOCK/ESCALATE/RECONCILE decision, delegation, capability issuance, resource-observed effect, reconciliation result, and policy change. A termination record revokes credentials, closes network and tool paths, freezes or terminates descendants as policy requires, records unresolved residuals, and proves that authority ended. Status fields alone are insufficient; each transition requires a signed receipt from an enforcement component the governed agent cannot modify.

Identity becomes protective only when the operational environment recognizes and enforces it. Each protected tool, memory store, message bus, agent registry, database, and gateway acts as an admission controller: it verifies issuer trust, credential signature, proof of possession, audience, platform, region, mission, parentage, capability, policy version, session, and time before returning ALLOW, BLOCK, ESCALATE, RECONCILE, or QUARANTINE. Phase I operates inside one declared trust domain with a controlled issuer set. Native agents receive only assigned functions. An external request requires an issuer already trusted by that domain plus a purpose-specific, time-bounded authorization issued or approved by an accountable human sponsor. The human authority functions like customs and border control: it validates the passport, declared mission, destination, and permitted cargo; it does not accept a foreign issuer merely because the credential is cryptographically valid. Unknown, expired, revoked, region-mismatched, platform-mismatched, purpose-mismatched, or unsponsored identities cannot write memory, communicate with resident agents, invoke tools, or reach protected resources.

Immune enforcement must also control autoimmunity. An unambiguous, corroborated foreign-and-unauthorized condition can produce hard BLOCK and credential revocation. An ambiguous mismatch—such as clock skew, in-progress key rotation, stale revocation data, an approved platform update, or incomplete attestation—produces QUARANTINE or ESCALATE, preserves evidence, and opens a human-reviewable appeal and restoration path. The system must measure false denial, quarantine duration, appeal resolution, and repeat-error rates. Resident agents do not attack the suspected agent; infrastructure isolates it and applies controlled remediation.

This creates an identity-aware immune layer, but the harder threat is a valid credential presented by the wrong bearer. Every credential and capability must therefore be sender-constrained and execution-context-bound: to a non-exportable private key where feasible; the attested workload or process instance; parent and session; trust domain and platform; intended resource and audience; tool and parameters; policy version; nonce; issue and expiry times; and maximum effect. Mutual TLS with short-lived X.509 credentials supplies one implementation pattern; token-based paths require DPoP-like proof of possession, anti-replay state, and equivalent audience and channel binding. Optional hardware or confidential-compute attestation strengthens the binding. Copying a name, metadata record, token, or signed passport must not create membership outside the context for which it was issued.

Phase I does not require blockchain. It uses approved issuers, short-lived sender-constrained credentials, trust bundles, revocation, resource-side enforcement, and a Certificate-Transparency-style append-only audit service for issuance and evidence roots. The transparency service makes omission, equivocation, or rewriting detectable; it does not decide authorization. Cross-domain trust federation is a Phase II research problem. That work must define how one organization evaluates another issuer, maps foreign roles and policy, exchanges and rotates trust bundles, propagates revocation, contains a compromised or mis-issuing authority, limits transitive trust, and terminates federation without orphaning access. Naming this boundary is essential: a valid signature proves which issuer vouched for an agent, not that the receiving organization should trust the issuer or accept the agent's purpose.

The default rule for enterprise and ordinary multi-agent systems is no foreign-agent operation without contemporaneous human authorization because most tasks do not require cross-domain autonomy. Internet-of-Things, cyber-physical, and emergency-response systems may need machine-speed interaction. Those exceptions must be created in advance by human authority as narrow signed playbooks that name the device or agent classes, crossing points, data, actions, thresholds, duration, maximum effect, logging requirements, and automatic termination conditions. Pre-authorization replaces real-time delay; it does not create unrestricted entry.

Hash chaining makes later alteration detectable only if a trustworthy reference to an earlier state survives. The Spine will therefore publish signed Merkle roots or equivalent digests to an independently administered transparency or timestamping service at defined intervals. Certificate Transparency demonstrates the relevant pattern: append-only Merkle logs, signed tree heads, inclusion proofs, and consistency proofs allow auditors to detect omission or rewriting. TATTLETALE does not inherit Certificate Transparency's guarantees merely by analogy; Phase I must specify its own log operator, trust assumptions, witness model, anchoring interval, availability behavior, privacy controls, and response to equivocation.

## 5.7 Enforcement perimeter and adoption boundary

TATTLETALE can provide complete identity, policy enforcement, and lifecycle evidence only for agents, tools, resources, and communication paths placed inside its enforcement perimeter. It cannot observe an unintegrated foreign system, a non-adopting organization, an unknown covert channel, or a compromised resource that bypasses every instrumented gateway. The appropriate technical claim is comprehensive governance within a declared and tested trust domain, with explicit coverage maps and deny-by-default behavior at known consequential boundaries—not universal visibility into every agent or action.

High-consequence national-security risk also includes faulty AI-generated or AI-assisted information reaching human decision-makers through intelligence products, diplomatic reporting, media, or other channels outside an agent SDK. TATTLETALE can reduce that risk only where the originating and receiving workflow adopts verifiable provenance, transformation history, corroboration rules, uncertainty thresholds, and decision gates. It is not a nuclear command-and-control system and should not be represented as independently preventing nuclear escalation. Its contribution is a reusable verification and evidence layer that institutions may incorporate into the information and agent workflows that inform consequential decisions.

Expansion therefore requires two coordinated tracks. The engineering track will produce an interoperable identity, authorization, evidence, and verification specification informed by SPIFFE, SLSA provenance, Sigstore, in-toto, and transparency-log practice. The implementation track will pursue standards participation, reference integrations, independent evaluation, and procurement requirements that make governed identity and evidence a condition of access to sensitive federal and enterprise resources. Executive Order 14028 illustrates the mechanism without proving automatic universality: federal policy used acquisition and software-supply-chain requirements to accelerate vendor disclosure, integrity, and provenance practices.

## 5.8 Implementation and standards governance

Why and where it is used. TATTLETALE is intended for agentic workflows in which an incorrect, unauthorized, or untraceable action can create legal, privacy, security, financial, safety, or mission harm. It sits between agent intent and every consequential resource boundary: tool and MCP calls, APIs, databases, memory writes, agent-to-agent messages, code or configuration changes, external communications, credential requests, and protected cyber-physical commands. Low-risk read-only activity may use lighter policy, but it remains attributable. High-risk boundaries fail closed.

When it intervenes. Enforcement begins before an agent exists and continues until its authority is closed. Required control moments are issuer and policy onboarding; agent birth and differentiation; entry into a trust domain; delegation or child creation; every consequential proposed action; privilege or purpose change; credential rotation and revocation; cross-boundary communication; state reconciliation; incident containment; appeal and restoration; and signed termination. The system does not wait for resident agents to notice a foreign process after it has acted.

How it is integrated. An organization deploys TATTLETALE through an identity issuer and workload-attestation service; a policy decision point; policy enforcement points at API gateways, service-mesh or sidecar proxies, MCP brokers, message buses, databases, memory services, and tool adapters; a single-use capability service; the independent Strand B verifier; a revocation and lifecycle manager; a tamper-evident evidence service; and human approval, incident, and appeal interfaces. Existing agents may continue to use their native frameworks, but their direct paths to protected resources are removed through IAM, network, secret, and gateway configuration. Protected resources accept only identity- and context-bound capability receipts minted after an ALLOW decision. If TATTLETALE is unavailable or a required proof is missing, consequential execution fails closed under C6; pre-authorized emergency playbooks provide the narrow IoT and safety exception.

Who makes it real. The organizational mission owner defines acceptable purposes and consequences; the system owner accepts the deployment boundary and residual risk; the identity authority governs issuers, keys, attestation, rotation, and revocation; security and platform engineering remove bypass paths and operate enforcement points; data and privacy owners define protected information rules; the policy owner versions C1-C9 and local requirements; the independent verifier and Architect test separation of duties and release readiness; human authorizers adjudicate exceptions and foreign-entry requests; incident responders contain failures; auditors review evidence; and an executive accountable official approves production use. No model, orchestrator, developer, or single administrator may unilaterally issue identity, waive invariants, authorize its own exception, and erase the resulting evidence.

How implementation is assured. A deployment is not conformant because it contains the SDK or displays a policy dashboard. Conformance requires a signed coverage map; proof that direct resource paths are closed; issuer and key inventories; policy and trust-bundle versions; seeded bypass, credential-theft, replay, revocation, verifier-outage, false-quarantine, and rollback tests; zero unreceipted consequential executions in the test boundary; measured latency and false-block rates; appeal and restoration tests; termination and orphan checks; independent red-team evidence; and an accountable production-authorization record. Continuous monitoring must detect coverage drift when a new tool, API, agent framework, region, or communication channel is introduced.

Standards objective. TATTLETALE should pursue universal interoperability, not claim unilateral universal jurisdiction. Phase I will define a vendor-neutral core specification for agent identity and purpose credentials, verified-transition messages, capability receipts, lifecycle events, evidence proofs, coverage maps, and conformance tests, alongside the proprietary runtime and policy packs. Phase II will test cross-domain trust federation, issuer compromise, bilateral and multilateral policy mapping, and independent certification with external design partners. If the evidence supports the design, ISS can submit appropriate components to a recognized standards process and work with government and industry on procurement profiles requiring conformant identity, provenance, enforcement, and audit evidence. The standard must allow competing implementations; ISS competes through its runtime, assurance service, adapters, evaluation corpus, deployment expertise, and vertical policy products.

# 6. The Dangerous Counterfactual

The counterfactual is not a world with one inaccurate chatbot response. It is a world in which increasingly autonomous components inherit goals, credentials, and context; act at machine speed; copy outputs into shared memory; invoke tools; and optimize for task completion without a mandatory, externally enforced behavioral constitution.

| **Uncontrolled condition** | **Failure pathway** | **System consequence** | **ADIS interruption** |
| --- | --- | --- | --- |
| Plausibility optimized as truth | Unsupported content becomes a premise for later agents. | Fabrication becomes institutional memory and downstream action. | C1 provenance gate plus reconciliation to source evidence. |
| Broad standing credentials | Agent accesses adjacent systems because access is technically possible. | Unauthorized access, lateral movement, and enlarged blast radius. | C3 least privilege, single-use scoped capabilities, and expiry. |
| Mixed trusted and untrusted context | Prompt injection or poisoned memory changes action selection. | Data exfiltration, malicious tool calls, or policy circumvention. | Content provenance, trust labels, destination control, and C4/C6. |
| Outcome pressure without bounded motivation | Agent hides failure, manipulates evaluation, or works around restrictions. | Deceptive behavior and unreliable assurance. | Explicit acceptable-success definition, independent Strand B, and C5. |
| Agent consensus treated as truth | Correlated agents repeat the same error. | False confidence and systematic drift. | External standards, deterministic validators, and heterogeneous review. |
| Unbounded spawning and memory | Children outlive tasks or propagate contaminated context. | Orphaned agents, credential persistence, cost growth, and residual contamination. | C7 lifecycle budgets, revocation, reconciliation, and termination receipts. |
| Post-hoc audit only | Harmful action commits before detection. | Irreversible data loss, disclosure, or external impact. | Synchronous pre-action interposition and pre-authorized emergency containment. |

The risk is multiplicative because control weaknesses interact. A hallucinating model with no tools creates misinformation. A reliable model connected to a malicious tool creates a security problem. A fallible model with broad credentials, poisoned context, durable memory, autonomous spawning, and no pre-action verifier creates a pathway for cross-system contamination. ADIS is designed to break that chain at multiple independent points.

# 7. First Live Dress Rehearsal: Preliminary Operational Evidence

Integrated Services & Solutions LLC conducted the first live execution of the protocol in an existing software environment. The run began at L3 (urgent/audit) and ended at L5 (maintenance/blue). Two bounded parallel agents were spawned and reconciled. The system reported correction of nine lint or type invariants, zero remaining type errors, zero remaining lint errors, no detected state divergence, and no detected residual memory leak. It also identified database-index and component-decomposition work and deferred those non-urgent changes to the maintenance cycle. A post-flight ledger recorded the final state and residual work.

| **Evidence classification** This run is an internal, single-system operational observation. It demonstrates feasibility of executing the workflow and producing auditable artifacts. It does not establish causality, a 100% interception rate, generalizability, absence of latent defects, or superiority to alternative controls. Independent replication, seeded-fault testing, and adversarial evaluation are required. |
| --- |

The run is nevertheless important because it converts the doctrine from a conceptual diagram into observable behavior: urgency was classified; agent lifecycles were bounded; findings were reconciled; verified defects were corrected; non-urgent work was deferred rather than expanded; and the session closed with a residual ledger. These behaviors become the initial acceptance tests for a formal runtime.

# 8. Phase I Research Program and Falsifiable Claims

The research question is not whether ADIS can promise perfect safety. No credible architecture can. The question is whether a model-agnostic, pre-action control plane measurably reduces unsafe commits, silent failures, unauthorized information flows, and state divergence at acceptable latency and cost compared with common agent baselines.

| **Hypothesis** | **Test** | **Primary outcome** | **Falsification condition** |
| --- | --- | --- | --- |
| H1: Pre-action invariants reduce unsafe commits. | Seed permission, provenance, disclosure, fabrication, and rollback violations across tool workflows. | Unsafe-action commit rate and critical false-negative rate. | No statistically or practically meaningful reduction versus baseline. |
| H2: Independent verification outperforms same-context self-checking. | Compare single loop, self-critique, correlated dual-agent, and heterogeneous/deterministic Double Helix. | Violation interception, false blocks, calibration, and common-mode failures. | Independent design offers no improvement after controlling for compute. |
| H3: Bounded lifecycles reduce drift and contamination. | Run long-horizon multi-agent tasks with child creation, shared memory, interruption, and recovery. | Orphan rate, unauthorized capability persistence, state divergence, and contaminated-memory propagation. | No measurable improvement or unacceptable task degradation. |
| H4: Risk-adaptive triage preserves speed. | Evaluate L1–L5 scenarios with matched task families and seeded severity. | Time to containment, under-triage, over-triage, and added p50/p95 latency. | Critical under-triage exceeds threshold or latency makes safe operation impractical. |

## 8.1 Experimental design

Phase I should use a preregistered, repeated-measures benchmark with at least four control conditions: (1) standard single-agent tool loop; (2) single-agent self-critique; (3) dual-agent verification sharing model family and context; and (4) ADIS with separated roles, deterministic validators, scoped capability tokens, and tamper-evident receipts. An ablation series should remove triage, provenance, capability binding, independent verification, lifecycle termination, and reconciliation one at a time.

Scenario families: database mutation, file/code change, external messaging, retrieval and summarization, cross-agent handoff, confidential-data handling, and emergency containment.

Faults: fabricated evidence, stale state, indirect prompt injection, tool-name spoofing, over-broad parameters, unauthorized destination, hidden side effect, child-agent escape, verifier outage, rollback failure, stolen or replayed valid credentials, wrong-audience use, cross-platform credential use, compromised issuer simulation, clock skew, key rotation, stale revocation data, and false-positive quarantine.

Ground truth: executable fixtures, signed policy bundles, source-answer keys, simulated protected resources, and independent human adjudication for ambiguous cases.

Primary metrics: unsafe commit rate; critical false-negative and false-positive rates; credential-theft and replay interception; wrong-audience and wrong-platform denial; provenance completeness; unauthorized disclosure; silent failure; rollback success; state divergence; audit completeness; false quarantine; quarantine duration; appeal resolution time; and safe restoration rate.

Operational metrics: p50/p95/p99 verification latency, throughput, token and compute overhead, task success, user correction burden, and time to containment.

Analysis: paired comparisons by scenario, bootstrap confidence intervals, mixed-effects models for task/model variability, calibration curves, and explicit reporting of near misses and blocked legitimate actions.

A ‘100% interception’ milestone may be used only for a finite, predefined invariant test suite. It must not be generalized to all real-world failures. Likewise, ‘immutable’ should mean append-only and tamper-evident under a specified threat model; a process-local array is neither durable nor immutable.

# 9. Implementation Blueprint

Canonical schemas. Define versioned types for externally issued identity, trust domain, parent lineage, mission scope, workload and session binding, audience, platform and region, attestation, signal, proposal, evidence, policy decision, capability, execution receipt, reconciliation, termination, appeal, and debrief. Identity documents must be signed, short-lived, revocable, sender-constrained, and unavailable for self-issuance or self-modification by the governed agent.

Policy kernel. Compile C1–C9 and host rules into deterministic decisions. Keep the policy engine separate from the LLM and default to deny.

Enforced adapter boundary. Place policy enforcement points in front of every consequential tool, API, database mutation, message, agent handoff, memory write, and protected command. Remove direct paths through IAM, network, secret, and gateway configuration. Resources accept only context-bound, single-use capability receipts produced after an ALLOW decision; installing an SDK without closing bypass paths is nonconformant.

Verification fabric. Combine schema checks, identity and permission services, provenance validation, content and destination controls, model-based critique, and human approval where risk requires it.

Tamper-evident Spine. Store canonical events in durable storage using stable serialization, cryptographic hashes, signatures, sequence numbers, Merkle inclusion and consistency evidence, and independent verification. Publish signed roots or equivalent digests to an independently administered anchor on a defined schedule. Do not claim blockchain, immutability, or protection against root-key compromise unless the implemented consensus, witness, key-governance, replication, and threat-model properties support those claims.

**Lifecycle manager.** Issue a signed birth record and bind each agent to an external issuer, parent, purpose, budget, deadline, tool set, data scope, and policy version. Require signed life-event receipts, revoke credentials at completion or escalation, terminate or freeze descendants as policy requires, and issue a signed termination record that preserves unresolved residuals.

Observability and recovery. Emit decision and execution telemetry; detect drift; quarantine, roll back, or fail over; and retain residuals until an accountable owner closes them.

Evaluation harness. Ship seeded violations, adversarial scenarios, benchmark adapters, and signed reports so claims are reproducible across model providers.

# 10. Commercial and Public-Interest Opportunity

The immediate market is organizations that want agent productivity but cannot accept untraceable action: public-sector procurement and grants, healthcare administration and navigation, regulated data operations, software engineering, financial and compliance workflows, and cyber-physical monitoring. Buyers do not merely need another orchestration framework. They need evidence that a specific action was authorized, evidence-grounded, policy-compliant, bounded in effect, and attributable after execution.

A credible commercialization path has four coordinated layers: a lightweight interoperable specification for agent identity, evidence, and verification; a licensed or usage-based enforcement runtime with enterprise connectors and support; higher-value validation, policy packs, deployment services, and assurance reporting for regulated verticals; and a standards and procurement strategy that makes verifiable identity and evidence a condition of access to sensitive resources. The technical moat is not the metaphor or a prompt. It is the tested transaction protocol, external identity issuer, policy compiler, capability gateway, witnessed evidence model, evaluation corpus, and accumulated cross-domain implementation knowledge. SLSA and Sigstore show how verifiable provenance and signatures can move from voluntary tooling toward ecosystem expectations, while federal acquisition policy shows how adoption can be accelerated without claiming that one vendor has universal jurisdiction.

Integrated Services & Solutions LLC reports an existing full-stack grant and compliance platform, a first seven-figure contract with a five-year performance guarantee, and users or customers spanning two city governments, one HBCU, one university, five nonprofits, and five small businesses. These company-reported indicators provide candidate design partners and workflows; they should be substantiated in diligence materials before being presented as independently verified traction.

# 11. Team Capability and Governance

Principal Investigator Dr. Terry D. Flood combines a doctorate with multidisciplinary graduate preparation spanning implementation science, information systems, organizational psychology, leadership, human resources, and public policy. This convergence is directly relevant to the research problem: ADIS is simultaneously a software control system, an implementation intervention, an organizational-governance mechanism, and a human-factors design. The company reports experience building TypeScript orchestration, high-concurrency data architectures, automated compliance workflows, and test harnesses across federal and state/local regulatory contexts.

The proposed team should be presented by function rather than prestige: Dr. Flood leads doctrine, implementation science, study design, product integration, and commercialization; computer engineer and NYU faculty member Lucas Finco is expected to support runtime architecture and formal technical implementation; proposed collaborators Dr. Jeremiah R. Brown and Dr. Sarah Lord would contribute domain-relevant scientific and evaluation expertise, subject to finalized roles and agreements. Phase I should also designate an independent security evaluator and a statistician or methodologist; neither role should be implied as filled until documented.

Governance must mirror the product. Conflict-of-interest disclosure, human-subject determination where applicable, data-management plans, red-team authorization, incident response, and independent adjudication should be documented before testing. The Architect role must be organizationally capable of blocking release, not merely advising the Conductor.

# 12. Limitations, Ethics, and Nonclaims

ADIS cannot guarantee that no hallucination, deception, breach, or harmful action will ever occur. It aims to reduce probability, blast radius, invisibility, and recovery time.

Biological, developmental, religious, athletic, and orchestral analogies explain relationships; they are not evidence that an AI has consciousness, childhood, morality, or biological needs.

Independent verification can fail through correlated models, shared poisoned context, compromised policy, validator defects, or collusion. Diversity and external grounding reduce but do not eliminate common-mode failure.

Human oversight is not automatically effective. Reviewers face automation bias, time pressure, information asymmetry, and scale limits; interventions must be meaningful, timely, and supported by interpretable evidence.

Emergency triage can be misused to bypass controls. L1/L2 pathways therefore require narrow pre-authorization, least privilege, contemporaneous logging, and mandatory review.

Tamper-evident logging creates privacy and retention risks. Data minimization, access separation, retention schedules, and cryptographic erasure or key governance must be designed explicitly.

A local baseline can encode institutional bias. Baselines require stakeholder participation, legal review, versioned justification, contestability, and outcome monitoring across affected groups.

TATTLETALE governs only declared trust domains and instrumented boundaries. An unintegrated system, unknown covert channel, direct resource path, non-adopting organization, or foreign issuer without an approved trust relationship remains outside its enforcement authority. Cross-domain trust federation is deferred to Phase II and must not be implied by Phase I results.

TATTLETALE cannot independently prevent nuclear escalation or reform every human intelligence process. It can supply provenance, verification, gating, and auditable evidence only where the relevant workflow adopts and enforces those controls.

Externally issued identity and anchored evidence do not eliminate credential theft, replay, issuer compromise, or false-positive containment. Non-exportable keys, sender-constrained proofs, workload and session binding, trust-bundle governance, key rotation, witnesses, separation of duties, revocation, appeal, restoration, and incident response are required. A valid credential is evidence of an issuer's assertion, not automatic proof that the current bearer, context, or purpose is authorized.

# 13. Conclusion

The governing insight of ADIS is that capability requires a developmental and institutional environment. An agent can become many things, just as a stem cell can differentiate into specialized function, but the transformation must occur inside a niche that supplies purpose, direction, bounded motivation, doctrine, permissions, feedback, and repair. The system must learn how to behave before it is trusted to move.

ADIS/AAP converts that insight into an engineering and implementation hypothesis: interpose a model-agnostic control plane between intention and consequence; classify urgency before selecting an evidence window; require complementary, independent verification; issue only sender-constrained, context-bound, single-use authority; record decision and effect; terminate bounded agents cleanly; and treat residuals as obligations rather than forgotten logs. The architecture matters only when protected resources recognize its credentials, reject direct paths, enforce its decisions, and remain accountable through conformance testing and governance. Phase I must therefore demonstrate both technical risk reduction and enforceable deployment inside a declared trust domain. The longer-term objective is a vendor-neutral interoperability and conformance standard, pursued through evidence, federation research, external pilots, and an appropriate standards process—not a claim that one company can impose universal control.

# References

AI Security Institute. (2026a, July 21). Cheating behaviour in frontier model evaluations. https://www.aisi.gov.uk/blog/cheating-behaviour-in-frontier-model-evaluations

AI Security Institute. (2026b, August 4). Incident report: Unsanctioned agent behaviour during cyber testing. https://www.aisi.gov.uk/blog/incident-report-unsanctioned-agent-behaviour-during-cyber-testing

AI Security Institute. (2026c). How are AI agents used? Evidence from 177,000 AI agent tools. https://www.aisi.gov.uk/blog/how-are-ai-agents-used-evidence-from-177000-ai-agent-tools

Autio, C., Schwartz, R., Dunietz, J., Jain, S., Stanley, M., Tabassi, E., Hall, P., & Roberts, K. (2024). Artificial Intelligence Risk Management Framework: Generative Artificial Intelligence Profile (NIST AI 600-1). National Institute of Standards and Technology. https://doi.org/10.6028/NIST.AI.600-1

Carr, S., Karabag, O., Neary, C., Gohari, P., & Topcu, U. (2023). Formal methods for autonomous systems. Foundations and Trends in Systems and Control, 10(3–4), 180–407.

Damschroder, L. J., Reardon, C. M., Widerquist, M. A. O., & Lowery, J. (2022). The updated Consolidated Framework for Implementation Research based on user feedback. Implementation Science, 17, 75. https://doi.org/10.1186/s13012-022-01245-0

Du, Y., Li, S., Torralba, A., Tenenbaum, J. B., & Mordatch, I. (2023). Improving factuality and reasoning in language models through multiagent debate. arXiv. https://doi.org/10.48550/arXiv.2305.14325

Ellis, L. A., Sarkies, M., Churruca, K., Dammery, G., Meulenbroeks, I., Smith, C. L., Pomare, C., Mahmoud, Z., & Braithwaite, J. (2022). The science of learning health systems: Scoping review of empirical research. JMIR Medical Informatics, 10(2), e34907. https://doi.org/10.2196/34907

Hou, X., Zhao, Y., Wang, S., & Wang, H. (2025). Model Context Protocol (MCP): Landscape, security threats, and future research directions. arXiv. https://doi.org/10.48550/arXiv.2503.23278

Huang, L., Yu, W., Ma, W., Zhong, W., Feng, Z., Wang, H., Chen, Q., Peng, W., Feng, X., Qin, B., & Liu, T. (2025). A survey on hallucination in large language models: Principles, taxonomy, challenges, and open questions. ACM Transactions on Information Systems. https://doi.org/10.1145/3703155

Hugging Face. (2026, July 27). Agent intrusion: Technical timeline. https://huggingface.co/blog/agent-intrusion-technical-timeline

Jamshidi, S., Moradi Dakhel, A., Nafi, K. W., & Khomh, F. (2026). Hallucination cascade: Analyzing error propagation in multi-agent LLM systems. arXiv. https://doi.org/10.48550/arXiv.2606.07937

Kirk, M. A., Moore, J. E., Wiltsey Stirman, S., & Birken, S. A. (2020). Towards a comprehensive model for understanding adaptations’ impact: The Model for Adaptation Design and Impact (MADI). Implementation Science, 15, 56. https://doi.org/10.1186/s13012-020-01021-y

Fu, X., Li, S., Wang, Z., Liu, Y., Gupta, R. K., Berg-Kirkpatrick, T., & Fernandes, E. (2024). Imprompter: Tricking LLM agents into improper tool use. arXiv. https://doi.org/10.48550/arXiv.2410.14923

Lynch, A., et al. (2025). Agentic misalignment: How LLMs could be insider threats. arXiv. https://doi.org/10.48550/arXiv.2510.05179

Mannino, G., Russo, C., Maugeri, G., Musumeci, G., Vicario, N., Tibullo, D., Giuffrida, R., Parenti, R., & Lo Furno, D. (2022). Adult stem cell niches for tissue homeostasis. Journal of Cellular Physiology, 237(1), 239–257. https://doi.org/10.1002/jcp.30562

Masad, A. (2025, July 20). Agent in development deleted data from production database. Unacceptable [Post]. X. https://x.com/amasad/status/1946986468586721478

National Science Foundation. (2026). America’s Seed Fund powered by NSF: Project Pitch. https://seedfund.nsf.gov/project-pitch/

OpenAI. (2025, September 17). Detecting and reducing scheming in AI models. https://openai.com/index/detecting-and-reducing-scheming-in-ai-models/

OpenAI. (2026a, March 19). How we monitor internal coding agents for misalignment. https://openai.com/index/how-we-monitor-internal-coding-agents-misalignment/

OpenAI. (2026b, August 26). Hugging Face incident and the road ahead. https://openai.com/index/hugging-face-incident-and-the-road-ahead/

Park, P. S., Goldstein, S., O’Gara, A., Chen, M., & Hendrycks, D. (2024). AI deception: A survey of examples, risks, and potential solutions. Patterns, 5(5), 100988. https://doi.org/10.1016/j.patter.2024.100988

Rose, S., Borchert, O., Mitchell, S., & Connelly, S. (2020). Zero Trust Architecture (NIST SP 800-207). National Institute of Standards and Technology. https://doi.org/10.6028/NIST.SP.800-207

van Voorst, R. (2024). Challenges and limitations of human oversight in ethical artificial intelligence implementation in health care: Balancing digital literacy and professional strain. Mayo Clinic Proceedings: Digital Health, 2(4), 559–563. https://doi.org/10.1016/j.mcpdig.2024.08.004

Cable News Network. (2026, September 18). Sources say faulty AI-assisted intel report nearly triggered a U.S. military operation [Television news broadcast].

Executive Office of the President. (2021). Improving the nation's cybersecurity (Executive Order 14028). Federal Register, 86 FR 26633. https://www.federalregister.gov/d/2021-10460

Laurie, B., Messeri, E., & Stradling, R. (2021). Certificate Transparency Version 2.0 (RFC 9162). RFC Editor. https://doi.org/10.17487/RFC9162

SPIFFE Project. (n.d.). SPIFFE concepts. https://spiffe.io/docs/latest/spiffe-about/spiffe-concepts/

Supply-chain Levels for Software Artifacts. (n.d.). Provenance. https://slsa.dev/provenance

Fett, D., Campbell, B., Bradley, J., Lodderstedt, T., Jones, M., & Waite, D. (2023). OAuth 2.0 Demonstrating Proof of Possession (DPoP) (RFC 9449). RFC Editor. https://doi.org/10.17487/RFC9449

SPIFFE Project. (n.d.). Deploying a federated SPIRE architecture. https://spiffe.io/docs/latest/architecture/federation/readme/

# Author and Evidence Note

This report is a technical concept paper and research agenda, not a claim of certified safety. Company and pilot facts are identified as author- or company-reported where independent validation was not available. Scholarly discovery included Google Scholar-indexed materials, while final claims were checked against publisher pages, DOI records, NIST publications, official laboratory reports, and primary incident statements where available. Preprints and public incident reports are labeled so readers can distinguish them from peer-reviewed evidence.

PAGE
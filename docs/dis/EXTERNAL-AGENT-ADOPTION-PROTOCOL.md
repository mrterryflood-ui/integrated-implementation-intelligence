# DIS shared agent standard — connected-agent adoption protocol

**Release candidate:** 2026-11-06  
**Status:** Public discovery and cryptographic-content consistency; no automatic installation, system prompt replacement or cross-account memory changes.

## Purpose

Provide one stable, read-only and versioned retrieval point for three existing canonical, owner-maintained DIS standards. External agents and owned platforms may adopt them **only through their authorized configuration and explicit acceptance tests**. This closes the *publication/distribution* gap; it does not mean all agents now obey the rules.

## Source of truth and API

- GitHub: [GPT/agent operating contract](https://github.com/mrterryflood-ui/integrated-implementation-intelligence/blob/main/docs/dis/GPT-SESSION-AND-AGENT-OPERATING-CONTRACT.md)
- GitHub: [Federated evidence and decision standard](https://github.com/mrterryflood-ui/integrated-implementation-intelligence/blob/main/docs/dis/FEDERATED-EVIDENCE-AND-DECISION-STANDARD.md)
- GitHub: [Stack-agnostic engineering inquiry and release protocol](https://github.com/mrterryflood-ui/integrated-implementation-intelligence/blob/main/docs/dis/STACK-AGNOSTIC-ENGINEERING-INQUIRY-PROTOCOL.md)
- Public discovery endpoint: [https://dis-authenticated-platform.vercel.app/api/dis/standard](https://dis-authenticated-platform.vercel.app/api/dis/standard)
- Existing Council runtime receipt: [https://dis-authenticated-platform.vercel.app/api/council](https://dis-authenticated-platform.vercel.app/api/council)

The endpoint returns JSON `schemaVersion=dis-agent-standard-manifest-v1`, three full text Markdown documents, exact owner source paths, versions, SHA-256 hashes and adoption guidance. It exposes **no secrets, client records or executable agent commands** and implements only GET/OPTIONS. Responses are public with bounded cache; the policy is updated only after GitHub source review and a tested Vercel production release.

## Reader implementation (example Node.js, using a known trusted digest)

```js
import {createHash} from 'node:crypto';
const STANDARD_URL='https://dis-authenticated-platform.vercel.app/api/dis/standard';
const response=await fetch(STANDARD_URL,{headers:{accept:'application/json'}});
if(!response.ok)throw new Error('DIS standard unavailable; do not use a stale cache silently.');
const manifest=await response.json();
if(manifest.schemaVersion!=='dis-agent-standard-manifest-v1')
  throw new Error('Unexpected manifest schema.');
if(manifest.documents.length!==3)throw new Error('Incomplete standard');
for(const doc of manifest.documents){
  const computed=createHash('sha256').update(doc.content,'utf8').digest('hex');
  if(computed!==doc.sha256)throw new Error('Corrupted document: '+doc.id);
  // Compare to a trusted expected digest pinned OUTSIDE this HTTP response.
  // A hash alongside the data protects consistency, not server authenticity.
  // Do not auto-install or overwrite higher-priority system/security instructions.
}
console.log(manifest.documents.map(x=>[x.id,x.version,x.sha256]));
```

**Trust rule:** A digest supplied by the same response is not sufficient to authenticate the source. Consumers should pin an expected digest from an independently trusted release record, authenticate the origin, record approved version, and reject unexpected changes until reviewed. Where supported, cache the exact accepted source SHA and require human approval for upgrades.

## Behavioral adoption acceptance

1. Owner identifies a specific consuming agent, app version, deployment environment, authority, intended decisions and risk category.
2. Consumer fetches the three standards without forwarding personal user data, tokens or client records.
3. Consumer validates source integrity and explicitly mounts the standards in the instruction mechanism that platform actually supports. Do not assume a public GET changes an LLM or ChatGPT's system prompt.
4. Run blind synthetic cases: valid measurements, mismatched units/constructs, two publisher URLs sharing one underlying study, late-arriving evidence, geographic disagreement, simulated personas, incentive gaming, post-success stewardship, human-approval and sensitive-record denial.
5. Record tests on exact consuming revision, observed behavior, failures and corrective actions; issue per-agent adoption receipt, never a portfolio-wide blanket assertion.
6. Monitor for version drift, incompatible tool permissions, update, reverify and reversible rollback; user retains consequence authority.

## Proportionate reasoning

The standards apply especially to consequential choices. Simple factual questions receive direct answers. For medical, public-safety or legal topics, follow the applicable clinical, public-safety, regulatory and professional standards. Avoid promoting a plausible mechanism into proven treatment, correlating duplicate sources as independent support, or calling a green engineering build scientific validation.

## What remains

This release provides **distribution and verification infrastructure** plus existing DIS Council adoption. Other connected applications, ChatGPT accounts and external agents have NOT been reconfigured, and no external adoption has been tested. Those must be tracked in separate adoption receipts when authorized. No Copilot, paid Replit, new inference gateway or external correspondence is required.

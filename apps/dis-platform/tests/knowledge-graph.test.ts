import test from "node:test";
import assert from "node:assert/strict";
import {buildGraphData} from "../app/api/consultation/graph/route";
const sessionId="00000000-0000-4000-8000-000000000001";
test("knowledge graph derives problem, organization and evidence leads without promoting findings",()=>{
 const nodes=buildGraphData(sessionId,{mission:"Increase access to preventive care",organization:"Example Ventures",audience:"Rural clinicians",desiredOutcome:"Faster appropriate referrals"},{
  records:[{title:"Example study",url:"https://doi.org/10.1234/x",source:"Scholarly index",kind:"SCHOLARLY",sourceStatus:"DISCOVERY_ONLY",retrievedAt:"2026-10-29T00:00:00Z"}]
 });
 assert.equal(nodes.filter(n=>n.kind==="question").length,1);
 assert.equal(nodes.filter(n=>n.kind==="source").length,1);
 const source=nodes.find(n=>n.kind==="source")!;
 assert.equal(source.metadata.verification,"NOT_CLAIM_VERIFIED");
 assert.equal(source.metadata.consultationId,sessionId);
});
test("graph source inputs reject untrusted non-HTTPS URIs and bounded size",()=>{
 const bad={records:[{title:"Malicious file URL",url:"file:///etc/passwd"},{title:"Untrusted javascript",url:"javascript:alert(1)"},{title:"Official record",url:"https://www.grants.gov/record"}]};
 const result=buildGraphData(sessionId,{mission:"A question"},bad);
 assert.equal(result.filter(n=>n.kind==="source").length,1);
 assert.ok(result.every(n=>n.label.length<=250));
});

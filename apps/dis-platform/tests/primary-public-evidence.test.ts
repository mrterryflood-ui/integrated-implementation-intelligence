import test from 'node:test';
import assert from 'node:assert/strict';
import {selectAnswerEvidence} from '../lib/answer-release-policy';
import {convene} from '../lib/council-engine';
import {safeCouncilSources,councilEvidenceBundle} from '../lib/council-source-register';
import {integratedCouncilResearch} from '../lib/integrated-research';
import {withCouncilEvidenceSnapshot} from '../lib/council-evidence-snapshot';
import type {EvidenceSource} from '../lib/evidence-integrity';
const primary:EvidenceSource={id:'E701',title:'Public workforce program rule',url:'https://example.org/rule',doi:null,year:null,abstract:'Applicants must establish program-specific eligibility. Program existence does not establish applicant qualification or current funding availability.',abstractTruncated:false,evidenceKind:'PRIMARY_PUBLIC_DOCUMENT',source:'Synthetic public authority fixture',retrievedAt:'2026-11-02T12:00:00Z',receiptHash:'a'.repeat(64)};
test('primary public documents require retained source fingerprint and retrieval time',()=>{
 assert.deepEqual(selectAnswerEvidence([primary]),[primary]);
 assert.equal(selectAnswerEvidence([{...primary,receiptHash:undefined}]).length,0);
 assert.equal(selectAnswerEvidence([{...primary,retrievedAt:'bad-date'}]).length,0);
 assert.equal(selectAnswerEvidence([{...primary,abstractTruncated:true}]).length,0);
 assert.equal(selectAnswerEvidence([{...primary,url:'http://example.org'}]).length,0);
});
test('primary evidence is not silently relabeled as scholarly or owned-platform evidence',()=>{
 const [preserved]=safeCouncilSources([primary]);assert.equal(preserved.evidenceKind,'PRIMARY_PUBLIC_DOCUMENT');assert.equal(preserved.receiptHash,primary.receiptHash);
 const bundle=councilEvidenceBundle('workforce', [primary]);assert.equal(bundle.records[0].kind,'TECHNICAL_REPORT');assert.equal(bundle.records[0].retrievedAt,primary.retrievedAt);assert.equal(bundle.coverage.primaryPublic,'RETRIEVED_PASSAGES_NOT_ELIGIBILITY_CERTIFICATION');assert.equal(bundle.coverage.scholarly,'NOT_RETURNED');
});
test('public-only evidence actually reaches inference rather than ending as EVIDENCE_INSUFFICIENT',async()=>{
 const previous=process.env.AI_GATEWAY_MODEL,force=process.env.AI_GATEWAY_FORCE_MULTIPROVIDER;process.env.AI_GATEWAY_MODEL='fixture-free';delete process.env.AI_GATEWAY_FORCE_MULTIPROVIDER;let calls=0;
 try{
  const result=await convene({prompt:'Help an Austin nonprofit compare workforce funding qualification needs.',count:4,redCount:2,selected:[],redSelected:[],depth:'Standard'},{research:async()=>({sources:[primary],status:'PRIMARY_PUBLIC_DOCUMENTS'}),infer:async(_system,prompt)=>{calls++;assert.ok(prompt.includes('PRIMARY_PUBLIC_DOCUMENT'));assert.ok(prompt.includes('Public workforce program rule'));return {ok:true,text:'The chapter should verify program-specific eligibility before choosing a funding route. Program existence is not proof of qualification or available funds [E701]. Agree the accountable partner and investigate missing evidence before implementation.',model:'fixture-free'};}});
  assert.equal(calls,1);assert.notEqual(result.state,'EVIDENCE_INSUFFICIENT');assert.ok(result.deliberation?.synthesis);
  const snapshot=withCouncilEvidenceSnapshot(result,'workforce');assert.equal(snapshot.intelligence.records[0].url,primary.url);assert.equal(snapshot.intelligence.records[0].kind,'TECHNICAL_REPORT');
 }finally{if(previous===undefined)delete process.env.AI_GATEWAY_MODEL;else process.env.AI_GATEWAY_MODEL=previous;if(force===undefined)delete process.env.AI_GATEWAY_FORCE_MULTIPROVIDER;else process.env.AI_GATEWAY_FORCE_MULTIPROVIDER=force;}
});
test('external sources join scholarly discovery with explicit failures and no applicant certification',async()=>{
 const text='third-party 40 percent high demand only in partnership Sec. 303.003. JET grants TWC will release the 2027 application period for the Texas Talent Connection Sec. 309.002. support services low-income';
 const fetcher:typeof fetch=async(input)=>String(input).includes('api.openalex.org')?Response.json({results:[]}):new Response('<html>'+text+'</html>',{headers:{'content-type':'text/html'}});
 const found=await integratedCouncilResearch('Austin workforce funding',fetcher);assert.equal(found.sources.length,5);assert.equal(selectAnswerEvidence(found.sources,6).length,5);assert.ok(found.sources.every(s=>s.evidenceKind==='PRIMARY_PUBLIC_DOCUMENT'));assert.ok(found.sources.every(s=>s.abstract?.includes('ELIGIBILITY NOT CERTIFIED')));
});
test('external-public and internal-platform evidence remain separately identifiable in one register',()=>{
 const owned:EvidenceSource={...primary,id:'E1',evidenceKind:'PLATFORM_PUBLIC_EXCERPT',source:'Owned aggregate fixture'};
 const bundle=councilEvidenceBundle('combined', [primary,owned]);assert.equal(bundle.records.length,2);assert.equal(bundle.coverage.primaryPublic,'RETRIEVED_PASSAGES_NOT_ELIGIBILITY_CERTIFICATION');assert.equal(bundle.coverage.ownedPlatforms,'SOURCE_REPORTED_EXCERPTS');assert.notEqual(bundle.records[0].source,bundle.records[1].source);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {publicAgentStandard} from '../lib/public-agent-standard';
import {GET,OPTIONS} from '../app/api/dis/standard/route';

const sha=(s:string)=>createHash('sha256').update(s,'utf8').digest('hex');
test('public standard points to canonical GitHub sources and validates exact UTF-8 text hashes',()=>{
  const m=publicAgentStandard();
  assert.equal(m.schemaVersion,'dis-agent-standard-manifest-v1');
  assert.equal(m.documents.length,2);
  assert.equal(m.governingScope,'PUBLIC_DOCUMENTS_ONLY');
  assert.equal(m.publication,'SERVER_VERIFIED_CONTENT_COPY');
  assert.equal(m.behaviorVerified,false);
  assert.equal(m.otherAgentsAdopted,false);
  assert.equal(m.userPermissionOrOperationalAuthorityGranted,false);
  for(const doc of m.documents){
    const local=readFileSync(new URL('../../../'+doc.sourcePath,import.meta.url),'utf8');
    assert.equal(doc.content,local);
    assert.equal(doc.sha256,sha(local));
    assert.match(doc.sourcePath,/^docs\/dis\/[A-Z0-9-]+\.md$/);
    assert.equal(doc.contentType,'text/markdown');
  }
  assert.equal(m.documents[0].version,'2026-11-05.1');
  assert.equal(m.documents[1].version,'1.0');
});
test('manifest makes no claim of global ChatGPT memory/system edit or automatic adoption',()=>{
  const m=publicAgentStandard();
  assert.equal(m.adoption.status,'PUBLISHED_FOR_AUTHORIZED_CONSUMERS_NOT_AUTO_INSTALLED');
  const serialized=JSON.stringify(m);
  assert.match(serialized,/does not change an agent system prompt/);
  assert.match(serialized,/do not automatically|does not automatically|cannot rewrite ChatGPT/);
  assert.match(serialized,/independently trusted source/);
  assert.match(serialized,/human-authority/);
  assert.match(serialized,/not permission for new actions/);
  assert.doesNotMatch(serialized,/"credentialValue"\s*:/);
});
test('GET serves public only, immutable source integrity metadata and no false verification status',async()=>{
  const response=await GET();
  assert.equal(response.status,200);
  assert.match(response.headers.get('content-type')||'',/application\/json/);
  assert.equal(response.headers.get('access-control-allow-origin'),'*');
  assert.equal(response.headers.get('x-content-type-options'),'nosniff');
  const body=await response.json();
  assert.equal(body.behaviorVerified,false);
  assert.equal(body.otherAgentsAdopted,false);
  assert.equal(body.documents.length,2);
  assert.equal(response.headers.get('x-dis-standard-sha256'),body.documents[0].sha256);
  assert.equal(response.headers.get('x-dis-standard-version'),body.documents[0].version);
  for(const doc of body.documents)assert.equal(sha(doc.content),doc.sha256);
});
test('OPTIONS exposes only read-only public method, no auth or write scope',async()=>{
  const r=await OPTIONS();
  assert.equal(r.status,204);
  assert.equal(r.headers.get('access-control-allow-origin'),'*');
  assert.equal(r.headers.get('access-control-allow-methods'),'GET, OPTIONS');
});
test('existing Council standard and public shared manifest agree without redefining agent authority',()=>{
  const manifest=publicAgentStandard();
  const doc=manifest.documents[0];
  assert.match(doc.content,/Match each instrument to its phenomenon/);
  assert.match(doc.content,/Triangulate without false independence/);
  assert.match(doc.content,/Steward before and after success/);
  assert.match(doc.content,/do not turn a simple factual request into an elaborate committee exercise/);
  const f=manifest.documents[1];
  assert.match(f.content,/federated/i);
  assert.match(f.content,/Do not conflate|count repeated|duplicate/i);
  assert.match(f.content,/Human authorization/);
});

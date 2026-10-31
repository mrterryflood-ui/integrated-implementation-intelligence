import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateAutonomy,type AuthorityGrant,type AutonomyRequest,defaultAutonomy} from '../lib/ecosystem/autonomy-policy';
const grant:AuthorityGrant={grantId:'g1',subjectId:'alice',tenantId:'a',projectId:'p',level:'supervised',
 allowedOperations:['plan','research-public','read-aggregate','draft-artifact','assign-task','modify-platform'],
 expiresAt:'2030-01-01T00:00:00Z',approvedBy:'owner'};
const request:AutonomyRequest={subjectId:'alice',tenantId:'a',projectId:'p',operation:'read-aggregate',
 requestedLevel:'collaborative',externalConsent:true};
const now=new Date('2026-10-31T00:00:00Z');
test('default never self-approves a protected read',()=>{assert.equal(defaultAutonomy().level,'collaborative');assert.equal(evaluateAutonomy(request,null,now).outcome,'HUMAN_APPROVAL_REQUIRED')});
test('scoped read is allowed only under a valid server-side grant',()=>{assert.equal(evaluateAutonomy(request,grant,now).outcome,'ALLOW');for(const mismatch of [{subjectId:'bob'},{tenantId:'b'},{projectId:'other'}])assert.notEqual(evaluateAutonomy({...request,...mismatch},grant,now).outcome,'ALLOW')});
test('expired and revoked grants deny elevation',()=>{assert.notEqual(evaluateAutonomy(request,{...grant,expiresAt:'2020-01-01T00:00:00Z'},now).outcome,'ALLOW');assert.notEqual(evaluateAutonomy(request,{...grant,revokedAt:'2026-10-30T00:00:00Z'},now).outcome,'ALLOW')});
test('user request cannot elevate above a server grant',()=>assert.equal(evaluateAutonomy({...request,requestedLevel:'bounded-autonomous'},grant,now).outcome,'HUMAN_APPROVAL_REQUIRED'));
test('high-impact actions always require transaction-specific approval',()=>{for(const operation of ['send-external','spend','publish','access-protected','operate-device'] as const)assert.equal(evaluateAutonomy({...request,operation}, {...grant,level:'bounded-autonomous',allowedOperations:[...grant.allowedOperations,operation]},now).outcome,'HUMAN_APPROVAL_REQUIRED')});
test('ungranted operation and missing consent never silently succeed',()=>{assert.equal(evaluateAutonomy({...request,operation:'save-private'},grant,now).outcome,'HUMAN_APPROVAL_REQUIRED');assert.equal(evaluateAutonomy({...request,externalConsent:false},grant,now).outcome,'HUMAN_APPROVAL_REQUIRED')});
test('basic planning is available without a grant but never executes',()=>{const result=evaluateAutonomy({...request,operation:'plan',requestedLevel:'advisory',externalConsent:false},null,now);assert.equal(result.outcome,'ALLOW');assert.equal(result.actionExecuted,false);assert.equal(result.auditRequired,true)});

import test from 'node:test';import assert from 'node:assert/strict';
import {GET,POST} from '../app/api/autonomy-preview/route';
const req=(body:unknown)=>new Request('https://dynamicintel.io/api/autonomy-preview',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
test('autonomy preview lists modes and performs no actions',async()=>{const r=await GET();const j=await r.json();assert.equal(j.status,'SIMULATION_ONLY_NO_GRANT_OR_ACTION');assert.equal(j.levels.length,5)});
test('client preference cannot create a delegation grant',async()=>{const r=await POST(req({level:'bounded-autonomous',operation:'assign-task',externalConsent:true}));const j=await r.json();assert.equal(j.decision.outcome,'HUMAN_APPROVAL_REQUIRED');assert.equal(j.decision.actionExecuted,false)});
test('high impact preview cannot approve publishing',async()=>{const r=await POST(req({level:'bounded-autonomous',operation:'publish',externalConsent:true}));const j=await r.json();assert.notEqual(j.decision.outcome,'ALLOW')});
test('preview rejects injected credentials or grants',async()=>{const r=await POST(req({level:'collaborative',operation:'plan',externalConsent:false,grantId:'forged'}));assert.equal(r.status,400)});

import test from "node:test";import assert from "node:assert/strict";import {dispatch} from "../api/mcp.js";
const msg=(method,params)=>({jsonrpc:"2.0",id:1,method,params});
test("initialize declares tool capability",async()=>{const x=await dispatch(msg("initialize",{}));assert.equal(x.result.serverInfo.name,"dis-public-research")});
test("tool listing exposes read-only tools",async()=>{const x=await dispatch(msg("tools/list",{}));assert.deepEqual(x.result.tools.map(t=>t.name),["dis.plan","dis.scholar_search","dis.public_repo_inspect"])});
test("invalid tool fails closed",async()=>{const x=await dispatch(msg("tools/call",{name:"dis.delete",arguments:{}}));assert.equal(x.error.code,-32602)});
test("invalid parameter fails closed",async()=>{const x=await dispatch(msg("tools/call",{name:"dis.plan",arguments:{question:"x"}}));assert.equal(x.error.code,-32602)});
test("dis.plan preserves evidence uncertainty",async()=>{const x=await dispatch(msg("tools/call",{name:"dis.plan",arguments:{question:"Improve company onboarding"}}));const result=JSON.parse(x.result.content[0].text);assert.ok(result.gates.every(g=>g.pass===false))});
test("scholarly search uses injected read-only source",async()=>{const x=await dispatch(msg("tools/call",{name:"dis.scholar_search",arguments:{query:"implementation science"}}),{retrieve:async()=>({sources:[],errors:["unavailable"]})});assert.equal(JSON.parse(x.result.content[0].text).sources.length,0)});
test("public repository inspection uses injected source",async()=>{const x=await dispatch(msg("tools/call",{name:"dis.public_repo_inspect",arguments:{repository:"owner/repo"}}),{inspectRepository:async()=>({status:"INCOMPLETE"})});assert.equal(JSON.parse(x.result.content[0].text).status,"INCOMPLETE")});

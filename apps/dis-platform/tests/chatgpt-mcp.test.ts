import test from "node:test";
import assert from "node:assert/strict";
import {dispatch} from "../app/api/mcp/route";
import {CONNECTOR_REGISTRY,connectorSummary} from "../lib/integration-registry";
const request=(method:string,params:any={})=>({jsonrpc:"2.0",id:"t1",method,params});
test("ChatGPT plugin MCP initializes and lists tools",async()=>{
 const init:any=await dispatch(request("initialize",{protocolVersion:"2025-06-18"}));
 assert.equal(init.result.serverInfo.name,"dynamic-intelligence-public");
 const list:any=await dispatch(request("tools/list"));
 assert.equal(list.result.tools.length,4);
 assert.ok(list.result.tools.every((t:any)=>t.annotations.readOnlyHint===true));
});
test("anonymous MCP never exposes private connector data or mutation tools",async()=>{
 const list:any=await dispatch(request("tools/list"));
 assert.ok(list.result.tools.every((t:any)=>!/(delete|send_email|write_file|connect_oauth|export_private)/.test(t.name)));
 const raw=JSON.stringify(list);
 assert.equal(raw.includes("CLERK_SECRET_KEY"),false);
});
test("consultation tool returns draft and explicit unverified sources",async()=>{
 const r:any=await dispatch(request("tools/call",{name:"dis_consultation_plan",arguments:{problem:"Help remote rural clinics schedule accessible appointments",mode:"startup"}}));
 const data=JSON.parse(r.result.content[0].text);
 assert.equal(data.state,"WORKING_DRAFT");
 assert.equal(data.slides.length,12);
 assert.match(data.warning,/No research/);
});
test("council is lenses only with separate challenges",async()=>{
 const r:any=await dispatch(request("tools/call",{name:"dis_select_council",arguments:{question:"Analyze a health software idea",count:6,redCount:3}}));
 const data=JSON.parse(r.result.content[0].text);
 assert.equal(data.primary.length,6);assert.equal(data.challenge.length,3);
 assert.ok(data.challenge.every((x:any)=>!data.primary.some((y:any)=>y.name===x.name)));
});
test("invalid unknown MCP tools fail closed",async()=>{
 const r:any=await dispatch(request("tools/call",{name:"dis_delete_account",arguments:{id:"oops"}}));
 assert.equal(r.error.code,-32602);
});
test("private email and Drive connectors are not asserted as connected",()=>{
 const mail=CONNECTOR_REGISTRY.find(x=>x.id==="gmail");
 assert.equal(mail?.configured,false);
 assert.equal(mail?.access,"OWN_OAUTH_REQUIRED");
 assert.equal(connectorSummary().userOAuthConnected,0);
});

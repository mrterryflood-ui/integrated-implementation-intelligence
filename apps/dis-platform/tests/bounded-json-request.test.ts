import test from "node:test";import assert from "node:assert/strict";
import {readBoundedJsonRequest,BoundedJsonRequestError} from "../lib/bounded-json-request";
import {POST as mcpPost,dispatch} from "../app/api/mcp/route";
const req=(body:string,headers:Record<string,string>={})=>new Request("https://example.invalid/api/mcp",{method:"POST",headers:{"content-type":"application/json",...headers},body});
test("actual bytes bound absent and understated Content-Length before public MCP dispatch",async()=>{
 for(const headers of [{},{"content-length":"1"}] as Record<string,string>[]){
  const response=await mcpPost(req(JSON.stringify({jsonrpc:"2.0",method:"ping",id:"x".repeat(20000)}),headers));
  assert.equal(response.status,413);assert.equal((await response.json()).id,null);
 }
});
test("multibyte and chunked input is counted as UTF-8 bytes",async()=>{
 const body=JSON.stringify({value:"é".repeat(30)});assert.ok(body.length<60);assert.ok(new TextEncoder().encode(body).length>60);
 await assert.rejects(readBoundedJsonRequest(req(body),60),(e:unknown)=>e instanceof BoundedJsonRequestError&&e.status===413);
 const stream=new ReadableStream<Uint8Array>({start(c){c.enqueue(new TextEncoder().encode('{"x":"'));c.enqueue(new TextEncoder().encode('a'.repeat(100)));c.close();}});
 const request=new Request("https://example.invalid/",{method:"POST",body:stream,duplex:"half"} as RequestInit);
 await assert.rejects(readBoundedJsonRequest(request,40),(e:unknown)=>e instanceof BoundedJsonRequestError&&e.status===413);
});
test("valid payloads survive while invalid UTF-8 and JSON fail visibly",async()=>{
 assert.deepEqual(await readBoundedJsonRequest(req('{"ok":true}'),100),{ok:true});
 await assert.rejects(readBoundedJsonRequest(req('{broken'),100),BoundedJsonRequestError);
 const bad=new Request("https://example.invalid/",{method:"POST",body:new Uint8Array([0xff])});
 await assert.rejects(readBoundedJsonRequest(bad,100),BoundedJsonRequestError);
 const response=await mcpPost(req('{"jsonrpc":"2.0","method":"ping","id":17}'));assert.equal(response.status,200);assert.equal((await response.json()).id,17);
});
test("RPC IDs and inherited argument names cannot bypass the public contract",async()=>{
 for(const id of [{nested:true},"x".repeat(129),Number.POSITIVE_INFINITY]){
  const r:any=await dispatch({jsonrpc:"2.0",method:"ping",id});assert.equal(r.error.code,-32600);assert.equal(r.id,null);
 }
 const r:any=await dispatch({jsonrpc:"2.0",method:"tools/call",id:1,params:{name:"dis_handoff_template",arguments:{toString:"unexpected"}}});assert.equal(r.error.code,-32602);
});

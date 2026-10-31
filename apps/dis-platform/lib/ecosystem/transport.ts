import {createHash,randomUUID} from 'node:crypto';
import {ContractError} from './contracts';
export type WireResponse={status:number;contentType:string;headers:Headers;text:string;sha256:string;data:unknown};
/** A budget is per engagement, shared across adapters, and cannot be reset by a model. */
export class NetworkBudget{
 requests=0;
 readonly deadline:number;
 constructor(readonly maxRequests=12,readonly maxMilliseconds=30000,readonly maxBytes=262144,readonly fetcher:typeof fetch=fetch,readonly startedAt=Date.now()){this.deadline=startedAt+maxMilliseconds;}
 scope():NetworkBudget{
  const parent=this,local=new NetworkBudget(parent.maxRequests,Math.max(1,parent.deadline-Date.now()),parent.maxBytes,parent.fetcher);
  local.request=async(url,init={},origin)=>{const before=parent.requests;const pending=parent.request(url,init,origin);local.requests+=parent.requests-before;return pending;};
  return local;
 }
 async request(url:string,init:RequestInit={},allowedOrigin:string):Promise<WireResponse>{
  const target=new URL(url);
  if(target.protocol!=='https:'||target.origin!==allowedOrigin||target.username||target.password||target.hash||target.port)throw new ContractError('ENDPOINT_DENIED','The endpoint does not match its reviewed origin.');
  if(this.requests>=this.maxRequests||Date.now()>=this.deadline)throw new ContractError('BUDGET_EXHAUSTED','The bounded engagement budget is exhausted.');
  this.requests++;
  const controller=new AbortController();const remaining=Math.min(10000,this.deadline-Date.now());
  const timeout=setTimeout(()=>controller.abort(),Math.max(1,remaining));
  let reader:ReadableStreamDefaultReader<Uint8Array>|undefined;
  try{
   const response=await this.fetcher(target.href,{...init,redirect:'error',cache:'no-store',signal:controller.signal});
   if(response.redirected||response.url&&new URL(response.url).origin!==allowedOrigin)throw new ContractError('REDIRECT_DENIED','An unexpected origin was returned.');
   const declared=Number(response.headers.get('content-length')||0);
   if(Number.isFinite(declared)&&declared>this.maxBytes){await response.body?.cancel();throw new ContractError('RESPONSE_TOO_LARGE','The upstream response exceeded its size budget.');}
   const chunks:Uint8Array[]=[];let length=0;
   if(response.body){reader=response.body.getReader();for(;;){const next=await reader.read();if(next.done)break;length+=next.value.byteLength;if(length>this.maxBytes){await reader.cancel();throw new ContractError('RESPONSE_TOO_LARGE','The upstream response exceeded its size budget.');}chunks.push(next.value);}}
   const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
   const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes),contentType=response.headers.get('content-type')||'';
   let data:unknown=null;if(text&&/application\/(?:json|[^;]+\+json)/i.test(contentType)){try{data=JSON.parse(text)}catch{throw new ContractError('INVALID_JSON','The upstream response was not valid JSON.');}}
   return {status:response.status,contentType,headers:response.headers,text,sha256:createHash('sha256').update(bytes).digest('hex'),data};
  }catch(error){if(error instanceof ContractError)throw error;throw new ContractError(controller.signal.aborted?'TIMEOUT':'TRANSPORT_ERROR',controller.signal.aborted?'The source did not respond within its bounded time.':'The source could not be reached securely.');}
  finally{clearTimeout(timeout);try{reader?.releaseLock()}catch{}}
 }
}
export function asRecord(value:unknown):Record<string,unknown>{if(!value||typeof value!=='object'||Array.isArray(value))throw new ContractError('INVALID_SCHEMA','The source returned the wrong object shape.');return value as Record<string,unknown>;}
export function boundedText(value:unknown,limit=1600):string{return typeof value==='string'?value.slice(0,limit):'';}
export function publicHttps(value:unknown):string|null{try{if(typeof value!=='string'||value.length>1000)return null;const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null}catch{return null}}
export function parseRpc(wire:WireResponse,id:string):Record<string,unknown>{
 let responses:unknown[]=[];
 if(wire.data!==null)responses=[wire.data];
 else if(/text\/event-stream/i.test(wire.contentType)){
  const events=wire.text.replace(/\r\n/g,'\n').split('\n\n');
  for(const event of events){const value=event.split('\n').filter(line=>line.startsWith('data:')).map(line=>line.slice(5).trimStart()).join('\n');if(!value||value==='[DONE]')continue;try{responses.push(JSON.parse(value))}catch{throw new ContractError('MCP_INVALID_EVENT','Invalid MCP event data.');}}
 }else throw new ContractError('MCP_CONTENT_TYPE','The server did not return MCP JSON or event-stream data.');
 const matching=responses.filter(r=>r&&typeof r==='object'&&!Array.isArray(r)&&(r as any).jsonrpc==='2.0'&&(r as any).id===id);
 if(matching.length!==1)throw new ContractError('MCP_RESPONSE_ID','No unique matching MCP response was received.');
 const response=asRecord(matching[0]);if(response.error)throw new ContractError('MCP_TOOL_ERROR','The MCP server rejected the request.');return asRecord(response.result);
}
export type McpCall={result:Record<string,unknown>;wire:WireResponse;server:{name:string;version:string};protocol:string};
/** Native MCP client: explicit tools only; transport metadata never grants permission. */
export async function callMcpRead(endpoint:string,tool:string,args:Record<string,unknown>,budget:NetworkBudget,resourceToken?:string):Promise<McpCall>{
 if(endpoint!=='https://govbizorchestrator.com/api/mcp')throw new ContractError('MCP_ENDPOINT_DENIED','This MCP endpoint has no reviewed binding.');
 const allowed=new Set(['coverage','find_place','steps_for','glossary','census_find_place','official_pages_read_page']);
 if(!allowed.has(tool))throw new ContractError('MCP_TOOL_DENIED','This MCP operation is not in the reviewed public-read allowlist.');
 const origin=new URL(endpoint).origin;let protocol='2025-06-18',session:string|null=null;
 const headers=()=>new Headers({'content-type':'application/json',accept:'application/json, text/event-stream','MCP-Protocol-Version':protocol,...(session?{'Mcp-Session-Id':session}:{}),...(resourceToken?{Authorization:'Bearer '+resourceToken}:{})});
 const send=async(method:string,params:Record<string,unknown>)=>{const id=randomUUID();const wire=await budget.request(endpoint,{method:'POST',headers:headers(),body:JSON.stringify({jsonrpc:'2.0',id,method,params})},origin);if(wire.status===401||wire.status===403)throw new ContractError(wire.status===401?'AUTHENTICATION_REQUIRED':'SCOPE_DENIED','The MCP resource requires a valid service identity with the requested scope.');if(wire.status<200||wire.status>=300)throw new ContractError('UPSTREAM_HTTP_'+wire.status,'The MCP resource returned HTTP '+wire.status+'.');return {wire,result:parseRpc(wire,id)};};
 const init=await send('initialize',{protocolVersion:protocol,capabilities:{},clientInfo:{name:'dis-owned-ecosystem',version:'1.0.0'}});
 const negotiated=init.result.protocolVersion;if(!['2025-03-26','2025-06-18','2025-11-25'].includes(String(negotiated)))throw new ContractError('MCP_PROTOCOL','Unsupported negotiated MCP protocol.');protocol=String(negotiated);
 session=init.wire.headers.get('mcp-session-id');if(session&&(session.length>256||/[\r\n]/.test(session)))throw new ContractError('MCP_SESSION','Invalid MCP session identifier.');
 const serverData=asRecord(init.result.serverInfo),server={name:boundedText(serverData.name,100),version:boundedText(serverData.version,60)};
 const notified=await budget.request(endpoint,{method:'POST',headers:headers(),body:JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})},origin);
 if(notified.status<200||notified.status>=300)throw new ContractError('MCP_INITIALIZATION','The initialization notification was not accepted.');
 const listing=await send('tools/list',{});if(!Array.isArray(listing.result.tools)||listing.result.tools.length>200)throw new ContractError('MCP_TOOL_SCHEMA','Invalid advertised tool list.');
 if(!listing.result.tools.some((t:any)=>t?.name===tool))throw new ContractError('MCP_TOOL_UNAVAILABLE','The reviewed tool is not advertised by the current server.');
 const called=await send('tools/call',{name:tool,arguments:args});if(called.result.isError===true)throw new ContractError('MCP_TOOL_ERROR','The source tool reported failure; no empty success is inferred.');
 return {...called,server,protocol};
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {IncomingMessage} from 'node:http';
import {Socket} from 'node:net';
import {NextRequestAdapter} from 'next/dist/server/web/spec-extension/adapters/next-request';
import {NodeNextRequest} from 'next/dist/server/base-http/node';
import {addRequestMeta} from 'next/dist/server/request-meta';
import type {NextFetchEvent} from 'next/server';
import {canonicalRequestOrigin,assertSameOriginRequest,sameOriginRequestFailure,RequestOriginError} from '../lib/request-origin';
import {sameOrigin} from '../lib/organizations/http';
import {GET as metadata} from '../app/api/integrations/decisions/client/route';
import proxy from '../proxy';

const origin='https://www.dynamicintel.io',host='www.dynamicintel.io';
const production={DIS_HOST_PRODUCTION:'1',DIS_PUBLIC_ORIGIN:origin};
const failure=(status:number)=>(error:unknown)=>error instanceof RequestOriginError&&error.status===status;

/** Actual installed Next adapter; synthetic local message only, no socket connection. */
function adapted(path='/api/organizations',headers:Record<string,string>={host,origin},method='GET'){
 const incoming=new IncomingMessage(new Socket());incoming.method=method;incoming.url=path;incoming.headers=headers;
 addRequestMeta(incoming,'initURL','https://0.0.0.0:8080'+path);
 return NextRequestAdapter.fromNodeNextRequest(new NodeNextRequest(incoming),new AbortController().signal);
}
async function withEnvironment(values:Record<string,string|undefined>,work:()=>unknown|Promise<unknown>){
 const prior=Object.fromEntries(Object.keys(values).map(key=>[key,process.env[key]]));
 for(const [key,value]of Object.entries(values)){if(value===undefined)delete process.env[key];else process.env[key]=value;}
 try{await work();}finally{for(const [key,value]of Object.entries(prior)){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
}

test('actual NextRequestAdapter retains internal listener URL but canonical Host and browser Origin pass',async()=>{
 const request=adapted();assert.equal(new URL(request.url).origin,'https://0.0.0.0:8080');
 assert.equal(request.headers.get('host'),host);assert.equal(canonicalRequestOrigin(request,production),origin);
 assert.doesNotThrow(()=>assertSameOriginRequest(request,{},production));
 await withEnvironment(production,()=>assert.doesNotThrow(()=>sameOrigin(request)));
});

test('production rejects missing, foreign, ambiguous and spoofed Host even when forwarded headers name DIS',()=>{
 for(const value of [undefined,'evil.example','dynamicintel.io','0.0.0.0:8080',host+':443',host+', evil.example','evil.example, '+host,host+'.',host.toUpperCase()]){
  const request=adapted('/api/organizations',{...(value===undefined?{}:{host:value}),origin,'x-forwarded-host':host,'x-forwarded-proto':'https',forwarded:'host='+host+';proto=https'});
  assert.throws(()=>assertSameOriginRequest(request,{},production),failure(403),String(value));
  assert.throws(()=>canonicalRequestOrigin(request,production),failure(403),String(value));
 }
 const request=adapted('/api/organizations',{host,origin,'x-forwarded-host':'evil.example','x-forwarded-proto':'http'});
 assert.doesNotThrow(()=>assertSameOriginRequest(request,{},production));
});

test('browser Origin must be the exact configured serialized origin',()=>{
 for(const value of [undefined,'','null','https://evil.example','http://'+host,origin+':444',origin+':443',origin+'/',origin+'/path',origin+'?x=1',origin+'#x','https://user:pass@'+host,origin+', https://evil.example']){
  const request=adapted('/api/organizations',{host,...(value===undefined?{}:{origin:value})});
  assert.throws(()=>assertSameOriginRequest(request,{},production),failure(403),String(value));
 }
 assert.doesNotThrow(()=>assertSameOriginRequest(adapted('/api/council',{host}),{allowMissingOrigin:true},production));
 assert.throws(()=>assertSameOriginRequest(adapted('/api/council',{host:'evil.example'}),{allowMissingOrigin:true},production),failure(403));
 assert.throws(()=>assertSameOriginRequest(adapted('/api/council',{host,origin:'null'}),{allowMissingOrigin:true},production),failure(403));
});

test('production missing or malformed public configuration fails closed before optional-Origin handling',()=>{
 for(const value of [undefined,'','not-a-url','http://'+host,origin+'/path',origin+'?x=1',origin+'#x','https://user:pass@'+host,' https://'+host,'https://localhost','https://127.0.0.1']){
  const env={DIS_HOST_PRODUCTION:'1',DIS_PUBLIC_ORIGIN:value};
  assert.throws(()=>canonicalRequestOrigin(adapted(),env),failure(503),String(value));
  assert.throws(()=>assertSameOriginRequest(adapted('/api/council',{host}),{allowMissingOrigin:true},env),failure(503));
 }
 assert.equal(canonicalRequestOrigin(adapted(),{...production,DIS_PUBLIC_ORIGIN:origin+'/'}),origin);
 assert.throws(()=>canonicalRequestOrigin(adapted(),{}),failure(503));
});

test('explicit local development, tests and existing preview origins retain same-origin behavior',()=>{
 const local=new Request('http://localhost:3000/api/organizations',{headers:{host:'localhost:3000',origin:'http://localhost:3000'}});
 assert.doesNotThrow(()=>assertSameOriginRequest(local,{}, {NODE_ENV:'development'}));
 const listening=new Request('http://0.0.0.0:3000/api/organizations',{headers:{host:'localhost:3000',origin:'http://localhost:3000','x-forwarded-host':'evil.example'}});
 assert.doesNotThrow(()=>assertSameOriginRequest(listening,{}, {NODE_ENV:'development'}));
 assert.throws(()=>assertSameOriginRequest(new Request(listening.url,{headers:{host:'evil.example',origin:'http://evil.example'}}),{}, {NODE_ENV:'development'}),failure(403));
 const preview=new Request('https://synthetic-preview.example/api/council',{headers:{origin:'https://synthetic-preview.example'}});
 assert.doesNotThrow(()=>assertSameOriginRequest(preview,{}, {NODE_ENV:'production',VERCEL_ENV:'preview'}));
 assert.doesNotThrow(()=>assertSameOriginRequest(preview,{}, {NODE_ENV:'test'}));
 assert.throws(()=>assertSameOriginRequest(preview,{}, {NODE_ENV:'test',DIS_PUBLIC_ORIGIN:''}),failure(503));
 assert.throws(()=>assertSameOriginRequest(preview,{}, {NODE_ENV:'test',DIS_HOST_PRODUCTION:'0'}),failure(503));
});

test('public Decisions metadata accepts adapter Host without Origin and returns only canonical public configuration',async()=>{
 await withEnvironment({...production,DIS_CONNECTOR_ENCRYPTION_KEY:'a'.repeat(64),DIS_DECISIONS_READ_TOOL_ALLOWLIST:undefined},async()=>{
  const response=await metadata(adapted('/api/integrations/decisions/client',{host,'x-forwarded-host':'evil.example'}));
  assert.equal(response.status,200);const data=await response.json();
  assert.equal(data.client_id,origin+'/api/integrations/decisions/client');
  assert.deepEqual(data.redirect_uris,[origin+'/api/organizations/connections/decisions/callback']);
  assert.ok(!JSON.stringify(data).includes('a'.repeat(64)));
  assert.equal((await metadata(adapted('/api/integrations/decisions/client',{host:'evil.example','x-forwarded-host':host}))).status,403);
 });
});

test('closed-identity redirect uses canonical public origin and safely rejects missing or malformed configuration',async()=>{
 await withEnvironment({...production,CLERK_SECRET_KEY:undefined,NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:undefined},async()=>{
  const response=await proxy(adapted('/workspace',{host,'x-forwarded-host':'evil.example'}),{} as NextFetchEvent);
  assert.equal(response?.status,307);assert.equal(response?.headers.get('location'),origin+'/?workspace=pending');
  for(const value of [undefined,'']){
   await withEnvironment({DIS_PUBLIC_ORIGIN:value},async()=>{
    const denied=await proxy(adapted('/workspace',{host}),{} as NextFetchEvent);
    assert.equal(denied?.status,503);assert.equal(denied?.headers.get('location'),null);
   });
  }
  const denied=await proxy(adapted('/workspace',{host:'evil.example','x-forwarded-host':host}),{} as NextFetchEvent);
  assert.equal(denied?.status,403);assert.equal(denied?.headers.get('location'),null);
 });
});

test('owned apex GET/HEAD navigation redirects to www without trusting path or forwarded authority',async()=>{
 await withEnvironment({...production,CLERK_SECRET_KEY:undefined,NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:undefined},async()=>{
  for(const method of ['GET','HEAD']){
   const response=await proxy(adapted('/planning?view=meetings',{host:'dynamicintel.io','x-forwarded-host':'evil.example'},method),{} as NextFetchEvent);
   assert.equal(response?.status,308);assert.equal(response?.headers.get('location'),origin+'/planning?view=meetings');
  }
  const hostilePath=await proxy(adapted('//evil.example/path?x=1',{host:'dynamicintel.io'}),{} as NextFetchEvent);
  assert.equal(new URL(hostilePath!.headers.get('location')!).origin,origin);
  const mutation=await proxy(adapted('/workspace',{host:'dynamicintel.io'},'POST'),{} as NextFetchEvent);
  assert.equal(mutation?.status,403);assert.equal(mutation?.headers.get('location'),null);
 });
});

test('origin failures return bounded private responses',async()=>{
 const response=sameOriginRequestFailure(adapted('/api/organizations',{host,origin:'https://evil.example'}),{},production);
 assert.equal(response?.status,403);assert.equal(response?.headers.get('cache-control'),'private, no-store');
 assert.deepEqual(await response!.json(),{error:'Same-origin request required; origin mismatch'});
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {POST} from '../app/api/council/route';

test('actual council handler rejects browser-supplied evidence and readiness before auth or inference',async()=>{
 const previous=process.env.VERCEL_ENV;process.env.VERCEL_ENV='preview';
 try{
  for(const key of ['providedEvidence','evidence','sourceReceipts','engagementAssurance','operatingContract']){
   const response=await POST(new Request('https://example.test/api/council',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({prompt:'Evaluate a synthetic implementation example',[key]:{readyToExecute:true,status:'SOURCE_INSPECTED'}})}));
   assert.equal(response.status,400,key+' must not be trusted');
   assert.match((await response.json()).error,/Browser-supplied/);
  }
 }finally{if(previous===undefined)delete process.env.VERCEL_ENV;else process.env.VERCEL_ENV=previous}
});
test('production identity gate still precedes every acceptance assertion',async()=>{
 const previous={VERCEL_ENV:process.env.VERCEL_ENV,CLERK_SECRET_KEY:process.env.CLERK_SECRET_KEY,NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY};
 process.env.VERCEL_ENV='production';delete process.env.CLERK_SECRET_KEY;delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
 try{
  const response=await POST(new Request('https://example.test/api/council',{method:'POST',body:JSON.stringify({prompt:'Try a forged approval',engagementAssurance:{readyToExecute:true}})}));
  assert.equal(response.status,503);assert.match((await response.json()).error,/Private identity/);
 }finally{for(const [key,value]of Object.entries(previous)){if(value===undefined)delete process.env[key];else process.env[key]=value}}
});

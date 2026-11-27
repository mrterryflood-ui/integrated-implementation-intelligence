import assert from 'node:assert/strict';
import test from 'node:test';
import { productionIdentityBlocked, trustedProductionUploader, productionRelease } from './release-gates.ts';
const live={NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:'pk_live_fixture',CLERK_SECRET_KEY:'sk_live_fixture'};
const dev={NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:'pk_test_fixture',CLERK_SECRET_KEY:'sk_test_fixture'};
test('alternate production host denies missing, test or mixed credentials',()=>{
  for(const env of [{DIS_HOST_PRODUCTION:'1'},{NODE_ENV:'production'},{DIS_HOST_PRODUCTION:'1',VERCEL_ENV:'preview'}]){
    assert.equal(productionRelease(env),true);
    for(const keys of [{},dev,{...live,CLERK_SECRET_KEY:dev.CLERK_SECRET_KEY}]) assert.equal(productionIdentityBlocked({...env,...keys}),true);
    assert.equal(productionIdentityBlocked({...env,...live}),false);
  }
});
test('alternate production upload allowlist remains deny by default',()=>{
  for(const env of [{NODE_ENV:'production'},{DIS_HOST_PRODUCTION:'1',VERCEL_ENV:'preview'},{VERCEL_ENV:'production'}]){
    const e={...env,...live};
    assert.equal(trustedProductionUploader('fixture-a',e),false);
    assert.equal(trustedProductionUploader('fixture-a',{...e,DIS_TRUSTED_UPLOAD_SUBJECTS:'fixture-b'}),false);
    assert.equal(trustedProductionUploader('fixture-a',{...e,DIS_TRUSTED_UPLOAD_SUBJECTS:'fixture-a, fixture-b'}),true);
    assert.equal(trustedProductionUploader('fixture-a',{...env,...dev,DIS_TRUSTED_UPLOAD_SUBJECTS:'fixture-a'}),false);
  }
});
test('existing Vercel preview and local test behavior remains separate',()=>{
  for(const env of [{VERCEL_ENV:'preview',NODE_ENV:'production'},{NODE_ENV:'test'},{NODE_ENV:'development'}]){
    assert.equal(productionIdentityBlocked({...env,...dev}),false);
    assert.equal(trustedProductionUploader('fixture-a',{...env,...dev}),true);
  }
});
test('missing, unknown and contradictory deployment markers fail closed',()=>{
  for(const env of [{},{NODE_ENV:''},{NODE_ENV:'staging'},{VERCEL_ENV:''},{VERCEL_ENV:'unknown',NODE_ENV:'test'},{DIS_HOST_PRODUCTION:'0',NODE_ENV:'development'},{DIS_HOST_PRODUCTION:'',VERCEL_ENV:'preview'},{VERCEL_ENV:'production',NODE_ENV:'test'}]){
    assert.equal(productionRelease(env),true);
    assert.equal(productionIdentityBlocked(env),true);
    assert.equal(productionIdentityBlocked({...env,...dev}),true);
    assert.equal(trustedProductionUploader('fixture-a',env),false);
    assert.equal(trustedProductionUploader('fixture-a',{...env,...live}),false);
    assert.equal(trustedProductionUploader('fixture-a',{...env,...live,DIS_TRUSTED_UPLOAD_SUBJECTS:'fixture-b'}),false);
    assert.equal(trustedProductionUploader('fixture-a',{...env,...live,DIS_TRUSTED_UPLOAD_SUBJECTS:'fixture-a'}),true);
  }
});

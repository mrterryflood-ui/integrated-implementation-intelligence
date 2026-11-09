// Independent synthetic execution of the actual Home server component.
// Only presentation imports and Clerk identity resolution are stubbed.
// This is not live identity or browser acceptance.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const {createHash} = require('node:crypto');
const app = '/workspace/scratch/ad20f6f1a514/dis-integration/apps/dis-platform';
const review = __dirname;
const {build} = require(path.join(app, 'node_modules/esbuild'));
const stubs = {
  './consultation-studio': 'export default function ConsultationStudio(){return null}',
  './council-lab': 'export default function CouncilLab(){return null}',
  'next/link': 'export default function Link(){return null}',
  '@clerk/nextjs': 'export function SignInButton(){return null}; export function UserButton(){return null}',
  '@clerk/nextjs/server': 'export async function auth(){globalThis.__identityReviewAuthCalls++;return {userId:null}}',
};
function find(node, name){
  if(!node || typeof node !== 'object') return null;
  if(node.type?.name === name) return node;
  const children = node.props?.children;
  for(const child of Array.isArray(children) ? children.flat(Infinity) : [children]){
    const result = find(child, name);
    if(result) return result;
  }
  return null;
}
(async()=>{
  const compiled = await build({entryPoints:[path.join(app,'app/page.tsx')],bundle:true,write:false,format:'cjs',platform:'node',packages:'external',jsx:'automatic',plugins:[{name:'isolated-identity-fixture',setup(b){
    b.onResolve({filter:/.*/},args=>Object.hasOwn(stubs,args.path)?{path:args.path,namespace:'identity-fixture'}:undefined);
    b.onLoad({filter:/.*/,namespace:'identity-fixture'},args=>({contents:stubs[args.path],loader:'js'}));
  }}]});
  const filename = path.join(review,'mobile-home-fixture.cjs');
  const mod = new Module(filename);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(app);
  mod._compile(compiled.outputFiles[0].text,mod.filename);
  const cases = [
    ['production_missing','production',undefined,undefined,false,0],
    ['production_test_pair','production','pk_test_fixture','sk_test_fixture',false,0],
    ['production_mixed_pair','production','pk_live_fixture','sk_test_fixture',false,0],
    ['production_live_pair','production','pk_live_fixture','sk_live_fixture',true,1],
    ['preview_test_pair','preview','pk_test_fixture','sk_test_fixture',false,1],
    ['preview_live_pair','preview','pk_live_fixture','sk_live_fixture',true,1],
  ];
  const results=[];
  for(const [id,environment,publicFixture,secretFixture,expectedReady,expectedAuthCalls] of cases){
    // Replace with synthetic fixture values; never read or print deployed keys.
    process.env.VERCEL_ENV=environment;
    for(const [key,value] of Object.entries({NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:publicFixture,CLERK_SECRET_KEY:secretFixture})){
      if(value===undefined) delete process.env[key]; else process.env[key]=value;
    }
    globalThis.__identityReviewAuthCalls=0;
    const tree=await mod.exports.default();
    const studio=find(tree,'ConsultationStudio'),council=find(tree,'CouncilLab');
    assert.ok(studio&&council,id+' renders both existing components');
    assert.equal(studio.props.privateReady,expectedReady,id+' studio readiness');
    assert.equal(council.props.privateReady,expectedReady,id+' council readiness');
    assert.equal(globalThis.__identityReviewAuthCalls,expectedAuthCalls,id+' identity resolution boundary');
    results.push({id,privateReady:studio.props.privateReady,authCalls:globalThis.__identityReviewAuthCalls,passed:true});
  }
  const receipt={kind:'SYNTHETIC_ACTUAL_HOME_COMPONENT_EXECUTION',sourceSha256:createHash('sha256').update(fs.readFileSync(path.join(app,'app/page.tsx'))).digest('hex'),cases:results,passed:results.length,failed:0,liveIdentityVerified:false,browserExecuted:false,externalNetworkCalls:0,limitations:'Presentation modules and auth() stubbed; actual Home expression and release-gates implementation bundled unchanged.'};
  fs.writeFileSync(path.join(review,'mobile-identity-home-controls.json'),JSON.stringify(receipt,null,2)+'\n');
  console.log(JSON.stringify(receipt,null,2));
})().catch(error=>{console.error(error);process.exitCode=1});

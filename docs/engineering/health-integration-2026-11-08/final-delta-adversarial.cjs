const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const {validateAssessmentSource,AssessmentRecoveryError}=require('../dis-integration/apps/dis-platform/lib/case-assessment-recovery.ts');
const {CASE_REPORT_MAX_CHARS:limit,CASE_REPORT_MAX_DB_BYTES:byteLimit}=require('../dis-integration/apps/dis-platform/lib/case-payload-capacity.ts');
const {PGlite}=require('../dis-integration/apps/dis-platform/node_modules/@electric-sql/pglite');
const results=[];
const row=text=>({version:3,previous_version:'1',report_text:text,report_bytes:Buffer.byteLength(text),current_report_bytes:50,playbook_bytes:50});
function verify(name,text,status=null,patch={}){
 let actual=null;
 try{validateAssessmentSource({...row(text),...patch},3);}catch(e){if(!(e instanceof AssessmentRecoveryError))throw e;actual=e.status;}
 assert.equal(actual,status,name);
 results.push({name,expected:status??'accepted',actual:actual??'accepted',textCodeUnits:text.length,bytes:Buffer.byteLength(text)});
}
(async()=>{
 const suffixes=[' ',String.raw`\\`,String.raw`"`,String.raw`\\"`,String.raw`\\\\`,String.raw`\\\\"`,'\n\t\r',String.raw`","extra":" `,'界','𝄞','\u2028\u2029',String.raw`\u0020`];
 for(let index=0;index<suffixes.length;index++){
  const suffix=suffixes[index];
  const template={evidence:suffix,authority:false};
  const fill=limit-JSON.stringify(template).length;
  const value={...template,evidence:'界'.repeat(fill)+suffix};
  const compact=JSON.stringify(value);assert.equal(compact.length,limit);
  verify('valid boundary quoted suffix '+index,JSON.stringify(value,null,'\t'));
  verify('one-over quoted suffix '+index,JSON.stringify({...value,evidence:value.evidence+' '},null,'\t'),413);
 }
 verify('numeric exponent cannot shrink through parsing','{"n":1e'+ '9'.repeat(limit)+'}',413);
 verify('numeric integer cannot shrink through parsing','{"n":'+ '9'.repeat(limit)+'}',413);
 verify('escaped unicode cannot shrink through parsing','{"s":"'+String.raw`\u0020`.repeat(Math.ceil(limit/6))+'"}',413);
 verify('non-JSON formatting whitespace fails','{\v"x":1}',409);
 verify('invalid trailing comma fails','{"x":1,}',409);
 verify('unclosed escaped quote fails',String.raw`{"x":"\\`,409);
 verify('stored bytes exact bound',' '.repeat(byteLimit-2)+'{}');
 verify('stored bytes one over',' '.repeat(byteLimit-1)+'{}',413);
 verify('mismatched byte receipt fails','{"s":"界"}',503,{report_bytes:9});
 verify('oversized current report fails','{}',413,{current_report_bytes:byteLimit+1});
 const raw=fs.readFileSync(__dirname+'/near-limit-report.json','utf8');
 assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),'7e31b174d4b8e38a39f757e240f09886004d7cbfcff87389d67e19b297849936');
 const db=new PGlite();await db.waitReady;
 const source=(await db.query('SELECT $1::jsonb::text AS body',[raw])).rows[0].body;
 verify('original independently retained failing fixture now recoverable',source);
 await db.close();
 const receipt={head:'1969e2e7af73f8ba65ab48fe1e761a1a9f4222b0',reviewedParent:'039761a706534e8d21ffdbe71c616646ee9ef539',count:results.length,allPassed:true,results};
 fs.writeFileSync(__dirname+'/final-delta-adversarial-results.json',JSON.stringify(receipt,null,2)+'\n');
 console.log(JSON.stringify({head:receipt.head,count:results.length,allPassed:true}));
})().catch(e=>{console.error(e);process.exitCode=1;});


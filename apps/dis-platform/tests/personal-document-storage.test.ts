/** Registered document handlers, synthetic identity/object transport, real PGlite
 * ownership policies. No Clerk, Neon, Railway, or Vercel service is contacted. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import {PGlite} from '@electric-sql/pglite';
import {ObjectStoreError,railwayStorageConfiguration,isRailwayObjectPath,validateRailwayObjectPath,type ObjectExpectation} from '../lib/organizations/object-store';

type Statement={text:string;values:unknown[]};
type Stored={bytes:Buffer;contentType:string;sha256:string};
const hash=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const origin='https://synthetic-documents.test',owner='synthetic-document-owner',other='synthetic-other-owner';
const envKeys=['DIS_DATABASE_URL','NODE_ENV','VERCEL_ENV','DIS_HOST_PRODUCTION','NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY','CLERK_SECRET_KEY','DIS_TRUSTED_UPLOAD_SUBJECTS','DIS_OBJECT_STORAGE_PROVIDER','DIS_S3_ENDPOINT','DIS_S3_BUCKET','DIS_S3_REGION','DIS_S3_ACCESS_KEY_ID','DIS_S3_SECRET_ACCESS_KEY','DIS_S3_URL_STYLE','BLOB_READ_WRITE_TOKEN'] as const;

test('personal document consumers preserve provider, ownership and receipt boundaries',async t=>{
 const directory=mkdtempSync(join(tmpdir(),'dis-personal-storage-')),bundlePath=join(directory,'routes.cjs');
 const originalEnv=Object.fromEntries(envKeys.map(key=>[key,process.env[key]]));
 const db=new PGlite();await db.waitReady;
 const objects=new Map<string,Stored>(),legacyObjects=new Map<string,Stored>();
 const events:Array<{operation:string;path:string;expected?:ObjectExpectation}>=[];
 let actor:string|null=owner,putFailure:unknown=null,getFailure:unknown=null,removeFailure:unknown=null,badReceipt=false;
 let afterGet:(()=>Promise<void>)|null=null,afterTransaction:((statements:Statement[])=>Promise<void>)|null=null,cancelled=0;
 const stream=(data:Stored)=>new ReadableStream<Uint8Array>({start(controller){controller.enqueue(new Uint8Array(data.bytes));},pull(controller){controller.close();},cancel(){cancelled++;}});
 const globals=globalThis as typeof globalThis&{__disPersonalStorageFixture?:any};
 try{
  for(const key of envKeys)delete process.env[key];
  Object.assign(process.env,{DIS_DATABASE_URL:'synthetic-pglite-transport',NODE_ENV:'production',NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:'pk_live_fixture',CLERK_SECRET_KEY:'sk_live_fixture',DIS_TRUSTED_UPLOAD_SUBJECTS:owner,DIS_OBJECT_STORAGE_PROVIDER:'railway',DIS_S3_ENDPOINT:'https://fixture.storageapi.dev',DIS_S3_BUCKET:'synthetic-documents',DIS_S3_REGION:'auto',DIS_S3_ACCESS_KEY_ID:'fixture-access-key',DIS_S3_SECRET_ACCESS_KEY:'fixture-secret-not-a-credential',DIS_S3_URL_STYLE:'virtual'});
  await db.exec(readFileSync('tests/fixtures/casework-recovery-schema.sql','utf8'));
  // Existing source-controlled fixture supplies workspace RLS. Document select
  // and insert policies below are synthetic owner checks, not a migration or a
  // claim that the incomplete live-schema baseline contains this table.
  await db.exec(`CREATE TABLE dis_documents(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),workspace_id uuid NOT NULL REFERENCES dis_workspaces(id),owner_subject text NOT NULL,filename text NOT NULL,media_type text,byte_size bigint NOT NULL,blob_path text NOT NULL,extracted_text text,extraction_state text NOT NULL,sha256 text,created_at timestamptz NOT NULL DEFAULT now());
   ALTER TABLE dis_documents ENABLE ROW LEVEL SECURITY; ALTER TABLE dis_documents FORCE ROW LEVEL SECURITY;
   GRANT SELECT,INSERT ON dis_documents TO dis_app_safe;
   CREATE POLICY document_owner_read ON dis_documents FOR SELECT TO dis_app_safe USING(owner_subject=current_setting('dis.subject_id',true) AND EXISTS(SELECT 1 FROM dis_workspaces w WHERE w.id=dis_documents.workspace_id AND w.owner_subject=current_setting('dis.subject_id',true)));
   CREATE POLICY document_owner_insert ON dis_documents FOR INSERT TO dis_app_safe WITH CHECK(owner_subject=current_setting('dis.subject_id',true) AND EXISTS(SELECT 1 FROM dis_workspaces w WHERE w.id=dis_documents.workspace_id AND w.owner_subject=current_setting('dis.subject_id',true)));`);
  await db.exec(readFileSync('db/002_document_delete_policy.sql','utf8'));
  await db.query('INSERT INTO dis_subjects(subject_id) VALUES($1),($2)',[owner,other]);
  const workspaceId=(await db.query<{id:string}>('INSERT INTO dis_workspaces(owner_subject,title) VALUES($1,$2) RETURNING id',[owner,'Synthetic personal workspace'])).rows[0].id;
  const otherWorkspace=(await db.query<{id:string}>('INSERT INTO dis_workspaces(owner_subject,title) VALUES($1,$2) RETURNING id',[other,'Synthetic separate workspace'])).rows[0].id;
  globals.__disPersonalStorageFixture={
   get actor(){return actor;},ObjectStoreError,railwayStorageConfiguration,isRailwayObjectPath,
   async transaction(statements:Statement[]){
    await db.exec('BEGIN; SET LOCAL ROLE dis_app_safe;');let result:unknown[][];
    try{result=[];for(const s of statements)result.push((await db.query(s.text,s.values)).rows);await db.exec('COMMIT');}
    catch(error){await db.exec('ROLLBACK');throw error;}
    if(afterTransaction)await afterTransaction(statements);return result;
   },
   railwayObjectStore:{
    async putBytes(path:string,bytes:Uint8Array,contentType:string){
     railwayStorageConfiguration();validateRailwayObjectPath(path);events.push({operation:'railway-put',path});if(putFailure)throw putFailure;
     const data={bytes:Buffer.from(bytes),contentType,sha256:hash(bytes)};objects.set(path,data);
     return{pathname:path,size:bytes.byteLength,contentType,sha256:badReceipt?'0'.repeat(64):data.sha256};
    },
    async get(path:string,expected:ObjectExpectation){
     railwayStorageConfiguration();validateRailwayObjectPath(path);events.push({operation:'railway-get',path,expected});if(getFailure)throw getFailure;
     const data=objects.get(path);if(!data)throw new ObjectStoreError('OBJECT_NOT_FOUND','Synthetic original unavailable',404);
     if(expected.size!==data.bytes.length||expected.contentType!==data.contentType||expected.sha256!==data.sha256)throw new ObjectStoreError('OBJECT_CHANGED','The original differs from its saved receipt.',409);
     const original=stream(data);if(afterGet)await afterGet();return{pathname:path,size:data.bytes.length,contentType:data.contentType,sha256:data.sha256,stream:original};
    },
    async remove(path:string){railwayStorageConfiguration();validateRailwayObjectPath(path);events.push({operation:'railway-remove',path});if(removeFailure)throw removeFailure;objects.delete(path);},
   },
   async legacyGet(path:string,options:{access:string}){assert.equal(options.access,'private');events.push({operation:'legacy-get',path});const data=legacyObjects.get(path);return data?{statusCode:200,stream:stream(data)}:null;},
   async legacyDelete(path:string){events.push({operation:'legacy-remove',path});legacyObjects.delete(path);},
  };
  await build({stdin:{contents:"export * as documents from './app/api/documents/route'; export * as download from './app/api/documents/download/route';",resolveDir:process.cwd(),loader:'ts'},outfile:bundlePath,bundle:true,platform:'node',format:'cjs',packages:'external',logLevel:'silent',plugins:[{
   name:'synthetic-identity-database-and-object-transport',setup(builder){
    builder.onResolve({filter:/^@clerk\/nextjs\/server$/},()=>({path:'identity',namespace:'document-fixture'}));
    builder.onResolve({filter:/^@neondatabase\/serverless$/},()=>({path:'database',namespace:'document-fixture'}));
    builder.onResolve({filter:/^@vercel\/blob$/},()=>({path:'legacy',namespace:'document-fixture'}));
    builder.onResolve({filter:/\/lib\/organizations\/object-store$/},()=>({path:'railway',namespace:'document-fixture'}));
    builder.onLoad({filter:/.*/,namespace:'document-fixture'},args=>({loader:'js',contents:{
     identity:'export async function auth(){return {userId:globalThis.__disPersonalStorageFixture.actor}}',
     database:`export function neon(){const query=(parts,...values)=>({text:parts.reduce((text,part,i)=>text+part+(i<values.length?'$'+(i+1):''),''),values});query.transaction=statements=>globalThis.__disPersonalStorageFixture.transaction(statements);return query;}`,
     legacy:'export const get=(...args)=>globalThis.__disPersonalStorageFixture.legacyGet(...args);export const del=(...args)=>globalThis.__disPersonalStorageFixture.legacyDelete(...args);',
     railway:'const fixture=globalThis.__disPersonalStorageFixture;export const {ObjectStoreError,railwayStorageConfiguration,isRailwayObjectPath,railwayObjectStore}=fixture;',
    }[args.path]!}));
   },
  }]});
  const api=createRequire(import.meta.url)(bundlePath) as {documents:{POST:(r:Request)=>Promise<Response>;GET:(r:Request)=>Promise<Response>;DELETE:(r:Request)=>Promise<Response>};download:{GET:(r:Request)=>Promise<Response>}};
  const request=(method:string,id?:string,requestOrigin:string|null=origin)=>new Request(origin+'/api/documents'+(id?'?id='+id:''),{method,headers:requestOrigin?{origin:requestOrigin}:{}});
  const upload=(name='planning-notes.txt',bytes:Uint8Array=new TextEncoder().encode('Synthetic planning notes'),workspace=workspaceId,requestOrigin:string|null=origin)=>{
   const form=new FormData();form.set('workspaceId',workspace);form.set('file',new File([Buffer.from(bytes)],name,{type:'text/plain'}));
   return new Request(origin+'/api/documents',{method:'POST',headers:requestOrigin?{origin:requestOrigin}:{},body:form});
  };
  const count=async()=>Number((await db.query<{n:number}>('SELECT count(*)::int AS n FROM dis_documents')).rows[0].n);
  const storedRow=async(id:string)=>(await db.query<any>('SELECT * FROM dis_documents WHERE id=$1',[id])).rows[0];
  const seedLegacy=async()=>{
   const path='dis/'+randomUUID()+'/legacy.txt',bytes=Buffer.from('Synthetic legacy original'),sha256=hash(bytes);
   legacyObjects.set(path,{bytes,sha256,contentType:'text/plain'});
   const row=(await db.query<any>("INSERT INTO dis_documents(workspace_id,owner_subject,filename,media_type,byte_size,blob_path,extraction_state,sha256) VALUES($1,$2,'legacy.txt','text/plain',$3,$4,'EXTRACTED',$5) RETURNING *",[workspaceId,owner,bytes.length,path,sha256])).rows[0];
   return row;
  };

  await t.test('identity, invited-uploader, origin, provider and workspace gates precede any object write',async()=>{
   actor=null;assert.equal((await api.documents.POST(upload())).status,401);actor=other;
   assert.equal((await api.documents.POST(upload())).status,403);actor=owner;
   for(const value of [null,'https://foreign.test',origin+'/not-an-origin'])assert.equal((await api.documents.POST(upload('notes.txt',undefined,workspaceId,value))).status,403);
   const provider=process.env.DIS_OBJECT_STORAGE_PROVIDER;process.env.BLOB_READ_WRITE_TOKEN='fixture-legacy-token';delete process.env.DIS_OBJECT_STORAGE_PROVIDER;
   assert.equal((await api.documents.POST(upload())).status,503);process.env.DIS_OBJECT_STORAGE_PROVIDER=provider;delete process.env.BLOB_READ_WRITE_TOKEN;
   assert.equal((await api.documents.POST(upload('notes.txt',undefined,otherWorkspace))).status,404);
   assert.equal(events.length,0);assert.equal(await count(),0);
  });
  await t.test('multipart body, file size and file type bounds cannot be bypassed by an absent or false length',async()=>{
   for(const length of [undefined,'1']){
    const r=new Request(origin+'/api/documents',{method:'POST',headers:{origin,'content-type':'multipart/form-data; boundary=synthetic',...(length?{'content-length':length}:{})},body:new Uint8Array(5*1024*1024+100001)});
    assert.equal((await api.documents.POST(r)).status,413);
   }
   assert.equal((await api.documents.POST(upload('notes.txt',new Uint8Array(5*1024*1024+1)))).status,413);
   assert.equal((await api.documents.POST(upload('notes.txt',new Uint8Array()))).status,413);
   assert.equal((await api.documents.POST(upload('execute.exe'))).status,415);
   assert.equal(events.length,0);assert.equal(await count(),0);
  });
  let item:any;
  const originalBytes=Buffer.from('Synthetic adoption plan\nKeep implementation outcomes separate from participant benefit.');
  await t.test('new upload saves an exact Railway receipt and extracted text without a Vercel token',async()=>{
   const response=await api.documents.POST(upload('meeting notes?.txt',originalBytes));assert.equal(response.status,201);assert.equal(response.headers.get('cache-control'),'private, no-store');
   item=(await response.json()).document;const row=await storedRow(item.id);
   assert.equal(row.owner_subject,owner);assert.equal(row.filename,'meeting_notes_.txt');assert.match(row.blob_path,/^railway\/dis\/[a-f0-9-]{36}\/meeting_notes_\.txt$/);
   assert.equal(Number(row.byte_size),originalBytes.length);assert.equal(row.sha256,hash(originalBytes));assert.equal(row.media_type,'text/plain');assert.equal(row.extracted_text,originalBytes.toString());assert.equal(row.extraction_state,'EXTRACTED');
   assert.ok(objects.has(row.blob_path));assert.deepEqual(events.map(e=>e.operation),['railway-put']);
  });
  await t.test('foreign subjects cannot list, retrieve or delete the stored original',async()=>{
   const before=events.length;actor=other;
   assert.deepEqual((await (await api.documents.GET(new Request(origin+'/api/documents?workspaceId='+workspaceId))).json()).documents,[]);
   assert.equal((await api.download.GET(request('GET',item.id))).status,404);
   assert.equal((await api.documents.DELETE(request('DELETE',item.id))).status,404);
   assert.equal(events.length,before);assert.ok(await storedRow(item.id));actor=owner;
  });
  await t.test('download passes persisted size, media type and hash and returns a protected attachment',async()=>{
   const row=await storedRow(item.id),response=await api.download.GET(request('GET',item.id));assert.equal(response.status,200);
   assert.equal(response.headers.get('content-type'),'application/octet-stream');assert.equal(response.headers.get('x-content-type-options'),'nosniff');assert.equal(response.headers.get('cache-control'),'private, no-store, max-age=0');assert.match(response.headers.get('content-disposition')!,/^attachment;/);
   assert.deepEqual(Buffer.from(await response.arrayBuffer()),originalBytes);
   assert.deepEqual(events.at(-1),{operation:'railway-get',path:row.blob_path,expected:{size:originalBytes.length,contentType:'text/plain',sha256:hash(originalBytes)}});
  });
  await t.test('receipt mismatch, transport failure and wrong namespaces fail without a provider fallback or error leakage',async()=>{
   process.env.BLOB_READ_WRITE_TOKEN='fixture-legacy-token';const beforeLegacy=events.filter(e=>e.operation.startsWith('legacy')).length;
   await db.query('UPDATE dis_documents SET sha256=$1 WHERE id=$2',['b'.repeat(64),item.id]);assert.equal((await api.download.GET(request('GET',item.id))).status,409);
   await db.query('UPDATE dis_documents SET sha256=$1 WHERE id=$2',[hash(originalBytes),item.id]);getFailure=Error('SYNTHETIC_PROVIDER_SECRET');
   const failed=await api.download.GET(request('GET',item.id));assert.equal(failed.status,503);assert.ok(!(await failed.text()).includes('SYNTHETIC_PROVIDER_SECRET'));getFailure=null;
   const row=await storedRow(item.id);
   for(const invalidPath of ['railway/organizations/'+randomUUID()+'/'+randomUUID()+'/other.txt','Railway/dis/'+randomUUID()+'/wrong-provider.txt','dis/'+randomUUID()+'/..']){
    await db.query('UPDATE dis_documents SET blob_path=$1 WHERE id=$2',[invalidPath,item.id]);
    const before=events.length;assert.equal((await api.download.GET(request('GET',item.id))).status,503);assert.equal((await api.documents.DELETE(request('DELETE',item.id))).status,503);assert.equal(events.length,before);
   }
   await db.query('UPDATE dis_documents SET blob_path=$1 WHERE id=$2',[row.blob_path,item.id]);
   assert.equal(events.filter(e=>e.operation.startsWith('legacy')).length,beforeLegacy);delete process.env.BLOB_READ_WRITE_TOKEN;
  });
  await t.test('loss of ownership or changed receipt during retrieval cancels the original before returning it',async()=>{
   const before=cancelled;afterGet=async()=>{await db.query('UPDATE dis_workspaces SET owner_subject=$1 WHERE id=$2',[other,workspaceId]);};
   const denied=await api.download.GET(request('GET',item.id));assert.equal(denied.status,404);assert.ok(!(await denied.text()).includes(originalBytes.toString()));assert.equal(cancelled,before+1);
   await db.query('UPDATE dis_workspaces SET owner_subject=$1 WHERE id=$2',[owner,workspaceId]);
   afterGet=async()=>{await db.query('UPDATE dis_documents SET sha256=$1 WHERE id=$2',['c'.repeat(64),item.id]);};
   assert.equal((await api.download.GET(request('GET',item.id))).status,409);assert.equal(cancelled,before+2);
   afterGet=null;await db.query('UPDATE dis_documents SET sha256=$1 WHERE id=$2',[hash(originalBytes),item.id]);
  });
  await t.test('legacy Vercel objects require their own configuration and keep provider-specific retrieval/deletion',async()=>{
   const legacy=await seedLegacy(),before=events.length;
   assert.equal((await api.download.GET(request('GET',legacy.id))).status,503);assert.equal((await api.documents.DELETE(request('DELETE',legacy.id))).status,503);assert.equal(events.length,before);
   process.env.BLOB_READ_WRITE_TOKEN='fixture-legacy-token';delete process.env.DIS_OBJECT_STORAGE_PROVIDER;
   const response=await api.download.GET(request('GET',legacy.id));assert.equal(response.status,200);assert.equal(await response.text(),'Synthetic legacy original');
   assert.equal((await api.documents.DELETE(request('DELETE',legacy.id))).status,200);assert.equal(await storedRow(legacy.id),undefined);
   assert.deepEqual(events.slice(before).map(e=>e.operation),['legacy-get','legacy-remove']);
   process.env.DIS_OBJECT_STORAGE_PROVIDER='railway';delete process.env.BLOB_READ_WRITE_TOKEN;
  });
  await t.test('an unconfirmed upload never uses Vercel and a malformed confirmed receipt is cleaned up only at its own key',async()=>{
   const before=await count(),eventsBefore=events.length;process.env.BLOB_READ_WRITE_TOKEN='fixture-legacy-token';putFailure=Error('SYNTHETIC_PROVIDER_SECRET');
   const failed=await api.documents.POST(upload());assert.equal(failed.status,503);assert.ok(!(await failed.text()).includes('SYNTHETIC_PROVIDER_SECRET'));putFailure=null;
   badReceipt=true;const mismatched=await api.documents.POST(upload());assert.equal(mismatched.status,409);badReceipt=false;
   assert.equal(await count(),before);assert.deepEqual(events.slice(eventsBefore).map(e=>e.operation),['railway-put','railway-put','railway-remove']);
   assert.equal(events.at(-1)?.path,events.at(-2)?.path);assert.ok(objects.has((await storedRow(item.id)).blob_path));delete process.env.BLOB_READ_WRITE_TOKEN;
  });
  await t.test('metadata failure retains the original, and a lost committed response recovers its exact receipt without deletion',async()=>{
   await db.exec("CREATE FUNCTION reject_document_fixture() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Synthetic metadata failure'; END $$; CREATE TRIGGER reject_document_fixture BEFORE INSERT ON dis_documents FOR EACH ROW EXECUTE FUNCTION reject_document_fixture();");
   const before=await count(),eventStart=events.length;
   const failed=await api.documents.POST(upload('retained-for-reconciliation.txt'));assert.equal(failed.status,503);const failure=await failed.json();assert.match(failure.uploadReference,/^[a-f0-9-]{36}$/);assert.match(failure.error,/retained for reconciliation/);
   assert.equal(await count(),before);assert.equal(events.length,eventStart+1);assert.ok(objects.has(events.at(-1)!.path));
   await db.exec('DROP TRIGGER reject_document_fixture ON dis_documents; DROP FUNCTION reject_document_fixture();');
   afterTransaction=async statements=>{if(statements.some(s=>s.text.includes('INSERT INTO dis_documents'))){afterTransaction=null;throw Error('Synthetic lost COMMIT response');}};
   const recovered=await api.documents.POST(upload('recovered-receipt.txt'));assert.equal(recovered.status,201);const body=await recovered.json();assert.equal(body.receiptRecovered,true);assert.ok(objects.has((await storedRow(body.document.id)).blob_path));
   assert.equal(await count(),before+1);assert.ok(events.slice(eventStart).every(e=>e.operation==='railway-put'));
  });
  await t.test('delete keeps metadata on object failure and removes only the authorized Railway document on success',async()=>{
   const before=events.length;for(const value of [null,'https://foreign.test'])assert.equal((await api.documents.DELETE(request('DELETE',item.id,value))).status,403);assert.equal(events.length,before);
   const path=(await storedRow(item.id)).blob_path;removeFailure=Error('SYNTHETIC_PROVIDER_SECRET');
   const failed=await api.documents.DELETE(request('DELETE',item.id));assert.equal(failed.status,503);assert.ok(!(await failed.text()).includes('SYNTHETIC_PROVIDER_SECRET'));assert.ok(await storedRow(item.id));assert.ok(objects.has(path));removeFailure=null;
   const success=await api.documents.DELETE(request('DELETE',item.id));assert.equal(success.status,200);assert.equal((await success.json()).deleted,true);assert.equal(await storedRow(item.id),undefined);assert.equal(objects.has(path),false);
   assert.equal(events.at(-1)?.operation,'railway-remove');
  });
 }finally{
  delete globals.__disPersonalStorageFixture;
  const environment=process.env as Record<string,string|undefined>;
  for(const key of envKeys){if(originalEnv[key]===undefined)delete environment[key];else environment[key]=originalEnv[key];}
  await db.close();rmSync(directory,{recursive:true,force:true});
 }
});

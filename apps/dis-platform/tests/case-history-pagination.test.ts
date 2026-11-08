import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {PGlite} from "@electric-sql/pglite";
import {CASE_HISTORY_MAX_RESPONSE_BYTES,CASE_HISTORY_DB_PAYLOAD_BYTES,CASE_HISTORY_LIMIT,CASE_HISTORY_PAGE_SQL,CaseHistoryReadError,encodeCaseHistoryCursor,decodeCaseHistoryCursor,buildCaseHistoryPageBody,type CaseHistoryDatabaseEvent,type CaseHistoryDatabasePage} from "../lib/case-history-pagination";

const caseId="00000000-0000-4000-8000-000000000001",otherCase="00000000-0000-4000-8000-000000000002";
const id=(n:number)=>`10000000-0000-4000-8000-${n.toString(16).padStart(12,"0")}`;
const time="2026-11-08T02:00:00.123456Z";
function event(n:number,payload:unknown={note:"Synthetic checkpoint"},created_at=time):CaseHistoryDatabaseEvent{
 const event_json=JSON.stringify({id:id(n),event_type:"CHECKPOINT",payload,created_at});
 return {id:id(n),created_at,event_json,event_bytes:Buffer.byteLength(event_json,"utf8")};
}
function page(rows:CaseHistoryDatabaseEvent[],extra:Record<string,unknown>={}):CaseHistoryDatabasePage{
 const case_json=JSON.stringify({id:caseId,report:{state:"SYNTHETIC"},playbook:{notes:[]},version:7,...extra});
 return {case_json,case_json_bytes:Buffer.byteLength(case_json,"utf8"),case_version:7,history_rows:rows};
}
const code=(status:number,code:string)=>(e:unknown)=>e instanceof CaseHistoryReadError&&e.status===status&&e.code===code;

test("history cursor preserves PostgreSQL microseconds and binds navigation to its case",()=>{
 const token=encodeCaseHistoryCursor({caseId,createdAt:time,id:id(3)});
 assert.deepEqual(decodeCaseHistoryCursor(token,caseId),{v:1,caseId,createdAt:time,id:id(3)});
 assert.notEqual(token,encodeCaseHistoryCursor({caseId,createdAt:"2026-11-08T02:00:00.123455Z",id:id(3)}));
 assert.equal(decodeCaseHistoryCursor(null,caseId),null);
 assert.throws(()=>decodeCaseHistoryCursor(token,otherCase),code(400,"INVALID_HISTORY_CURSOR"));
});
test("malformed, noncanonical, cross-shape and impossible-date cursors fail before query use",()=>{
 const pack=(value:unknown)=>Buffer.from(JSON.stringify(value)).toString("base64url");
 const valid={v:1,caseId,createdAt:time,id:id(4)};
 for(const token of ["","x".repeat(513),"not+base64",pack(valid)+"=",pack([]),pack({...valid,v:2}),pack({...valid,id:"not-a-uuid"}),pack({...valid,createdAt:"2026-02-30T12:00:00.000000Z"}),pack({...valid,createdAt:"2026-11-08T24:00:00.000000Z"}),pack({...valid,createdAt:"2026-11-08T02:00:00.123Z"}),pack({...valid,createdAt:"2026-11-08T02:00:00.123456+00:00"}),pack({...valid,extra:true})]){
  assert.throws(()=>decodeCaseHistoryCursor(token,caseId),code(400,"INVALID_HISTORY_CURSOR"));
 }
});
test("empty and fully fitting first pages disclose complete scope and preserve raw case and payload text",()=>{
 const empty=buildCaseHistoryPageBody(page([]),caseId);const parsed=JSON.parse(empty.body);
 assert.deepEqual(parsed.history,[]);assert.equal(parsed.case.version,7);assert.equal(parsed.historyPage.incompleteCoverage,false);assert.equal(parsed.historyPage.hasMore,false);assert.equal(parsed.historyPage.nextCursor,null);
 const raw=event(2,{note:"é 😀\n\"\\",authority:{clinicalAction:false},source:"Original bytes"});
 raw.event_json=raw.event_json!.replace('"source":"Original bytes"','"source":"Original bytes","exactNumeric":900719925474099312345');raw.event_bytes=Buffer.byteLength(raw.event_json,"utf8");
 const result=buildCaseHistoryPageBody(page([raw,event(1)]),caseId);
 assert.ok(result.body.includes('"exactNumeric":900719925474099312345'),"do not parse/re-stringify stored JSON numbers");
 assert.ok(result.body.includes(raw.event_json));assert.equal(result.historyPage.returnedCount,2);assert.equal(result.historyPage.hasMore,false);
 assert.equal(JSON.parse(result.body).history[0].payload.note,"é 😀\n\"\\");
});
test("actual UTF8 budget covers the whole case, full events, cursor and metadata",async()=>{
 const rows=Array.from({length:12},(_,i)=>event(12-i,{report:"😀é".repeat(70000),source:"Synthetic source-rich checkpoint",clinicalActionAuthorized:false}));
 const snapshot=JSON.stringify(rows);
 const input=page(rows,{report:{baseline:"é".repeat(100000)}});
 const result=buildCaseHistoryPageBody(input,caseId);const response=new Response(result.body,{headers:{"content-type":"application/json"}});
 assert.ok((await response.arrayBuffer()).byteLength<=CASE_HISTORY_MAX_RESPONSE_BYTES);
 assert.ok(Buffer.byteLength(result.body,"utf8")>result.body.length,"reproduce multibyte undercount risk");
 const parsed=JSON.parse(result.body);assert.equal(parsed.case.report.baseline.length,100000);
 assert.ok(parsed.history.length>0&&parsed.history.length<rows.length);assert.equal(parsed.historyPage.hasMore,true);assert.equal(parsed.historyPage.incompleteCoverage,true);
 for(let i=0;i<parsed.history.length;i++){assert.equal(parsed.history[i].payload.report,"😀é".repeat(70000));assert.equal(parsed.history[i].id,rows[i].id)}
 const cursor=decodeCaseHistoryCursor(parsed.historyPage.nextCursor,caseId)!;
 assert.equal(cursor.id,rows[parsed.history.length-1].id);assert.equal(JSON.stringify(rows),snapshot,"read pagination never mutates stored fixtures");
});
test("more than 250 events traverse exactly once in newest-first microsecond and UUID order",()=>{
 const all=Array.from({length:621},(_,i)=>event(i+1,{original:i+1},`2026-11-08T02:00:00.${(123000+Math.floor(i/3)).toString()}Z`)).sort((a,b)=>a.created_at>b.created_at?-1:a.created_at<b.created_at?1:a.id>b.id?-1:1);
 const seen:string[]=[];let before:ReturnType<typeof decodeCaseHistoryCursor>=null,pages=0;
 while(true){
  const remaining=all.filter(r=>!before||r.created_at<before.createdAt||(r.created_at===before.createdAt&&r.id<before.id));
  const candidates=remaining.slice(0,CASE_HISTORY_LIMIT+1).map((r,i)=>i<CASE_HISTORY_LIMIT?r:{...r,event_json:null});
  const result=buildCaseHistoryPageBody(page(candidates),caseId,before),parsed=JSON.parse(result.body);pages++;
  seen.push(...parsed.history.map((r:{id:string})=>r.id));assert.ok(parsed.history.length<=250);
  if(pages>1)assert.equal(parsed.historyPage.incompleteCoverage,true,"one older page is not the whole accumulated history");
  if(!parsed.historyPage.hasMore){assert.equal(parsed.historyPage.nextCursor,null);break}
  before=decodeCaseHistoryCursor(parsed.historyPage.nextCursor,caseId);assert.ok(pages<10);
 }
 assert.equal(pages,3);assert.deepEqual(seen,all.map(r=>r.id));assert.equal(new Set(seen).size,all.length);
});
test("a DB-limited prefix returns continuation but never skips a blocked middle event",()=>{
 const first=event(3),blocked={...event(2),event_json:null,event_bytes:CASE_HISTORY_MAX_RESPONSE_BYTES+1},older={...event(1),event_json:null};
 const firstPage=buildCaseHistoryPageBody(page([first,blocked,older]),caseId),parsed=JSON.parse(firstPage.body);
 assert.deepEqual(parsed.history.map((r:{id:string})=>r.id),[first.id]);assert.equal(parsed.historyPage.hasMore,true);
 const before=decodeCaseHistoryCursor(parsed.historyPage.nextCursor,caseId)!;
 assert.equal(before.id,first.id,"cursor stays before the blocked event rather than advancing past it");
 assert.throws(()=>buildCaseHistoryPageBody(page([blocked,older]),caseId,before),(e:unknown)=>{
  assert.ok(e instanceof CaseHistoryReadError);assert.equal(e.status,413);const body=e.responseBody();
  assert.equal(body.historyPage?.incompleteCoverage,true);assert.equal(body.historyPage?.nextCursor,null);assert.equal(body.gap?.eventId,blocked.id);assert.equal(body.gap?.continuationBlocked,true);
  assert.ok(Buffer.byteLength(JSON.stringify(body),"utf8")<4096);return true;
 });
});
test("oversized legacy case and event yield a small owned gap without content loss or fake completeness",()=>{
 const legacy={case_json:null,case_json_bytes:CASE_HISTORY_MAX_RESPONSE_BYTES+100,case_version:7,history_rows:[]};
 assert.throws(()=>buildCaseHistoryPageBody(legacy,caseId),(e:unknown)=>{
  assert.ok(e instanceof CaseHistoryReadError);assert.equal(e.status,413);const body=e.responseBody();assert.equal(body.gap?.recordKind,"CASE");assert.equal(body.gap?.assignmentStatus,"NEEDS_DESIGNATION");assert.equal(body.historyPage?.incompleteCoverage,true);assert.equal(body.historyPage?.hasMore,null);return true;
 });
 const huge=event(1,{evidence:"x".repeat(CASE_HISTORY_MAX_RESPONSE_BYTES)}),original=huge.event_json;
 assert.throws(()=>buildCaseHistoryPageBody(page([huge]),caseId),code(413,"CASE_HISTORY_READ_CAPACITY_EXCEEDED"));assert.equal(huge.event_json,original);
});
test("upstream ordering holes, duplicates, bad metadata and wrong-case records fail visibly",()=>{
 const a=event(3),b=event(2),c=event(1);
 for(const rows of [[c,a],[a,a],[a,{...b,event_json:null},c],[{...a,event_bytes:1}],[{...a,created_at:"not-a-timestamp"}]])assert.throws(()=>buildCaseHistoryPageBody(page(rows),caseId),code(503,"CASE_HISTORY_SOURCE_INVALID"));
 assert.throws(()=>buildCaseHistoryPageBody(page([],{id:otherCase}),caseId),code(503,"CASE_HISTORY_SOURCE_INVALID"));
 const badCase=page([]);badCase.case_json_bytes=1;assert.throws(()=>buildCaseHistoryPageBody(badCase,caseId),code(503,"CASE_HISTORY_SOURCE_INVALID"));
});

const fixtureSQL=(events:string,caseBody="'{}'::jsonb")=>`WITH dis_casework AS (
 SELECT '${caseId}'::uuid AS id,'${otherCase}'::uuid AS workspace_id,'Synthetic case'::text AS title,'Synthetic read-only fixture'::text AS question,
 ${caseBody} AS report,'{}'::jsonb AS playbook,7 AS version,'ACTIVE'::text AS status,'${time}'::timestamptz AS updated_at,'${time}'::timestamptz AS created_at
), dis_case_events AS (${events}), ${CASE_HISTORY_PAGE_SQL.replace(/^\s*WITH\s+/,"")}`;

test("actual PostgreSQL CTE query preserves microsecond/id keysets, lookahead and authorized-case gating using only synthetic SELECTs",async()=>{
 const db=new PGlite();
 try{
  const events=`SELECT ('10000000-0000-4000-8000-'||lpad(to_hex(n),12,'0'))::uuid AS id,'${caseId}'::uuid AS case_id,'CHECKPOINT'::text AS event_type,jsonb_build_object('original',n) AS payload,
   CASE WHEN n=4 THEN '2026-11-08T02:00:00.123457Z'::timestamptz ELSE '${time}'::timestamptz END AS created_at FROM generate_series(1,4) AS n`;
  const sql=fixtureSQL(events);
  const first=await db.query<CaseHistoryDatabasePage>(sql,[caseId,null,null,CASE_HISTORY_DB_PAYLOAD_BYTES,2]);
  const p=first.rows[0];assert.equal(p.history_rows.length,3);assert.deepEqual(p.history_rows.map(r=>r.id),[id(4),id(3),id(2)]);assert.equal(p.history_rows[2].event_json,null);
  assert.equal(p.history_rows[0].created_at,"2026-11-08T02:00:00.123457Z");
  const cursor=encodeCaseHistoryCursor({caseId,createdAt:p.history_rows[1].created_at,id:p.history_rows[1].id}),before=decodeCaseHistoryCursor(cursor,caseId)!;
  const second=await db.query<CaseHistoryDatabasePage>(sql,[caseId,before.createdAt,before.id,CASE_HISTORY_DB_PAYLOAD_BYTES,2]);
  assert.deepEqual(second.rows[0].history_rows.map(r=>r.id),[id(2),id(1)]);
  const empty=await db.query<CaseHistoryDatabasePage>(sql,[otherCase,null,null,CASE_HISTORY_DB_PAYLOAD_BYTES,2]);assert.deepEqual(empty.rows,[],"no case row means no history metadata or payload leaves the query");
 }finally{await db.close()}
});
test("actual PostgreSQL byte prefix excludes a large middle payload and every following payload before transport",async()=>{
 const db=new PGlite();
 try{
  const events=`SELECT ('10000000-0000-4000-8000-'||lpad(to_hex(n),12,'0'))::uuid AS id,'${caseId}'::uuid AS case_id,'CHECKPOINT'::text AS event_type,
   jsonb_build_object('evidence',CASE WHEN n=2 THEN repeat('é',10000) ELSE 'small' END) AS payload,'${time}'::timestamptz AS created_at FROM generate_series(1,3) AS n`;
  const sql=fixtureSQL(events),result=await db.query<CaseHistoryDatabasePage>(sql,[caseId,null,null,5000,250]),p=result.rows[0];
  assert.equal(p.history_rows[0].id,id(3));assert.ok(p.history_rows[0].event_json);assert.equal(p.history_rows[1].event_json,null);assert.equal(p.history_rows[2].event_json,null);
  assert.ok(Number(p.history_rows[1].event_bytes)>20000);assert.ok(JSON.stringify(p).length<5000,"blocked raw evidence must not cross the DB/network response");
  const body=buildCaseHistoryPageBody(p,caseId);assert.deepEqual(JSON.parse(body.body).history.map((r:{id:string})=>r.id),[id(3)]);assert.equal(body.historyPage.hasMore,true);
  const tooLargeCase=await db.query<CaseHistoryDatabasePage>(fixtureSQL(events,"jsonb_build_object('evidence',repeat('é',10000))"),[caseId,null,null,5000,250]);
  assert.equal(tooLargeCase.rows[0].case_json,null);assert.deepEqual(tooLargeCase.rows[0].history_rows,[]);assert.ok(JSON.stringify(tooLargeCase.rows).length<1000);
 }finally{await db.close()}
});
test("GET consumes the bounded query under the existing subject-scoped transaction without adding write SQL",()=>{
 const route=readFileSync("app/api/cases/route.ts","utf8"),get=route.slice(route.indexOf("export async function GET"),route.indexOf("export async function POST"));
 assert.match(get,/await context\(\)/);assert.match(get,/set_config\('dis.subject_id',\$\{ctx.userId\},true\)/);assert.match(get,/ctx.sql.transaction/);
 assert.match(get,/decodeCaseHistoryCursor\(p.get\("historyCursor"\),id\)/);assert.match(get,/ctx.sql.query\(CASE_HISTORY_PAGE_SQL/);assert.match(get,/buildCaseHistoryPageBody/);assert.match(get,/private, no-store/);
 assert.doesNotMatch(CASE_HISTORY_PAGE_SQL,/\b(?:INSERT|UPDATE|DELETE|ALTER|CREATE|DROP)\b/i);assert.match(CASE_HISTORY_PAGE_SQL,/ORDER BY e.created_at DESC,e.id DESC/);
});

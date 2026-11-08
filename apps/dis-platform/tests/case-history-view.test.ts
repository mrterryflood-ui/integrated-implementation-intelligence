import test from "node:test";
import assert from "node:assert/strict";
import {emptyHistoryView,receiveHistoryPage} from "../lib/case-history-view";
const id="00000000-0000-4000-8000-000000000001";
const event=(n:number)=>({id:"event-"+n,event_type:"CHECKPOINT",created_at:"2026-11-08T02:00:00."+String(n).padStart(6,"0")+"Z",payload:{original:n}});
const page=(rows:ReturnType<typeof event>[],first:boolean,more:boolean,cursor:string|null,version=7)=>({case:{id,version},history:rows,historyPage:{hasMore:more,nextCursor:cursor,incompleteCoverage:!first||more,isFirstPage:first,returnedCount:rows.length,limit:250,order:"created_at_desc_id_desc",maxResponseBytes:3145728,caseVersion:version}});
test("older pages complete coverage only after a contiguous same-revision traversal",()=>{
 const first=receiveHistoryPage(emptyHistoryView(id),page([event(3),event(2)],true,true,"opaque-one"));
 assert.equal(first.complete,false);assert.equal(first.events.length,2);
 const final=receiveHistoryPage(first,page([event(1)],false,false,null),"opaque-one");
 assert.equal(final.page!.incompleteCoverage,true,"an older response alone remains partial");
 assert.equal(final.complete,true,"the accumulated view contains a contiguous traversal");
 assert.deepEqual(final.events.map(x=>x.id),["event-3","event-2","event-1"]);
 assert.equal(first.events.length,2,"earlier view was not mutated");
});
test("changed case/version, wrong cursor, overlap and ordering cannot certify full history",()=>{
 const first=receiveHistoryPage(emptyHistoryView(id),page([event(3),event(2)],true,true,"opaque-one"));
 assert.throws(()=>receiveHistoryPage(first,page([event(1)],false,false,null,8),"opaque-one"),/changed/);
 assert.throws(()=>receiveHistoryPage(first,page([event(1)],false,false,null),"another-cursor"),/changed/);
 assert.throws(()=>receiveHistoryPage(first,page([event(2)],false,false,null),"opaque-one"),/overlap/);
 assert.throws(()=>receiveHistoryPage(emptyHistoryView(id),page([event(1),event(2)],true,false,null)),/order/);
 const cross=page([event(1)],true,false,null);cross.case.id="another-case";
 assert.throws(()=>receiveHistoryPage(emptyHistoryView(id),cross),/match this case/);
 assert.equal(first.complete,false);
});
test("missing metadata preserves legacy rows while declaring unknown coverage",()=>{
 const view=receiveHistoryPage(emptyHistoryView(id),{case:{id,version:1},history:[event(1)]});
 assert.equal(view.complete,false);assert.equal(view.page,null);assert.ok(view.issue);assert.equal(view.events[0].payload&&typeof view.events[0].payload,"object");
});
test("case UUID casing does not change identity or silently lose history",()=>{
 const letters="ABCDEFAB-1234-4ABC-8DEF-ABCDEFABCDEF";
 const response=page([event(1)],true,false,null);response.case.id=letters.toLowerCase();
 const view=receiveHistoryPage(emptyHistoryView(letters),response);
 assert.equal(view.caseId,letters.toLowerCase());assert.equal(view.complete,true);
});
test("inconsistent continuation declarations are rejected without losing the prior view",()=>{
 const broken=page([event(1)],true,true,null);
 assert.throws(()=>receiveHistoryPage(emptyHistoryView(id),broken),/inconsistent/);
 const wrongCount=page([event(1)],true,false,null);wrongCount.historyPage.returnedCount=2;
 assert.throws(()=>receiveHistoryPage(emptyHistoryView(id),wrongCount),/inconsistent/);
 const wrongCoverage=page([event(1)],false,false,null);wrongCoverage.historyPage.incompleteCoverage=false;
 assert.throws(()=>receiveHistoryPage(emptyHistoryView(id),wrongCoverage,"cursor"),/inconsistent/);
});

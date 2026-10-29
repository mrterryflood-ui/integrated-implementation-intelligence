import test from "node:test";
import assert from "node:assert/strict";
import {assemble,COUNCIL_LIMIT} from "../lib/council-assembly";
test("automatic mode uses diverse ancient anchors and no duplicate red team",()=>{
 const result=assemble({prompt:"Improve an aerospace software company",count:8,redCount:8});
 assert.equal(result.errors.length,0);
 assert.equal(result.primary.length,8);
 assert.equal(result.red.length,8);
 assert.ok(result.primary.some(x=>x.id==="socrates"));
 assert.ok(result.primary.some(x=>x.id==="hypatia"));
 assert.ok(result.red.every(x=>!result.primary.some(y=>y.id===x.id)));
 assert.equal(new Set(result.primary.map(x=>x.id)).size,result.primary.length);
});
test("manual primary is optional as a mode and respects explicit choices",()=>{
 const result=assemble({prompt:"Launch a new company",primaryMode:"manual",redMode:"manual",selected:["ford","warren-buffett"],redSelected:["james-clapper","rediet-abebe"]});
 assert.deepEqual(result.primary.map(x=>x.id),["socrates","hypatia","ford","warren-buffett"]);
 assert.deepEqual(result.red.map(x=>x.id),["james-clapper","rediet-abebe"]);
 assert.ok(result.reasons.ford.includes("educational analytic method"));
});
test("manual overlap fails closed",()=>{
 const r=assemble({prompt:"Improve a service",primaryMode:"manual",redMode:"manual",selected:["ford"],redSelected:["ford"]});
 assert.ok(r.errors.some(e=>e.includes("cannot contain")));
});
test("solo mode uses one perspective and no challenge council",()=>{
 const r=assemble({prompt:"Explore leadership",primaryMode:"solo",selected:["mlk"],redSelected:["mlk"]});
 assert.equal(r.errors.length,0);assert.deepEqual(r.primary.map(m=>m.id),["mlk"]);assert.equal(r.red.length,0);
});
test("council clamps automated counts at twelve",()=>{
 const r=assemble({prompt:"Explore innovation",count:30,redCount:30});
 assert.equal(COUNCIL_LIMIT,12);assert.equal(r.primary.length,12);assert.equal(r.red.length,12);
});

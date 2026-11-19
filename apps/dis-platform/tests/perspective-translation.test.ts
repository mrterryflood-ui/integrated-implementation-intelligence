import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validatePerspectiveRequest,DEPTHS,DIRECTIONS} from "../lib/perspective-translation";
const sample={from:"Community member",to:"Public official",source:"Our public meeting notes describe delayed transit access. Costs were not measured.",objective:"Clarify priorities",language:"English",depth:"Simple",direction:"Bidirectional",consent:true};
test("four user-selectable depths and three communication directions",()=>{assert.deepEqual(DEPTHS,["Simple","Moderate","Deep","Research"]);assert.equal(DIRECTIONS.includes("Bidirectional"),true);});
test("arbitrary user-defined roles are permitted",()=>{const x=validatePerspectiveRequest({...sample,from:"Grandparent and informal advocate",to:"Local cooperative board"});assert.equal(x.ok,true);});
test("missing consent and empty source are refused",()=>{assert.equal(validatePerspectiveRequest({...sample,consent:false}).ok,false);assert.equal(validatePerspectiveRequest({...sample,source:"short"}).ok,false);});
test("invalid mode, excessive source text and malformed language rejected",()=>{assert.equal(validatePerspectiveRequest({...sample,depth:"Certified"}).ok,false);assert.equal(validatePerspectiveRequest({...sample,source:"x".repeat(9001)}).ok,false);assert.equal(validatePerspectiveRequest({...sample,language:"<script>"}).ok,false);});
test("homepage exposes studio and data transfer requires signed-in opt-in",()=>{
 const home=readFileSync("app/page.tsx","utf8");
 const ui=readFileSync("app/perspective-studio.tsx","utf8");
 const route=readFileSync("app/api/perspective-translation/route.ts","utf8");
 assert.match(home,/<PerspectiveStudio\/>/);assert.match(home,/href="#perspectives"/);
 assert.match(ui,/DEPTHS\.map/);assert.match(ui,/DIRECTIONS\.map/);assert.match(ui,/setFrom\(to\);setTo\(from\)/);assert.match(ui,/External AI|external AI/);
 assert.match(route,/await auth\(\)/);assert.match(route,/input\.consent/);assert.match(route,/looksLikePrivateRecord/);assert.match(route,/usage_day/);assert.match(route,/Cache-Control/);
});

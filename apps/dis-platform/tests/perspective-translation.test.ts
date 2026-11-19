import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validatePerspectiveRequest,DEPTHS,DIRECTIONS} from "../lib/perspective-translation";
import {readBoundedJsonRequest,jsonRequestStatus} from "../lib/bounded-json-request";
import {PERSPECTIVE_JSON_MAX_BYTES} from "../app/api/perspective-translation/route";
const sample={from:"Community member",to:"Public official",source:"Our public meeting notes describe delayed transit access. Costs were not measured.",objective:"Clarify priorities",language:"English",depth:"Simple",direction:"Bidirectional",consent:true};
test("four user-selectable depths and three communication directions",()=>{assert.deepEqual(DEPTHS,["Simple","Moderate","Deep","Research"]);assert.equal(DIRECTIONS.includes("Bidirectional"),true);});
test("arbitrary user-defined roles are permitted",()=>{const x=validatePerspectiveRequest({...sample,from:"Grandparent and informal advocate",to:"Local cooperative board"});assert.equal(x.ok,true);});
test("missing consent and empty source are refused",()=>{assert.equal(validatePerspectiveRequest({...sample,consent:false}).ok,false);assert.equal(validatePerspectiveRequest({...sample,source:"short"}).ok,false);});
test("invalid mode, excessive source text and malformed language rejected",()=>{assert.equal(validatePerspectiveRequest({...sample,depth:"Certified"}).ok,false);assert.equal(validatePerspectiveRequest({...sample,source:"x".repeat(9001)}).ok,false);assert.equal(validatePerspectiveRequest({...sample,language:"<script>"}).ok,false);});
test("homepage exposes studio and data transfer requires signed-in opt-in",()=>{
 const home=readFileSync("app/page.tsx","utf8");
 const ui=readFileSync("app/perspective-studio.tsx","utf8");
 const route=readFileSync("app/api/perspective-translation/route.ts","utf8");
 assert.match(home,/<PerspectiveStudio privateReady=\{privateReady\}\/>/);assert.match(home,/href="#perspectives"/);
 assert.match(ui,/DEPTHS\.map/);assert.match(ui,/DIRECTIONS\.map/);assert.match(ui,/setFrom\(to\);setTo\(from\)/);assert.match(ui,/External AI|external AI/);
 assert.match(route,/await auth\(\)/);assert.match(route,/input\.consent/);assert.match(route,/looksLikePrivateRecord/);assert.match(route,/usage_day/);assert.match(route,/Cache-Control/);
});

test("9,000 Japanese characters and bounded Unicode escape expansion remain admissible",async()=>{
 for(const input of ["漢".repeat(9000),String.fromCharCode(0).repeat(9000), "あ".repeat(9000)]){
  const payload={...sample,source:input};const raw=JSON.stringify(payload);
  assert.ok(new TextEncoder().encode(raw).byteLength<=PERSPECTIVE_JSON_MAX_BYTES);
  const parsed=await readBoundedJsonRequest(new Request("https://dynamicintel.io/api/perspective-translation",{method:"POST",headers:{"content-type":"application/json"},body:raw}),PERSPECTIVE_JSON_MAX_BYTES);
  const checked=validatePerspectiveRequest(parsed);assert.equal(checked.ok,true);
 }
});
test("actual transport bytes above limit fail closed even with false Content-Length",async()=>{
 const request=new Request("https://dynamicintel.io/api/perspective-translation",{method:"POST",body:JSON.stringify({...sample,source:"x".repeat(PERSPECTIVE_JSON_MAX_BYTES+1)})});
 await assert.rejects(readBoundedJsonRequest(request,PERSPECTIVE_JSON_MAX_BYTES),e=>jsonRequestStatus(e)===413);
});
test("AI export is tied to original server-accepted settings and is blocked when stale",()=>{
 const ui=readFileSync("app/perspective-studio.tsx","utf8");
 const api=readFileSync("app/api/perspective-translation/route.ts","utf8");
 assert.match(ui,/acceptedSettings:.*data.acceptedSettings/);
 assert.match(ui,/JSON.stringify\(draft.acceptedSettings\)===JSON.stringify\(settings\)/);
 assert.match(ui,/if\(!draft\|\|!draftMatches\)/);
 assert.match(ui,/const d=draft.acceptedSettings/);
 assert.match(ui,/disabled=\{!draftMatches\|\|busy\}/);
 assert.match(api,/acceptedSettings,sourceSha256,generatedAt/);
 assert.match(api,/PERSPECTIVE_JSON_MAX_BYTES=100\*1024/);
 assert.doesNotMatch(api,/readBoundedOfficeRequest/);
});

test("stakeholder experience is optional, bounded, user-defined and never silently truncated",()=>{
 const x=validatePerspectiveRequest({...sample,experience:"I observed the service close early.",priorities:"Being able to take the bus",audienceStatements:"The clerk wrote that the schedule changed.",unknowns:"The reason for the change has not been verified."});
 assert.equal(x.ok,true);
 if(x.ok){assert.match(x.value.experience,/observed/);assert.match(x.value.audienceStatements,/clerk/);}
 for(const key of ["experience","priorities","audienceStatements","unknowns"] as const){
   const limits={experience:900,priorities:600,audienceStatements:900,unknowns:600};
   assert.equal(validatePerspectiveRequest({...sample,[key]:"語".repeat(limits[key]+1)}).ok,false,"oversize "+key);
 }
});
test("UI binds perspective differences to generation settings and source truth",()=>{
 const ui=readFileSync("app/perspective-studio.tsx","utf8");
 const api=readFileSync("app/api/perspective-translation/route.ts","utf8");
 assert.match(ui,/const settings=\{from,to,objective,language,depth,direction,experience,priorities,audienceStatements,unknowns\}/);
 assert.match(ui,/Reported firsthand experience/);
 assert.match(ui,/Attributed recipient statements/);
 assert.match(ui,/What the receiving person actually said/);
 assert.match(api,/attributedAudienceStatements:input.audienceStatements/);
 assert.match(api,/Do not manufacture thoughts, feelings, motivations or claims/);
 assert.match(api,/audienceStatements:input.audienceStatements/);
 assert.match(ui,/setConsent\(false\)/);
});

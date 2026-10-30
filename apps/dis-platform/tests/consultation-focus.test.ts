import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {
 CONSULTATION_FOCUS_AREAS,
 consultationFocusHref,
 findConsultationFocus,
} from "../lib/consultation-focus";

test("all six formerly inert use-case cards have unique, usable consultation destinations",()=>{
 assert.equal(CONSULTATION_FOCUS_AREAS.length,6);
 assert.equal(new Set(CONSULTATION_FOCUS_AREAS.map(a=>a.id)).size,6);
 for(const area of CONSULTATION_FOCUS_AREAS){
  const url=new URL(consultationFocusHref(area.id),"https://dynamicintel.io");
  assert.equal(url.origin,"https://dynamicintel.io");
  assert.equal(url.pathname,"/");
  assert.equal(url.hash,"#consult");
  assert.equal(findConsultationFocus(url.searchParams.get("focus")),area);
  assert.ok(area.title.length>5);
  assert.ok(area.description.length>25);
  assert.ok(area.guidance.length>30);
  assert.equal(area.examples.length,2);
  for(const example of area.examples)assert.ok(example.length>=8);
 }
});
test("unrecognized category does not fabricate a selected domain",()=>{
 assert.equal(findConsultationFocus(null),null);
 assert.equal(findConsultationFocus(""),null);
 assert.equal(findConsultationFocus("healthcare%3Cscript%3E"),null);
 assert.equal(findConsultationFocus("admin"),null);
});
test("homepage renders real links, while client route opens the existing consult workflow",()=>{
 const page=readFileSync(join(process.cwd(),"app","page.tsx"),"utf8");
 const studio=readFileSync(join(process.cwd(),"app","consultation-studio.tsx"),"utf8");
 const css=readFileSync(join(process.cwd(),"app","home.css"),"utf8");
 assert.match(page,/<a className="possibility-card" key={area.id} href={consultationFocusHref\(area.id\)}/);
 assert.doesNotMatch(page,/useCases\.map\(x=><article/);
 assert.match(studio,/findConsultationFocus\(new URLSearchParams\(window\.location\.search\)\.get\("focus"\)\)/);
 assert.match(studio,/setMode\("general"\);setTab\("Consult"\)/);
 assert.match(studio,/onClick=\{\(\)=>startExample\(example\)\}/);
 assert.match(studio,/const startExample=\(question:string\)=>\{/);
 assert.match(studio,/setPkg\(draft\);setSlideIndex\(0\)/);
 assert.match(studio,/goToTab\("Design & deliver"\)/);
 assert.match(studio,/ref=\{workflowPanelRef\}/);
 assert.match(studio,/Choosing an example builds an editable/);
 assert.match(studio,/disabled=\{working\|\|!privateReady\}/);
 assert.match(studio,/Public draft mode: download Markdown now/);
 assert.match(css,/\.possibility-grid \.possibility-card:focus-visible/);
 assert.match(css,/@media\(max-width:650px\)/);
});

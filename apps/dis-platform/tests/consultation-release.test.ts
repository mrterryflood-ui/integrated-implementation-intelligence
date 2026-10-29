import JSZip from "jszip";
import test from "node:test";
import assert from "node:assert/strict";
import {sanitizeIntake} from "../lib/consultation";
import {buildPackage,renderPackageMarkdown} from "../lib/consultation-package";
import {chooseFederalSources,searchFederal,FEDERAL_REGISTRY} from "../lib/federal-sources";
import {investigate} from "../lib/consultation-research";
import {exportPptx,exportDocx} from "../lib/consultation-export";
const intake=sanitizeIntake({mission:"Help rural clinics improve access to care and make scheduling usable",organization:"Example Health",audience:"Rural primary-care patients",stage:"Working prototype",alternatives:"Phone call scheduling",traction:"Three interviews (user reported, not verified)",geography:"Texas",resources:"Two-person team",desiredOutcome:"Higher appointment completion"});
test("federal source selection is based on query and cannot include unknown IDs",()=>{
 assert.ok(chooseFederalSources("nasa satellite technology").includes("nasa"));
 assert.ok(chooseFederalSources("new federal contracts and grants").includes("usaspending"));
 assert.deepEqual(chooseFederalSources("x",["unknown","nsf","nsf"]),["nsf"]);
 assert.ok(FEDERAL_REGISTRY.length>=6);
});
test("federal records are marked as historical and never active without proof",async()=>{
 const fetcher=async(url:RequestInfo|URL)=>{
  const s=String(url);
  if(s.includes("api.nsf.gov"))return new Response(JSON.stringify({response:{award:[{id:"12345",title:"Prior research",awardeeName:"Example College",fundsObligatedAmt:"10000"}]}}),{status:200});
  throw Error("offline fixture");
 };
 const r=await searchFederal("research health",fetcher as typeof fetch,new Date("2026-10-29T00:00:00Z"),["nsf"]);
 assert.equal(r.records.length,1);
 assert.equal(r.records[0].kind,"PAST_AWARD");
 assert.equal(r.records[0].sourceStatus,"OFFICIAL_RECORD");
 assert.equal(r.records[0].url,"https://www.nsf.gov/awardsearch/showAward?AWD_ID=12345");
 assert.equal(r.coverage.nsf,"OFFICIAL_INDEX_RECORDS");
});
test("incomplete repository services report gaps rather than inventing records",async()=>{
 const fetcher=async()=>{throw Error("mock network failure")};
 const r=await investigate(intake,fetcher as typeof fetch,new Date("2026-10-29T00:00:00Z"));
 assert.equal(r.records.length,0);
 assert.ok(r.errors.length>=4);
 assert.equal(r.coverage.grants,"UNAVAILABLE");
});
test("founder package contains twelve editable slides and source-linked documents",()=>{
 const intel={query:"clinic scheduling",retrievedAt:"2026-10-29T00:00:00Z",errors:[],coverage:{},researchStandard:"Unverified data",records:[{id:"E1",kind:"OPEN_GRANT" as const,title:"Example official posted listing",summary:"Agency item",source:"Grants.gov",url:"https://www.grants.gov/search-results-detail/12345",retrievedAt:"2026-10-29T00:00:00Z",sourceStatus:"OFFICIAL_RECORD" as const,opportunityStatus:"posted"}]};
 const pkg=buildPackage(intake,"startup",intel);
 assert.equal(pkg.slides.length,12);
 assert.ok(pkg.documents.some(d=>d.id==="funding"&&d.body.includes("Example official posted listing")));
 assert.ok(pkg.documents.some(d=>d.id==="sources"));
 assert.ok(pkg.quality.knownGaps.length>0);
 assert.equal(pkg.quality.grade,"DRAFT / GATES OPEN");
 assert.ok(renderPackageMarkdown(pkg).includes("Speaker notes"));
});
test("general consultation has adaptable deliverables",()=>{
 const p=buildPackage(intake,"general");
 assert.ok(p.documents.find(d=>d.id==="pitch")?.title.includes("implementation"));
 assert.equal(p.quality.activeOpportunityCandidates,0);
});
test("PowerPoint export produces a zip-based, editable presentation with notes",async()=>{
 const buffer=await exportPptx(buildPackage(intake),"forest");
 assert.equal(buffer.subarray(0,2).toString("ascii"),"PK");
 assert.ok(buffer.length>18000);
 const zip=await JSZip.loadAsync(buffer);
 assert.ok(zip.file("ppt/presentation.xml"));
 assert.ok(zip.file("ppt/slides/slide1.xml"));
 const notes=Object.keys(zip.files).filter(p=>/^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(p));
 assert.equal(notes.length,12);
 const speakerText=await zip.file(notes[0])!.async("string");
 assert.ok(speakerText.includes("Source")||speakerText.includes("DIS draft"));
});
test("Word export produces a genuine editable OpenXML document",async()=>{
 const buffer=await exportDocx(buildPackage(intake));
 assert.equal(buffer.subarray(0,2).toString("ascii"),"PK");
 assert.ok(buffer.length>10000);
 const zip=await JSZip.loadAsync(buffer);
 const doc=await zip.file("word/document.xml")!.async("string");
 assert.ok(doc.includes("CONSULTATION"));
 assert.ok(doc.includes("EVIDENCE"));
 assert.ok(doc.includes("DRAFT"));
});

test("PubMed adapter retains official PMID provenance without inventing evidence support",async()=>{
 const fetcher=async(url:RequestInfo|URL)=>{
  const u=String(url);
  if(u.includes("esearch.fcgi"))return new Response(JSON.stringify({esearchresult:{idlist:["12345678"]}}),{status:200});
  if(u.includes("esummary.fcgi"))return new Response(JSON.stringify({result:{"12345678":{title:"Example clinical study",pubdate:"2026",source:"Example Journal"}}}),{status:200});
  throw Error("Unexpected provider");
 };
 const r=await searchFederal("mental health",fetcher as typeof fetch,new Date("2026-10-29T00:00:00Z"),["pubmed"]);
 assert.equal(r.records.length,1);
 assert.equal(r.records[0].kind,"SCHOLARLY");
 assert.equal(r.records[0].url,"https://pubmed.ncbi.nlm.nih.gov/12345678/");
 assert.equal(r.records[0].sourceStatus,"OFFICIAL_RECORD");
 assert.ok(r.records[0].summary.includes("not validated"));
});

test("aerospace consultations do not ingest unrelated NIH clinical awards",async()=>{
 const query=sanitizeIntake({mission:"Improve NASA satellite telemetry, orbital navigation and aerospace system testing",audience:"Aerospace engineers",geography:"USA"});
 const called:string[]=[];
 const fetcher=async(url:RequestInfo|URL)=>{called.push(String(url));throw Error("Network off in fixture")};
 const result=await investigate(query,fetcher as typeof fetch,new Date("2026-10-29T00:00:00Z"));
 assert.equal(result.coverage.pastAwards,"NOT_APPLICABLE");
 assert.equal(called.some(x=>x.includes("api.reporter.nih.gov")),false);
});
test("unrelated funding records stay in provenance but not ranked pitch recommendations",()=>{
 const research={query:"satellite telemetry",retrievedAt:"2026-10-29T00:00:00Z",records:[{id:"E1",kind:"OPEN_GRANT" as const,title:"Unrelated social services grant",summary:"Unrelated policy",source:"Grants.gov",url:"https://www.grants.gov/search-results-detail/12345",retrievedAt:"2026-10-29T00:00:00Z",sourceStatus:"OFFICIAL_RECORD" as const,queryMatchStatus:"NO_TEXT_OVERLAP" as const}],errors:[],coverage:{},researchStandard:"Discovery only"};
 const pkg=buildPackage(sanitizeIntake({mission:"Analyze satellite telemetry adoption"}),"startup",research);
 assert.equal(pkg.quality.activeOpportunityCandidates,0);
 assert.ok(pkg.documents.find(x=>x.id==="sources")?.body.includes("Unrelated social services grant"));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import {normalizeExportIntelligence,normalizeExportSlides} from '../lib/consultation-export-sources';
import {buildPackage,renderPackageMarkdown,type SlideSpec} from '../lib/consultation-package';
import {sanitizeIntake} from '../lib/consultation';
import {exportDocx,exportPptx} from '../lib/consultation-export';

const source=(id:string,title='Study source')=>({id,title,kind:'SCHOLARLY',url:'https://example.org/'+id,summary:'A bounded source excerpt.',source:'Fixture index',retrievedAt:'2026-10-31T12:00:00Z',sourceStatus:'OFFICIAL_RECORD'});
const raw=()=>({query:'Community implementation',retrievedAt:'2026-10-31T12:00:00Z',records:[source('E9','SORTED COMMUNITY SOURCE'),source('S1','CURRENT COUNCIL SOURCE')],errors:['One provider was unavailable.']});
const slides=(sourceIds:string[]=[]):SlideSpec[]=>Array.from({length:12},(_,i)=>({id:String(i+1).padStart(2,'0'),title:'Review the evidence',kicker:'DRAFT',bullets:['A draft for source review.'],notes:'Claim support still needs review.',sourceIds:i===0?sourceIds:[]}));

test('export preserves sorted and council source IDs without reassignment or false verification',()=>{
 const input=raw(),output=normalizeExportIntelligence(input)!;
 assert.deepEqual(output.records.map(r=>[r.id,r.title]),[['E9','SORTED COMMUNITY SOURCE'],['S1','CURRENT COUNCIL SOURCE']]);
 assert.equal(output.records[0].sourceStatus,'DISCOVERY_ONLY');
 assert.equal(output.records[1].eligibilityStatus,'UNVERIFIED');
 assert.equal(output.records[0].retrievedAt,input.records[0].retrievedAt);
 assert.match(output.errors[0],/Client-reported: One provider was unavailable/);
 assert.match(output.researchStandard,/not been independently verified/);
 assert.equal(input.records[0].sourceStatus,'OFFICIAL_RECORD','caller object must not be mutated');
});

test('duplicate, blank, padded and missing source IDs are rejected rather than regenerated',()=>{
 for(const id of ['', ' ', ' S1', 'S1 ',undefined])assert.throws(()=>normalizeExportIntelligence({records:[{...source('S1'),id}]}),/Source IDs/);
 assert.throws(()=>normalizeExportIntelligence({records:[source('S1'),source('S1','Different claimed source')]}),/Source IDs/);
});

test('malformed or oversized source registers cannot silently discard or reorder evidence',()=>{
 for(const value of [{}, {records:'invalid'}, {records:[null]}, {records:[{...source('S1'),url:'http://example.org/source'}]}, {records:[{...source('S1'),url:'https://'}]}, {records:[{...source('S1'),title:' '}]}, {records:Array.from({length:71},(_,i)=>source('E'+i))}])assert.throws(()=>normalizeExportIntelligence(value));
 const missingDate=normalizeExportIntelligence({records:[{...source('S1'),retrievedAt:undefined}]})!;
 assert.equal(missingDate.retrievedAt,'Not supplied');
 assert.equal(missingDate.records[0].retrievedAt,'Not supplied');
});

test('nonexistent citations fail explicitly; valid original IDs and source order are retained',()=>{
 const register=normalizeExportIntelligence(raw()),original=slides(['S1','E9']);
 assert.deepEqual(normalizeExportSlides(original,register),original);
 for(const id of ['E1','fabricated-source','S999',''])assert.throws(()=>normalizeExportSlides(slides([id]),register),/source|citation/i);
 assert.deepEqual(original[0].sourceIds,['S1','E9']);
});

test('inline scholarly and platform references cannot evade validation with an empty sourceIds array',()=>{
 const register=normalizeExportIntelligence(raw());
 for(const field of ['title','notes','kicker'] as const){const draft=slides();draft[0][field]='Unsupported [S999]';assert.throws(()=>normalizeExportSlides(draft,register),/absent/);}
 const draft=slides();draft[0].bullets=['Unsupported [E99]'];assert.throws(()=>normalizeExportSlides(draft,register),/absent/);
 draft[0].bullets=['Review [S1] and [E9].'];assert.doesNotThrow(()=>normalizeExportSlides(draft,register));
});

test('a source-free working draft can export, but cannot cite a missing source register',()=>{
 assert.equal(normalizeExportIntelligence(undefined),null);
 assert.equal(normalizeExportIntelligence(null),null);
 assert.equal(normalizeExportSlides(undefined,null),null);
 assert.deepEqual(normalizeExportSlides(slides(),null),slides());
 assert.throws(()=>normalizeExportSlides(slides(['S1']),null),/absent/);
 assert.throws(()=>normalizeExportSlides({sourceIds:[]},null),/Invalid slide/);
});

test('real Word and PowerPoint output retain the original S1 and E9 citations and source records',async()=>{
 const intelligence=normalizeExportIntelligence(raw());
 const pkg=buildPackage(sanitizeIntake({mission:'Review a community implementation proposal with source-linked evidence.'}),'general',intelligence);
 pkg.slides=normalizeExportSlides(slides(['S1','E9']),intelligence)!;
 const docx=await JSZip.loadAsync(await exportDocx(pkg));
 const doc=await docx.file('word/document.xml')!.async('string');
 assert.ok(doc.includes('[S1] CURRENT COUNCIL SOURCE'));
 assert.ok(doc.includes('[E9] SORTED COMMUNITY SOURCE'));
 assert.ok(doc.includes('Sources: S1, E9'));
 assert.ok(!doc.includes('[E1] CURRENT COUNCIL SOURCE'));
 assert.ok(doc.includes('DISCOVERY_ONLY'));
 const pptx=await JSZip.loadAsync(await exportPptx(pkg));
 const slide=await pptx.file('ppt/slides/slide1.xml')!.async('string');
 assert.ok(slide.includes('Evidence leads: S1, E9'));
});

test('direct Word and PowerPoint serializers reject nonexistent references before generating files',async()=>{
 for(const serialize of [exportDocx,exportPptx]){
  const pkg=buildPackage(sanitizeIntake({mission:'Review source-linked community evidence.'}),'general',normalizeExportIntelligence(raw()));
  pkg.slides=slides(['fabricated-source']);
  await assert.rejects(()=>serialize(pkg),/absent from its source register/);
  pkg.slides=slides();pkg.slides[0].bullets=['A material assertion [S999].'];
  await assert.rejects(()=>serialize(pkg),/absent from its source register/);
 }
});

test('direct serializers reject duplicate source identities instead of accepting an ambiguous register',async()=>{
 for(const serialize of [exportDocx,exportPptx]){
  const intelligence=normalizeExportIntelligence(raw())!;
  intelligence.records.push({...intelligence.records[1],title:'Different source under the same S1 ID'});
  const pkg=buildPackage(sanitizeIntake({mission:'Review source-linked community evidence.'}),'general',intelligence);
  pkg.slides=slides(['S1']);
  await assert.rejects(()=>serialize(pkg),/Source IDs must be unique/);
 }
});

test('direct serializers preserve source identity when the source register is reordered',async()=>{
 const input=raw();input.records.reverse();
 const intelligence=normalizeExportIntelligence(input)!;
 const pkg=buildPackage(sanitizeIntake({mission:'Review source-linked community evidence.'}),'general',intelligence);
 pkg.slides=slides(['E9','S1']);
 const docx=await JSZip.loadAsync(await exportDocx(pkg));
 const doc=await docx.file('word/document.xml')!.async('string');
 assert.ok(doc.includes('[S1] CURRENT COUNCIL SOURCE'));
 assert.ok(doc.includes('[E9] SORTED COMMUNITY SOURCE'));
 assert.ok(doc.includes('Sources: E9, S1'));
 const pptx=await JSZip.loadAsync(await exportPptx(pkg));
 const slide=await pptx.file('ppt/slides/slide1.xml')!.async('string');
 assert.ok(slide.includes('Evidence leads: E9, S1'));
 assert.deepEqual(pkg.intelligence!.records.map(r=>r.id),['S1','E9']);
 assert.deepEqual(pkg.slides[0].sourceIds,['E9','S1']);
});

test('inline imported-source citations cannot bypass Markdown, Word or PowerPoint gates',async()=>{
 const intelligence=normalizeExportIntelligence({records:[source('IMP1','REGISTERED IMPORT')]});
 const pkg=buildPackage(sanitizeIntake({mission:'Review imported source evidence before implementation.'}),'general',intelligence);
 pkg.slides[0].sourceIds=[];pkg.slides[0].notes='An unsupported claim [IMP999].';
 assert.throws(()=>renderPackageMarkdown(pkg),/absent from its source register/);
 await assert.rejects(()=>exportDocx(pkg),/absent from its source register/);
 await assert.rejects(()=>exportPptx(pkg),/absent from its source register/);
});

test('valid imported citations and ordinary bracket prose remain exportable in every format',async()=>{
 const intelligence=normalizeExportIntelligence({records:[source('IMP1','REGISTERED IMPORT')]});
 const pkg=buildPackage(sanitizeIntake({mission:'Review imported source evidence before implementation.'}),'general',intelligence);
 pkg.slides[0].sourceIds=[];pkg.slides[0].notes='Review [IMP1]. [RESEARCH REQUIRED] [DRAFT] [NEXT STEP]';
 assert.ok(renderPackageMarkdown(pkg).includes(pkg.slides[0].notes));
 const docx=await JSZip.loadAsync(await exportDocx(pkg));
 const document=await docx.file('word/document.xml')!.async('string');
 assert.ok(document.includes(pkg.slides[0].notes));
 const pptx=await JSZip.loadAsync(await exportPptx(pkg));
 const notes=await pptx.file('ppt/notesSlides/notesSlide1.xml')!.async('string');
 assert.ok(notes.includes('[IMP1]'));
 assert.ok(notes.includes('[RESEARCH REQUIRED]'));
});

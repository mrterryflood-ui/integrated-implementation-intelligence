import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import {importResearchBundle} from '../lib/consultation-research-import';
import {buildPackage,renderPackageMarkdown} from '../lib/consultation-package';
import {sanitizeIntake} from '../lib/consultation';
import {exportDocx,exportPptx} from '../lib/consultation-export';
import type {IntelligenceBundle} from '../lib/consultation-research';

const at=new Date('2026-11-01T15:00:00Z');
const lead=(title:string,url='https://example.org/'+title.toLowerCase().replaceAll(' ','-'))=>({title,url,kind:'SCHOLARLY',summary:'Imported fixture evidence, not an inspected source.'});
const append=(records:unknown[],existing:IntelligenceBundle|null=null)=>importResearchBundle(JSON.stringify({records}),existing,at);

test('successive imports allocate unused IDs and leave prior records unchanged',()=>{
 const first=append([lead('FIRST IMPORT')]);
 const before=JSON.stringify(first.bundle);
 const second=append([lead('SECOND IMPORT')],first.bundle);
 const third=append([lead('THIRD IMPORT')],second.bundle);
 assert.deepEqual(third.bundle.records.map(r=>[r.id,r.title]),[['IMP1','FIRST IMPORT'],['IMP2','SECOND IMPORT'],['IMP3','THIRD IMPORT']]);
 assert.equal(JSON.stringify(first.bundle),before);
 assert.deepEqual(third.bundle.records.slice(0,2),second.bundle.records);
 assert.equal(second.importedCount,1);
 assert.ok(third.bundle.records.every(r=>r.sourceStatus==='DISCOVERY_ONLY'));
});

test('existing imported and council IDs are preserved while all occupied IDs are skipped',()=>{
 const initial=append([lead('Prior one'),lead('Prior three'),lead('Council record')]).bundle;
 initial.records[1].id='IMP3';initial.records[2].id='S1';
 const before=structuredClone(initial.records);
 const result=append([{...lead('New two'),id:'S1',sourceStatus:'SOURCE_INSPECTED'},{...lead('New four'),id:'IMP3',sourceStatus:'OFFICIAL_RECORD'}],initial);
 assert.deepEqual(result.bundle.records.slice(0,3),before);
 assert.deepEqual(result.bundle.records.map(r=>r.id),['IMP1','IMP3','S1','IMP2','IMP4']);
 assert.deepEqual(result.bundle.records.slice(3).map(r=>r.sourceStatus),['DISCOVERY_ONLY','DISCOVERY_ONLY']);
});

test('duplicate URLs retain separate unverified records with distinct citation IDs',()=>{
 const first=append([lead('Original title','https://example.org/same')]);
 const second=append([lead('Another supplied description','https://example.org/same')],first.bundle);
 assert.equal(second.bundle.records.length,2);
 assert.deepEqual(second.bundle.records.map(r=>r.id),['IMP1','IMP2']);
 assert.deepEqual(second.bundle.records.map(r=>r.url),['https://example.org/same','https://example.org/same']);
});

test('existing ambiguous source IDs are rejected instead of silently renumbered',()=>{
 const ambiguous=append([lead('First'),lead('Second')]).bundle;
 ambiguous.records[1].id=ambiguous.records[0].id;
 const before=JSON.stringify(ambiguous);
 assert.throws(()=>append([lead('Third')],ambiguous),/Source IDs must be unique/);
 assert.equal(JSON.stringify(ambiguous),before);
});

test('imports preserve the 70-source export boundary and reject excess without data loss',()=>{
 const sixty=append(Array.from({length:60},(_,i)=>lead('Source '+i))).bundle;
 const seventy=append(Array.from({length:10},(_,i)=>lead('Source '+(i+60))),sixty).bundle;
 assert.equal(seventy.records.length,70);
 assert.equal(new Set(seventy.records.map(r=>r.id)).size,70);
 const before=JSON.stringify(seventy);
 assert.throws(()=>append([lead('Source 71')],seventy),/exceed the 70-source limit/);
 assert.equal(JSON.stringify(seventy),before);
 assert.deepEqual(seventy.records.slice(0,60),sixty.records);
});

test('invalid entries cannot consume a source identity or become imported evidence',()=>{
 const result=append([null,{title:'No URL'},lead('Valid source')]);
 assert.equal(result.importedCount,1);assert.equal(result.bundle.records[0].id,'IMP1');
 assert.throws(()=>append([]),/No valid HTTPS source/);
 assert.throws(()=>append(Array.from({length:61},(_,i)=>lead('Lead '+i))),/up to 60/);
});

test('two real import batches remain exportable as Markdown, Word and PowerPoint with original IDs',async()=>{
 const first=append([lead('FIRST IMPORT')]);
 const second=append([lead('SECOND IMPORT')],first.bundle);
 const pkg=buildPackage(sanitizeIntake({mission:'Review an implementation proposal using imported evidence.'}),'general',second.bundle);
 pkg.slides[0].sourceIds=['IMP1','IMP2'];
 const markdown=renderPackageMarkdown(pkg);
 assert.ok(markdown.includes('[IMP1] FIRST IMPORT'));
 assert.ok(markdown.includes('[IMP2] SECOND IMPORT'));
 assert.ok(markdown.includes('Sources: IMP1, IMP2'));
 const docx=await JSZip.loadAsync(await exportDocx(pkg));
 const document=await docx.file('word/document.xml')!.async('string');
 assert.ok(document.includes('[IMP1] FIRST IMPORT'));
 assert.ok(document.includes('[IMP2] SECOND IMPORT'));
 assert.ok(document.includes('Sources: IMP1, IMP2'));
 const pptx=await JSZip.loadAsync(await exportPptx(pkg));
 const slide=await pptx.file('ppt/slides/slide1.xml')!.async('string');
 assert.ok(slide.includes('Evidence leads: IMP1, IMP2'));
 assert.ok(document.includes('DISCOVERY_ONLY'));
 assert.deepEqual(pkg.intelligence!.records.map(r=>r.id),['IMP1','IMP2']);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {sanitizeIntake} from '../lib/consultation';
import {buildPackage,renderPackageMarkdown} from '../lib/consultation-package';
import {exportDocx,exportPptx} from '../lib/consultation-export';
import JSZip from 'jszip';

test('maximum intake text generates save/export-compatible slides without discarding report context',async()=>{
 const full='Context-specific decision with affected people, uncertainty, fidelity and measurable outcomes. '.repeat(16).slice(0,1200);
 const input=sanitizeIntake({mission:full,organization:full,audience:full,geography:full,stage:full,alternatives:full,traction:full,resources:full,desiredOutcome:full});
 const pkg=buildPackage(input,'general');
 for(const s of pkg.slides){assert.ok(s.id.length<25);assert.ok(s.title.length<=180,'title exceeds saved-slide schema');assert.ok(s.kicker.length<=140);assert.ok(s.bullets.length<=6);for(const b of s.bullets)assert.ok(b.length<=500,'bullet exceeds saved-slide schema');assert.ok(s.notes.length<=2000);for(const id of s.sourceIds)assert.ok(id.length<50);}
 assert.ok(renderPackageMarkdown(pkg).includes(full),'complete context must remain in the report');
 const docx=await exportDocx(pkg),pptx=await exportPptx(pkg);
 const d=await JSZip.loadAsync(docx),p=await JSZip.loadAsync(pptx);
 assert.ok(d.file('word/document.xml'));assert.equal(Object.keys(p.files).filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n)).length,12);
 assert.ok((await d.file('word/document.xml')!.async('string')).includes(full),'Word report must preserve the complete context');
});

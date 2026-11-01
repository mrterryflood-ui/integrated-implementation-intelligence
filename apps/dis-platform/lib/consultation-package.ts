import {normalizeExportIntelligence,normalizeExportSlides} from './consultation-export-sources';
import type {CouncilEngagementAssurance} from './council-engagement-assurance';
import type {Intake} from './consultation';
import type {IntelligenceBundle} from './consultation-research';
import {buildPackage as buildSpecialistPackage,renderPackageMarkdown as renderSpecialistMarkdown,type ConsultationPackage} from './startup-consultation-package';
import {buildUniversalPackage} from './universal-consultation-package';
import {generateUnknowns} from './unknowns-radar';
import {designEnterpriseMission,renderEnterpriseMission} from './enterprise-mission';
export type {ConsultationPackage,SlideSpec} from './startup-consultation-package';
export {attachUnverifiedOwnedIntelAnnex} from './startup-consultation-package';
export function buildPackage(intake:Intake,mode:'startup'|'general'='startup',intelligence:IntelligenceBundle|null=null,council?:{deliberation?:{synthesis?:string,challenge?:string};engagementAssurance?:CouncilEngagementAssurance}):ConsultationPackage {
 // Preserve explicitly requested specialist startup/real-estate workflows.
 const specialist=mode==='startup'||generateUnknowns(intake,intelligence).mode==='REAL_ESTATE';
 const pkg=specialist?buildSpecialistPackage(intake,mode,intelligence,council):buildUniversalPackage(intake,intelligence,council);
 if(council?.engagementAssurance){
  const a=council.engagementAssurance;
  const gaps=[...new Set([...a.blockers,...a.executionBlockers])];
  pkg.documents.push({id:'engagement-assurance',title:'Evidence review and next decision',body:[
   'This is a preliminary draft. It is not authorization to act or evidence of improved outcomes.',
   'Source review: discovery excerpts only; original-source appraisal remains open.',
   'Review gaps:\n'+gaps.map(x=>'- '+x).join('\n'),
   'Improvement and delivery follow-through: pending. A prepared draft does not prove that it was sent, received or read.',
   ...(a.completion?['Completion evidence still needed:\n'+a.completion.blockers.map(x=>'- '+x).join('\n')]:[]),
   'Next step: '+a.nextAction,
   'Limits: '+a.limits,
   a.operatingContract?'Operating standard: '+a.operatingContract.version+'; content SHA-256: '+a.operatingContract.sha256:'Operating-standard loading receipt not established.'
  ].join('\n\n'),validation:'DRAFT',note:'Retained assessment of this council run. User edits and saved draft receipts are not independent evidence verification.'});
  pkg.quality.knownGaps=[...new Set([...pkg.quality.knownGaps,...gaps])];
 }
 if(specialist)return pkg;
 // Match both save and Office-export schemas. Keep complete context in the
 // documents; slides are explicitly abbreviated views, not the source record.
 const clip=(value:string,max:number)=>value.length<=max?value:value.slice(0,max-1).replace(/[\uD800-\uDBFF]$/,'')+'…';
 pkg.slides=pkg.slides.map(s=>({...s,title:clip(s.title,180),kicker:clip(s.kicker,140),bullets:s.bullets.slice(0,6).map(b=>clip(b,500)),notes:clip(s.notes,2000)}));
 pkg.documents.push({id:'enterprise-mission',title:'DIS discipline-based mission plan',body:renderEnterpriseMission(designEnterpriseMission(intake.mission)),validation:'DRAFT',note:'Existing discipline lenses are optional planning aids, not a closed list of permissible domains or proof of acceptance.'});
 return pkg;
}
export function renderPackageMarkdown(pkg:ConsultationPackage):string {
 normalizeExportSlides(pkg.slides,normalizeExportIntelligence(pkg.intelligence));
 if(pkg.mode==='startup')return renderSpecialistMarkdown(pkg);
 return '# DIS Decision and Implementation Package — DRAFT / EVIDENCE GATES OPEN\n\nPrepared for: '+(pkg.intake.organization||'Person or project to confirm')+'\n\nContext-specific planning, not a verified outcome. Human approval is required before consequential use.\n\n'+pkg.documents.map((d,i)=>'## '+(i+1)+'. '+d.title+'\n\n'+d.body+'\n\nValidation: '+d.validation+' — '+d.note).join('\n\n---\n\n')+'\n\n## Presentation storyboard\n\n'+pkg.slides.map(s=>'### '+s.id+'. '+s.title+'\n\n'+s.bullets.map(b=>'- '+b).join('\n')+'\n\nSpeaker notes: '+s.notes+'\nSources: '+s.sourceIds.join(', ')).join('\n\n')+'\n\n## Validation gates\n\n'+pkg.quality.knownGaps.map(g=>'- '+g).join('\n');
}

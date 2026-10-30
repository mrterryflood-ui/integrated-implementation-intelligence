import type {Intake} from './consultation';
import type {IntelligenceBundle} from './consultation-research';
import {buildPackage as buildSpecialistPackage,renderPackageMarkdown as renderSpecialistMarkdown,type ConsultationPackage} from './startup-consultation-package';
import {buildUniversalPackage} from './universal-consultation-package';
import {generateUnknowns} from './unknowns-radar';
import {designEnterpriseMission,renderEnterpriseMission} from './enterprise-mission';
export type {ConsultationPackage,SlideSpec} from './startup-consultation-package';
export {attachUnverifiedOwnedIntelAnnex} from './startup-consultation-package';
export function buildPackage(intake:Intake,mode:'startup'|'general'='startup',intelligence:IntelligenceBundle|null=null,council?:{deliberation?:{synthesis?:string,challenge?:string}}):ConsultationPackage {
 // Preserve explicitly requested specialist startup/real-estate workflows.
 if(mode==='startup'||generateUnknowns(intake,intelligence).mode==='REAL_ESTATE')return buildSpecialistPackage(intake,mode,intelligence,council);
 const pkg=buildUniversalPackage(intake,intelligence,council);
 pkg.documents.push({id:'enterprise-mission',title:'DIS discipline-based mission plan',body:renderEnterpriseMission(designEnterpriseMission(intake.mission)),validation:'DRAFT',note:'Existing discipline lenses are optional planning aids, not a closed list of permissible domains or proof of acceptance.'});
 return pkg;
}
export function renderPackageMarkdown(pkg:ConsultationPackage):string {
 if(pkg.mode==='startup')return renderSpecialistMarkdown(pkg);
 return '# DIS Decision and Implementation Package — DRAFT / EVIDENCE GATES OPEN\n\nPrepared for: '+(pkg.intake.organization||'Person or project to confirm')+'\n\nContext-specific planning, not a verified outcome. Human approval is required before consequential use.\n\n'+pkg.documents.map((d,i)=>'## '+(i+1)+'. '+d.title+'\n\n'+d.body+'\n\nValidation: '+d.validation+' — '+d.note).join('\n\n---\n\n')+'\n\n## Presentation storyboard\n\n'+pkg.slides.map(s=>'### '+s.id+'. '+s.title+'\n\n'+s.bullets.map(b=>'- '+b).join('\n')+'\n\nSpeaker notes: '+s.notes+'\nSources: '+s.sourceIds.join(', ')).join('\n\n')+'\n\n## Validation gates\n\n'+pkg.quality.knownGaps.map(g=>'- '+g).join('\n');
}

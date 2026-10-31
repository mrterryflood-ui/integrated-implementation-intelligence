import {buildPackage,type ConsultationPackage} from '../consultation-package';
import type {Intake} from '../consultation';
import type {IntelligenceBundle} from '../consultation-research';
import {parseEngagement,type EngagementInput} from './contracts';
/** Reuse the editable package; a model does not replace user edits or erase the receipt audit. */
export function retainCouncilDraft(previous:ConsultationPackage|null,intake:Intake,mode:'startup'|'general',intelligence:IntelligenceBundle|null,report:any):ConsultationPackage{
 const generated=buildPackage(intake,mode,intelligence,report?.deliberation?.synthesis?report:undefined);
 if(!previous)return generated;
 const synthesis=typeof report?.deliberation?.synthesis==='string'?report.deliberation.synthesis:'';
 const register=(intelligence?.records||[]).map(s=>`[${s.id}] ${s.title}\n${s.summary}\nSource: ${s.url}\nRetrieved: ${s.retrievedAt}`).join('\n\n');
 const body=(synthesis||'No council synthesis was released.')+'\n\nReview status: '+String(report?.release?.state||report?.state||'UNKNOWN')+'\nEvidence refresh: '+String(report?.evidenceHandoff?.sourceRefresh||'Not established')+'\nSource snapshot: '+String(report?.evidenceHandoff?.inputSourceHash||'Not recorded')+'\n\nSource identifiers in this council review belong only to the following register, not earlier documents.\n\n'+register;
 return {...previous,intake,mode,intelligence,documents:[...previous.documents.filter(d=>d.id!=='ecosystem-council-review'),{id:'ecosystem-council-review',title:'Council synthesis and its source snapshot',body,validation:'DRAFT',note:'Earlier documents and user edits are preserved, not automatically verified or updated by this review. Check conflicting dates, geography and claims. No implementation or outcome is inferred.'}],quality:{...generated.quality,grade:'DRAFT / GATES OPEN',knownGaps:[...new Set([...previous.quality.knownGaps,...generated.quality.knownGaps,'Earlier edited documents retain their original source snapshot; reconcile them before circulation.'])]}};
}
export function resumeEngagement(value:unknown,mission:string):EngagementInput|null{
 if(!value)return null;
 try{const e=parseEngagement(value);return e.problem===mission?{...e,externalConsent:false}:null}catch{return null}
}
export function engagementGeography(e:EngagementInput):string{
 return [e.geography.label||e.geography.zcta||e.geography.countyFips||'Not place-based','Boundary type: '+e.geography.kind,e.geography.countyFips?'Regional context county: '+e.geography.countyFips:''].filter(Boolean).join('; ');
}

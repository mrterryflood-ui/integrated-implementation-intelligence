/** Validate legacy research creates; new creates submit typed inputs, not a report. */
import {colorectalEvidenceAction} from "./evidence-action-colorectal";
import {buildEvidenceActionCaseHandoff,type InvestigationSupplement} from "./evidence-action-case-handoff";
import {objectRecord,credentialFreeHttps} from "./evidence-action-input-integrity";
import {CasePayloadError} from "./case-payload-capacity";
import type {IntelligenceRecord} from "./consultation-research";

const canonical=(value:unknown):string=>{
 if(Array.isArray(value))return "["+value.map(canonical).join(",")+"]";
 const object=objectRecord(value);if(object)return "{"+Object.keys(object).sort().map(k=>JSON.stringify(k)+":"+canonical(object[k])).join(",")+"}";
 return JSON.stringify(value);
};
export function admitCaseReport(report:unknown):unknown{
 const r=objectRecord(report);if(!r)return report;
 const research=r.schemaVersion==="dis-evidence-action-case-v1"||r.state==="RESEARCH_GAP_SCAFFOLD_UNVERIFIED"||["workflow","retainedResearch","decisionBrief","sourceIndicators","calibratedEvidence","crcMarginalEvidence","investigation","independentOutcomeVerified","causalEffectEstablished","interventionAuthorized","externalCommunicationAuthorized"].some(key=>key in r);
 if(!research)return report;
 if("workflow" in r||"retainedResearch" in r)throw new CasePayloadError("Research creates accept typed researchWorkflow inputs, not supplied assessment or workflow reports.",400);
 if(r.condition!=="colorectal")throw new CasePayloadError("This research create route requires the registered colorectal workflow; other conditions require their own source contract.",400);
 const i=objectRecord(r.investigation);
 if(!i||!Array.isArray(i.literature)||i.literature.length>6)throw new CasePayloadError("Research report requires bounded discovery metadata.",400);
 const ids=new Set<string>();const leads:IntelligenceRecord[]=i.literature.map(raw=>{
  const x=objectRecord(raw);
  if(!x||typeof x.id!=="string"||!x.id.trim()||x.id.length>100||ids.has(x.id)||typeof x.title!=="string"||!x.title.trim()||x.title.length>260||typeof x.sourceIndex!=="string"||x.sourceIndex.length>500||typeof x.url!=="string"||x.url.length>1600||!credentialFreeHttps(x.url))throw new CasePayloadError("Invalid research discovery metadata or credential-bearing source URL.",400);
  ids.add(x.id);
  return {id:x.id,title:x.title,source:x.sourceIndex,url:x.url,kind:"SCHOLARLY",sourceStatus:"DISCOVERY_ONLY",summary:"",retrievedAt:""};
 });
 const {program,bridge}=colorectalEvidenceAction(leads);
 if(!Array.isArray(r.gapLedger)||!Array.isArray(i.notes))throw new CasePayloadError("Research report requires its full gap ledger and notes.",400);
 const extra=r.gapLedger.filter(g=>!bridge.gaps.some(b=>b.id===objectRecord(g)?.id));
 const needsSupplement=i.privacyStatus==="OPERATOR_DECLARED_PUBLIC_NOT_PRIVACY_CERTIFIED";
 let expected:unknown;
 try{expected=buildEvidenceActionCaseHandoff(program,bridge,needsSupplement?{publicAggregateConfirmed:true,additionalGaps:extra,notes:i.notes} as InvestigationSupplement:undefined).report;}
 catch(e){throw new CasePayloadError(e instanceof Error?e.message:"Invalid research report",400);}
 if(canonical(expected)!==canonical(report))throw new CasePayloadError("Research report differs from the registered source contract. Reopen the workflow; supplied evidence, verification or authorization changes are not accepted.",400);
 return structuredClone(expected);
}

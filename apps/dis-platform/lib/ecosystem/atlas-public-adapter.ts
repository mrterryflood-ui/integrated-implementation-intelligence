/**
 * DIS -> SHIELD | ATLAS: bounded public interface metadata only.
 *
 * This reads ATLAS's existing mission-composition contract; it does NOT query
 * operational sensor records, protected missions, physical devices, private
 * handoffs or an authenticated observation-to-recipient receipt. A successful
 * HTTP read proves only that the public contract was returned on this request.
 */
import {NetworkBudget,asRecord} from './transport';
import {ContractError,emptyReceipt,type Capability,type CapabilityReceipt,type EvidenceItem} from './contracts';

export const ATLAS_PUBLIC_ORIGIN='https://secureassure.app';
export const ATLAS_PUBLIC_COMPOSITION_URL=ATLAS_PUBLIC_ORIGIN+'/api/integration/composition/v1?goal=hazard-awareness';
const EXPECTED=['HAZARD_CONTEXT','WEATHER_OBSERVATION'] as const;
const SAFE_ID=/^[a-zA-Z0-9_.:-]{1,80}$/;
type GapSummary={required:string;declaredSourceCount:number;codePresentCandidateCount:number;providerReportedLiveSources:number;providerReportedGap:string|null};
export type AtlasPublicProjection={
 contract:'atlas.mission-composition.v1';
 goal:'hazard-awareness';
 observedAt:null;
 dataClass:'PUBLIC_INTERFACE_METADATA';
 provenanceType:'SOURCE_REPORTED_NOT_CLAIM_VERIFIED';
 providerReportedLive:boolean;
 providerReportedEndToEnd:boolean;
 independentlyVerifiedSource:boolean;
 independentlyVerifiedOutcome:boolean;
 physicalIntegrationProven:boolean;
 fieldAcceptanceProven:boolean;
 needs:GapSummary[];
 nodes:{codePresent:number;declarationOnly:number};
};
function list(value:unknown,name:string,limit:number):unknown[]{
 if(!Array.isArray(value)||value.length>limit)throw new ContractError('ATLAS_INVALID_'+name,'The public ATLAS '+name+' did not meet its bounded response contract.');
 return value;
}
function ids(value:unknown,name:string):string[]{
 const arr=list(value,name,24);
 if(arr.some(x=>typeof x!=='string'||!SAFE_ID.test(x))||new Set(arr).size!==arr.length)throw new ContractError('ATLAS_INVALID_'+name,'ATLAS source identities are malformed or duplicated.');
 return arr as string[];
}
/** Reject malformed, ambiguous or fabricated shapes rather than filling gaps with zero. */
export function projectAtlasPublicComposition(value:unknown):AtlasPublicProjection{
 const root=asRecord(value);
 if(root.contract!=='atlas.mission-composition.v1'||root.goal!=='hazard-awareness')
  throw new ContractError('ATLAS_SCOPE_MISMATCH','The public ATLAS response did not identify the reviewed hazard-awareness contract.');
 const rawNeeds=list(root.needs,'NEEDS',12);
 const needs:GapSummary[]=[];
 for(const item of rawNeeds){
  const need=asRecord(item);
  if(typeof need.required!=='string'||!SAFE_ID.test(need.required)||needs.some(x=>x.required===need.required))
   throw new ContractError('ATLAS_INVALID_NEED','The public ATLAS response contains an unknown or repeated requirement.');
  if(typeof need.satisfiedByLiveEvidence!=='boolean'||typeof need.independentlyReceiptedPairs!=='number'||!Number.isSafeInteger(need.independentlyReceiptedPairs)||need.independentlyReceiptedPairs<0)
   throw new ContractError('ATLAS_INVALID_EVIDENCE','The public response does not carry explicit evidence-state fields.');
  const sourceIds=ids(need.sourceIds,'SOURCE_IDS'),candidates=ids(need.implementedCandidates,'CANDIDATES'),observed=ids(need.observedSourceIds,'OBSERVED_IDS');
  if(observed.some(id=>!sourceIds.includes(id))||candidates.some(id=>!sourceIds.includes(id)))
   throw new ContractError('ATLAS_INVALID_EVIDENCE','The source and observed identifiers do not reconcile.');
  if(need.satisfiedByLiveEvidence!== (observed.length>0))
   throw new ContractError('ATLAS_INVALID_EVIDENCE','The reported live flag contradicts its observed-source list.');
  if(need.gap!==null&&typeof need.gap!=='string')
   throw new ContractError('ATLAS_INVALID_GAP','An absent source must remain an explicit unknown.');
  needs.push({required:need.required,declaredSourceCount:sourceIds.length,codePresentCandidateCount:candidates.length,
   providerReportedLiveSources:observed.length,providerReportedGap:need.gap===null?null:String(need.gap).slice(0,90)});
 }
 if(!EXPECTED.every(key=>needs.some(n=>n.required===key)))
  throw new ContractError('ATLAS_MISSING_REQUIREMENTS','The reviewed source is missing the required hazard and weather inputs.');
 const rawNodes=list(root.nodes,'NODES',40);
 let codePresent=0,declarationOnly=0;
 for(const entry of rawNodes){
  const node=asRecord(entry);
  if(typeof node.id!=='string'||!SAFE_ID.test(node.id))throw new ContractError('ATLAS_INVALID_NODE','The public source returned a malformed interface identity.');
  if(node.implementation==='CODE_PRESENT')codePresent++;
  else if(node.implementation==='DECLARATION_ONLY')declarationOnly++;
  else throw new ContractError('ATLAS_INVALID_NODE','The public source returned an unrecognized implementation state.');
 }
 if(typeof root.hasAnyLiveEvidence!=='boolean'||typeof root.endToEndServiceAccepted!=='boolean'||typeof root.fullyReceipted!=='boolean')
  throw new ContractError('ATLAS_INVALID_STATUS','The public source omitted explicit readiness boundaries.');
 // Provider-reported states never become independent acceptance without the
 // private, tenant-bound, source-to-recipient custody chain and field witness.
 return {contract:'atlas.mission-composition.v1',goal:'hazard-awareness',observedAt:null,dataClass:'PUBLIC_INTERFACE_METADATA',
  provenanceType:'SOURCE_REPORTED_NOT_CLAIM_VERIFIED',providerReportedLive:root.hasAnyLiveEvidence,
  providerReportedEndToEnd:root.endToEndServiceAccepted,independentlyVerifiedSource:false,
  independentlyVerifiedOutcome:false,physicalIntegrationProven:false,fieldAcceptanceProven:false,
  needs,nodes:{codePresent,declarationOnly}};
}
export async function readAtlasPublicComposition(cap:Capability,budget:NetworkBudget):Promise<CapabilityReceipt>{
 if(cap.id!=='continuity-and-emergency-intelligence'||cap.endpoint!==ATLAS_PUBLIC_COMPOSITION_URL||cap.platformId!=='defense')
  throw new ContractError('ATLAS_UNREVIEWED_BINDING','This capability is not bound to the reviewed public ATLAS endpoint.');
 const start=new Date().toISOString(),before=budget.requests;
 const wire=await budget.request(ATLAS_PUBLIC_COMPOSITION_URL,{method:'GET',headers:{Accept:'application/json'}},ATLAS_PUBLIC_ORIGIN);
 if(wire.status!==200)throw new ContractError(wire.status===401?'AUTHENTICATION_REQUIRED':wire.status===403?'SCOPE_DENIED':'ATLAS_HTTP_'+wire.status,'The bounded ATLAS public interface request was not accepted.');
 if(!/application\/(?:json|[^;]+\+json)/i.test(wire.contentType))
  throw new ContractError('ATLAS_CONTENT_TYPE','The ATLAS public interface response was not JSON.');
 const projection=projectAtlasPublicComposition(wire.data);
 const items:EvidenceItem[]=[{
  id:'atlas-public-composition-hazard-awareness',
  title:'ATLAS hazard and continuity interface readiness (public metadata only)',
  summary:'The existing ATLAS service returned its public interface composition. '+
   projection.needs.filter(x=>x.providerReportedGap!==null).map(x=>x.required+' remains '+x.providerReportedGap).join('; ')+
   '. This is not a location observation, physical sensor proof, a named-recipient receipt or independently measured outcome.',
  url:ATLAS_PUBLIC_COMPOSITION_URL,source:'SHIELD | ATLAS / public mission-composition API',
  retrievedAt:new Date().toISOString(),referencePeriod:null,geography:'No location queried; interface contract only',
  status:'SOURCE_REPORTED_NOT_CLAIM_VERIFIED',data:projection
 }];
 return {...emptyReceipt(cap,'RETURNED','A bounded public ATLAS interface contract was read; it is not proof of operational exchange.'),
  startedAt:start,finishedAt:new Date().toISOString(),requestCount:budget.requests-before,
  httpStatus:wire.status,sourceUrl:ATLAS_PUBLIC_COMPOSITION_URL,responseSha256:wire.sha256,items,
  limitations:['Interface declarations, reachable HTTPS and reported source state are not independent evidence of a live operational integration.',
   'This request neither accessed protected ATLAS data nor authorized dispatch, combat action or interagency sharing.',
   'A separate authorized, tenant-bound ATLAS receipt and independently measured outcome are necessary before claiming end-to-end performance.']};
}

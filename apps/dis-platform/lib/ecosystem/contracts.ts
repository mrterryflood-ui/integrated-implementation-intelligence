/** Typed orchestration boundaries. Ownership is not confused with runtime or data rights. */
export const DOMAINS=['community','civic','funding','business','research','health','veterans','social-care','safety','hazards','defense','lunar','education','security'] as const;
export type Domain=typeof DOMAINS[number];
export type Geography={kind:'city'|'county'|'zcta'|'postal-code'|'point'|'unspecified';label?:string;stateFips?:string;countyFips?:string;placeFips?:string;zcta?:string;latitude?:number;longitude?:number};
export type EngagementInput={problem:string;audience:string;geography:Geography;domains:Domain[];externalConsent:boolean};
export type EvidenceItem={id:string;title:string;summary:string;url:string;source:string;retrievedAt:string;referencePeriod:string|null;geography:string;status:'SOURCE_REPORTED_NOT_CLAIM_VERIFIED';data:Record<string,unknown>};
export type ReceiptState='RETURNED'|'EMPTY_SOURCE_RESULT'|'NEEDS_CONTEXT'|'NOT_CONNECTED'|'AUTHENTICATION_REQUIRED'|'SCOPE_DENIED'|'UPSTREAM_ERROR'|'INVALID_RESPONSE'|'BUDGET_EXHAUSTED'|'CONSENT_REQUIRED';
export type CapabilityReceipt={capabilityId:string;platformId:string;state:ReceiptState;startedAt:string;finishedAt:string;requestCount:number;httpStatus:number|null;sourceUrl:string|null;responseSha256:string|null;items:EvidenceItem[];limitations:string[];reason:string;claimVerification:'NOT_PERFORMED';privateDataTransferred:false};
export type Capability={id:string;platformId:string;label:string;domains:readonly Domain[];terms:readonly string[];purpose:string;ownerAuthorization:'OWNER_APPROVED'|'PUBLIC_SOURCE';dataClass:'PUBLIC'|'PUBLIC_AGGREGATE'|'PROTECTED_CLIENT';transport:'PUBLIC_JSON'|'EXISTING_READER'|'MCP_HTTP'|'INTERNAL_SERVICE'|'NOT_BOUND';endpoint:string|null;toolName?:string;legacyId?:string;requiresGeography:boolean;technicalState:'BOUND_READ_CONTRACT'|'SOURCE_CONTRACT_ONLY'|'ADAPTER_IN_REVIEW'|'HOST_UNRECONCILED';scope:string;sourceEvidence:string;};
export type Step={id:string;title:string;kind:'clarify'|'retrieve'|'assess'|'deliver'|'measure';dependsOn:string[];status:'PLANNED'|'NEEDS_CONTEXT'|'NOT_EXECUTED'};
export type Plan={schemaVersion:'dis-engagement-plan-v1';input:EngagementInput;selected:Array<Capability&{reason:string}>;deferred:Array<{capabilityId:string;reason:string}>;question:string|null;steps:Step[];budgets:{maxCapabilities:number;maxNetworkRequests:number;maxMilliseconds:number;maxResponseBytes:number};notice:string};
export class ContractError extends Error { constructor(readonly code:string,message:string){super(message);this.name='ContractError';} }
const clean=(value:unknown,max:number,fallback='')=>typeof value==='string'?value.trim().slice(0,max):fallback;
export function parseEngagement(value:unknown):EngagementInput{
 if(!value||typeof value!=='object'||Array.isArray(value))throw new ContractError('INVALID_INPUT','An engagement object is required.');
 const v=value as Record<string,unknown>;
 if(Object.keys(v).some(k=>!['problem','audience','geography','domains','externalConsent'].includes(k)))throw new ContractError('UNKNOWN_FIELD','Only the documented engagement fields are accepted.');
 if(typeof v.problem!=='string'||v.problem.trim().length<8||v.problem.length>1200)throw new ContractError('PROBLEM_REQUIRED','Describe the decision in 8–1,200 characters.');
 if(v.audience!==undefined&&(typeof v.audience!=='string'||v.audience.length>180))throw new ContractError('INVALID_AUDIENCE','Audience must be at most 180 characters.');
 if(v.externalConsent!==undefined&&typeof v.externalConsent!=='boolean')throw new ContractError('INVALID_CONSENT','Consent must be an explicit boolean.');
 const allowedKinds=['city','county','zcta','postal-code','point','unspecified'];
 const g=(v.geography??{kind:'unspecified'}) as Record<string,unknown>;
 if(!g||typeof g!=='object'||Array.isArray(g)||!allowedKinds.includes(String(g.kind)))throw new ContractError('INVALID_GEOGRAPHY','Choose city, county, Census ZCTA, postal code, or coordinates.');
 if(Object.keys(g).some(k=>!['kind','label','stateFips','countyFips','placeFips','zcta','latitude','longitude'].includes(k)))throw new ContractError('UNKNOWN_GEOGRAPHY_FIELD','Unrecognized geographic field.');
 for(const [key,n] of [['stateFips',2],['countyFips',5],['placeFips',5],['zcta',5]] as const){if(g[key]!==undefined&&(typeof g[key]!=='string'||!new RegExp('^\\d{'+n+'}$').test(g[key] as string)))throw new ContractError('INVALID_GEOGRAPHIC_CODE',key+' has an invalid length or format.');}
 if(g.stateFips&&g.countyFips&&!String(g.countyFips).startsWith(String(g.stateFips)))throw new ContractError('GEOGRAPHY_CONFLICT','State and county codes disagree.');
 if(g.label!==undefined&&(typeof g.label!=='string'||g.label.length>120))throw new ContractError('INVALID_GEOGRAPHY_LABEL','Use a bounded public place name, not a private address.');
 for(const [key,max] of [['latitude',90],['longitude',180]] as const)if(g[key]!==undefined&&(typeof g[key]!=='number'||!Number.isFinite(g[key])||Math.abs(g[key] as number)>max))throw new ContractError('INVALID_COORDINATES','Coordinates are outside their valid range.');
 if((g.latitude===undefined)!==(g.longitude===undefined))throw new ContractError('INCOMPLETE_COORDINATES','Both latitude and longitude are required.');
 if(v.domains!==undefined&&(!Array.isArray(v.domains)||v.domains.length>DOMAINS.length||v.domains.some(d=>!DOMAINS.includes(d as Domain))))throw new ContractError('INVALID_DOMAINS','Choose only registered disciplinary domains.');
 return {problem:v.problem.trim(),audience:clean(v.audience,180,'Decision owner and affected people'),geography:{...g,kind:g.kind as Geography['kind'],...(g.label?{label:clean(g.label,120)}:{})} as Geography,domains:[...new Set((v.domains||[]) as Domain[])],externalConsent:v.externalConsent===true};
}
export function emptyReceipt(cap:Capability,state:ReceiptState,reason:string):CapabilityReceipt{const at=new Date().toISOString();return{capabilityId:cap.id,platformId:cap.platformId,state,startedAt:at,finishedAt:at,requestCount:0,httpStatus:null,sourceUrl:null,responseSha256:null,items:[],limitations:[],reason,claimVerification:'NOT_PERFORMED',privateDataTransferred:false};}

import type {EvidenceSource} from './evidence-integrity';
import type {IntelligenceBundle} from './consultation-research';
export function safeCouncilSources(value:unknown):EvidenceSource[]{
 if(!Array.isArray(value))return [];
 return value.slice(0,16).filter((s:any)=>s&&typeof s.id==='string'&&/^[SE]\d+$/.test(s.id)&&typeof s.title==='string'&&typeof s.url==='string'&&s.url.length<=1000&&/^https:\/\//.test(s.url)).map((s:any)=>({id:s.id,title:s.title.slice(0,500),url:s.url,doi:typeof s.doi==='string'?s.doi:null,year:Number.isInteger(s.year)?s.year:null,abstract:typeof s.abstract==='string'?s.abstract.slice(0,16000):null,evidenceKind:s.evidenceKind==='PLATFORM_PUBLIC_EXCERPT'?'PLATFORM_PUBLIC_EXCERPT' as const:'SCHOLARLY_ABSTRACT' as const,source:typeof s.source==='string'?s.source:undefined,retrievedAt:typeof s.retrievedAt==='string'?s.retrievedAt:undefined,referencePeriod:typeof s.referencePeriod==='string'?s.referencePeriod:null,geography:typeof s.geography==='string'?s.geography:undefined,abstractTruncated:s.abstractTruncated===true||(typeof s.abstract==='string'&&s.abstract.length>16000)}));
}
export function councilEvidenceBundle(query:string,raw:unknown):IntelligenceBundle{
 const sources=safeCouncilSources(raw),at=new Date().toISOString();
 return {query,retrievedAt:at,records:sources.map(s=>({id:s.id,kind:s.evidenceKind==='PLATFORM_PUBLIC_EXCERPT'?'TECHNICAL_REPORT':'SCHOLARLY',title:s.title,summary:s.abstract||'No abstract supplied',source:s.source||'OpenAlex discovery; original publication linked',url:s.url,retrievedAt:at,sourceStatus:'DISCOVERY_ONLY'})),errors:sources.some(s=>s.abstractTruncated)?['Some source text is explicitly truncated; omitted findings remain unknown.']:[],coverage:{scholarly:'ABSTRACT_AND_METADATA_NOT_FULL_TEXT'},researchStandard:'Claim support, applicability, bias, contrary evidence and full text still require independent appraisal.'};
}

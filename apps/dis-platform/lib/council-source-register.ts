import type {EvidenceSource} from './evidence-integrity';
import type {IntelligenceBundle} from './consultation-research';
export function safeCouncilSources(value:unknown):EvidenceSource[]{
 if(!Array.isArray(value))return [];
 return value.slice(0,6).filter((s:any)=>s&&typeof s.id==='string'&&/^S\d+$/.test(s.id)&&typeof s.title==='string'&&typeof s.url==='string'&&s.url.length<=1000&&/^https:\/\//.test(s.url)).map((s:any)=>({id:s.id,title:s.title.slice(0,500),url:s.url,doi:typeof s.doi==='string'?s.doi:null,year:Number.isInteger(s.year)?s.year:null,abstract:typeof s.abstract==='string'?s.abstract.slice(0,16000):null,abstractTruncated:s.abstractTruncated===true||(typeof s.abstract==='string'&&s.abstract.length>16000)}));
}
export function councilEvidenceBundle(query:string,raw:unknown):IntelligenceBundle{
 const sources=safeCouncilSources(raw),at=new Date().toISOString();
 return {query,retrievedAt:at,records:sources.map(s=>({id:s.id,kind:'SCHOLARLY',title:s.title,summary:s.abstract||'No abstract supplied',source:'OpenAlex discovery; original publication linked',url:s.url,retrievedAt:at,sourceStatus:'DISCOVERY_ONLY'})),errors:sources.some(s=>s.abstractTruncated)?['Some source text is explicitly truncated; omitted findings remain unknown.']:[],coverage:{scholarly:'ABSTRACT_AND_METADATA_NOT_FULL_TEXT'},researchStandard:'Claim support, applicability, bias, contrary evidence and full text still require independent appraisal.'};
}

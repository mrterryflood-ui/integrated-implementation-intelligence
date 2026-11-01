import type {IntelligenceBundle,IntelligenceRecord} from './consultation-research';
import {normalizeExportIntelligence} from './consultation-export-sources';

/** Append unverified research leads without changing any existing citation identity. */
export function importResearchBundle(json:string,existing:IntelligenceBundle|null,at=new Date()){
 if(json.length>65000)throw Error('Research bundle is too large (65 KB maximum).');
 const parsed:unknown=JSON.parse(json);
 const supplied=Array.isArray(parsed)?parsed:parsed&&typeof parsed==='object'&&'records' in parsed&&Array.isArray(parsed.records)?parsed.records:null;
 if(!supplied||supplied.length>60)throw Error('Paste JSON with up to 60 entries in a records array.');
 // Existing ambiguity needs review; importing must not renumber or accept it.
 normalizeExportIntelligence(existing);
 const previous=existing?.records||[];
 const used=new Set(previous.map(r=>r.id));let next=1;
 const allocate=()=>{while(used.has('IMP'+next))next++;const id='IMP'+next++;used.add(id);return id;};
 const types=new Set(['SCHOLARLY','OPEN_GRANT','PAST_AWARD','LANDSCAPE_LEAD','TECHNICAL_REPORT','REGULATION']);
 const now=at.toISOString();
 const records:IntelligenceRecord[]=supplied.flatMap((record:unknown)=>{
  if(!record||typeof record!=='object'||Array.isArray(record))return [];
  const r=record as Record<string,unknown>;
  if(typeof r.title!=='string'||!r.title.trim()||typeof r.url!=='string'||!/^https:\/\/[^\s]+$/.test(r.url)||r.url.length>500)return [];
  return [{id:allocate(),kind:typeof r.kind==='string'&&types.has(r.kind)?r.kind as IntelligenceRecord['kind']:'LANDSCAPE_LEAD',title:r.title.slice(0,250),summary:typeof r.summary==='string'?r.summary.slice(0,500):'Imported source lead; content not independently verified.',source:typeof r.source==='string'?r.source.slice(0,90):'User-supplied research',url:r.url,retrievedAt:now,sourceStatus:'DISCOVERY_ONLY'}];
 });
 if(!records.length)throw Error('No valid HTTPS source records were found.');
 if(previous.length+records.length>70)throw Error('This import would exceed the 70-source limit. Existing sources are unchanged; import fewer new records.');
 const bundle:IntelligenceBundle={query:'User-approved imported research',retrievedAt:now,records:[...previous,...records],errors:existing?.errors||[],coverage:{...(existing?.coverage||{}),userImport:'USER_PROVIDED_UNVERIFIED'},researchStandard:'Imported records remain discovery leads even if ChatGPT or another tool described them as authoritative. Verify official source text, dates, fit and claim-level support independently.'};
 // Apply the existing register gate without replacing prior source records.
 normalizeExportIntelligence(bundle);
 return {bundle,importedCount:records.length};
}

import {createHash} from 'node:crypto';
import {PLANNING_SECTIONS,normalizeReport} from '../planning-contract';
import {IMPLEMENTATION_FIELDS} from '../implementation-science';

export type KnowledgePassage = {
 id:string;recordId:string;version:number;digest:string;field:string;ordinal:number;
 startOffset:number;endOffset:number;sha256:string;text:string;title:string;
 sourceKind:'ORGANIZATION_INPUT'|'RETAINED_SOURCE_EXCERPT';url:string|null;
 publisher:string|null;publishedAt:string|null;retrievedAt:string|null;freshness:'NOT_ASSESSED';
};
export type KnowledgeRetrieval = {
 layer:'PASSAGES'|'ABSTAIN';query:string;passages:KnowledgePassage[];
 structuredClaims:{state:'NOT_AVAILABLE';reason:string};
 searchedRecords:number;searchedPassages:number;matchedPassages:number;
 limited:boolean;reason:string;scope:'SELECTED_PLAN_AND_SHARED_SOURCE_ANCESTRY';
};
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
const stop=new Set('a an the and or to for of in on at is are was were be been being do does did with from by as that this it its we our what which how why can could should would will about before after need needs know tell me please'.split(' '));
const terms=(s:string)=>[...new Set((s.toLocaleLowerCase('en-US').match(/[\p{L}\p{N}]{2,}/gu)||[]).filter(x=>!stop.has(x)))];
// Reconciliation labels identify contributors; they are not substantive support.
// Keep the original text for offsets/quotes, but never rank on these wrappers.
const substantive=(s:string)=>s.split('\n').filter(line=>!/^Perspective\s*[—-]/.test(line.trim())&&!/^(UNKNOWN|NOT SUPPLIED|\[.*\])$/i.test(line.trim())).join('\n').trim();
const dateText=(v:unknown)=>typeof v==='string'&&v.length<80?v:null;
function https(v:unknown):string|null{try{if(typeof v!=='string'||v.length>1200)return null;const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null}catch{return null}}

/** Exact UTF-16 offsets are relative to the named field/excerpt, never a whole unseen file. */
export function recordPassages(record:any):KnowledgePassage[]{
 const segments:Array<{field:string;text:string;title:string;url:string|null;publisher:string|null;publishedAt:string|null;retrievedAt:string|null;sourceKind:KnowledgePassage['sourceKind']}>=[];
 if(record.body?.report){
  const report=normalizeReport(record.body.report);
  for(const [key,title]of PLANNING_SECTIONS)segments.push({field:'sections.'+key,text:report.sections[key],title:record.title+' — '+title,url:null,publisher:null,publishedAt:null,retrievedAt:null,sourceKind:'ORGANIZATION_INPUT'});
  for(const f of IMPLEMENTATION_FIELDS)if(report.implementationScience)segments.push({field:'implementationScience.'+f.id,text:report.implementationScience.fields[f.id],title:record.title+' — '+f.title,url:null,publisher:null,publishedAt:null,retrievedAt:null,sourceKind:'ORGANIZATION_INPUT'});
 }else if(record.kind==='evidence'&&Array.isArray(record.body?.bundle?.records)){
  for(const [index,s]of record.body.bundle.records.entries())if(typeof s?.summary==='string')segments.push({field:'bundle.records.'+index+'.summary',text:s.summary,title:typeof s.title==='string'?s.title:record.title,url:https(s.url),publisher:typeof s.source==='string'?s.source:null,publishedAt:dateText(s.publishedAt),retrievedAt:dateText(s.retrievedAt||record.body.retrievedAt),sourceKind:'RETAINED_SOURCE_EXCERPT'});
 }
 const result:KnowledgePassage[]=[];
 for(const segment of segments){
  if(!substantive(segment.text))continue;
  let offset=0,ordinal=0;
  while(offset<segment.text.length){
   let end=Math.min(offset+1400,segment.text.length);
   if(end<segment.text.length){const boundary=segment.text.lastIndexOf(' ',end);if(boundary>offset+900)end=boundary;}
   const quote=segment.text.slice(offset,end),sha256=hash(quote);
   result.push({...segment,id:'P'+hash(record.id+':'+record.version+':'+segment.field+':'+offset+':'+sha256).slice(0,20),recordId:record.id,version:record.version,digest:record.digest,ordinal:ordinal++,startOffset:offset,endOffset:end,sha256,text:quote,freshness:'NOT_ASSESSED'});
   if(end===segment.text.length)break;offset=end-120;
  }
 }
 return result;
}

/** Bounded lexical retrieval. A hit is a source passage, not a validated answer. */
export function retrieveKnowledge(query:string,records:any[]):KnowledgeRetrieval{
 if(typeof query!=='string'||query.trim().length<3||query.length>1200)throw Error('Ask a question of 3–1,200 characters.');
 if(records.length>100)throw Error('Choose a smaller source selection.');
 const words=terms(query),all=records.flatMap(recordPassages);
 if(all.length>4000)throw Error('This selection is too large for a focused source review.');
 const ranked=all.map(p=>{const body=new Set(terms(substantive(p.text))),overlap=words.filter(w=>body.has(w)).length;return{p,overlap,score:overlap/(words.length||1)+overlap/Math.sqrt(body.size||1)};}).filter(r=>r.overlap>0).sort((a,b)=>b.score-a.score||a.p.id.localeCompare(b.p.id));
 const perRecord=new Map<string,number>(),passages:KnowledgePassage[]=[];
 for(const r of ranked){const count=perRecord.get(r.p.recordId)||0;if(count>=4)continue;passages.push(r.p);perRecord.set(r.p.recordId,count+1);if(passages.length===12)break;}
 return{layer:passages.length?'PASSAGES':'ABSTAIN',query:query.trim(),passages,structuredClaims:{state:'NOT_AVAILABLE',reason:'No verified structured-claim graph is available for this selected record set; searched source passages next.'},searchedRecords:records.length,searchedPassages:all.length,matchedPassages:ranked.length,limited:ranked.length>passages.length,reason:passages.length?'Ranked word matches in selected shared records. Check relevance, conflicts, and source currency.':'No relevant passage was found in this selected record set. Broaden the sources, revise the question, or run research.',scope:'SELECTED_PLAN_AND_SHARED_SOURCE_ANCESTRY'};
}

export type KnowledgeAnswer={state:'DRAFT_WITH_CITATIONS'|'ABSTAIN'|'FAILED';claims:Array<{text:string;citations:Array<{id:string;quote:string}>}>;questions:string[];unknowns:string[];reason:string;citationCheck:'EXACT_QUOTE_ONLY_NOT_ENTAILMENT';approvalGranted:false};
export function emptyKnowledgeAnswer(state:'ABSTAIN'|'FAILED',reason:string):KnowledgeAnswer{return{state,claims:[],questions:[],unknowns:[],reason,citationCheck:'EXACT_QUOTE_ONLY_NOT_ENTAILMENT',approvalGranted:false};}
/** Do not display uncited factual prose or substitute invented citations on a provider failure. */
export function validateKnowledgeAnswer(raw:unknown,passages:KnowledgePassage[]):KnowledgeAnswer{
 const x=raw as any;
 const strings=(v:unknown):v is string[]=>Array.isArray(v)&&v.length<=8&&v.every(s=>typeof s==='string'&&s.length>0&&s.length<=1000);
 if(!x||typeof x!=='object'||!Array.isArray(x.claims)||x.claims.length>12||!strings(x.questions)||!strings(x.unknowns))throw Error('The answer did not meet the cited-answer format.');
 const claims=x.claims.map((claim:any)=>{
  if(typeof claim?.text!=='string'||!claim.text.trim()||claim.text.length>1500||!Array.isArray(claim.citations)||claim.citations.length<1||claim.citations.length>4)throw Error('An answer statement is missing its source.');
  const citations=claim.citations.map((c:any)=>{const p=passages.find(p=>p.id===c?.id);if(!p||typeof c.quote!=='string'||c.quote.length<12||c.quote.length>700||!p.text.includes(c.quote))throw Error('An answer citation does not match the selected source passage.');return{id:p.id,quote:c.quote};});
  return{text:claim.text.trim(),citations};
 });
 return{state:claims.length?'DRAFT_WITH_CITATIONS':'ABSTAIN',claims,questions:x.questions,unknowns:x.unknowns,reason:claims.length?'Source identifiers and quotations match. A person must check whether each source supports the statement and applies here.':'The selected sources did not support an answer.',citationCheck:'EXACT_QUOTE_ONLY_NOT_ENTAILMENT',approvalGranted:false};
}

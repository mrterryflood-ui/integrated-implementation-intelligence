/** Registry references connect discovery leads for review; they never count trials. */
export type RegistryMention={registrationId:string;fields:("title"|"summary"|"url")[]};
export type LiteratureLineage={
 registrationMentions:RegistryMention[];
 candidateConnections:{registrationId:string;otherLeadId:string;otherTitle:string;otherUrl:string}[];
 familyVerified:false;
 independentStudyCount:null;
};
type Source={id:string;title:string;summary:string;url:string};
const fields=["title","summary","url"] as const;
const limits={title:500,summary:5000,url:1600};
/** Keep the workflow's existing 5,000-character bound and disclose lost text. */
export function retainedAbstractSummary(abstract:string|null,upstreamTruncated=false):string{
 if(!abstract)return "Abstract unavailable; inspect original source.";
 const note="\n[Abstract excerpt truncated; inspect the original source for omitted text.]";
 return upstreamTruncated||abstract.length>limits.summary
  ?abstract.slice(0,limits.summary-note.length)+note:abstract;
}
/**
 * Only inspect the retained metadata, without fetching or inventing missing text.
 * An ID may identify the paper's study or a cited study. Multiple IDs are not a
 * transitive cohort relation. A missing match is not evidence of independence.
 */
export function reviewLiteratureLineage(records:readonly Source[]):LiteratureLineage[]{
 const sources=records.slice(0,60);
 const mentions=sources.map(record=>{
  const found=new Map<string,RegistryMention>();
  for(const field of fields){
   const value=record[field];
   if(typeof value!=="string"||value.length>limits[field])continue;
   const matches=value.matchAll(/(?<![A-Za-z0-9_])NCT\d{8}(?![A-Za-z0-9_])/gi);
   for(const match of matches){
    const registrationId=match[0].toUpperCase(),prior=found.get(registrationId);
    if(prior){if(!prior.fields.includes(field))prior.fields.push(field);}
    else found.set(registrationId,{registrationId,fields:[field]});
   }
  }
  return [...found.values()].sort((a,b)=>a.registrationId.localeCompare(b.registrationId));
 });
 return sources.map((record,index)=>({
  registrationMentions:mentions[index],
  candidateConnections:mentions[index].flatMap(mention=>sources.flatMap((other,otherIndex)=>
   otherIndex!==index&&other.url!==record.url&&mentions[otherIndex].some(x=>x.registrationId===mention.registrationId)
    ?[{registrationId:mention.registrationId,otherLeadId:other.id,otherTitle:other.title,otherUrl:other.url}]:[])),
  familyVerified:false,independentStudyCount:null
 }));
}

import type {IntelligenceBundle,IntelligenceRecord} from './consultation-research';
import type {SlideSpec} from './consultation-package';

const SOURCE_ID=/^[A-Za-z0-9][A-Za-z0-9._:-]{0,48}$/;
const kinds:readonly IntelligenceRecord['kind'][]=['SCHOLARLY','OPEN_GRANT','PAST_AWARD','LANDSCAPE_LEAD','TECHNICAL_REPORT','REGULATION'];
const record=(value:unknown):value is Record<string,unknown>=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value);
const text=(value:unknown,limit:number,fallback='')=>typeof value==='string'&&value.trim()?value.slice(0,limit):fallback;

/** Preserve draft source identity; browser metadata never establishes inspected evidence. */
export function normalizeExportIntelligence(value:unknown):IntelligenceBundle|null{
 if(value===undefined||value===null)return null;
 if(!record(value)||!Array.isArray(value.records)||value.records.length>70)throw Error('Export requires a source register with at most 70 records.');
 const seen=new Set<string>();
 const records:IntelligenceRecord[]=value.records.map((source:unknown)=>{
  if(!record(source)||typeof source.id!=='string'||!SOURCE_ID.test(source.id)||seen.has(source.id))throw Error('Source IDs must be unique, nonblank, and unchanged from the draft source register.');
  seen.add(source.id);
  if(typeof source.title!=='string'||!source.title.trim()||typeof source.url!=='string'||source.url.length>1000)throw Error('Each source needs a title and a valid HTTPS URL.');
  try{const url=new URL(source.url);if(url.protocol!=='https:'||url.username||url.password)throw Error();}catch{throw Error('Each source needs a title and a valid HTTPS URL.');}
  return {
   id:source.id,kind:kinds.includes(source.kind as IntelligenceRecord['kind'])?source.kind as IntelligenceRecord['kind']:'LANDSCAPE_LEAD',
   title:source.title.slice(0,250),summary:text(source.summary,500),source:text(source.source,90,'Unknown source'),
   url:source.url,retrievedAt:text(source.retrievedAt,40,'Not supplied'),sourceStatus:'DISCOVERY_ONLY',eligibilityStatus:'UNVERIFIED'
  };
 });
 return {
  query:text(value.query,160),retrievedAt:text(value.retrievedAt,40,'Not supplied'),records,coverage:{},
  errors:Array.isArray(value.errors)?value.errors.filter((e):e is string=>typeof e==='string').slice(0,16).map(e=>'Client-reported: '+e.slice(0,500)):[],
  researchStandard:'Exported source metadata was supplied by the client and has not been independently verified by the export service. Original source IDs are retained; identifier matching does not verify claim support. Missing retrieval dates remain unknown.'
 };
}

function validSlide(value:unknown):value is SlideSpec{
 if(!record(value))return false;
 return typeof value.id==='string'&&value.id.length>0&&value.id.length<25&&typeof value.title==='string'&&value.title.length<=180&&typeof value.kicker==='string'&&value.kicker.length<=140&&Array.isArray(value.bullets)&&value.bullets.length<=6&&value.bullets.every(v=>typeof v==='string'&&v.length<=500)&&typeof value.notes==='string'&&value.notes.length<=2000&&Array.isArray(value.sourceIds)&&value.sourceIds.every(v=>typeof v==='string'&&SOURCE_ID.test(v));
}

/** Invalid references are errors, never silently removed or reassigned to another source. */
export function normalizeExportSlides(value:unknown,intelligence:IntelligenceBundle|null):SlideSpec[]|null{
 if(value===undefined)return null;
 if(!Array.isArray(value)||value.length!==12||!value.every(validSlide))throw Error('Invalid slide design or source citation.');
 const allowed=new Set(intelligence?.records.map(source=>source.id)||[]);
 for(const slide of value){
  const inline=[slide.title,slide.kicker,...slide.bullets,slide.notes].join('\n').match(/\[(?:[SE]|IMP)\d+\]/g)||[];
  const cited=[...slide.sourceIds,...inline.map(id=>id.slice(1,-1))];
  if(cited.some(id=>!allowed.has(id)))throw Error('Slide '+slide.id+' cites a source absent from its source register. Reconcile the draft and source register before exporting.');
 }
 return value.map(slide=>({...slide,bullets:[...slide.bullets],sourceIds:[...slide.sourceIds]}));
}

import type {ConsultationPackage} from './consultation-package';
import type {Deliverable} from './consultation';
const LIMIT=160000;
/** Export the actual edited draft, not a rebuilt approximation. Browser claims never confer review status. */
export function preserveDraftExportArtifacts(pkg:ConsultationPackage,value:unknown):ConsultationPackage{
 if(value===undefined)return pkg;
 if(!Array.isArray(value)||value.length<1||value.length>24)throw Error('Export requires 1–24 bounded draft documents.');
 let bytes=0;const ids=new Set<string>();
 const documents:Deliverable[]=value.map(v=>{
  if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!['id','title','body','validation','note'].includes(k)))throw Error('Invalid draft document fields.');
  if(typeof v.id!=='string'||!/^[-a-z0-9]{1,80}$/.test(v.id)||ids.has(v.id)||typeof v.title!=='string'||!v.title.trim()||v.title.length>250||typeof v.body!=='string'||v.body.length>90000||v.note!==undefined&&(typeof v.note!=='string'||v.note.length>1500))throw Error('Invalid or oversized draft document.');
  ids.add(v.id);bytes+=new TextEncoder().encode(v.id+v.title+v.body+(v.note||'')).byteLength;
  if(bytes>LIMIT)throw Error('Combined draft documents exceed the export size limit.');
  return{id:v.id,title:v.title,body:v.body,validation:'DRAFT',note:'Client-supplied or edited draft. Export preserves its text; this is not independent evidence verification, approval, compliance certification or completed implementation.'};
 });
 return {...pkg,documents,quality:{...pkg.quality,grade:'DRAFT / GATES OPEN',knownGaps:[...pkg.quality.knownGaps,'Exported document content is client-supplied or edited; review claims, sources and approval independently.']}};
}
export async function readBoundedOfficeRequest(request:Request,maxBytes=240000):Promise<unknown>{
 if(!request.body)throw Error('Missing export request.');
 const reader=request.body.getReader(),parts:Uint8Array[]=[];let size=0;
 try{for(;;){const item=await reader.read();if(item.done)break;size+=item.value.byteLength;if(size>maxBytes){await reader.cancel();throw Error('Export request too large.');}parts.push(item.value);}}
 finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}

import {Document,Packer,Paragraph,HeadingLevel} from 'docx';
import {inOrganizationTransaction} from '../../../../lib/organizations/database';
import {organizationActor,organizationFailure} from '../../../../lib/organizations/http';
import {membership,getRecord,uuid,OrganizationError} from '../../../../lib/organizations/service';
import {PLANNING_SECTIONS,normalizeReport} from '../../../../lib/planning-contract';
import {researchPlanningSections,ResearchPlanningError,wordPresentationText} from '../../../../lib/research-planning-handoff';
export const runtime='nodejs';export const maxDuration=30;
export async function GET(req:Request){try{
 const actor=await organizationActor(),p=new URL(req.url).searchParams,org=uuid(p.get('organizationId')),id=uuid(p.get('id')),version=Number(p.get('version')),format=p.get('format')||'docx';
 if(!Number.isSafeInteger(version)||version<1)throw new OrganizationError('Choose an exact saved version');
 if(!['docx','md','json'].includes(format))throw new OrganizationError('Choose Word, Markdown or JSON');
 const data=await inOrganizationTransaction(actor,async db=>{await membership(db,org,actor);const record=await getRecord(db,org,id);if(record.version!==version)throw new OrganizationError('The saved record changed. Inspect its current version before export',409);const seen=new Set<string>();const sources:any[]=[];async function visit(r:any,depth=0){if(depth>12||seen.size>100)throw new OrganizationError('The source chain requires a focused export',413);if(seen.has(r.id))return;seen.add(r.id);for(const sourceId of r.body.sourceIds||[]){const source=await getRecord(db,org,sourceId);if(source.visibility!=='organization')throw new OrganizationError('An underlying source was withdrawn; review before exporting',409);sources.push({id:source.id,version:source.version,digest:source.digest,title:source.title,kind:source.kind,body:source.body});await visit(source,depth+1);}}await visit(record);return {record,sources};});
 const serialized=JSON.stringify(data,null,2);if(Buffer.byteLength(serialized)>2*1024*1024)throw new OrganizationError('The export exceeds the bounded document size; select a focused report',413);
 const notice='Saved organizational record, not independent claim validation. Technical administration and Council advice do not confer chapter decision authority. Sharing copies does not authorize external publication.';
 const sections=data.record.body.report?PLANNING_SECTIONS.map(([key,title])=>({title,text:normalizeReport(data.record.body.report).sections[key]||'Not supplied'})):[{title:'Recorded content',text:JSON.stringify(data.record.body,null,2)}];
 const researchSections:Array<{title:string;text:string}>=[];
 for(const record of [data.record,...data.sources]){
  if(record.body.researchSnapshot===undefined)continue;
  try{for(const section of researchPlanningSections(record.body.researchSnapshot))researchSections.push({title:`${record.title} — ${section.title}`,text:`Planning record ${record.id}, version ${record.version}\n${section.text}`});}
  catch(error){if(error instanceof ResearchPlanningError)throw new OrganizationError(error.message,error.status);throw error;}
 }
 const receipt=`Record ${data.record.id} | version ${version} | ${data.record.kind} | fingerprint ${data.record.digest}`;
 const markdown=['# '+data.record.title,receipt,notice,...sections.flatMap(s=>['## '+s.title,s.text]),...researchSections.flatMap(s=>['## '+s.title,s.text]),'## Retained source snapshots',...data.sources.map(s=>`### ${s.title}\nRecord ${s.id}, version ${s.version}, fingerprint ${s.digest}\n${JSON.stringify(s.body,null,2)}`)].join('\n\n');
 if(format!=='json'&&Buffer.byteLength(markdown)>2*1024*1024)throw new OrganizationError('The readable export exceeds the bounded document size; select a focused report',413);
 let body:BodyInit,media:string;
 if(format==='json'){body=JSON.stringify({...data,notice},null,2);media='application/json';}
 else if(format==='md'){body=markdown;media='text/markdown; charset=utf-8';}
 else {
  const paragraph=(text:string,heading?:(typeof HeadingLevel)[keyof typeof HeadingLevel])=>new Paragraph({text:wordPresentationText(text),...(heading?{heading,keepNext:true}:{})});
  const wordNotice=notice+(wordPresentationText(markdown)!==markdown?' Word presentation note: characters that XML cannot represent are displayed as visible Unicode escape sequences (for example, \\uFFFE). The stored content, JSON download and source fingerprint are unchanged.':'');
  const children=[paragraph(data.record.title,HeadingLevel.TITLE),paragraph(receipt),paragraph(wordNotice),...[...sections,...researchSections].flatMap(s=>[paragraph(s.title,HeadingLevel.HEADING_1),...s.text.split('\n').map(t=>paragraph(t))]),paragraph('Retained source snapshots',HeadingLevel.HEADING_1),...data.sources.flatMap(s=>[paragraph(s.title,HeadingLevel.HEADING_2),paragraph(`Record ${s.id}; version ${s.version}; ${s.digest}`),...JSON.stringify(s.body,null,2).split('\n').map(t=>paragraph(t))])];
  body=new Uint8Array(await Packer.toBuffer(new Document({sections:[{children}]})));media='application/vnd.openxmlformats-officedocument.wordprocessingml.document';
 }
 return new Response(body,{headers:{'Content-Type':media,'Content-Disposition':`attachment; filename="DIS-record-${id}-v${version}.${format}"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}catch(e){return organizationFailure(e)}}

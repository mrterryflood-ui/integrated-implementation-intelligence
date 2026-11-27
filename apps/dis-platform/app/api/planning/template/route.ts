import {Document,Packer,Paragraph,HeadingLevel} from 'docx';
import {PLANNING_SCHEMA,PLANNING_SECTIONS} from '../../../../lib/planning-contract';
import {emptyImplementationScience,implementationTextFields,IMPLEMENTATION_NOTICE} from '../../../../lib/implementation-science';
export const runtime='nodejs';
export async function GET(req:Request){
 const params=new URL(req.url).searchParams,format=params.get('format')||'docx';
 const implementationScience=params.get('implementationScience')==='1'?emptyImplementationScience():undefined;
 const implementationFields=implementationTextFields(implementationScience);
 const blank={schemaVersion:PLANNING_SCHEMA,title:'',sections:Object.fromEntries(PLANNING_SECTIONS.map(([id])=>[id,''])),...(implementationScience===undefined?{}:{implementationScience})};
 const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
 if(format==='json')return new Response(JSON.stringify(blank,null,2),{headers:{...headers,'Content-Type':'application/json','Content-Disposition':'attachment; filename="DIS-member-template.json"'}});
 if(format==='csv')return new Response('schemaVersion,sectionId,sectionTitle,response\r\n'+[[PLANNING_SCHEMA,'title','Report title',''],...PLANNING_SECTIONS.map(([id,title])=>[PLANNING_SCHEMA,id,title,'']),...implementationFields.map(field=>[PLANNING_SCHEMA,field.id,field.title,field.text])].map(row=>row.map(x=>'"'+x.replaceAll('"','""')+'"').join(',')).join('\r\n'),{headers:{...headers,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="DIS-member-template.csv"'}});
 if(format!=='docx')return Response.json({error:'Use docx, csv or json. The working template is editable.'},{status:400,headers});
 const field=(id:string,value:string)=>[new Paragraph('[DIS_FIELD:'+id+']'),new Paragraph(value),new Paragraph('[DIS_END_FIELD]')];
 const children=[new Paragraph({text:'Member planning input',heading:HeadingLevel.TITLE}),new Paragraph('Editable working template. Preserve the field markers and review the mapping after upload. Do not include identifiable youth or health records. Replace the response placeholders; headings and instructions are outside the response boundaries.'),new Paragraph('Organizational decision authority is established by the organization. Portal administration does not confer approval authority. Chat is unlinked unless deliberately selected.'),...field('schemaVersion',PLANNING_SCHEMA),...field('title','[Enter report title]'),...PLANNING_SECTIONS.flatMap(([id,title])=>[new Paragraph({text:title,heading:HeadingLevel.HEADING_1}),...field(id,'[Enter your response, or UNKNOWN]')]),...(implementationScience?[new Paragraph({text:'Implementation science: approach, context, adoption and sustainment',heading:HeadingLevel.HEADING_1}),new Paragraph(IMPLEMENTATION_NOTICE),...implementationFields.flatMap(entry=>[new Paragraph({text:entry.title,heading:HeadingLevel.HEADING_2}),...field(entry.id,entry.text||'UNKNOWN')])]:[]),new Paragraph('[DIS_END]')];
 const buffer=await Packer.toBuffer(new Document({sections:[{children}]}));
 return new Response(new Uint8Array(buffer),{headers:{...headers,'Content-Type':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','Content-Disposition':'attachment; filename="DIS-member-template.docx"'}});
}

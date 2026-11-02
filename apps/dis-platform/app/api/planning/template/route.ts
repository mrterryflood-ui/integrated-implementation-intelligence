import {Document,Packer,Paragraph,HeadingLevel,TextRun} from 'docx';
import {PLANNING_SCHEMA,PLANNING_SECTIONS} from '../../../../lib/planning-contract';
export const runtime='nodejs';
export async function GET(req:Request){
 const format=new URL(req.url).searchParams.get('format')||'docx';
 const blank={schemaVersion:PLANNING_SCHEMA,title:'',sections:Object.fromEntries(PLANNING_SECTIONS.map(([id])=>[id,'']))};
 const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
 if(format==='json')return new Response(JSON.stringify(blank,null,2),{headers:{...headers,'Content-Type':'application/json','Content-Disposition':'attachment; filename="DIS-member-template.json"'}});
 if(format==='csv')return new Response('schemaVersion,sectionId,sectionTitle,response\r\n'+[[PLANNING_SCHEMA,'title','Report title',''],...PLANNING_SECTIONS.map(([id,title])=>[PLANNING_SCHEMA,id,title,''])].map(row=>row.map(x=>'"'+x.replaceAll('"','""')+'"').join(',')).join('\r\n'),{headers:{...headers,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="DIS-member-template.csv"'}});
 if(format!=='docx')return Response.json({error:'Use docx, csv or json. The working template is editable.'},{status:400,headers});
 const children=[new Paragraph({text:'Member planning input',heading:HeadingLevel.TITLE}),new Paragraph('Editable working template. Save as DOCX. Preserve the [DIS_FIELD:...] markers and review section mapping after upload. Do not include identifiable youth or health records.'),new Paragraph('Organizational decision authority is established by the organization. Portal administration does not confer approval authority. Chat is unlinked unless deliberately selected.'),new Paragraph('[DIS_FIELD:schemaVersion]'),new Paragraph(PLANNING_SCHEMA),new Paragraph('[DIS_FIELD:title]'),new Paragraph('[Enter report title]'),...PLANNING_SECTIONS.flatMap(([id,title])=>[new Paragraph({text:title,heading:HeadingLevel.HEADING_1}),new Paragraph({children:[new TextRun({text:'[DIS_FIELD:'+id+']',color:'146B73',size:18})]}),new Paragraph('[Enter your response, or UNKNOWN]')]),new Paragraph('[DIS_END]')];
 const buffer=await Packer.toBuffer(new Document({sections:[{children}]}));
 return new Response(new Uint8Array(buffer),{headers:{...headers,'Content-Type':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','Content-Disposition':'attachment; filename="DIS-member-template.docx"'}});
}

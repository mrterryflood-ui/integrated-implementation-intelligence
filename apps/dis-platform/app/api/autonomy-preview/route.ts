import {AUTONOMY_LEVELS,OPERATIONS,evaluateAutonomy,defaultAutonomy} from '../../../lib/ecosystem/autonomy-policy';
export const runtime='nodejs';
export async function GET(){
 return Response.json({schemaVersion:'dis-autonomy-preview-v1',levels:AUTONOMY_LEVELS,operations:OPERATIONS,
  default:defaultAutonomy(),status:'SIMULATION_ONLY_NO_GRANT_OR_ACTION'},{headers:{'cache-control':'no-store'}});
}
export async function POST(request:Request){
 if(Number(request.headers.get('content-length')||0)>1200)return Response.json({error:'Request too large'},{status:413});
 let value:unknown;
 try{const text=await request.text();if(text.length>1200)return Response.json({error:'Request too large'},{status:413});value=JSON.parse(text)}
 catch{return Response.json({error:'Invalid JSON'},{status:400})}
 if(!value||typeof value!=='object'||Array.isArray(value))return Response.json({error:'Invalid request'},{status:400});
 const v=value as Record<string,unknown>;
 if(Object.keys(v).some(k=>!['level','operation','externalConsent'].includes(k))||
  !AUTONOMY_LEVELS.includes(v.level as any)||!OPERATIONS.includes(v.operation as any)||
  typeof v.externalConsent!=='boolean')return Response.json({error:'Unsupported autonomy preview request'},{status:400});
 const decision=evaluateAutonomy({subjectId:'PREVIEW_ONLY',tenantId:'PREVIEW_ONLY',projectId:'PREVIEW_ONLY',
  requestedLevel:v.level as any,operation:v.operation as any,externalConsent:v.externalConsent},null);
 return Response.json({schemaVersion:'dis-autonomy-preview-v1',status:'SIMULATION_ONLY_NO_GRANT_OR_ACTION',
  decision,notice:'This preview cannot grant authority. An authenticated owner-approved, tenant-scoped server grant is required for delegated execution.'},
  {headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
}

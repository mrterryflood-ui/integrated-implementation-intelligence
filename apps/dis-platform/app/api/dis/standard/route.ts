import {NextResponse} from 'next/server';
import {publicAgentStandard} from '../../../../lib/public-agent-standard';

export const runtime='nodejs';
export const dynamic='force-static';

/** Public, read-only standard discovery. No auth, tenant data or paid inference. */
export async function GET(){
  try{
    const manifest=publicAgentStandard();
    return NextResponse.json(manifest,{headers:{
      'Cache-Control':'public, max-age=60, must-revalidate',
      'Access-Control-Allow-Origin':'*',
      'Access-Control-Allow-Methods':'GET, OPTIONS',
      'X-Content-Type-Options':'nosniff',
      'X-DIS-Standard-Version':manifest.documents[0].version,
      'X-DIS-Standard-SHA256':manifest.documents[0].sha256
    }});
  }catch{
    return NextResponse.json({state:'STANDARD_NOT_AVAILABLE',reason:'Published standard integrity check failed; do not adopt a stale or inconsistent document.'},{status:503,headers:{'Cache-Control':'no-store'}});
  }
}
export async function OPTIONS(){
  return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Accept','Cache-Control':'public, max-age=60'}});
}

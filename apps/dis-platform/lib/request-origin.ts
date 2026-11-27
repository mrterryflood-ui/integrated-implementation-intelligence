import {productionRelease,type ReleaseEnvironment} from './release-gates';

export class RequestOriginError extends Error {
 constructor(message:string,readonly status:403|503){super(message);}
}
type OriginOptions={allowMissingOrigin?:boolean};
const localHosts=new Set(['localhost','127.0.0.1','[::1]','0.0.0.0','[::]']);

/** The public origin is operator configuration, never a forwarded header or the listener URL. */
export function canonicalRequestOrigin(request:Request,env:ReleaseEnvironment=process.env):string{
 const configured=env.DIS_PUBLIC_ORIGIN,host=request.headers.get('host');
 if(configured!==undefined){
  let publicUrl:URL;
  try{publicUrl=new URL(configured);}catch{throw new RequestOriginError('The public DIS address is not configured correctly',503);}
  if(publicUrl.protocol!=='https:'||publicUrl.username||publicUrl.password||publicUrl.search||publicUrl.hash||publicUrl.pathname!=='/'||!publicUrl.hostname||localHosts.has(publicUrl.hostname)||(configured!==publicUrl.origin&&configured!==publicUrl.origin+'/'))throw new RequestOriginError('The public DIS address is not configured correctly',503);
  // Raw Host must exactly identify the configured authority. In particular, do
  // not substitute x-forwarded-host/proto or accept a comma-separated host list.
  if(host!==publicUrl.host)throw new RequestOriginError('This request must use the configured DIS address',403);
  return publicUrl.origin;
 }
 if(productionRelease(env))throw new RequestOriginError('The public DIS address is not configured',503);
 // Explicit development/test or an existing preview can keep its own origin.
 // Direct synthetic Request fixtures may omit Host; real HTTP requests include it.
 const url=new URL(request.url);
 if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw new RequestOriginError('Invalid request origin',403);
 if(host===null||host===url.host)return url.origin;
 // A local Next listener can be 0.0.0.0 while the browser uses localhost/127.0.0.1.
 if(localHosts.has(url.hostname)){
  try{
   const local=new URL(url.protocol+'//'+host);
   if(localHosts.has(local.hostname)&&local.host===host&&!local.username&&!local.password&&local.pathname==='/'&&!local.search&&!local.hash)return local.origin;
  }catch{/* Fail closed below. */}
 }
 throw new RequestOriginError('This request must use its own application address',403);
}

export function assertSameOriginRequest(request:Request,options:OriginOptions={},env:ReleaseEnvironment=process.env):void{
 const expected=canonicalRequestOrigin(request,env),origin=request.headers.get('origin');
 if(origin===null&&options.allowMissingOrigin)return;
 if(!origin||origin!==expected)throw new RequestOriginError('Same-origin request required; origin mismatch',403);
}

/** Preserve each caller's existing required/optional Origin policy with a common check. */
export function sameOriginRequestFailure(request:Request,options:OriginOptions={},env:ReleaseEnvironment=process.env):Response|null{
 try{assertSameOriginRequest(request,options,env);return null;}
 catch(error){if(!(error instanceof RequestOriginError))throw error;return Response.json({error:error.message},{status:error.status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}
}

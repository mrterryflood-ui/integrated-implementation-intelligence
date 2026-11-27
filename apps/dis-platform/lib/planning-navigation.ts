const VIEWS=new Set(['overview','meetings','implementation','knowledge','connections','plans','work','evidence','people','chat','files','governance']);
/** Preserve a chosen DIS tool across sign-in without accepting a redirect URL. */
export function planningReturnPath(params:Record<string,string|string[]|undefined>){
 const query=new URLSearchParams();
 if(typeof params.view==='string'&&VIEWS.has(params.view))query.set('view',params.view);
 if(typeof params.organizationId==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(params.organizationId))query.set('organizationId',params.organizationId);
 return '/planning'+(query.size?'?'+query.toString():'');
}

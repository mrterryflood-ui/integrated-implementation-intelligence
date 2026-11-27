import {auth} from '@clerk/nextjs/server';
import {productionIdentityBlocked} from '../release-gates';
import {OrganizationError} from './service';
import {readBoundedOfficeRequest} from '../consultation-export-artifacts';
import {assertSameOriginRequest,RequestOriginError} from '../request-origin';
export async function organizationActor(){if(productionIdentityBlocked(process.env))throw new OrganizationError('Production identity is not configured. The existing Clerk integration needs its production domain.',503);const {userId}=await auth();if(!userId)throw new OrganizationError('Sign in to your own account',401);return userId;}
export function sameOrigin(req:Request){try{assertSameOriginRequest(req);}catch(error){if(error instanceof RequestOriginError)throw new OrganizationError(error.message,error.status);throw error;}}
export async function readOrganizationAction(req:Request){sameOrigin(req);const body=await readBoundedOfficeRequest(req,1200000);if(!body||typeof body!=='object'||Array.isArray(body))throw new OrganizationError('A structured action is required');return body as Record<string,any>;}
export function organizationResponse(value:unknown,status=200){return Response.json(value,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}
export function organizationFailure(error:unknown){return organizationResponse({error:error instanceof OrganizationError?error.message:'Organization service unavailable. No successful change is recorded.'},error instanceof OrganizationError?error.status:503);}

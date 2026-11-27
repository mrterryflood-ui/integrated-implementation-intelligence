import {BoundedJsonRequestError, readBoundedJsonRequest} from '../bounded-json-request';
import {organizationFailure, organizationResponse, sameOrigin} from '../organizations/http';
import {OrganizationError} from '../organizations/service';
import {DecisionsError, type DecisionsConfiguration} from './decisions-contract';
import {canonicalRequestOrigin,RequestOriginError} from '../request-origin';

export function decisionsFailure(error: unknown) {
  if (error instanceof DecisionsError) return organizationResponse({error: error.message, code: error.code}, error.status);
  if (error instanceof BoundedJsonRequestError) return organizationFailure(new OrganizationError(error.message, error.status));
  // Transport, database and provider exceptions are deliberately not serialized.
  return organizationFailure(error);
}
export async function decisionsBody(request: Request, allowed: string[]): Promise<Record<string, unknown>> {
  sameOrigin(request);
  const body = await readBoundedJsonRequest(request, 40000);
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !allowed.includes(key))) throw new OrganizationError('A supported connection action is required', 400);
  return body as Record<string, unknown>;
}
export function decisionsPublicOrigin(request: Request, config: DecisionsConfiguration) {
  try { canonicalRequestOrigin(request, {...process.env, DIS_PUBLIC_ORIGIN: config.publicOrigin}); }
  catch (error) { if (error instanceof RequestOriginError) throw new OrganizationError(error.message, error.status); throw error; }
}
export function decisionsReturn(config: DecisionsConfiguration, authorized: boolean, organizationId?: string) {
  const destination = new URL('/planning', config.publicOrigin);
  if (organizationId) destination.searchParams.set('organizationId', organizationId);
  destination.searchParams.set('decisions', authorized ? 'authorized' : 'failed');
  return new Response(null, {status: 303, headers: {Location: destination.href, 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff'}});
}

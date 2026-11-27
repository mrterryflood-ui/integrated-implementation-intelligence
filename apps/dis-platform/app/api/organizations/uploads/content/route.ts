import {organizationActor, organizationFailure, organizationResponse, sameOrigin} from '../../../../../lib/organizations/http';
import {organizationObjectUpload} from '../../../../../lib/organizations/object-upload';
import {ObjectStoreError} from '../../../../../lib/organizations/object-store';
import {OrganizationError} from '../../../../../lib/organizations/service';
export const runtime = 'nodejs';
export const maxDuration = 180;
export async function POST(request: Request) {
  try {
    sameOrigin(request); const actor = await organizationActor(), params = new URL(request.url).searchParams;
    if (params.getAll('organizationId').length !== 1 || params.getAll('reservationId').length !== 1) throw new OrganizationError('Choose one organization upload reservation', 400);
    return organizationResponse(await organizationObjectUpload.upload(actor, params.get('organizationId'), params.get('reservationId'), request.body, request.headers.get('content-type') || '', request.headers.get('content-length'), request.signal), 201);
  } catch (error) {return organizationFailure(error instanceof ObjectStoreError ? new OrganizationError(error.message, error.status) : error);}
}

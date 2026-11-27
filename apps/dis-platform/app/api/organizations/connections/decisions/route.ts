import {organizationActor, organizationResponse} from '../../../../../lib/organizations/http';
import {decisionsConnections} from '../../../../../lib/organizations/decisions-connection';
import {decisionsFailure} from '../../../../../lib/integrations/decisions-http';
import {OrganizationError} from '../../../../../lib/organizations/service';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
    const actor = await organizationActor(), params = new URL(request.url).searchParams;
    if (params.getAll('organizationId').length !== 1) throw new OrganizationError('Choose one organization', 400);
    return organizationResponse({connection: await decisionsConnections.status(actor, params.get('organizationId'))});
  } catch (error) { return decisionsFailure(error); }
}

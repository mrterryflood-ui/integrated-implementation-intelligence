import {organizationActor, organizationResponse} from '../../../../../../lib/organizations/http';
import {decisionsConnections} from '../../../../../../lib/organizations/decisions-connection';
import {decisionsBody, decisionsFailure} from '../../../../../../lib/integrations/decisions-http';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    const actor = await organizationActor(), body = await decisionsBody(request, ['organizationId']);
    return organizationResponse({connection: await decisionsConnections.disconnect(actor, body.organizationId)});
  } catch (error) { return decisionsFailure(error); }
}

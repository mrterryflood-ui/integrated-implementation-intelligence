import {organizationActor, organizationResponse} from '../../../../../../lib/organizations/http';
import {decisionsConnections} from '../../../../../../lib/organizations/decisions-connection';
import {decisionsBody, decisionsFailure, decisionsPublicOrigin} from '../../../../../../lib/integrations/decisions-http';
import {decisionsConfiguration} from '../../../../../../lib/integrations/decisions-contract';
export const runtime = 'nodejs';
export const maxDuration = 45;
export async function POST(request: Request) {
  try {
    const actor = await organizationActor(), body = await decisionsBody(request, ['organizationId', 'consent']);
    decisionsPublicOrigin(request, decisionsConfiguration());
    return organizationResponse(await decisionsConnections.start(actor, body.organizationId, body.consent));
  } catch (error) { return decisionsFailure(error); }
}

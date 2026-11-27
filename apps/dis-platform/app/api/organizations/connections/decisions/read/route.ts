import {organizationActor, organizationResponse} from '../../../../../../lib/organizations/http';
import {decisionsConnections} from '../../../../../../lib/organizations/decisions-connection';
import {decisionsBody, decisionsFailure} from '../../../../../../lib/integrations/decisions-http';
import {OrganizationError} from '../../../../../../lib/organizations/service';
export const runtime = 'nodejs';
export const maxDuration = 45;
export async function POST(request: Request) {
  try {
    const actor = await organizationActor(), body = await decisionsBody(request, ['organizationId', 'tool', 'arguments']);
    if (typeof body.tool !== 'string' || !body.arguments || typeof body.arguments !== 'object' || Array.isArray(body.arguments)) throw new OrganizationError('Choose a reviewed read capability and its structured inputs', 400);
    const result = await decisionsConnections.read(actor, body.organizationId, body.tool, body.arguments as Record<string, unknown>);
    return organizationResponse({connection: result.connection, read: result.read});
  } catch (error) { return decisionsFailure(error); }
}

import {organizationActor} from '../../../../../../lib/organizations/http';
import {decisionsConnections} from '../../../../../../lib/organizations/decisions-connection';
import {decisionsFailure, decisionsPublicOrigin, decisionsReturn} from '../../../../../../lib/integrations/decisions-http';
import {decisionsConfiguration, DecisionsError} from '../../../../../../lib/integrations/decisions-contract';
export const runtime = 'nodejs';
export const maxDuration = 45;
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
    // OAuth redirects originate at the provider; state + the existing Clerk
    // subject bind this GET instead of the POST-only Origin-header rule.
    const actor = await organizationActor(), config = decisionsConfiguration();
    decisionsPublicOrigin(request, config);
    if (request.url.length > 16000) return decisionsReturn(config, false);
    try {
      const result = await decisionsConnections.complete(actor, new URL(request.url).searchParams);
      return decisionsReturn(config, result.authorized, result.organizationId);
    } catch (error) {
      if (error instanceof DecisionsError) return decisionsReturn(config, false);
      throw error;
    }
  } catch (error) { return decisionsFailure(error); }
}

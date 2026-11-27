import {decisionsClientMetadata, decisionsConfiguration} from '../../../../../lib/integrations/decisions-contract';
import {decisionsFailure, decisionsPublicOrigin} from '../../../../../lib/integrations/decisions-http';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/** Public OAuth client metadata only. Never returns credentials or account state. */
export async function GET(request: Request) {
  try {
    const config = decisionsConfiguration();
    decisionsPublicOrigin(request, config);
    return Response.json(decisionsClientMetadata(config), {headers: {'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'}});
  } catch (error) { return decisionsFailure(error); }
}

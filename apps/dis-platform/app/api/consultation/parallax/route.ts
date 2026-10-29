import {auth} from "@clerk/nextjs/server";
import {neon} from "@neondatabase/serverless";
import {productionIdentityBlocked} from "../../../../lib/release-gates";
import {compareRpliceParallax, RpliceBridgeError, validatePerspectives} from "../../../../lib/rplice-adapter";

export const runtime = "nodejs";
export const maxDuration = 30;
export async function POST(request: Request) {
  if (productionIdentityBlocked(process.env))
    return Response.json({error:"Production identity not configured"},{status:503});
  const {userId} = await auth();
  if (!userId) return Response.json({error:"Sign in required"},{status:401});
  const size = Number(request.headers.get("content-length") || 0);
  if (size > 24_000) return Response.json({error:"Request too large"},{status:413});
  if (!request.headers.get("content-type")?.includes("application/json"))
    return Response.json({error:"JSON request required"},{status:415});
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(request.url).origin)
        return Response.json({error:"Origin mismatch"},{status:403});
    } catch { return Response.json({error:"Invalid request origin"},{status:403}); }
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object")
    return Response.json({error:"Invalid input"},{status:400});
  if (body.externalConsent !== true)
    return Response.json({error:"Consent required before sharing perspectives with RPLICE"},{status:403});
  try { validatePerspectives(body.stakeholders); }
  catch(e){ return Response.json({error:e instanceof RpliceBridgeError?e.message:"Invalid perspectives"},{status:400}); }
  if (!process.env.RPLICE_API_KEY || !process.env.DIS_DATABASE_URL)
    return Response.json({error:"Private RPLICE integration is not yet configured"},{status:503});

  // Shared per-user daily limit; no automatic external calls or unlimited inference.
  try {
    const sql = neon(process.env.DIS_DATABASE_URL);
    const usage = await sql.transaction([
      sql`SELECT set_config('dis.subject_id',${userId},true)`,
      sql`INSERT INTO dis_council_usage(subject_id,usage_day,calls) VALUES(${userId},CURRENT_DATE,1)
       ON CONFLICT(subject_id,usage_day) DO UPDATE SET calls=dis_council_usage.calls+1,last_called=now()
       WHERE dis_council_usage.calls<20 RETURNING calls`,
    ]);
    if (!usage[1]?.length)
      return Response.json({error:"Daily analytical review limit reached"},{status:429});
  } catch {
    return Response.json({error:"Integration quota authorization unavailable"},{status:503});
  }
  try {
    const out = await compareRpliceParallax({scenario:body.scenario,stakeholders:body.stakeholders}, process.env);
    return Response.json(out,{headers:{"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
  } catch(e) {
    const code=e instanceof RpliceBridgeError?e.statusCode:503;
    return Response.json({error:e instanceof RpliceBridgeError?e.message:"RPLICE analysis unavailable"},{status:code,headers:{"Cache-Control":"no-store"}});
  }
}

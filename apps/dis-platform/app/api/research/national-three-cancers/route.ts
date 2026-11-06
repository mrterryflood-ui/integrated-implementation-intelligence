/** Versioned published aggregate public reference (NOT a live NCI/SEER account connection). */
import {NextResponse} from "next/server";
import {nationalThreeCancerReference} from "../../../../lib/national-three-cancer-reference";
export const runtime="nodejs";
export async function GET(){
 return NextResponse.json(nationalThreeCancerReference(),
 {headers:{"Cache-Control":"public, s-maxage=3600, stale-while-revalidate=86400"}});
}

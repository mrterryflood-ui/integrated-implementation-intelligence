import {clerkMiddleware,createRouteMatcher} from "@clerk/nextjs/server";
import {NextResponse,type NextRequest,type NextFetchEvent} from "next/server";
import {productionIdentityBlocked,RELEASE_NOTICE} from "./lib/release-gates";

const protectedPages=createRouteMatcher(["/workspace(.*)"]);
const privateRoutes=createRouteMatcher([
 "/workspace(.*)",
 "/api/workspaces(.*)",
 "/api/documents(.*)",
 "/api/cases(.*)",
 "/api/consultation/sessions(.*)",
 "/api/consultation/graph(.*)",
 "/api/consultation/research(.*)",
 "/api/capability-fabric(.*)",
 "/api/consultation/parallax(.*)",
 "/api/consultation/opportunity(.*)",
 "/api/consultation/export(.*)",
]);

// Live identity: Clerk remains authoritative for protected pages.
// Authentication is never mocked or silently enabled by a test key.
const liveClerkMiddleware=clerkMiddleware(async(auth,req)=>{
 if(protectedPages(req))await auth.protect();
});

/**
 * Public-only release: bypass Clerk middleware entirely for public routes.
 * Calling clerkMiddleware on every public production page still bootstraps
 * development Clerk SDK endpoints even if ClerkProvider is omitted in layout.
 * Private requests deliberately continue to fail closed with the same 503
 * or safe redirect as before. Never reinterpret preview keys as live keys.
 */
export default function proxy(req:NextRequest,event:NextFetchEvent){
 if(productionIdentityBlocked(process.env)){
  const pathname=req.nextUrl.pathname;
  const blocked=privateRoutes(req)||(pathname==="/api/council"&&req.method==="POST");
  if(blocked){
   if(pathname.startsWith("/api/"))return NextResponse.json(
    {error:"Production identity not configured",notice:RELEASE_NOTICE},
    {status:503,headers:{"Cache-Control":"no-store"}}
   );
   return NextResponse.redirect(new URL("/?workspace=pending",req.url));
  }
  // No Clerk server/client initialization for public-only requests.
  return NextResponse.next();
 }
 return liveClerkMiddleware(req,event);
}

export const config={
 matcher:[
  "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|png|jpg|svg|ico|woff2?)).*)",
  "/(api|trpc)(.*)",
 ],
};

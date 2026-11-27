import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { productionIdentityBlocked, RELEASE_NOTICE } from "./lib/release-gates";
import {canonicalRequestOrigin,RequestOriginError} from './lib/request-origin';

const protectedPages = createRouteMatcher(["/workspace(.*)"]);
const privateRoutes = createRouteMatcher([
  "/workspace(.*)",
  "/api/workspaces(.*)",
  "/api/organizations(.*)",
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

// Do not initialize Clerk middleware for public browsing of a deployment
// whose production identity gate is closed. Clerk's development-tenant
// handshake otherwise occurs BEFORE its callback and can leak a browser
// request to *.clerk.accounts.dev even when <ClerkProvider> is not rendered.
const authenticatedProxy = clerkMiddleware(async (auth, req) => {
  if (protectedPages(req)) await auth.protect();
});

export default function proxy(req: NextRequest, event: NextFetchEvent) {
  // The owned apex serves public links too. Canonicalize safe navigation before
  // relative API requests; mutations must still pass the exact www Host guard.
  if ((req.method === 'GET' || req.method === 'HEAD') && req.headers.get('host') === 'dynamicintel.io' &&
      (process.env.DIS_PUBLIC_ORIGIN === 'https://www.dynamicintel.io' || process.env.DIS_PUBLIC_ORIGIN === 'https://www.dynamicintel.io/')) {
    const destination = new URL('https://www.dynamicintel.io');
    destination.pathname = req.nextUrl.pathname; destination.search = req.nextUrl.search;
    return NextResponse.redirect(destination, 308);
  }
  // Vendor metadata is public and contains no user, organization, or token data.
  if (req.method === "GET" && req.nextUrl.pathname === "/api/integrations/decisions/client") return NextResponse.next();
  if (productionIdentityBlocked(process.env)) {
    const pathname = req.nextUrl.pathname;
    const councilRun = pathname === "/api/council" && req.method === "POST";
    if (privateRoutes(req) || councilRun) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Production identity not configured", notice: RELEASE_NOTICE },
          { status: 503, headers: { "Cache-Control": "no-store" } },
        );
      }
      try{return NextResponse.redirect(new URL("/?workspace=pending", canonicalRequestOrigin(req)));}
      catch(error){return NextResponse.json({error:error instanceof RequestOriginError?error.message:'Public DIS address unavailable'},{status:error instanceof RequestOriginError?error.status:503,headers:{'Cache-Control':'no-store'}});}
    }
    // Public-only documentation, local draft generation, and read-only tools
    // may run; private APIs remain fail-closed without a Clerk handshake.
    return NextResponse.next();
  }
  // Live Clerk provider and identity checks are restored only when a verified
  // production key pair is configured. Per-route authorization is unchanged.
  return authenticatedProxy(req, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|png|jpg|svg|ico|woff2?)).*)",
    "/(api|trpc)(.*)",
  ],
};

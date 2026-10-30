import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { productionIdentityBlocked, RELEASE_NOTICE } from "./lib/release-gates";

const protectedPages = createRouteMatcher(["/workspace(.*)"]);
const privateRoutes = createRouteMatcher([
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

// Do not initialize Clerk middleware for public browsing of a deployment
// whose production identity gate is closed. Clerk's development-tenant
// handshake otherwise occurs BEFORE its callback and can leak a browser
// request to *.clerk.accounts.dev even when <ClerkProvider> is not rendered.
const authenticatedProxy = clerkMiddleware(async (auth, req) => {
  if (protectedPages(req)) await auth.protect();
});

export default function proxy(req: NextRequest, event: NextFetchEvent) {
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
      return NextResponse.redirect(new URL("/?workspace=pending", req.url));
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

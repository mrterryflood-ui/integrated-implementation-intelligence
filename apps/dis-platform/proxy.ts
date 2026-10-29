import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
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
  "/api/consultation/opportunity(.*)",
  "/api/consultation/export(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;
  const councilRun = pathname === "/api/council" && req.method === "POST";
  if (productionIdentityBlocked(process.env) && (privateRoutes(req) || councilRun)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Production identity not configured", notice: RELEASE_NOTICE },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.redirect(new URL("/?workspace=pending", req.url));
  }
  // JSON APIs have their own explicit 401 responses. Clerk protects private pages.
  if (protectedPages(req)) await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|png|jpg|svg|ico|woff2?)).*)",
    "/(api|trpc)(.*)",
  ],
};

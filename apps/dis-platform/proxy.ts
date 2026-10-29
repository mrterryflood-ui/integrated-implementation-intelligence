import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
const protectedRoutes=createRouteMatcher(["/workspace(.*)","/api/workspaces(.*)"]);
export default clerkMiddleware(async (auth,req)=>{if(protectedRoutes(req))await auth.protect()});
export const config={matcher:["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|png|jpg|svg|ico|woff2?)).*)","/(api|trpc)(.*)"]};

import "./home.css";
import {ClerkProvider} from "@clerk/nextjs";
import {productionIdentityBlocked} from "../lib/release-gates";
import type {ReactNode} from "react";

// The root layout must not be statically precomputed in an environment other
// than the production request. Otherwise ClerkProvider may be serialized
// from a preview build even while the dynamic home page correctly blocks auth.
export const dynamic="force-dynamic";

export default function Layout({children}:{children:ReactNode}){
 // Production with Clerk test keys is a public-only release. Do not mount
 // Clerk's browser SDK against a development tenant while private auth is
 // explicitly blocked: some browsers reject its cross-origin client calls.
 // When the owner provisions a real live key pair and redeploys, ClerkProvider
 // is restored without disabling the private-route/tenant authorization gates.
 const identityBlocked=productionIdentityBlocked(process.env);
 return <html lang="en"><body data-dis-identity={identityBlocked?"public-only":"clerk-enabled"} style={{fontFamily:"system-ui",margin:0,background:"#f6f8fc",color:"#1b3048"}}>{identityBlocked?children:<ClerkProvider>{children}</ClerkProvider>}</body></html>;
}

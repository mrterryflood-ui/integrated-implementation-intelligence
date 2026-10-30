import "./home.css";
import {ClerkProvider} from "@clerk/nextjs";
import {productionIdentityBlocked} from "../lib/release-gates";
import type {ReactNode} from "react";

/**
 * Production test identity is not a release. Don't boot the browser-side
 * Clerk SDK at all while private functionality is intentionally fail-closed:
 * repeated *.clerk.accounts.dev calls cause iPhone WebKit access errors.
 * Keep previews capable of testing development Clerk; real production requires
 * a verified pk_live_/sk_live_ pair and independent auth acceptance.
 */
export default function Layout({children}:{children:ReactNode}){
 const publicOnly=productionIdentityBlocked(process.env);
 return <html lang="en"><body style={{fontFamily:"system-ui",margin:0,background:"#f6f8fc",color:"#1b3048"}}>
  {publicOnly?children:<ClerkProvider>{children}</ClerkProvider>}
 </body></html>;
}

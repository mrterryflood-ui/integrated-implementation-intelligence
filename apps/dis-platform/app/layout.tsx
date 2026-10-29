import "./home.css";
import {ClerkProvider} from "@clerk/nextjs";
import type {ReactNode} from "react";
export default function Layout({children}:{children:ReactNode}){return <html lang="en"><body style={{fontFamily:"system-ui",margin:0,background:"#f6f8fc",color:"#1b3048"}}><ClerkProvider>{children}</ClerkProvider></body></html>}

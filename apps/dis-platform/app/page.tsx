import Link from "next/link";
import {auth} from "@clerk/nextjs/server";
import {SignInButton,UserButton} from "@clerk/nextjs";
export const dynamic="force-dynamic";
export default async function Home(){const {userId}=await auth();return <main style={{maxWidth:850,margin:"60px auto",padding:24}}><h1>DIS Council Intelligence</h1><p>Evidence-grounded inquiry, persistent private workspaces, and accountable decisions.</p>{userId?<><UserButton/><p><Link href="/workspace">Open my knowledge workspace</Link></p></>:<p><SignInButton mode="modal"><button>Sign in to DIS</button></SignInButton></p>}<p>Public research beta: <a href="https://dis-council-foundation.vercel.app">Explore the existing DIS workbench</a>.</p></main>}

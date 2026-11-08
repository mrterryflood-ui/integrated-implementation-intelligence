import {auth} from "@clerk/nextjs/server";
import {redirect} from "next/navigation";
import CaseClient from "./case-client";
import "../../research-program/research-program.css";
export default async function CasePage({searchParams}:{searchParams:Promise<{id?:string|string[]}>}){
 const {userId}=await auth();if(!userId)redirect("/");const params=await searchParams;
 const id=typeof params.id==="string"?params.id.toLowerCase():"";return <CaseClient key={id} caseId={id}/>;
}

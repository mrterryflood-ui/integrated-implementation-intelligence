import {auth} from "@clerk/nextjs/server";
import {redirect} from "next/navigation";
import CaseClient from "./case-client";
export default async function CasePage(){const {userId}=await auth();if(!userId)redirect("/");return <CaseClient/>}

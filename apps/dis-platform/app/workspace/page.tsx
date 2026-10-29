import {auth} from "@clerk/nextjs/server";
import {redirect} from "next/navigation";
import WorkspaceClient from "./workspace-client";
export default async function Workspace(){const {userId}=await auth();if(!userId)redirect("/");return <WorkspaceClient/>}

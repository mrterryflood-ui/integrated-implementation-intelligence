"use client";
import {useEffect,useState} from "react";
type Organization={id:string;name:string};
type Channel={id:string;name:string;audience:string[]};
type Entry={id:string;author_subject:string;display_name:string;body:string;created_at:string;parent_id:string|null};
export default function PerspectiveCollaboration({privateReady,draftText,draftReady}:{privateReady:boolean;draftText:string;draftReady:boolean}){
 const [expanded,setExpanded]=useState(false),[organizations,setOrganizations]=useState<Organization[]>([]),[organizationId,setOrganizationId]=useState(""),[channels,setChannels]=useState<Channel[]>([]),[channelId,setChannelId]=useState("");
 const [messages,setMessages]=useState<Entry[]>([]),[message,setMessage]=useState(""),[replyId,setReplyId]=useState<string|null>(null),[state,setState]=useState(""),[busy,setBusy]=useState(false);
 async function api(url:string,input?:Record<string,unknown>){const res=await fetch(url,input?{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(input)}:{cache:"no-store"});const json=await res.json();if(!res.ok)throw Error(json.error||"Request unavailable");return json}
 useEffect(()=>{if(!privateReady||!expanded)return;let active=true;api("/api/organizations").then(j=>{if(active)setOrganizations(j.organizations||[])}).catch(e=>{if(active)setState(e.message)});return()=>{active=false}},[privateReady,expanded]);
 useEffect(()=>{if(!privateReady||!organizationId)return;let active=true;api("/api/organizations?"+new URLSearchParams({organizationId})).then(j=>{if(active)setChannels(j.channels||[])}).catch(e=>{if(active)setState(e.message)});return()=>{active=false}},[privateReady,organizationId]);
 useEffect(()=>{
  if(!privateReady||!organizationId||!channelId)return;
  let alive=true;
  const load=async()=>{try{const j=await api("/api/organizations?"+new URLSearchParams({organizationId,channelId}));if(alive)setMessages(j.messages||[])}catch(e){if(alive)setState(e instanceof Error?e.message:"Conversation not available")}};
  void load();const timer=setInterval(()=>void load(),5000);
  return()=>{alive=false;clearInterval(timer)};
 },[privateReady,organizationId,channelId]);
 async function post(){if(!organizationId||!channelId||!message.trim()||busy)return;setBusy(true);setState("");
  try{await api("/api/organizations",{action:"message",organizationId,channelId,body:message,parentId:replyId});setMessage("");setReplyId(null);
   const data=await api("/api/organizations?"+new URLSearchParams({organizationId,channelId}));setMessages(data.messages||[]);setState("Message retained in the selected organization channel.");
  }catch(e){setState(e instanceof Error?e.message:"Message not saved")}finally{setBusy(false)}
 }
 return <details className="perspective-documents" onToggle={e=>setExpanded(e.currentTarget.open)}><summary>Continue a real, persistent conversation with others</summary>
  {!privateReady?<p>Multi-participant conversations require verified sign-in and membership in an existing DIS organization. <a href="/planning">Open organization collaboration</a>.</p>:<>
   <p>Use your existing organization channels for durable, participant-authored dialogue. These are real users, not simulated perspectives. Nothing is automatically sent to AI, and nothing is shared until you explicitly post it.</p>
   <label>Organization<select value={organizationId} onChange={e=>{setOrganizationId(e.target.value);setChannelId("");setChannels([]);setMessages([])}}><option value="">Choose an organization</option>{organizations.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
   <label>Conversation channel<select value={channelId} onChange={e=>{setChannelId(e.target.value);setMessages([])}}><option value="">Choose a channel</option>{channels.map(x=><option key={x.id} value={x.id}>{x.name}{x.audience?.length?" · restricted participants":" · organization members"}</option>)}</select></label>
   {channelId&&<><div className="perspective-thread" aria-live="polite">{messages.map(m=><article key={m.id}><strong>{m.display_name}</strong> <small>{new Date(m.created_at).toLocaleString()}</small><p>{m.body}</p><button type="button" onClick={()=>setReplyId(m.id)}>Reply</button></article>)}</div>
    {replyId&&<p>Reply selected. <button type="button" onClick={()=>setReplyId(null)}>Cancel reply</button></p>}
    <label>Message for the selected real participants<textarea rows={5} maxLength={8000} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Write your own perspective or response. The conversation is not automatically used as AI evidence."/></label>
    <div className="perspective-actions"><button type="button" disabled={!draftReady||!draftText||busy} onClick={()=>{setMessage(draftText.slice(0,7900));setState("The reviewed draft is in the message editor. Review the recipients, content and attribution before posting.")}}>Insert current AI draft for review</button><button type="button" disabled={busy||!message.trim()} onClick={()=>void post()}>{busy?"Saving…":"Post message explicitly"}</button></div>
   </>}
   <p>To invite or manage participants, establish channel permissions in <a href="/planning">organization collaboration</a>. Organization membership and channel visibility are enforced by the existing DIS authorization layer.</p>
   {state&&<p role="status">{state}</p>}
  </>}
 </details>;
}

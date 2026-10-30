'use client';
import {useState,useEffect,useRef} from 'react';
import {boundedConversation,type ConversationTurn} from '../lib/conversation-context';
export function ReadableAnswer({text}:{text:string}){return <div className="council-text">{text.split(/\n\s*\n/).map((paragraph,i)=><p key={i} style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{paragraph.split(/(\*\*[^*]+\*\*)/).map((part,j)=>part.startsWith('**')&&part.endsWith('**')?<strong key={j}>{part.slice(2,-2)}</strong>:part)}</p>)}</div>}
export default function CouncilFollowup({question,answer,enabled,consent,settings}:{question:string;answer:string;enabled:boolean;consent:boolean;settings:Record<string,unknown>}){
 const [turns,setTurns]=useState<ConversationTurn[]>([{role:'user',content:question.slice(0,3000)},{role:'assistant',content:answer.slice(0,6000)}]);
 const [input,setInput]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[reply,setReply]=useState('');
 const request=useRef<AbortController|null>(null),epoch=useRef(0);
 useEffect(()=>{if(!enabled||!consent){epoch.current++;request.current?.abort();setBusy(false);setReply('');setTurns([]);}},[enabled,consent]);
 useEffect(()=>()=>{epoch.current++;request.current?.abort();},[]);
 async function refine(){
  if(busy||!enabled||!consent||input.trim().length<5)return;
  const controller=new AbortController();request.current=controller;const version=++epoch.current;setBusy(true);setError('');
  const followup=input.trim();
  try{
   const history=boundedConversation(turns);const r=await fetch('/api/council',{method:'POST',signal:controller.signal,headers:{'content-type':'application/json'},body:JSON.stringify({...settings,prompt:followup,conversation:history,allowExternalResearch:true})});
   const data=await r.json();if(!r.ok||!data.deliberation?.synthesis)throw Error(data.error||data.notice||'This refinement did not complete. Your question is still here.');
   if(version!==epoch.current)return;
   const text=String(data.deliberation.synthesis);setReply(text);setTurns([...history,{role:'user',content:followup},{role:'assistant',content:text.slice(0,6000)}].slice(-4) as ConversationTurn[]);setInput('');
  }catch(e){if(version===epoch.current)setError(e instanceof Error?e.message:'Unable to complete this refinement.');}finally{if(version===epoch.current)setBusy(false);}
 }
 return <section aria-label="Continue the collaboration"><h4>Build on this answer</h4><p>Tell us what does not fit, what changed, or what you need next. Recent turns stay in this page and are sent only with your research consent; they are not training data or verified evidence.</p>{reply&&<div aria-live="polite"><ReadableAnswer text={reply}/><p className="truth-note">AI draft. Sources and consequential recommendations still require review.</p></div>}<label>What should we refine?<textarea value={input} maxLength={3000} onChange={e=>setInput(e.target.value)} disabled={busy||!enabled||!consent}/></label><button type="button" disabled={busy||!enabled||!consent||input.trim().length<5} onClick={refine}>{busy?'Working through your feedback…':'Refine together'}</button><button type="button" disabled={busy} onClick={()=>{setTurns([]);setReply('');setError('');setInput('')}}>Clear conversation context</button>{error&&<p role="alert">{error}</p>}</section>;
}

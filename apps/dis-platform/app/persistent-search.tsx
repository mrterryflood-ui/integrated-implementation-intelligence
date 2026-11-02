'use client';
import {useState} from 'react';
export default function PersistentSearch(){const [question,setQuestion]=useState(''),[mode,setMode]=useState('quick');
 return <form className="dis-persistent-search" aria-label="Persistent DIS question" onSubmit={e=>{e.preventDefault();if(!question.trim())return;const detail={question:question.trim(),mode};if(location.pathname==='/planning')window.dispatchEvent(new CustomEvent('dis:question',{detail}));else{sessionStorage.setItem('dis:pending-question',JSON.stringify(detail));location.assign('/planning');}}}>
 <a href="/" aria-label="DIS home">DIS</a><label htmlFor="persistent-dis-question">Ask your next question</label><input id="persistent-dis-question" value={question} onChange={e=>setQuestion(e.target.value)} maxLength={1200} placeholder="What are you trying to understand or accomplish?"/><select aria-label="Research depth" value={mode} onChange={e=>setMode(e.target.value)}><option value="quick">Find in my workspace</option><option value="deep">Prepare deep research</option></select><button type="submit">Ask DIS</button><a href="/planning">Organization terminal</a>
 </form>;
}

import { JSDOM } from 'jsdom';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { createElement as h, useState } from 'react';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{pretendToBeVisual:true,url:'http://localhost/'});
for(const key of ['window','document','HTMLElement','HTMLDialogElement','Element','SVGElement','Node','MutationObserver','Event','MouseEvent','KeyboardEvent','getComputedStyle']) {
 Object.defineProperty(globalThis,key,{configurable:true,value:typeof dom.window[key]==='function'&&key==='getComputedStyle'?dom.window[key].bind(dom.window):dom.window[key]});
}
Object.defineProperty(globalThis,'navigator',{configurable:true,value:dom.window.navigator});
globalThis.requestAnimationFrame=dom.window.requestAnimationFrame.bind(dom.window);
globalThis.cancelAnimationFrame=dom.window.cancelAnimationFrame.bind(dom.window);
dom.window.matchMedia=(query)=>({matches:query.includes('prefers-reduced-motion'),media:query,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
// This stub exercises React dialog lifecycle only. It does NOT model native inertness,
// browser Tab containment, layout, colors, screen readers, or actual OS permission UI.
const showModal=function(){this.open=true;};
HTMLDialogElement.prototype.showModal=showModal;
HTMLDialogElement.prototype.close=function(){this.open=false;queueMicrotask(()=>this.dispatchEvent(new Event('close')));};
const {render,fireEvent,screen,cleanup,act}=await import('@testing-library/react');
const {PermissionPrimerSheet,NarrativeEmptyState,IssExperienceProvider}=await import('./Primitives.mjs');
let calls=0, finish=()=>{}, reject=()=>{};
const cases=[];
function Fixture({mode='web-optional'}) {
 const [open,setOpen]=useState(false);
 return h(IssExperienceProvider,null,h('button',{id:'trigger',onClick:()=>setOpen(true)},'Start'),h(PermissionPrimerSheet,{isOpen:open,mode,permissionName:'Location',userBenefitStory:'Find resources near your selected area.',privacyExplanation:'Fixture only: no location is collected.',onDefer:()=>setOpen(false),onGrant:()=>{calls++;return new Promise((resolve,fail)=>{finish=()=>{resolve();setOpen(false);};reject=()=>fail(new Error('Fixture denied'));});}}));
}
async function test(name, fn){cleanup();calls=0;await fn();cases.push({name,status:'PASS'});console.log('PASS',name);}
async function open(mode){render(h(Fixture,{mode}));const trigger=screen.getByRole('button',{name:'Start'});trigger.focus();fireEvent.click(trigger);return trigger;}
await test('opening is read-only and assigns unique accessible labels',async()=>{
 await open();assert.equal(calls,0);const dialog=screen.getByRole('dialog');assert.equal(dialog.open,true);
 const title=document.getElementById(dialog.getAttribute('aria-labelledby'));assert.equal(title.textContent,'Use Location');assert.equal(document.activeElement,title);
 const ids=[...document.querySelectorAll('[id]')].map(n=>n.id);assert.equal(new Set(ids).size,ids.length);
 assert.equal(dialog.getAttribute('aria-describedby').split(' ').every(id=>!!document.getElementById(id)),true);
});
await test('cancel closes the controlled dialog and restores focus',async()=>{
 const trigger=await open();fireEvent(screen.getByRole('dialog'),new Event('cancel',{cancelable:true}));await act(async()=>{});
 assert.equal(screen.queryByRole('dialog'),null);assert.equal(document.activeElement,trigger);assert.equal(calls,0);
});
await test('defer performs no permission request',async()=>{
 const trigger=await open();fireEvent.click(screen.getByRole('button',{name:'Not now'}));await act(async()=>{});
 assert.equal(screen.queryByRole('dialog'),null);assert.equal(document.activeElement,trigger);assert.equal(calls,0);
});
await test('request is synchronous and duplicate pending requests are suppressed',async()=>{
 await open();const button=screen.getByRole('button',{name:'Continue'});fireEvent.click(button);assert.equal(calls,1);assert.equal(button.disabled,true);fireEvent.click(button);assert.equal(calls,1);
 await act(async()=>{finish();});assert.equal(screen.queryByRole('dialog'),null);
});
await test('rejected request shows an error without permission-success claim',async()=>{
 await open();fireEvent.click(screen.getByRole('button',{name:'Continue'}));await act(async()=>{reject();});
 assert.match(screen.getByRole('alert').textContent,/did not open/);assert.equal(screen.getByRole('button',{name:'Continue'}).disabled,false);
});
await test('a stale rejected request cannot replace a newly reopened explanation',async()=>{
 await open();fireEvent.click(screen.getByRole('button',{name:'Continue'}));fireEvent.click(screen.getByRole('button',{name:'Not now'}));await act(async()=>{});
 fireEvent.click(screen.getByRole('button',{name:'Start'}));await act(async()=>{reject();});assert.equal(screen.queryByRole('alert'),null);assert.equal(screen.getByRole('button',{name:'Continue'}).disabled,false);
});
await test('essential native primer has one Continue and recoverable error dismissal',async()=>{
 await open('native-essential');const dialog=screen.getByRole('dialog');assert.equal(dialog.querySelectorAll('button').length,1);fireEvent.click(screen.getByRole('button',{name:'Continue'}));await act(async()=>{reject();});
 const close=screen.getByRole('button',{name:'Close explanation'});assert.equal(dialog.querySelectorAll('button').length,1);fireEvent.click(close);await act(async()=>{});assert.equal(screen.queryByRole('dialog'),null);
});
await test('unsupported browser discloses inability and remains dismissible',async()=>{
 delete HTMLDialogElement.prototype.showModal;await open();assert.match(screen.getByRole('alert').textContent,/cannot open/);fireEvent.click(screen.getByRole('button',{name:'Close explanation'}));await act(async()=>{});assert.equal(screen.queryByRole('alert'),null);assert.equal(calls,0);HTMLDialogElement.prototype.showModal=showModal;
});
await test('empty-state CTA uses an explicit non-submit button',async()=>{
 let invoked=0;render(h(IssExperienceProvider,null,h('form',null,h(NarrativeEmptyState,{headline:'Begin with one resource',storyGuidance:'Choose a resource to review its availability.',ctaLabel:'Explore resources',onAction:()=>{invoked++;}}))));const button=screen.getByRole('button',{name:'Explore resources'});assert.equal(button.type,'button');fireEvent.click(button);assert.equal(invoked,1);
});
cleanup();
await fs.writeFile(new URL('./dom-receipt.json',import.meta.url),JSON.stringify({status:'PASS',timestamp:new Date().toISOString(),nodeVersion:process.version,sourceSha256:Object.fromEntries(await Promise.all(['../src/components/iss-hig/Primitives.tsx','../styles/iss-hig-tokens.css','../package-lock.json'].map(async path=>[path,crypto.createHash('sha256').update(await fs.readFile(new URL(path,import.meta.url))).digest('hex')]))),scope:'Synthetic JSDOM React lifecycle/control-flow tests. Native dialog behavior is stubbed; no browser, accessibility, live permission, or production acceptance claim.',passed:cases.length,cases},null,2)+'\n');
dom.window.close();

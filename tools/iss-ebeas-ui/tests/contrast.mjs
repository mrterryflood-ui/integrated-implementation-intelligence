import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const source=await fs.readFile(new URL('../styles/iss-hig-tokens.css',import.meta.url),'utf8');
const light=source.match(/:root \{([\s\S]*?)\n\}/)?.[1];
const dark=source.match(/:root\.dark, \.dark, \[data-iss-theme="dark"\] \{([\s\S]*?)\n\}/)?.[1];
assert.ok(light&&dark,'Both declared token sets must be present');
const tokens=block=>Object.fromEntries([...block.matchAll(/(--iss-[\w-]+):\s*(#[0-9a-f]{6});/ig)].map(m=>[m[1],m[2]]));
const pairs=[['--iss-text-primary','--iss-bg-canvas'],['--iss-text-secondary','--iss-bg-canvas'],['--iss-text-secondary','--iss-surface-elevated'],['--iss-button-text','--iss-button-bg'],['--iss-accent-primary','--iss-accent-soft'],['--iss-text-primary','--iss-accent-soft']];
const luminance=value=>{const rgb=[1,3,5].map(i=>parseInt(value.slice(i,i+2),16)/255).map(c=>c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4);return rgb.reduce((sum,c,i)=>sum+c*[0.2126,0.7152,0.0722][i],0);};
const results=[];
for(const [mode,block] of [['light',light],['dark',dark]]){
 const values=tokens(block);
 for(const [fg,bg] of pairs){assert.ok(values[fg]&&values[bg]);const [a,b]=[luminance(values[fg]),luminance(values[bg])].sort((x,y)=>x-y);const ratio=(b+0.05)/(a+0.05);assert.ok(ratio>=4.5,`${mode} ${fg} on ${bg}: ${ratio}`);results.push({mode,foreground:fg,background:bg,ratio});}
}
await fs.writeFile(new URL('./contrast-receipt.json',import.meta.url),JSON.stringify({status:'PASS',timestamp:new Date().toISOString(),sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),scope:'Declared opaque-token numerical contrast only; not composited browser, all application text, or WCAG conformance acceptance.',results},null,2)+'\n');
console.log(`PASS ${results.length} declared light/dark normal-text token contrasts`);

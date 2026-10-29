/**
 * Bounded, read-only public-source inspection. Findings are potential faults,
 * not confirmed vulnerabilities. Never returns source contents or secrets.
 */
const RULES=[
 {id:"CODE-001",level:"review",regex:/\beval\s*\(/g,reason:"Dynamic evaluation detected",fix:"Investigate whether a typed parser or explicit dispatch can replace eval"},
 {id:"CODE-002",level:"review",regex:/\bnew\s+Function\s*\(/g,reason:"Dynamic Function construction detected",fix:"Avoid runtime code generation where possible"},
 {id:"CODE-003",level:"review",regex:/\bdangerouslySetInnerHTML\b/g,reason:"HTML injection sink detected",fix:"Verify trusted sanitization and consider safe text rendering"},
 {id:"CODE-004",level:"review",regex:/\bexec\s*\(\s*[`'"]/g,reason:"Process execution call detected",fix:"Inspect input handling, allowlists and process boundaries"},
 {id:"CODE-005",level:"review",regex:/\bMath\.random\s*\(/g,reason:"Non-cryptographic randomness used",fix:"Check whether use is security-sensitive; if so, use a secure random source"}
];
const eligible=p=>/\.(?:[cm]?[jt]sx?|py|go|rs)$/.test(p)&&!/(^|\/)(node_modules|vendor|dist|build|\.next|coverage)\//.test(p);
export function selectFiles(tree,maxFiles=12){
 return tree.filter(x=>x.type==="blob"&&eligible(x.path)&&x.size!==undefined&&x.size<=30000)
  .sort((a,b)=>{const rank=p=>/(^|\/)(api|server|src|lib)\//.test(p)?0:1;return rank(a.path)-rank(b.path)||a.path.localeCompare(b.path)})
  .slice(0,maxFiles);
}
export function inspectText(path,source){
 const findings=[];
 const lines=source.split(/\r?\n/);
 for(let i=0;i<lines.length;i++){
  const line=lines[i];
  for(const rule of RULES){
   rule.regex.lastIndex=0;
   if(rule.regex.test(line))findings.push({id:rule.id,path,line:i+1,level:rule.level,reason:rule.reason,remediation:rule.fix,
     classification:"PATTERN MATCH — NOT A CONFIRMED VULNERABILITY"});
  }
 }
 return findings.slice(0,35);
}
export async function inspectContents(tree,owner,repo,sha,fetcher=fetch){
 const files=selectFiles(tree);
 const findings=[],errors=[],inspected=[];
 for(const f of files){
  const url="https://api.github.com/repos/"+encodeURIComponent(owner)+"/"+encodeURIComponent(repo)+"/contents/"+f.path.split("/").map(encodeURIComponent).join("/")+"?ref="+encodeURIComponent(sha);
  try{
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),4500);
   let r;try{r=await fetcher(url,{signal:controller.signal,headers:{Accept:"application/vnd.github.raw+json"}})}finally{clearTimeout(timer)}
   if(!r.ok){errors.push(f.path+": HTTP "+r.status);continue}
   const raw=await r.text();
   if(raw.length>60000){errors.push(f.path+": response too large");continue}
   // Raw media-type is required: never process JSON base64 envelopes as code.
   if(raw.trimStart().startsWith('{"name":')||raw.trimStart().startsWith('{"type":')){errors.push(f.path+": unexpected content format");continue}
   inspected.push(f.path);
   findings.push(...inspectText(f.path,raw));
  }catch(e){errors.push(f.path+": "+String(e.message||e))}
 }
 return {filesSelected:files.length,filesInspected:inspected.length,inspectedPaths:inspected,findings:findings.slice(0,80),errors,
   coverage:files.length===0?"NO_ELIGIBLE_FILES":errors.length?"PARTIAL":"BOUNDED_SAMPLE",
   disclaimer:"Static text patterns only. Findings require context, reproduction, security review and tests. No code was executed or modified."};
}
